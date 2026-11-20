import { Global, Injectable, Module } from '@nestjs/common';
import { loadEnv, type AppEnv } from './app-config';

@Injectable()
export class AppConfigService {
  readonly env: AppEnv;

  constructor() {
    this.env = loadEnv();
  }

  get isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }

  get isDevelopment(): boolean {
    return this.env.NODE_ENV === 'development';
  }

  get cookieSecure(): boolean {
    return this.env.COOKIE_SECURE || this.isProduction;
  }

  get accessTokenTtl(): string {
    return this.env.JWT_ACCESS_TTL;
  }

  get apiBaseUrl(): string {
    return `${this.env.PUBLIC_API_URL.replace(/\/$/, '')}/${this.env.API_PREFIX}`;
  }
}

@Global()
@Module({
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
