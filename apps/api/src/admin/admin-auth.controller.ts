import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ADMIN_COOKIE, adminLoginSchema, acceptInviteSchema } from '@kodecupid/shared';
import type { AdminLoginInput, AcceptInviteInput, AdminSession } from '@kodecupid/shared';
import type { Request, Response } from 'express';
import { ClientMeta, CurrentAdmin } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AppConfigService } from '../config/app-config.module';
import type { AdminAudienceUser } from '../auth/auth.types';
import type { RequestMeta } from '../auth/auth.service';
import { clearAuthCookies, setAuthCookies } from '../auth/cookies';
import { TokensService } from '../auth/tokens.service';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminAuthService, toAdminSummary } from './admin-auth.service';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly auth: AdminAuthService,
    private readonly tokens: TokensService,
    private readonly config: AppConfigService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(adminLoginSchema)) body: AdminLoginInput,
    @ClientMeta() meta: RequestMeta,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AdminSession> {
    const result = await this.auth.login(body, meta);
    setAuthCookies(response, {
      config: this.config,
      audience: 'admin',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      accessTtlMs: this.tokens.accessTtlMs,
      refreshTtlMs: this.tokens.refreshTtlMs,
    });
    return result.session;
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() request: Request,
    @ClientMeta() meta: RequestMeta,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AdminSession> {
    const cookies = (request as Request & { cookies?: Record<string, string> }).cookies;
    const result = await this.auth.refresh(cookies?.[ADMIN_COOKIE.refresh], meta);
    setAuthCookies(response, {
      config: this.config,
      audience: 'admin',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      accessTtlMs: this.tokens.accessTtlMs,
      refreshTtlMs: this.tokens.refreshTtlMs,
    });
    return result.session;
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ ok: true }> {
    const cookies = (request as Request & { cookies?: Record<string, string> }).cookies;
    await this.auth.logout(cookies?.[ADMIN_COOKIE.refresh]);
    clearAuthCookies(response, 'admin', this.config);
    return { ok: true };
  }

  /** Public: an invited admin sets their own password with the one-time token. */
  @Post('accept-invite')
  @HttpCode(200)
  acceptInvite(
    @Body(new ZodValidationPipe(acceptInviteSchema)) body: AcceptInviteInput,
  ): Promise<{ email: string; role: string }> {
    return this.auth.acceptInvitation(body);
  }

  @Get('me')
  @UseGuards(AdminAuthGuard)
  me(@CurrentAdmin() admin: AdminAudienceUser): AdminSession {
    return {
      admin: toAdminSummary(admin.admin),
      permissions: [...this.auth.toSession(admin.admin).permissions],
    };
  }
}
