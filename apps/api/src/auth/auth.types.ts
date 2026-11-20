import type { AdminUser } from '../prisma/generated';
import type { LegalAcceptance, OnboardingProgress, Profile, User } from '../prisma/generated';

export type MemberRecord = User & {
  legalAcceptances: LegalAcceptance[];
  profile: Profile | null;
  onboarding: OnboardingProgress | null;
};

/** Attached to the request by MemberAuthGuard. */
export interface MemberAudienceUser {
  user: MemberRecord;
}

/** Attached to the request by AdminAuthGuard. */
export interface AdminAudienceUser {
  admin: AdminUser;
}
