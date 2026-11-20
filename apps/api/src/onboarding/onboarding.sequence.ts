import type { OnboardingStep } from '@kodecupid/shared';

/** The order members must walk through onboarding. */
export const ONBOARDING_SEQUENCE: OnboardingStep[] = [
  'welcome',
  'identity',
  'profession',
  'location',
  'preferences',
  'privacy',
];

export function isOnboardingStep(value: string): value is OnboardingStep {
  return ONBOARDING_SEQUENCE.includes(value as OnboardingStep) || value === 'complete';
}

/** First step still missing, or `complete` when everything is done. */
export function nextIncompleteStep(completed: readonly OnboardingStep[]): OnboardingStep {
  const done = new Set(completed);
  return ONBOARDING_SEQUENCE.find((step) => !done.has(step)) ?? 'complete';
}

export function stepIndex(step: OnboardingStep): number {
  return Math.max(0, ONBOARDING_SEQUENCE.indexOf(step));
}
