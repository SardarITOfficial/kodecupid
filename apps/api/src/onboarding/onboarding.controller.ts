import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { schemaForStep, type MemberSession, type OnboardingStatus } from '@kodecupid/shared';
import { CurrentMember } from '../common/decorators';
import { validateWith } from '../common/pipes/zod-validation.pipe';
import { ErrorCode, errors } from '../common/errors';
import { ComplianceGuard } from '../auth/compliance.guard';
import { MemberAuthGuard } from '../auth/member-auth.guard';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
@UseGuards(MemberAuthGuard, ComplianceGuard)
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get('state')
  state(@CurrentMember() member: { user: { id: string } }): Promise<OnboardingStatus> {
    return this.onboarding.state(member.user.id);
  }

  @Patch('steps/:step')
  async saveStep(
    @CurrentMember() member: { user: { id: string } },
    @Param('step') step: string,
    @Body() body: unknown,
  ) {
    if (!OnboardingService.isPatchableStep(step)) {
      throw errors.validation('That onboarding step does not exist', {
        code: ErrorCode.ONBOARDING_STEP_UNKNOWN,
      });
    }

    const schema = schemaForStep(step);
    const payload = validateWith(schema, body ?? {});
    return this.onboarding.saveStep(member.user.id, step, payload);
  }

  @Post('complete')
  @HttpCode(200)
  complete(@CurrentMember() member: { user: { id: string } }): Promise<MemberSession> {
    return this.onboarding.complete(member.user.id);
  }
}
