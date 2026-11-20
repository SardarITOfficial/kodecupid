import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import {
  PROFILE_STATUS_VALUES,
  USER_STATUS_VALUES,
  updateMemberStatusSchema,
  type AdminMemberDetail,
  type AdminMemberRow,
  type Paginated,
  type UserStatus,
} from '@kodecupid/shared';
import { ClientMeta, CurrentAdmin, RequirePermissions } from '../common/decorators';
import { validateWith, ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { AdminAudienceUser } from '../auth/auth.types';
import { AdminAuthGuard } from './admin-auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { AdminUsersService } from './users.service';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(80).optional(),
  status: z.enum(USER_STATUS_VALUES).optional(),
  profileStatus: z.enum(PROFILE_STATUS_VALUES).optional(),
  onboarding: z.enum(['COMPLETE', 'INCOMPLETE']).optional(),
});

@Controller('admin/users')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  @RequirePermissions('users.read')
  list(
    @CurrentAdmin() admin: AdminAudienceUser,
    @Query() rawQuery: Record<string, string | undefined>,
  ): Promise<Paginated<AdminMemberRow>> {
    const query = validateWith(listQuerySchema, rawQuery);
    return this.users.list(
      { adminId: admin.admin.id, role: admin.admin.role, ip: null },
      query,
    );
  }

  @Get(':id')
  @RequirePermissions('users.read')
  detail(
    @CurrentAdmin() admin: AdminAudienceUser,
    @Param('id') userId: string,
  ): Promise<AdminMemberDetail> {
    return this.users.detail(
      { adminId: admin.admin.id, role: admin.admin.role, ip: null },
      userId,
    );
  }

  @Patch(':id/status')
  @RequirePermissions('users.write')
  updateStatus(
    @CurrentAdmin() admin: AdminAudienceUser,
    @Param('id') userId: string,
    @Body(new ZodValidationPipe(updateMemberStatusSchema)) body: { status: UserStatus },
    @ClientMeta() meta: { ip: string | null },
  ): Promise<{ id: string; status: UserStatus }> {
    return this.users.updateStatus(
      { adminId: admin.admin.id, role: admin.admin.role, ip: meta.ip },
      userId,
      body.status,
    );
  }

  @Delete(':id')
  @HttpCode(200)
  @RequirePermissions('users.delete')
  remove(
    @CurrentAdmin() admin: AdminAudienceUser,
    @Param('id') userId: string,
    @ClientMeta() meta: { ip: string | null },
  ): Promise<{ id: string; status: UserStatus }> {
    return this.users.softDelete(
      { adminId: admin.admin.id, role: admin.admin.role, ip: meta.ip },
      userId,
    );
  }
}
