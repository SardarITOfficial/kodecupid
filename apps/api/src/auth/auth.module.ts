import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RateLimiterService } from '../common/rate-limiter.service';
import { AppConfigService } from '../config/app-config.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ComplianceGuard } from './compliance.guard';
import { MemberAuthGuard } from './member-auth.guard';
import { MemberSessionService } from './member-session.service';
import { OtpService } from './otp.service';
import { SMS_PROVIDER, createSmsProvider } from './sms/sms.provider';
import { TokensService } from './tokens.service';

/**
 * Global because nearly every module needs the member guards and token service.
 * Keeping the guards central also prevents accidentally creating a second
 * auth code path with different rules.
 */
@Global()
@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    TokensService,
    MemberSessionService,
    OtpService,
    AuthService,
    MemberAuthGuard,
    ComplianceGuard,
    RateLimiterService,
    {
      provide: SMS_PROVIDER,
      useFactory: createSmsProvider,
      inject: [AppConfigService],
    },
  ],
  exports: [
    TokensService,
    MemberSessionService,
    OtpService,
    AuthService,
    MemberAuthGuard,
    ComplianceGuard,
    RateLimiterService,
  ],
})
export class AuthModule {}
