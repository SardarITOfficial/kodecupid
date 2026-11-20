import { Injectable } from '@nestjs/common';
import {
  type AdminInvitationRow,
  type AdminRole,
  type AdminSummary,
  type InviteAdminInput,
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
