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
import { z } from 'zod';
import {
  ONBOARDING_STEP_VALUES,
  schemaForStep,
  type MemberSession,
  type OnboardingStatus,
} from '@kodecupid/shared';
import { CurrentMember } from '../common/decorators';
import { validateWith } from '../common/pipes/zod-validation.pipe';
import { ErrorCode, errors } from '../common/errors';
import { ComplianceGuard } from '../auth/compliance.guard';
import { MemberAuthGuard } from '../auth/member-auth.guard';
import { OnboardingService } from './onboarding.service';

const stepPatchSchema = z.object({
  step: z.enum(ONBOARDING_STEP_VALUES),
  data: z.unknown(),
});

@Controller('onboarding')
@UseGuards(MemberAuthGuard, ComplianceGuard)
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  /** Canonical status endpoint (`/state` is kept as an alias). */
  @Get('status')
  status(@CurrentMember() member: { user: { id: string } }): Promise<OnboardingStatus> {
    return this.onboarding.state(member.user.id);
  }

  @Get('state')
  state(@CurrentMember() member: { user: { id: string } }): Promise<OnboardingStatus> {
    return this.onboarding.state(member.user.id);
  }

  /** Canonical single-step endpoint: `{ step, data }`. */
  @Patch('step')
  async saveStepByBody(
    @CurrentMember() member: { user: { id: string } },
    @Body() body: unknown,
  ) {
    const parsed = validateWith(stepPatchSchema, body ?? {});
    return this.save(member.user.id, parsed.step, parsed.data);
  }

  /** Path-parameter form, kept for convenience and backwards compatibility. */
  @Patch('steps/:step')
  async saveStepByParam(
    @CurrentMember() member: { user: { id: string } },
    @Param('step') step: string,
    @Body() body: unknown,
  ) {
    return this.save(member.user.id, step, body ?? {});
  }

  @Post('complete')
  @HttpCode(200)
  complete(@CurrentMember() member: { user: { id: string } }): Promise<MemberSession> {
    return this.onboarding.complete(member.user.id);
  }

  private async save(userId: string, step: string, data: unknown) {
    if (!OnboardingService.isPatchableStep(step)) {
      throw errors.validation('That onboarding step does not exist', {
        code: ErrorCode.ONBOARDING_STEP_UNKNOWN,
      });
    }

    const schema = schemaForStep(step);
    const payload = validateWith(schema, data ?? {});
    return this.onboarding.saveStep(userId, step, payload);
  }
}
