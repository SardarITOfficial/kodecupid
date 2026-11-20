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
  inviteAdminSchema,
  updateAdminRoleSchema,
  updateAdminStatusSchema,
  type AdminRole,
  type AdminSummary,
  type InviteAdminInput,
} from '@kodecupid/shared';
import { ClientMeta, CurrentAdmin, RequirePermissions } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { AdminAudienceUser } from '../auth/auth.types';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminsService } from './admins.service';
import { PermissionsGuard } from './permissions.guard';

@Controller('admin/admins')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminsController {
  constructor(private readonly admins: AdminsService) {}

  @Get()
  @RequirePermissions('admins.read')
  list() {
    return this.admins.list();
  }

  @Post('invite')
  @RequirePermissions('admins.manage')
  invite(
    @CurrentAdmin() admin: AdminAudienceUser,
    @Body(new ZodValidationPipe(inviteAdminSchema)) body: InviteAdminInput,
    @ClientMeta() meta: { ip: string | null },
  ) {
    return this.admins.invite(
      { adminId: admin.admin.id, email: admin.admin.email, ip: meta.ip },
      body,
    );
  }

  @Patch(':id/role')
  @RequirePermissions('admins.manage')
  changeRole(
    @CurrentAdmin() admin: AdminAudienceUser,
    @Param('id') adminId: string,
    @Body(new ZodValidationPipe(updateAdminRoleSchema)) body: { role: AdminRole },
    @ClientMeta() meta: { ip: string | null },
  ): Promise<AdminSummary> {
    return this.admins.changeRole(
      { adminId: admin.admin.id, email: admin.admin.email, ip: meta.ip },
      adminId,
      body.role,
    );
  }

  @Patch(':id/status')
  @RequirePermissions('admins.manage')
  setStatus(
    @CurrentAdmin() admin: AdminAudienceUser,
    @Param('id') adminId: string,
    @Body(new ZodValidationPipe(updateAdminStatusSchema)) body: { status: 'ACTIVE' | 'DISABLED' },
    @ClientMeta() meta: { ip: string | null },
  ): Promise<AdminSummary> {
    return this.admins.setStatus(
      { adminId: admin.admin.id, email: admin.admin.email, ip: meta.ip },
      adminId,
      body.status,
    );
  }

  @Delete('invitations/:id')
  @HttpCode(200)
  @RequirePermissions('admins.manage')
  revokeInvitation(
    @CurrentAdmin() admin: AdminAudienceUser,
    @Param('id') invitationId: string,
    @ClientMeta() meta: { ip: string | null },
  ) {
    return this.admins.revokeInvitation(
      { adminId: admin.admin.id, email: admin.admin.email, ip: meta.ip },
      invitationId,
    );
  }
}
