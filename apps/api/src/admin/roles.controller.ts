import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  roleAssignSchema,
  roleUpdateSchema,
  type AdminAuditLogRow,
  type RoleAssignmentResult,
  type RoleAssignmentRow,
  type RoleAssignInput,
  type RoleUpdateInput,
} from '@kodecupid/shared';
import { ClientMeta, CurrentAdmin, RequirePermissions } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { AdminAudienceUser } from '../auth/auth.types';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminsService } from './admins.service';
import { PermissionsGuard } from './permissions.guard';

/**
 * Milestone 1 role-management contract:
 *   POST   /admin/roles/assign { email, role }
 *   PATCH  /admin/roles/:assignmentId { role }
 *   DELETE /admin/roles/:assignmentId
 *   GET    /admin/roles
 *   GET    /admin/audit-logs
 *
 * Every route is guarded twice: a valid admin session, then the permission
 * matrix. A Moderator's request stops at the permission guard with 403.
 */
@Controller('admin')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminRolesController {
  constructor(private readonly admins: AdminsService) {}

  @Get('roles')
  @RequirePermissions('admins.read')
  list(): Promise<RoleAssignmentRow[]> {
    return this.admins.listAssignments();
  }

  @Post('roles/assign')
  @RequirePermissions('admins.manage')
  assign(
    @CurrentAdmin() admin: AdminAudienceUser,
    @Body(new ZodValidationPipe(roleAssignSchema)) body: RoleAssignInput,
    @ClientMeta() meta: { ip: string | null },
  ): Promise<RoleAssignmentResult> {
    return this.admins.assignRole(
      { adminId: admin.admin.id, email: admin.admin.email, ip: meta.ip },
      body,
    );
  }

  @Patch('roles/:assignmentId')
  @RequirePermissions('admins.manage')
  update(
    @CurrentAdmin() admin: AdminAudienceUser,
    @Param('assignmentId') assignmentId: string,
    @Body(new ZodValidationPipe(roleUpdateSchema)) body: RoleUpdateInput,
    @ClientMeta() meta: { ip: string | null },
  ): Promise<RoleAssignmentResult> {
    return this.admins.updateAssignmentRole(
      { adminId: admin.admin.id, email: admin.admin.email, ip: meta.ip },
      assignmentId,
      body.role,
    );
  }

  @Delete('roles/:assignmentId')
  @HttpCode(200)
  @RequirePermissions('admins.manage')
  revoke(
    @CurrentAdmin() admin: AdminAudienceUser,
    @Param('assignmentId') assignmentId: string,
    @ClientMeta() meta: { ip: string | null },
  ): Promise<RoleAssignmentResult> {
    return this.admins.revokeAssignment(
      { adminId: admin.admin.id, email: admin.admin.email, ip: meta.ip },
      assignmentId,
    );
  }

  @Get('audit-logs')
  @RequirePermissions('audit.read')
  async auditLogs(): Promise<AdminAuditLogRow[]> {
    const entries = await this.admins.recentAudit(100);
    return entries.map((entry) => ({
      id: entry.id,
      action: entry.action,
      admin: entry.admin?.email ?? 'system',
      targetType: entry.targetType,
      targetId: entry.targetId,
      createdAt: entry.createdAt.toISOString(),
    }));
  }
}
