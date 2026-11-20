import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import {
  OTP_MAX_ATTEMPTS,
  OTP_REQUESTS_PER_WINDOW,
  OTP_REQUEST_WINDOW_MINUTES,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TTL_MINUTES,
  type OtpRequestResult,
} from '@kodecupid/shared';
import { AppConfigService } from '../config/app-config.module';
import { ErrorCode, appError, errors } from '../common/errors';
import { RateLimiterService } from '../common/rate-limiter.service';
import { randomNumericCode, safeEqual, sha256 } from '../common/security';
import { PrismaService } from '../prisma/prisma.service';
import { SMS_PROVIDER, type SmsProvider } from './sms/sms.provider';

interface IssueOptions {
  phoneE164: string;
  ip: string | null;
}

interface VerifyOptions {
  challengeId: string;
  code: string;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger('Otp');

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly limiter: RateLimiterService,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
  ) {}

  get debugCodeEnabled(): boolean {
    return this.config.env.OTP_ALLOW_DEBUG_CODE;
  }

  /** Creates a challenge, enforces cooldowns and delivers the code. */
  async issue({ phoneE164, ip }: IssueOptions): Promise<OtpRequestResult> {
    const now = new Date();

    const windowMs = OTP_REQUEST_WINDOW_MINUTES * 60 * 1000;
    this.limiter.consume(`otp:phone:${phoneE164}`, OTP_REQUESTS_PER_WINDOW, windowMs);
    if (ip) {
      this.limiter.consume(`otp:ip:${ip}`, 20, windowMs);
    }

    if (this.config.env.NODE_ENV !== 'test') {
      const latest = await this.prisma.otpChallenge.findFirst({
        where: { phoneE164 },
        orderBy: { createdAt: 'desc' },
      });
      if (latest) {
        const elapsedMs = now.getTime() - latest.createdAt.getTime();
        const cooldownMs = OTP_RESEND_COOLDOWN_SECONDS * 1000;
        if (elapsedMs < cooldownMs) {
          const retryAfterSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);
          throw errors.tooManyRequests(
            ErrorCode.OTP_RESEND_TOO_SOON,
            `A code was just sent. You can request another in ${retryAfterSeconds}s.`,
            { retryAfterSeconds },
          );
        }
      }
    }

    const code = randomNumericCode(6);
    const expiresAt = new Date(now.getTime() + OTP_TTL_MINUTES * 60 * 1000);

    const challenge = await this.prisma.otpChallenge.create({
      data: {
        phoneE164,
        codeHash: this.hashCode(code, phoneE164),
        expiresAt,
        ip,
      },
    });

    try {
      await this.sms.sendOtp(phoneE164, code);
    } catch (error) {
      this.logger.error(
        `Could not deliver OTP for ${phoneE164} via ${this.sms.name}`,
        error instanceof Error ? error.message : String(error),
      );
      // The challenge stays valid; a retry can resend after the cooldown.
      throw errors.validation(
        'We could not send the code right now. Please try again in a moment.',
        { provider: this.sms.name },
      );
    }

    const result: OtpRequestResult = {
      challengeId: challenge.id,
      phone: phoneE164,
      expiresAt: expiresAt.toISOString(),
      resendAvailableAt: new Date(
        now.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000,
      ).toISOString(),
    };

    if (this.debugCodeEnabled) {
      result.debugCode = this.config.env.OTP_DEBUG_CODE;
    }

    return result;
  }

  /** Validates a code and marks the challenge consumed. */
  async verify({ challengeId, code }: VerifyOptions): Promise<{ phoneE164: string }> {
    const challenge = await this.prisma.otpChallenge.findUnique({ where: { id: challengeId } });

    if (!challenge || challenge.consumedAt) {
      throw appError(
        HttpStatus.BAD_REQUEST,
        ErrorCode.OTP_INVALID,
        'That code is no longer valid. Request a new one.',
      );
    }

    if (challenge.expiresAt.getTime() < Date.now()) {
      throw appError(
        HttpStatus.BAD_REQUEST,
        ErrorCode.OTP_EXPIRED,
        'That code has expired. Request a new one.',
      );
    }

    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      throw appError(
        HttpStatus.TOO_MANY_REQUESTS,
        ErrorCode.OTP_ATTEMPTS_EXCEEDED,
        'Too many incorrect codes. Request a new one.',
      );
    }

    const expectedHash = challenge.codeHash;
    const providedHash = this.hashCode(code.trim(), challenge.phoneE164);
    const debugMatches =
      this.debugCodeEnabled && safeEqual(code.trim(), this.config.env.OTP_DEBUG_CODE);
    const matches = safeEqual(providedHash, expectedHash) || debugMatches;

    if (!matches) {
      const attempts = challenge.attempts + 1;
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts },
      });

      const remaining = Math.max(0, OTP_MAX_ATTEMPTS - attempts);
      throw appError(
        HttpStatus.BAD_REQUEST,
        ErrorCode.OTP_INVALID,
        remaining > 0
          ? `That code is not right. ${remaining} attempt${remaining === 1 ? '' : 's'} left.`
          : 'Too many incorrect codes. Request a new one.',
        { attemptsRemaining: remaining },
      );
    }

    await this.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });

    return { phoneE164: challenge.phoneE164 };
  }

  private hashCode(code: string, phone: string): string {
    return sha256(`${phone}:${code}`, this.config.env.JWT_ACCESS_SECRET);
  }
}
