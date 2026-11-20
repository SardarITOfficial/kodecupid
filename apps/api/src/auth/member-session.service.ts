import { Injectable } from '@nestjs/common';
import {
  ONBOARDING_STEP_LABELS,
  type ComplianceStatus,
  type DocumentType,
  type MemberSession,
  type OnboardingStatus,
} from '@kodecupid/shared';
import { legalVersionsOf } from '../config/app-config';
import { AppConfigService } from '../config/app-config.module';
import type { MemberRecord } from './auth.types';
import {
  nextIncompleteStep,
  ONBOARDING_SEQUENCE,
} from '../onboarding/onboarding.sequence';

/** The documents the member must explicitly accept before onboarding. */
const MANDATORY_DOCUMENTS: DocumentType[] = ['TERMS', 'COMMUNITY_GUIDELINES', 'SAFETY_TIPS'];

@Injectable()
export class MemberSessionService {
  constructor(private readonly config: AppConfigService) {}

  complianceOf(member: MemberRecord): ComplianceStatus {
    const versions = legalVersionsOf(this.config.env);
    const expected: Record<string, string> = {
      TERMS: versions.terms,
      COMMUNITY_GUIDELINES: versions.guidelines,
      SAFETY_TIPS: versions.safetyTips,
    };

    const missing = MANDATORY_DOCUMENTS.filter(
      (type) =>
        !member.legalAcceptances.some(
          (acceptance) =>
            acceptance.documentType === type &&
            acceptance.documentVersion === expected[type],
        ),
    );

    const ageVerified = member.ageVerifiedAt !== null;
    return { required: !ageVerified || missing.length > 0, ageVerified, missing };
  }

  onboardingOf(member: MemberRecord): OnboardingStatus {
    const completedSteps = (member.onboarding?.completedSteps ??
      []) as OnboardingStatus['completedSteps'];
    const completed = member.onboardingCompletedAt !== null;
    const done = new Set(completedSteps);

    return {
      completed,
      nextStep: completed ? 'complete' : nextIncompleteStep(completedSteps),
      completedSteps,
      steps: ONBOARDING_SEQUENCE.map((step) => ({
        step,
        label: ONBOARDING_STEP_LABELS[step],
        completed: done.has(step),
      })),
      canComplete: completed || ONBOARDING_SEQUENCE.every((step) => done.has(step)),
    };
  }

  build(member: MemberRecord): MemberSession {
    return {
      user: {
        id: member.id,
        phone: member.phoneE164,
        status: member.status,
        createdAt: member.createdAt.toISOString(),
        ageVerifiedAt: member.ageVerifiedAt?.toISOString() ?? null,
        onboardingCompletedAt: member.onboardingCompletedAt?.toISOString() ?? null,
        displayName: member.profile?.displayName ?? null,
        profileStatus: member.profile?.status ?? null,
      },
      compliance: this.complianceOf(member),
      onboarding: this.onboardingOf(member),
    };
  }
}
