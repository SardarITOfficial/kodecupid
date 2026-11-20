import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { APP_NAME, MIN_AGE, type MetaInfo } from '@kodecupid/shared';
import { legalVersionsOf } from '../config/app-config';
import { AppConfigService } from '../config/app-config.module';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  health(): { status: 'ok'; uptime: number; timestamp: string } {
    return { status: 'ok', uptime: Math.round(process.uptime()), timestamp: new Date().toISOString() };
  }

  @Get('health/db')
  async database(): Promise<{ status: 'ok'; database: 'reachable' }> {
    try {
      await this.prisma.ping();
      return { status: 'ok', database: 'reachable' };
    } catch {
      throw new ServiceUnavailableException('Database is not reachable');
    }
  }
}

@Controller('meta')
export class MetaController {
  constructor(private readonly config: AppConfigService) {}

  @Get()
  meta(): MetaInfo {
    return {
      appName: APP_NAME,
      environment: this.config.env.NODE_ENV,
      minAge: MIN_AGE,
      debugOtpEnabled: this.config.env.OTP_ALLOW_DEBUG_CODE,
      smsProvider: this.config.env.SMS_PROVIDER,
      legalVersions: legalVersionsOf(this.config.env),
    };
  }
}
