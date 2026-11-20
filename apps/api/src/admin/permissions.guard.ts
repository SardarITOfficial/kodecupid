import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { can, type Permission } from '@kodecupid/shared';
import { PERMISSIONS_KEY } from '../common/decorators';
import { ErrorCode, errors } from '../common/errors';
import type { AdminAudienceUser } from '../auth/auth.types';

/**
 * Enforces the shared role→permission matrix. Routes without the decorator are
 * denied for safety: a forgotten guard must fail closed, never open.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
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

    const missing = required.filter((permission) => !can(admin.role, permission));
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
