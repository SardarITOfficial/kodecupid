import { Controller, Get, UseGuards } from '@nestjs/common';
import { RequirePermissions } from '../common/decorators';
import { AdminAuthGuard } from './admin-auth.guard';
import { AuditService } from './audit.service';
import { PermissionsGuard } from './permissions.guard';

/**
 * Permission-gated shells for the admin sections that Milestone 2 fills in.
 * They still enforce the role matrix, which is what proves the Moderator /
 * Super Admin difference on every route — not just on the visible navigation.
 */
@Controller('admin')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminShellsController {
  constructor(private readonly audit: AuditService) {}

  @Get('settings')
  @RequirePermissions('settings.read')
  settings() {
    return {
      milestone: 2,
      title: 'Platform settings',
      description:
        'Edit the Terms and Community Guidelines versions, safety copy and feature switches. Delivered in Milestone 2.',
      items: [],
    };
  }

  @Get('monetization')
  @RequirePermissions('monetization.read')
  monetization() {
    return {
      milestone: 2,
      title: 'Monetization',
      description: 'Plans, pricing and revenue reporting. Delivered in Milestone 2.',
      items: [],
    };
  }

  @Get('verification')
  @RequirePermissions('verification.read')
  verification() {
    return {
      milestone: 2,
      title: 'Verification queue',
      description:
        'Provider credential and photo verification requests. The queue starts filling in Milestone 2.',
      items: [],
    };
  }

  @Get('complaints')
  @RequirePermissions('complaints.read')
  complaints() {
    return {
      milestone: 2,
      title: 'Complaints',
      description: 'Member reports and safety complaints. Delivered in Milestone 2.',
      items: [],
    };
  }

  @Get('deletion-requests')
  @RequirePermissions('deletion.read')
  deletionRequests() {
    return {
      milestone: 2,
      title: 'Data deletion requests',
      description:
        'Members who asked for their data to be removed. Delivered in Milestone 2.',
      items: [],
    };
  }

  @Get('corrections')
  @RequirePermissions('corrections.read')
  corrections() {
    return {
      milestone: 2,
      title: 'Profile corrections',
      description: 'Requests to correct profile details. Delivered in Milestone 2.',
      items: [],
    };
  }

  @Get('audit')
  @RequirePermissions('audit.read')
  async auditLog() {
    const items = await this.audit.recent(100);
    return {
      milestone: 1,
      title: 'Admin activity',
      items: items.map((entry) => ({
        id: entry.id,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        admin: entry.admin?.email ?? 'system',
        createdAt: entry.createdAt.toISOString(),
      })),
    };
  }
}
