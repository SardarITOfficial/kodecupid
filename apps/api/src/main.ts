import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { randomUUID } from 'node:crypto';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const config = app.get(AppConfigService);

  app.setGlobalPrefix(config.env.API_PREFIX);

  // Images are served by this API and embedded by the web app on another origin.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: config.isProduction ? undefined : false,
    }),
  );
  app.use(cookieParser());

  app.use((request: Request, response: Response, next: NextFunction) => {
    const requestId = (request.headers['x-request-id'] as string) ?? randomUUID();
    (request as Request & { id?: string }).id = requestId;
    response.setHeader('x-request-id', requestId);
    next();
  });

  app.enableCors({
    origin: config.env.CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // All request validation goes through the shared zod schemas (ZodValidationPipe),
  // so no class-validator pipe is needed here.
  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableShutdownHooks();

  await app.listen(config.env.PORT);

  logger.log(`KodeCupid API listening on ${config.env.PUBLIC_API_URL}/${config.env.API_PREFIX}`);
  logger.log(
    `Environment: ${config.env.NODE_ENV} · SMS: ${config.env.SMS_PROVIDER}${
      config.env.OTP_ALLOW_DEBUG_CODE ? ' · debug OTP enabled' : ''
    }`,
  );
}

void bootstrap();
