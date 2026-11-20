import { notFound } from 'next/navigation';
import type { OnboardingStep } from '@kodecupid/shared';
import { OnboardingWizard } from '@/components/onboarding/wizard';
import { ONBOARDING_STEP_ORDER } from '@/lib/routing';

export default async function OnboardingStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  if (!(ONBOARDING_STEP_ORDER as readonly string[]).includes(step)) {
    notFound();
  }

  return <OnboardingWizard step={step as OnboardingStep} />;
}
