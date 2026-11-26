import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminAuthService } from './admin-auth.service';
import { AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';
import { AuditService } from './audit.service';
import { AdminDashboardController } from './dashboard.controller';
import { AdminDashboardService } from './dashboard.service';
import { PermissionsGuard } from './permissions.guard';
import { RolePermissionsService } from './role-permissions.service';
import { AdminRolesController } from './roles.controller';
import { AdminShellsController } from './shells.controller';
import { AdminUsersController } from './users.controller';
import { AdminUsersService } from './users.service';

@Module({
  imports: [ProfileModule],
  controllers: [
    AdminAuthController,
    AdminsController,
    AdminRolesController,
    AdminUsersController,
    AdminShellsController,
    AdminDashboardController,
  ],
  providers: [
    AuditService,
    AdminAuthService,
    AdminsService,
    AdminUsersService,
    AdminDashboardService,
    RolePermissionsService,
    AdminAuthGuard,
    PermissionsGuard,
  ],
  exports: [AuditService, AdminAuthGuard, PermissionsGuard, RolePermissionsService],
})
export class AdminModule {}