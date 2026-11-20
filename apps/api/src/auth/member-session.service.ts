import { Injectable } from '@nestjs/common';
import type {
  ComplianceStatus,
  DocumentType,
  MemberSession,
  OnboardingStatus,
} from '@kodecupid/shared';
import { legalVersionsOf } from '../config/app-config';
import { AppConfigService } from '../config/app-config.module';
import type { MemberRecord } from './auth.types';
import { nextIncompleteStep } from '../onboarding/onboarding.sequence';

/** The two documents the member must explicitly accept before onboarding. */
const MANDATORY_DOCUMENTS: DocumentType[] = ['TERMS', 'COMMUNITY_GUIDELINES'];

@Injectable()
export class MemberSessionService {
  constructor(private readonly config: AppConfigService) {}

  complianceOf(member: MemberRecord): ComplianceStatus {
    const versions = legalVersionsOf(this.config.env);
    const expected: Record<string, string> = {
      TERMS: versions.terms,
      COMMUNITY_GUIDELINES: versions.guidelines,
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
    const completedSteps = (member.onboarding?.completedSteps ?? []) as OnboardingStatus['completedSteps'];
    const completed = member.onboardingCompletedAt !== null;
    return {
      completed,
      nextStep: completed ? 'complete' : nextIncompleteStep(completedSteps),
      completedSteps,
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
