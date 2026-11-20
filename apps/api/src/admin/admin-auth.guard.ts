import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ADMIN_COOKIE } from '@kodecupid/shared';
import type { Request } from 'express';
import { ErrorCode, errors } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';
import type { AdminAudienceUser } from '../auth/auth.types';
import { readAccessToken } from '../auth/member-auth.guard';
import { TokensService } from '../auth/tokens.service';

type AdminRequest = Request & { admin?: AdminAudienceUser };

/**
 * Separate from member auth on purpose: different cookie, different audience,
 * different table. A member token can never open an admin route.
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokensService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdminRequest>();

    const token = readAccessToken(request, ADMIN_COOKIE.access);
    if (!token) {
      throw errors.unauthenticated('Please sign in to the admin area.');
    }

    const payload = await this.tokens.verifyAdminAccess(token);

    const admin = await this.prisma.adminUser.findUnique({ where: { id: payload.sub } });
    if (!admin) {
      throw errors.unauthenticated('Please sign in to the admin area.');
    }

    if (admin.status === 'DISABLED') {
      throw errors.forbidden(ErrorCode.PERMISSION_DENIED, 'This admin account is disabled.');
    }

    request.admin = { admin };
    return true;
  }
}
