import { Injectable } from '@nestjs/common';
import {
  type AdminInvitationRow,
  type AdminRole,
  type AdminSummary,
  type InviteAdminInput,
  type RoleAssignmentResult,
  type RoleAssignmentRow,
  type RoleAssignInput,
} from '@kodecupid/shared';
import type { AdminUser } from '../prisma/generated';
import { ErrorCode, errors } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';
import { AdminAuthService, toAdminSummary } from './admin-auth.service';

interface ActorContext {
  adminId: string;
  email: string;
  ip: string | null;
}

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AdminsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AdminAuthService,
    private readonly audit: AuditService,
  ) {}

  async list(): Promise<{ admins: AdminSummary[]; invitations: AdminInvitationRow[] }> {
    const [admins, invitations] = await Promise.all([
      this.prisma.adminUser.findMany({ orderBy: { createdAt: 'asc' } }),
      this.prisma.adminInvitation.findMany({
        orderBy: { createdAt: 'desc' },
        include: { invitedBy: { select: { email: true } } },
      }),
    ]);

    return {
      admins: admins.map((admin) => toAdminSummary(admin)),
      invitations: invitations.map((invitation) => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role as AdminRole,
        status: this.invitationStatus(invitation),
        expiresAt: invitation.expiresAt.toISOString(),
        createdAt: invitation.createdAt.toISOString(),
        invitedBy: invitation.invitedBy?.email ?? null,
      })),
    };
  }

  async invite(
    actor: ActorContext,
    input: InviteAdminInput,
  ): Promise<{ invitation: AdminInvitationRow; inviteToken: string; inviteUrl: string }> {
    const existingAdmin = await this.prisma.adminUser.findUnique({
      where: { email: input.email },
    });
    if (existingAdmin) {
      throw errors.conflict(
        ErrorCode.CONFLICT,
        'That email already has an admin account. Change the role instead of inviting.',
      );
    }

    const pending = await this.prisma.adminInvitation.findFirst({
      where: { email: input.email, status: 'PENDING' },
    });

    if (pending && pending.expiresAt.getTime() > Date.now()) {
      throw errors.conflict(
        ErrorCode.CONFLICT,
        'There is already a pending invitation for that email.',
      );
    }

    if (pending) {
      await this.prisma.adminInvitation.update({
        where: { id: pending.id },
        data: { status: 'EXPIRED' },
      });
    }

    const { token, hash } = this.auth.createInviteToken();
    const invitation = await this.prisma.adminInvitation.create({
      data: {
        email: input.email,
        role: input.role,
        tokenHash: hash,
        invitedById: actor.adminId,
        expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
      },
    });

    await this.audit.log({
      adminId: actor.adminId,
      action: 'admin.invitation.created',
      targetType: 'admin_invitation',
      targetId: invitation.id,
      metadata: { email: input.email, role: input.role },
      ip: actor.ip,
    });

    return {
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role as AdminRole,
        status: 'PENDING',
        expiresAt: invitation.expiresAt.toISOString(),
        createdAt: invitation.createdAt.toISOString(),
        invitedBy: actor.email,
      },
      inviteToken: token,
      inviteUrl: `/admin/accept-invite?token=${token}`,
    };
  }

  async changeRole(
    actor: ActorContext,
    targetId: string,
    role: AdminRole,
  ): Promise<AdminSummary> {
    const target = await this.requireAdmin(targetId);

    if (target.role === role) {
      return toAdminSummary(target);
    }

    if (target.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
      await this.assertNotLastSuperAdmin(target);
    }

    const updated = await this.prisma.adminUser.update({
      where: { id: target.id },
      data: { role },
    });

    await this.audit.log({
      adminId: actor.adminId,
      action: 'admin.role.changed',
      targetType: 'admin',
      targetId: target.id,
      metadata: { from: target.role, to: role, email: target.email },
      ip: actor.ip,
    });

    return toAdminSummary(updated);
  }

  async setStatus(
    actor: ActorContext,
    targetId: string,
    status: 'ACTIVE' | 'DISABLED',
  ): Promise<AdminSummary> {
    const target = await this.requireAdmin(targetId);

    if (target.id === actor.adminId && status === 'DISABLED') {
      throw errors.conflict(
        ErrorCode.LAST_SUPER_ADMIN,
        'You cannot disable your own admin account.',
      );
    }

    if (target.role === 'SUPER_ADMIN' && status === 'DISABLED') {
      await this.assertNotLastSuperAdmin(target);
    }

    const updated = await this.prisma.adminUser.update({
      where: { id: target.id },
      data: { status },
    });

    if (status === 'DISABLED') {
      await this.prisma.adminSession.updateMany({
        where: { adminId: target.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await this.audit.log({
      adminId: actor.adminId,
      action: 'admin.status.changed',
      targetType: 'admin',
      targetId: target.id,
      metadata: { status, email: target.email },
      ip: actor.ip,
    });

    return toAdminSummary(updated);
  }

  async revokeInvitation(actor: ActorContext, invitationId: string): Promise<{ ok: true }> {
    const invitation = await this.prisma.adminInvitation.findUnique({
      where: { id: invitationId },
    });
    if (!invitation) {
      throw errors.notFound('Invitation not found');
    }

    await this.prisma.adminInvitation.update({
      where: { id: invitation.id },
      data: { status: 'REVOKED' },
    });

    await this.audit.log({
      adminId: actor.adminId,
      action: 'admin.invitation.revoked',
      targetType: 'admin_invitation',
      targetId: invitation.id,
      metadata: { email: invitation.email },
      ip: actor.ip,
    });

    return { ok: true };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Milestone 1 role-assignment contract
  //   POST   /admin/roles/assign
  //   PATCH  /admin/roles/:assignmentId
  //   DELETE /admin/roles/:assignmentId
  //   GET    /admin/roles
  //
  // An "assignment" is either an existing admin account (source ADMIN, role
  // applied immediately) or a pending invitation (source INVITATION, role
  // applied when the invitee sets a password). This keeps one model for
  // "who has a role by email" without duplicating the admin table.
  // ─────────────────────────────────────────────────────────────────────────

  async listAssignments(): Promise<RoleAssignmentRow[]> {
    const [admins, invitations] = await Promise.all([
      this.prisma.adminUser.findMany({ orderBy: { createdAt: 'asc' } }),
      this.prisma.adminInvitation.findMany({
        where: { status: { in: ['PENDING', 'EXPIRED'] } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return [
      ...admins.map<RoleAssignmentRow>((admin) => ({
        assignmentId: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role as AdminRole,
        status: admin.status === 'ACTIVE' ? 'ACTIVE' : 'DISABLED',
        source: 'ADMIN',
        createdAt: admin.createdAt.toISOString(),
        lastLoginAt: admin.lastLoginAt?.toISOString() ?? null,
        expiresAt: null,
      })),
      ...invitations.map<RoleAssignmentRow>((invitation) => ({
        assignmentId: invitation.id,
        email: invitation.email,
        name: null,
        role: invitation.role as AdminRole,
        status: this.invitationStatus(invitation),
        source: 'INVITATION',
        createdAt: invitation.createdAt.toISOString(),
        lastLoginAt: null,
        expiresAt: invitation.expiresAt.toISOString(),
      })),
    ];
  }

  async assignRole(actor: ActorContext, input: RoleAssignInput): Promise<RoleAssignmentResult> {
    const existingAdmin = await this.prisma.adminUser.findUnique({
      where: { email: input.email },
    });

    if (existingAdmin) {
      const updated = await this.changeRole(actor, existingAdmin.id, input.role);
      return {
        assignmentId: updated.id,
        email: updated.email,
        role: updated.role,
        status: updated.status === 'ACTIVE' ? 'ACTIVE' : 'DISABLED',
        source: 'ADMIN',
        applied: true,
      };
    }

    const pending = await this.prisma.adminInvitation.findFirst({
      where: { email: input.email, status: 'PENDING' },
    });

    if (pending && pending.expiresAt.getTime() > Date.now()) {
      const updated = await this.prisma.adminInvitation.update({
        where: { id: pending.id },
        data: { role: input.role },
      });
      await this.audit.log({
        adminId: actor.adminId,
        action: 'role.assigned',
        targetType: 'admin_invitation',
        targetId: updated.id,
        metadata: { email: updated.email, role: input.role, applied: false },
        ip: actor.ip,
      });
      return {
        assignmentId: updated.id,
        email: updated.email,
        role: updated.role as AdminRole,
        status: 'PENDING',
        source: 'INVITATION',
        applied: false,
      };
    }

    const invitation = await this.invite(actor, { email: input.email, role: input.role });
    await this.audit.log({
      adminId: actor.adminId,
      action: 'role.assigned',
      targetType: 'admin_invitation',
      targetId: invitation.invitation.id,
      metadata: { email: invitation.invitation.email, role: input.role, applied: false },
      ip: actor.ip,
    });
    return {
      assignmentId: invitation.invitation.id,
      email: invitation.invitation.email,
      role: invitation.invitation.role,
      status: 'PENDING',
      source: 'INVITATION',
      applied: false,
      inviteToken: invitation.inviteToken,
      inviteUrl: invitation.inviteUrl,
    };
  }

  async updateAssignmentRole(
    actor: ActorContext,
    assignmentId: string,
    role: AdminRole,
  ): Promise<RoleAssignmentResult> {
    const target = await this.resolveAssignment(assignmentId);

    if (target.source === 'ADMIN') {
      const updated = await this.changeRole(actor, target.admin!.id, role);
      await this.audit.log({
        adminId: actor.adminId,
        action: 'role.updated',
        targetType: 'admin',
        targetId: updated.id,
        metadata: { email: updated.email, role },
        ip: actor.ip,
      });
      return {
        assignmentId: updated.id,
        email: updated.email,
        role: updated.role,
        status: updated.status === 'ACTIVE' ? 'ACTIVE' : 'DISABLED',
        source: 'ADMIN',
        applied: true,
      };
    }

    const invitation = target.invitation!;
    if (invitation.status === 'ACCEPTED') {
      throw errors.conflict(
        ErrorCode.CONFLICT,
        'That invitation was already accepted. Change the admin role instead.',
      );
    }

    const updated = await this.prisma.adminInvitation.update({
      where: { id: invitation.id },
      data: { role },
    });
    await this.audit.log({
      adminId: actor.adminId,
      action: 'role.updated',
      targetType: 'admin_invitation',
      targetId: updated.id,
      metadata: { email: updated.email, role },
      ip: actor.ip,
    });

    return {
      assignmentId: updated.id,
      email: updated.email,
      role: updated.role as AdminRole,
      status: this.invitationStatus(updated),
      source: 'INVITATION',
      applied: false,
    };
  }

  async revokeAssignment(actor: ActorContext, assignmentId: string): Promise<RoleAssignmentResult> {
    const target = await this.resolveAssignment(assignmentId);

    if (target.source === 'ADMIN') {
      const admin = target.admin!;
      if (admin.id === actor.adminId) {
        throw errors.conflict(
          ErrorCode.LAST_SUPER_ADMIN,
          'You cannot revoke your own admin access.',
        );
      }
      const updated = await this.setStatus(actor, admin.id, 'DISABLED');
      await this.audit.log({
        adminId: actor.adminId,
        action: 'role.revoked',
        targetType: 'admin',
        targetId: updated.id,
        metadata: { email: updated.email, role: updated.role },
        ip: actor.ip,
      });
      return {
        assignmentId: updated.id,
        email: updated.email,
        role: updated.role,
        status: 'DISABLED',
        source: 'ADMIN',
        applied: true,
      };
    }

    const invitation = target.invitation!;
    const updated = await this.prisma.adminInvitation.update({
      where: { id: invitation.id },
      data: { status: 'REVOKED' },
    });
    await this.audit.log({
      adminId: actor.adminId,
      action: 'role.revoked',
      targetType: 'admin_invitation',
      targetId: updated.id,
      metadata: { email: updated.email },
      ip: actor.ip,
    });

    return {
      assignmentId: updated.id,
      email: updated.email,
      role: updated.role as AdminRole,
      status: 'REVOKED',
      source: 'INVITATION',
      applied: false,
    };
  }

  private async resolveAssignment(
    assignmentId: string,
  ): Promise<{ source: 'ADMIN' | 'INVITATION'; admin?: AdminUser; invitation?: { id: string; email: string; role: string; status: string; expiresAt: Date } }> {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: assignmentId } });
    if (admin) {
      return { source: 'ADMIN', admin };
    }

    const invitation = await this.prisma.adminInvitation.findUnique({
      where: { id: assignmentId },
    });
    if (invitation) {
      return { source: 'INVITATION', invitation };
    }

    throw errors.notFound('That role assignment does not exist');
  }

  async recentAudit(limit = 100) {
    return this.audit.recent(limit);
  }

  private async requireAdmin(id: string): Promise<AdminUser> {
    const admin = await this.prisma.adminUser.findUnique({ where: { id } });
    if (!admin) {
      throw errors.notFound('Admin not found');
    }
    return admin;
  }

  private async assertNotLastSuperAdmin(target: AdminUser): Promise<void> {
    const remaining = await this.prisma.adminUser.count({
      where: { role: 'SUPER_ADMIN', status: 'ACTIVE', id: { not: target.id } },
    });

    if (remaining === 0) {
      throw errors.conflict(
        ErrorCode.LAST_SUPER_ADMIN,
        'At least one active Super Admin must remain.',
      );
    }
  }

  private invitationStatus(invitation: {
    status: string;
    expiresAt: Date;
  }): AdminInvitationRow['status'] {
    if (invitation.status !== 'PENDING') {
      return invitation.status as AdminInvitationRow['status'];
    }
    return invitation.expiresAt.getTime() < Date.now() ? 'EXPIRED' : 'PENDING';
  }
}
