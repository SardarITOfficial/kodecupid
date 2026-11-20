import { Module } from '@nestjs/common';
import { HealthController, MetaController } from './health.controller';

@Module({
  controllers: [HealthController, MetaController],
})
export class HealthModule {}
