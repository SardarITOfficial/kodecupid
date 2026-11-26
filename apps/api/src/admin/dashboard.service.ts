import { Injectable } from '@nestjs/common';
import { maskPhone, USER_STATUS_VALUES, type UserStatus } from '@kodecupid/shared';
import { PrismaService } from '../prisma/prisma.service';

export interface AdminDashboardRecentMember {
  id: string;
  displayName: string | null;
  phoneMasked: string;
  city: string | null;
  status: UserStatus;
  createdAt: string;
}

export interface AdminDashboardStats {
  generatedAt: string;
  rangeDays: number;
  members: {
    total: number;
    newInRange: number;
    newInPreviousRange: number;
    byStatus: Record<UserStatus, number>;
    recent: AdminDashboardRecentMember[];
  };
  moderation: {
    pendingPhotos: number;
    deletionRequests: number;
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async stats(days: number): Promise<AdminDashboardStats> {
    const now = Date.now();
    const rangeStart = new Date(now - days * DAY_MS);
    const previousStart = new Date(now - 2 * days * DAY_MS);

    const [total, newInRange, newInPreviousRange, pendingPhotos, statusCounts, recentUsers] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { createdAt: { gte: rangeStart } } }),
        this.prisma.user.count({ where: { createdAt: { gte: previousStart, lt: rangeStart } } }),
        this.prisma.profilePhoto.count({ where: { moderationStatus: 'PENDING' } }),
        Promise.all(
          USER_STATUS_VALUES.map((status) => this.prisma.user.count({ where: { status } })),
        ),
        this.prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
          take: 8,
          select: {
            id: true,
            phoneE164: true,
            status: true,
            createdAt: true,
            profile: { select: { displayName: true, city: true } },
          },
        }),
      ]);

    const byStatus = {} as Record<UserStatus, number>;
    USER_STATUS_VALUES.forEach((status, index) => {
      byStatus[status] = statusCounts[index] ?? 0;
    });

    return {
      generatedAt: new Date().toISOString(),
      rangeDays: days,
      members: {
        total,
        newInRange,
        newInPreviousRange,
        byStatus,
        recent: recentUsers.map((user) => ({
          id: user.id,
          displayName: user.profile?.displayName ?? null,
          phoneMasked: maskPhone(user.phoneE164),
          city: user.profile?.city ?? null,
          status: user.status as UserStatus,
          createdAt: user.createdAt.toISOString(),
        })),
      },
      moderation: {
        pendingPhotos,
        deletionRequests: byStatus.DELETION_REQUESTED ?? 0,
      },
    };
  }
}