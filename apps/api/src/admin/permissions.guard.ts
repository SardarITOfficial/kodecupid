import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Permission } from '@kodecupid/shared';
import { PERMISSIONS_KEY } from '../common/decorators';
import { ErrorCode, errors } from '../common/errors';
import type { AdminAudienceUser } from '../auth/auth.types';
import { RolePermissionsService } from './role-permissions.service';

/**
 * Enforces the role→permission matrix (saved in the database, defaults from the
 * shared constant). Routes without the decorator are denied for safety: a
 * forgotten guard must fail closed, never open.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rolePermissions: RolePermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Permission[] | undefined>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      throw errors.forbidden(ErrorCode.PERMISSION_DENIED, 'You do not have access to this area.');
    }

    const request = context.switchToHttp().getRequest<{ admin?: AdminAudienceUser }>();
    const admin = request.admin?.admin;
    if (!admin) {
      throw errors.unauthenticated('Please sign in to the admin area.');
    }

    const granted = await this.rolePermissions.permissionsFor(admin.role);
    const missing = required.filter((permission) => !granted.includes(permission));
    if (missing.length > 0) {
      throw errors.forbidden(
        ErrorCode.PERMISSION_DENIED,
        'Your role does not allow this action.',
        { required, role: admin.role },
      );
    }

    return true;
  }
}