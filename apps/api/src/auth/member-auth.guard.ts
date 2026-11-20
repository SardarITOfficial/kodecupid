import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { MEMBER_COOKIE } from '@kodecupid/shared';
import type { Request } from 'express';
import { ErrorCode, errors } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';
import type { MemberAudienceUser } from './auth.types';
import { TokensService } from './tokens.service';

type AuthedRequest = Request & { member?: MemberAudienceUser };

export function readAccessToken(request: Request, cookieName: string): string | null {
  const cookie = (request as Request & { cookies?: Record<string, string> }).cookies?.[cookieName];
  if (cookie) return cookie;

  const header = request.headers.authorization;
  if (header?.toLowerCase().startsWith('bearer ')) {
    return header.slice(7).trim();
  }
  return null;
}

/**
 * Verifies the member access token, loads the account and attaches it to the
 * request. Every downstream guard/controller can then trust `request.member`.
 */
@Injectable()
export class MemberAuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokensService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();

    const token = readAccessToken(request, MEMBER_COOKIE.access);
    if (!token) {
      throw errors.unauthenticated();
    }

    const payload = await this.tokens.verifyMemberAccess(token);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { legalAcceptances: true, profile: true, onboarding: true },
    });

    if (!user || user.status === 'DELETED') {
      throw errors.unauthenticated('This account is no longer available.');
    }

    if (user.status === 'SUSPENDED') {
      throw errors.forbidden(
        ErrorCode.ACCOUNT_SUSPENDED,
        'This account is suspended. Please contact support.',
      );
    }

    request.member = { user };
    return true;
  }
}
