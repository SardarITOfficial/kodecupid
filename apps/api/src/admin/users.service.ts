import { Injectable } from '@nestjs/common';
import {
  maskPhone,
  PROFILE_STATUS_VALUES,
  USER_STATUS_VALUES,
  calculateAge,
  type AdminMemberDetail,
  type AdminMemberRow,
  type Paginated,
  type ProfileStatus,
  type UserStatus,
} from '@kodecupid/shared';
import type { Prisma } from '../prisma/generated';
import { ErrorCode, errors } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileService } from '../profile/profile.service';
import { AuditService } from './audit.service';

export interface ListMembersQuery {
  page: number;
  pageSize: number;
  q?: string;
  status?: UserStatus;
  profileStatus?: ProfileStatus;
  onboarding?: 'COMPLETE' | 'INCOMPLETE';
}

interface Actor {
  adminId: string;
  role: string;
  ip: string | null;
}

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profile: ProfileService,
    private readonly audit: AuditService,
  ) {}

  async list(actor: Actor, query: ListMembersQuery): Promise<Paginated<AdminMemberRow>> {
    const where: Prisma.UserWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.profileStatus) {
      where.profile = { is: { status: query.profileStatus } };
    }

    if (query.onboarding === 'COMPLETE') {
      where.onboardingCompletedAt = { not: null };
    } else if (query.onboarding === 'INCOMPLETE') {
      where.onboardingCompletedAt = null;
    }

    if (query.q) {
      const phoneQuery = query.q.replace(/[^\d+]/g, '');
      where.OR = [
        ...(phoneQuery ? [{ phoneE164: { contains: phoneQuery } }] : []),
        { profile: { is: { displayName: { contains: query.q, mode: 'insensitive' } } } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: { profile: true },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      items: users.map((user) => this.toRow(actor, user)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async detail(actor: Actor, userId: string): Promise<AdminMemberDetail> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, legalAcceptances: { orderBy: { acceptedAt: 'desc' } } },
    });

    if (!user) {
      throw errors.notFound('Member not found');
    }

    const profileView = user.profile ? await this.profile.ownerView(user.id) : null;

    return {
      id: user.id,
      phone: actor.role === 'SUPER_ADMIN' ? user.phoneE164 : maskPhone(user.phoneE164),
      phoneMasked: maskPhone(user.phoneE164),
      status: user.status as UserStatus,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      ageVerifiedAt: user.ageVerifiedAt?.toISOString() ?? null,
      onboardingCompletedAt: user.onboardingCompletedAt?.toISOString() ?? null,
      profile: profileView,
      legalAcceptances: user.legalAcceptances.map((acceptance) => ({
        documentType: acceptance.documentType as AdminMemberDetail['legalAcceptances'][number]['documentType'],
        documentVersion: acceptance.documentVersion,
        acceptedAt: acceptance.acceptedAt.toISOString(),
      })),
    };
  }

  async updateStatus(
    actor: Actor,
    userId: string,
    status: UserStatus,
  ): Promise<{ id: string; status: UserStatus }> {
    if (!USER_STATUS_VALUES.includes(status)) {
      throw errors.validation('Unknown member status');
    }

    if (status === 'DELETED') {
      return this.softDelete(actor, userId);
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw errors.notFound('Member not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    if (status === 'SUSPENDED' || status === 'DELETION_REQUESTED') {
      await this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await this.audit.log({
      adminId: actor.adminId,
      action: 'member.status.changed',
      targetType: 'member',
      targetId: user.id,
      metadata: { from: user.status, to: status },
      ip: actor.ip,
    });

    return { id: updated.id, status: updated.status as UserStatus };
  }

  async softDelete(actor: Actor, userId: string): Promise<{ id: string; status: UserStatus }> {
    if (actor.role !== 'SUPER_ADMIN') {
      throw errors.forbidden(
        ErrorCode.PERMISSION_DENIED,
        'Only a Super Admin can delete member accounts.',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw errors.notFound('Member not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { status: 'DELETED' } });
      await tx.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.profile.updateMany({ where: { userId }, data: { status: 'PAUSED' } });
    });

    await this.audit.log({
      adminId: actor.adminId,
      action: 'member.deleted',
      targetType: 'member',
      targetId: user.id,
      metadata: { phoneMasked: maskPhone(user.phoneE164) },
      ip: actor.ip,
    });

    return { id: user.id, status: 'DELETED' };
  }

  private toRow(
    actor: Actor,
    user: {
      id: string;
      phoneE164: string;
      status: string;
      createdAt: Date;
      onboardingCompletedAt: Date | null;
      profile: { displayName: string | null; city: string | null; dateOfBirth: Date | null; status: string } | null;
    },
  ): AdminMemberRow {
    return {
      id: user.id,
      phone: actor.role === 'SUPER_ADMIN' ? user.phoneE164 : maskPhone(user.phoneE164),
      phoneMasked: maskPhone(user.phoneE164),
      status: user.status as UserStatus,
      age: user.profile?.dateOfBirth ? calculateAge(user.profile.dateOfBirth) : null,
      displayName: user.profile?.displayName ?? null,
      city: user.profile?.city ?? null,
      profileStatus: (user.profile?.status as ProfileStatus | undefined) ?? null,
      onboardingCompletedAt: user.onboardingCompletedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    };
  }

  static readonly filters = {
    statuses: USER_STATUS_VALUES,
    profileStatuses: PROFILE_STATUS_VALUES,
  };
}
