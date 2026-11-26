import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { RequirePermissions } from '../common/decorators';
import { validateWith } from '../common/pipes/zod-validation.pipe';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminDashboardService, type AdminDashboardStats } from './dashboard.service';
import { PermissionsGuard } from './permissions.guard';

const statsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

@Controller('admin/dashboard')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  @Get('stats')
  @RequirePermissions('users.read')
  stats(@Query() rawQuery: Record<string, string | undefined>): Promise<AdminDashboardStats> {
    const { days } = validateWith(statsQuerySchema, rawQuery);
    return this.dashboard.stats(days);
  }
}