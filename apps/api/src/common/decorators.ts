import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Request } from 'express';
import type { AdminAudienceUser, MemberAudienceUser } from '../auth/auth.types';

export const IS_PUBLIC_KEY = 'kodecupid:isPublic';
export const PERMISSIONS_KEY = 'kodecupid:permissions';

/** Marks a route as reachable without a member session. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Declares the permissions an admin route requires (any-of is not supported on purpose). */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const CurrentMember = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): MemberAudienceUser => {
    const request = ctx.switchToHttp().getRequest<Request & { member?: MemberAudienceUser }>();
    if (!request.member) {
      throw new Error('CurrentMember used on a route without MemberAuthGuard');
    }
    return request.member;
  },
);

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AdminAudienceUser => {
    const request = ctx.switchToHttp().getRequest<Request & { admin?: AdminAudienceUser }>();
    if (!request.admin) {
      throw new Error('CurrentAdmin used on a route without AdminAuthGuard');
    }
    return request.admin;
  },
);

export const ClientMeta = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  return {
    ip: (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? request.ip ?? null,
    userAgent: request.headers['user-agent'] ?? null,
  };
});
