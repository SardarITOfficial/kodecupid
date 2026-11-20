import { Injectable } from '@nestjs/common';
import {
  ONBOARDING_STEP_VALUES,
  type IdentityStepInput,
  type LocationStepInput,
  type MemberSession,
  type OnboardingStatus,
  type OnboardingStep,
  type PreferencesStepInput,
  type PrivacyStepInput,
  type ProfessionStepInput,
} from '@kodecupid/shared';
import { ErrorCode, errors } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';
import { MemberSessionService } from '../auth/member-session.service';
import { ProfileService } from '../profile/profile.service';
import { nextIncompleteStep, ONBOARDING_SEQUENCE } from './onboarding.sequence';

const MEMBER_INCLUDE = {
  legalAcceptances: true,
  profile: true,
  onboarding: true,
} as const;

export interface StepSaveResult {
  status: OnboardingStatus;
  nextStep: OnboardingStep;
}

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profile: ProfileService,
    private readonly sessions: MemberSessionService,
  ) {}

  async state(userId: string): Promise<OnboardingStatus> {
    const progress = await this.ensureProgress(userId);
    const completedSteps = progress.completedSteps as OnboardingStep[];
    const completed = progress.completedAt !== null;
    return {
      completed,
      nextStep: completed ? 'complete' : nextIncompleteStep(completedSteps),
      completedSteps,
    };
  }

  /**
   * Saves one step and advances progress. Step data lands in the same tables
   * the profile screens edit, so there is no separate "draft profile".
   */
  async saveStep(userId: string, step: OnboardingStep, payload: unknown): Promise<StepSaveResult> {
    switch (step) {
      case 'welcome':
        break;

      case 'identity': {
        const input = payload as IdentityStepInput;
        await this.profile.update(userId, {
          displayName: input.displayName,
          dateOfBirth: input.dateOfBirth,
          genderIdentity: input.genderIdentity,
          ...(input.genderIdentityOther !== undefined
            ? { genderIdentityOther: input.genderIdentityOther }
            : {}),
          interestedIn: input.interestedIn,
        });
        break;
      }

      case 'profession': {
        const input = payload as ProfessionStepInput;
        await this.profile.update(userId, {
          profession: input.profession,
          ...(input.employerName !== undefined ? { employerName: input.employerName } : {}),
          shiftSchedule: input.shiftSchedule,
          ...(input.shiftNotes !== undefined ? { shiftNotes: input.shiftNotes } : {}),
        });
        break;
      }

      case 'location': {
        const input = payload as LocationStepInput;
        await this.profile.update(userId, {
          city: input.city,
          ...(input.region !== undefined ? { region: input.region } : {}),
          country: input.country,
          ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
          ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
        });
        break;
      }

      case 'preferences': {
        const input = payload as PreferencesStepInput;
        await this.prisma.userPreference.upsert({
          where: { userId },
          create: {
            userId,
            lookingFor: input.lookingFor,
            ageRangeMin: input.ageRangeMin,
            ageRangeMax: input.ageRangeMax,
            maxDistanceKm: input.maxDistanceKm,
          },
          update: {
            lookingFor: input.lookingFor,
            ageRangeMin: input.ageRangeMin,
            ageRangeMax: input.ageRangeMax,
            maxDistanceKm: input.maxDistanceKm,
          },
        });
        await this.profile.update(userId, { relationshipGoals: input.lookingFor });
        break;
      }

      case 'privacy': {
        const input = payload as PrivacyStepInput;
        for (const update of input.visibility) {
          await this.profile.setVisibility(userId, update.field, update.visibility);
        }
        break;
      }

      default:
        throw errors.validation('That onboarding step cannot be saved', {
          code: ErrorCode.ONBOARDING_STEP_UNKNOWN,
        });
    }

    const progress = await this.ensureProgress(userId);
    const completed = Array.from(
      new Set([...(progress.completedSteps as OnboardingStep[]), step]),
    ) as OnboardingStep[];
    const nextStep = nextIncompleteStep(completed);

    await this.prisma.onboardingProgress.update({
      where: { userId },
      data: { completedSteps: completed, currentStep: nextStep },
    });

    return {
      status: { completed: false, nextStep, completedSteps: completed },
      nextStep,
    };
  }

  async complete(userId: string): Promise<MemberSession> {
    const progress = await this.ensureProgress(userId);
    const completedSteps = progress.completedSteps as OnboardingStep[];
    const missing = ONBOARDING_SEQUENCE.filter((step) => !completedSteps.includes(step));

    if (missing.length > 0) {
      throw errors.forbidden(
        ErrorCode.ONBOARDING_INCOMPLETE,
        'Please finish the remaining onboarding steps first.',
        { missing },
      );
    }

    const now = new Date();
    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingCompletedAt: now, status: 'ACTIVE' },
    });
    await this.prisma.onboardingProgress.update({
      where: { userId },
      data: { completedAt: now, currentStep: 'complete', completedSteps: ONBOARDING_SEQUENCE },
    });

    const member = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: MEMBER_INCLUDE,
    });

    return this.sessions.build(member);
  }

  private async ensureProgress(userId: string) {
    const existing = await this.prisma.onboardingProgress.findUnique({ where: { userId } });
    if (existing) return existing;

    return this.prisma.onboardingProgress.create({ data: { userId } });
  }

  static isPatchableStep(step: string): step is OnboardingStep {
    return (ONBOARDING_STEP_VALUES as readonly string[]).includes(step) && step !== 'complete';
  }
}
