import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import {
  MEMBER_COOKIE,
  otpRequestSchema,
  otpVerifySchema,
  type MemberSession,
  type OtpRequestResult,
  type OtpRequestInput,
  type OtpVerifyInput,
} from '@kodecupid/shared';
import type { Request, Response } from 'express';
import { ClientMeta, CurrentMember } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AppConfigService } from '../config/app-config.module';
import type { MemberRecord } from './auth.types';
import { AuthService, type RequestMeta } from './auth.service';
import { clearAuthCookies, setAuthCookies } from './cookies';
import { MemberAuthGuard } from './member-auth.guard';
import { TokensService } from './tokens.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly tokens: TokensService,
    private readonly config: AppConfigService,
  ) {}

  @Post('otp/request')
  @HttpCode(200)
  requestOtp(
    @Body(new ZodValidationPipe(otpRequestSchema)) body: OtpRequestInput,
    @ClientMeta() meta: RequestMeta,
  ): Promise<OtpRequestResult> {
    return this.auth.requestOtp(body, meta);
  }

  /** Milestone 1 contract path (`/auth/otp/request` stays as an alias). */
  @Post('request-otp')
  @HttpCode(200)
  requestOtpCanonical(
    @Body(new ZodValidationPipe(otpRequestSchema)) body: OtpRequestInput,
    @ClientMeta() meta: RequestMeta,
  ): Promise<OtpRequestResult> {
    return this.auth.requestOtp(body, meta);
  }

  @Post('otp/verify')
  @HttpCode(200)
  async verifyOtp(
    @Body(new ZodValidationPipe(otpVerifySchema)) body: OtpVerifyInput,
    @ClientMeta() meta: RequestMeta,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ created: boolean; session: MemberSession }> {
    const result = await this.auth.verifyOtp(body, meta);
    setAuthCookies(response, {
      config: this.config,
      audience: 'member',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      accessTtlMs: this.tokens.accessTtlMs,
      refreshTtlMs: this.tokens.refreshTtlMs,
    });
    return { created: result.created, session: result.session };
  }

  /** Milestone 1 contract path (`/auth/otp/verify` stays as an alias). */
  @Post('verify-otp')
  @HttpCode(200)
  verifyOtpCanonical(
    @Body(new ZodValidationPipe(otpVerifySchema)) body: OtpVerifyInput,
    @ClientMeta() meta: RequestMeta,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ created: boolean; session: MemberSession }> {
    return this.verifyOtp(body, meta, response);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() request: Request,
    @ClientMeta() meta: RequestMeta,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ session: MemberSession }> {
    const cookies = (request as Request & { cookies?: Record<string, string> }).cookies;
    const result = await this.auth.refresh(cookies?.[MEMBER_COOKIE.refresh], meta);
    setAuthCookies(response, {
      config: this.config,
      audience: 'member',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      accessTtlMs: this.tokens.accessTtlMs,
      refreshTtlMs: this.tokens.refreshTtlMs,
    });
    return { session: result.session };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ ok: true }> {
    const cookies = (request as Request & { cookies?: Record<string, string> }).cookies;
    await this.auth.logout(cookies?.[MEMBER_COOKIE.refresh]);
    clearAuthCookies(response, 'member', this.config);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(MemberAuthGuard)
  me(@CurrentMember() member: { user: MemberRecord }): Promise<MemberSession> {
    return this.auth.me(member.user);
  }
}
