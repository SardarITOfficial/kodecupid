import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { MemberSession } from '@kodecupid/shared';

/**
 * One place decides where a signed-in member lands:
 *   compliance first → onboarding → app.
 */
export function routeAfterAuth(session: MemberSession, router: AppRouterInstance): void {
  if (session.compliance.required) {
    router.replace('/compliance');
    return;
  }

  if (!session.onboarding.completed) {
    const step = session.onboarding.nextStep === 'complete' ? 'privacy' : session.onboarding.nextStep;
    router.replace(`/onboarding/${step}`);
    return;
  }

  router.replace('/app');
}

export const ONBOARDING_STEP_ORDER = [
  'welcome',
  'identity',
  'profession',
  'location',
  'preferences',
  'privacy',
  'complete',
] as const;
