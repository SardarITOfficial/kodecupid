'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  COUNTRY_DIAL_CODES,
  GENDER_IDENTITY_LABELS,
  INTERESTED_IN_LABELS,
  ONBOARDING_STEP_LABELS,
  QUICK_PRIVACY_FIELDS,
  RELATIONSHIP_GOAL_LABELS,
  SHIFT_SCHEDULE_LABELS,
  schemaForStep,
  type MemberSession,
  type OnboardingStatus,
  type OnboardingStep,
  type ProfileOwnerView,
  type ProfileField,
  type VisibilityLevel,
} from '@kodecupid/shared';
import { useSession } from '@/app/providers';
import { apiFetch, ApiError, errorMessage } from '@/lib/api';
import { optionsFrom } from '@/lib/options';
import { ONBOARDING_STEP_ORDER } from '@/lib/routing';
import { Button } from '@/components/ui/button';
import { TextInput, TextArea, SelectField } from '@/components/ui/field';
import { SelectableChips } from '@/components/ui/chips';
import { Card } from '@/components/ui/card';
import { Alert, LoadingBlock } from '@/components/ui/feedback';
import { ProgressSteps } from '@/components/ui/stepper';
import { ToggleRow } from '@/components/ui/toggle';

const ORDER = ONBOARDING_STEP_ORDER as unknown as OnboardingStep[];
const VISIBLE_STEPS: OnboardingStep[] = ['welcome', 'identity', 'profession', 'location', 'preferences', 'privacy', 'complete'];

interface FormState {
  displayName: string;
  dateOfBirth: string;
  genderIdentity: string;
  genderIdentityOther: string;
  interestedIn: string[];
  profession: string;
  employerName: string;
  shiftSchedule: string;
  shiftNotes: string;
  city: string;
  region: string;
  country: string;
  latitude?: number;
  longitude?: number;
  lookingFor: string[];
  ageRangeMin: number;
  ageRangeMax: number;
  maxDistanceKm: number;
  visibility: Record<string, VisibilityLevel>;
}

function initialForm(profile: ProfileOwnerView | null): FormState {
  return {
    displayName: profile?.displayName ?? '',
    dateOfBirth: profile?.dateOfBirth ?? '',
    genderIdentity: profile?.genderIdentity ?? '',
    genderIdentityOther: profile?.genderIdentityOther ?? '',
    interestedIn: profile?.interestedIn ?? [],
    profession: profile?.profession ?? '',
    employerName: profile?.employerName ?? '',
    shiftSchedule: profile?.shiftSchedule ?? '',
    shiftNotes: profile?.shiftNotes ?? '',
    city: profile?.city ?? '',
    region: profile?.region ?? '',
    country: profile?.country ?? 'US',
    ...(typeof profile?.latitude === 'number' ? { latitude: profile.latitude } : {}),
    ...(typeof profile?.longitude === 'number' ? { longitude: profile.longitude } : {}),
    lookingFor: profile?.relationshipGoals ?? [],
    ageRangeMin: 18,
    ageRangeMax: 99,
    maxDistanceKm: 50,
    visibility: { ...(profile?.visibility ?? {}) },
  };
}

function eighteenYearsAgo(): string {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - 18);
  return date.toISOString().slice(0, 10);
}

const COUNTRY_OPTIONS = COUNTRY_DIAL_CODES.map((country) => ({
  value: country.iso2,
  label: country.name,
}));

export function OnboardingWizard({ step }: { step: OnboardingStep }) {
  const router = useRouter();
  const { setMember } = useSession();

  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [form, setForm] = useState<FormState>(initialForm(null));
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [geoNote, setGeoNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [state, profile] = await Promise.all([
          apiFetch<OnboardingStatus>('/onboarding/state'),
          apiFetch<ProfileOwnerView>('/profile/me'),
        ]);
        if (cancelled) return;
        setStatus(state);
        setForm(initialForm(profile));
      } catch (caught) {
        if (!cancelled) setError(errorMessage(caught, 'Could not load your setup.'));
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stepIndex = useMemo(() => ORDER.indexOf(step), [step]);

  useEffect(() => {
    if (!loaded || !status) return;
    if (status.completed) {
      router.replace('/app');
      return;
    }
    if (!VISIBLE_STEPS.includes(step)) {
      router.replace(`/onboarding/${status.nextStep}`);
      return;
    }
    const nextIndex = ORDER.indexOf(status.nextStep);
    if (step !== 'complete' && stepIndex > nextIndex) {
      router.replace(`/onboarding/${status.nextStep}`);
    }
  }, [loaded, status, step, stepIndex, router]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function buildPayload(): Record<string, unknown> {
    switch (step) {
      case 'identity':
        return {
          displayName: form.displayName,
          dateOfBirth: form.dateOfBirth,
          genderIdentity: form.genderIdentity,
          ...(form.genderIdentity === 'OTHER' && form.genderIdentityOther
            ? { genderIdentityOther: form.genderIdentityOther }
            : {}),
          interestedIn: form.interestedIn,
        };
      case 'profession':
        return {
          profession: form.profession,
          ...(form.employerName ? { employerName: form.employerName } : {}),
          shiftSchedule: form.shiftSchedule,
          ...(form.shiftNotes ? { shiftNotes: form.shiftNotes } : {}),
        };
      case 'location':
        return {
          city: form.city,
          ...(form.region ? { region: form.region } : {}),
          country: form.country,
          ...(typeof form.latitude === 'number' && typeof form.longitude === 'number'
            ? { latitude: form.latitude, longitude: form.longitude }
            : {}),
        };
      case 'preferences':
        return {
          lookingFor: form.lookingFor,
          ageRangeMin: form.ageRangeMin,
          ageRangeMax: form.ageRangeMax,
          maxDistanceKm: form.maxDistanceKm,
        };
      case 'privacy':
        return {
          visibility: QUICK_PRIVACY_FIELDS.map((field) => ({
            field,
            visibility: form.visibility[field] ?? 'PUBLIC',
          })),
        };
      default:
        return {};
    }
  }

  async function saveAndContinue(): Promise<void> {
    setError(null);
    setFieldErrors({});
    const payload = buildPayload();

    if (step !== 'welcome' && step !== 'complete') {
      const parsed = schemaForStep(step).safeParse(payload);
      if (!parsed.success) {
        const errors: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          const key = issue.path.join('.') || '_';
          if (!errors[key]) errors[key] = issue.message;
        }
        setFieldErrors(errors);
        setError('Please check the highlighted fields.');
        return;
      }
    }

    setSaving(true);
    try {
      await apiFetch(`/onboarding/steps/${step}`, { method: 'PATCH', body: payload });
      const next = ORDER[Math.min(stepIndex + 1, ORDER.length - 1)] ?? 'complete';
      router.push(`/onboarding/${next}`);
    } catch (caught) {
      if (caught instanceof ApiError && Object.keys(caught.fieldErrors).length > 0) {
        setFieldErrors(caught.fieldErrors);
      }
      setError(errorMessage(caught, 'We could not save that step.'));
    } finally {
      setSaving(false);
    }
  }

  async function finish(): Promise<void> {
    setError(null);
    setFinishing(true);
    try {
      const session = await apiFetch<MemberSession>('/onboarding/complete', { method: 'POST' });
      setMember(session);
      router.replace('/app');
    } catch (caught) {
      setError(errorMessage(caught, 'We could not finish your setup.'));
    } finally {
      setFinishing(false);
    }
  }

  function useMyLocation(): void {
    if (!navigator.geolocation) {
      setGeoNote('Your browser does not support location sharing.');
      return;
    }
    setGeoNote('Getting your location…');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        update('latitude', Math.round(position.coords.latitude * 10000) / 10000);
        update('longitude', Math.round(position.coords.longitude * 10000) / 10000);
        setGeoNote('Approximate location saved. It is never shown as an exact address.');
      },
      () => setGeoNote('We could not read your location. You can still continue.'),
      { timeout: 8000 },
    );
  }

  if (!loaded || !status) {
    return <LoadingBlock label="Loading your setup" rows={3} />;
  }

  if (step === 'complete') {
    return (
      <div>
        <ProgressSteps
          steps={VISIBLE_STEPS.map((key) => ({
            key,
            label: ONBOARDING_STEP_LABELS[key as keyof typeof ONBOARDING_STEP_LABELS] ?? key,
          }))}
          currentIndex={VISIBLE_STEPS.length - 1}
        />
        <Card className="mt-6 text-center">
          <span aria-hidden className="text-4xl">
            🎉
          </span>
          <h1 className="mt-3 text-xl font-semibold text-navy">
            You&apos;re ready, {form.displayName || 'friend'}
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Your profile is live to members who match your preferences. You can change every field
            and every privacy switch from your profile at any time.
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-3 text-left text-sm">
            <div className="rounded-xl bg-alabaster p-3">
              <dt className="text-xs text-muted">City</dt>
              <dd className="font-medium text-navy">{form.city || 'Not set'}</dd>
            </div>
            <div className="rounded-xl bg-alabaster p-3">
              <dt className="text-xs text-muted">Shift</dt>
              <dd className="font-medium text-navy">
                {SHIFT_SCHEDULE_LABELS[form.shiftSchedule as keyof typeof SHIFT_SCHEDULE_LABELS] ??
                  'Not set'}
              </dd>
            </div>
            <div className="rounded-xl bg-alabaster p-3">
              <dt className="text-xs text-muted">Looking for</dt>
              <dd className="font-medium text-navy">
                {form.lookingFor
                  .map((goal) => RELATIONSHIP_GOAL_LABELS[goal as keyof typeof RELATIONSHIP_GOAL_LABELS])
                  .join(', ') || 'Not set'}
              </dd>
            </div>
            <div className="rounded-xl bg-alabaster p-3">
              <dt className="text-xs text-muted">Hidden fields</dt>
              <dd className="font-medium text-navy">
                {QUICK_PRIVACY_FIELDS.filter((field) => form.visibility[field] === 'HIDDEN').length} of{' '}
                {QUICK_PRIVACY_FIELDS.length}
              </dd>
            </div>
          </dl>
          {error ? (
            <div className="mt-4 text-left">
              <Alert tone="danger">{error}</Alert>
            </div>
          ) : null}
          <Button className="mt-6" size="lg" fullWidth loading={finishing} onClick={() => void finish()}>
            Enter KodeCupid
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <ProgressSteps
        steps={VISIBLE_STEPS.slice(0, -1).map((key) => ({
          key,
          label: ONBOARDING_STEP_LABELS[key as keyof typeof ONBOARDING_STEP_LABELS] ?? key,
        }))}
        currentIndex={Math.max(0, stepIndex)}
      />

      <Card className="mt-6">
        {step === 'welcome' ? (
          <div>
            <h1 className="text-xl font-semibold text-navy">Welcome to KodeCupid</h1>
            <p className="mt-2 text-sm leading-relaxed text-charcoal">
              We built this for people whose lives run on shift patterns — nurses, doctors,
              paramedics, firefighters and everyone else working when the rest of the world sleeps.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-charcoal">
              {[
                'Five short steps, saved as you go — leave and come back anytime.',
                'Every field gets its own privacy switch.',
                'You can pause your profile whenever you need a break.',
              ].map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden className="text-crimson">
                    ✓
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {step === 'identity' ? (
          <div className="space-y-4">
            <h1 className="text-xl font-semibold text-navy">About you</h1>
            <TextInput
              label="Display name"
              required
              value={form.displayName}
              onChange={(event) => update('displayName', event.target.value)}
              error={fieldErrors.displayName}
              hint="First name and an initial is plenty. This is what other members see."
            />
            <TextInput
              label="Date of birth"
              type="date"
              required
              max={eighteenYearsAgo()}
              value={form.dateOfBirth}
              onChange={(event) => update('dateOfBirth', event.target.value)}
              error={fieldErrors.dateOfBirth}
              hint="Shown as your age only — never your birthday."
            />
            <SelectableChips
              legend="Gender identity"
              options={optionsFrom(GENDER_IDENTITY_LABELS)}
              value={form.genderIdentity || null}
              onChange={(value) => update('genderIdentity', value as string)}
            />
            {fieldErrors.genderIdentity ? (
              <p className="text-xs font-medium text-crimson">{fieldErrors.genderIdentity}</p>
            ) : null}
            {form.genderIdentity === 'OTHER' ? (
              <TextInput
                label="How do you describe your gender?"
                optional
                value={form.genderIdentityOther}
                onChange={(event) => update('genderIdentityOther', event.target.value)}
              />
            ) : null}
            <SelectableChips
              legend="Interested in"
              multiple
              options={optionsFrom(INTERESTED_IN_LABELS)}
              value={form.interestedIn}
              onChange={(value) => update('interestedIn', value as string[])}
            />
            {fieldErrors.interestedIn ? (
              <p className="text-xs font-medium text-crimson">{fieldErrors.interestedIn}</p>
            ) : null}
          </div>
        ) : null}

        {step === 'profession' ? (
          <div className="space-y-4">
            <h1 className="text-xl font-semibold text-navy">Work &amp; shifts</h1>
            <TextInput
              label="Profession"
              required
              placeholder="e.g. Registered Nurse"
              value={form.profession}
              onChange={(event) => update('profession', event.target.value)}
              error={fieldErrors.profession}
            />
            <TextInput
              label="Employer"
              optional
              value={form.employerName}
              onChange={(event) => update('employerName', event.target.value)}
              hint="Visible only if you switch on Workplace privacy later."
            />
            <SelectableChips
              legend="Main shift pattern"
              options={optionsFrom(SHIFT_SCHEDULE_LABELS)}
              value={form.shiftSchedule || null}
              onChange={(value) => update('shiftSchedule', value as string)}
            />
            {fieldErrors.shiftSchedule ? (
              <p className="text-xs font-medium text-crimson">{fieldErrors.shiftSchedule}</p>
            ) : null}
            <TextArea
              label="Anything about your schedule?"
              optional
              value={form.shiftNotes}
              onChange={(event) => update('shiftNotes', event.target.value)}
              hint="e.g. 3 on, 4 off — four nights a week."
            />
          </div>
        ) : null}

        {step === 'location' ? (
          <div className="space-y-4">
            <h1 className="text-xl font-semibold text-navy">Where are you based?</h1>
            <TextInput
              label="City"
              required
              value={form.city}
              onChange={(event) => update('city', event.target.value)}
              error={fieldErrors.city}
            />
            <TextInput
              label="State / region"
              optional
              value={form.region}
              onChange={(event) => update('region', event.target.value)}
            />
            <SelectField
              label="Country"
              required
              value={form.country}
              onChange={(event) => update('country', event.target.value)}
              options={COUNTRY_OPTIONS}
            />
            <div className="rounded-xl border border-line bg-alabaster p-3">
              <p className="text-sm font-medium text-navy">Approximate location</p>
              <p className="mt-1 text-xs text-muted">
                Optional. Used for distance-based matching in a later release; exact coordinates are
                never shown to members.
              </p>
              <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={useMyLocation}>
                Use my current location
              </Button>
              {geoNote ? <p className="mt-1 text-xs text-muted">{geoNote}</p> : null}
            </div>
          </div>
        ) : null}

        {step === 'preferences' ? (
          <div className="space-y-4">
            <h1 className="text-xl font-semibold text-navy">What are you looking for?</h1>
            <SelectableChips
              legend="I'm open to"
              multiple
              options={optionsFrom(RELATIONSHIP_GOAL_LABELS)}
              value={form.lookingFor}
              onChange={(value) => update('lookingFor', value as string[])}
            />
            {fieldErrors.lookingFor ? (
              <p className="text-xs font-medium text-crimson">{fieldErrors.lookingFor}</p>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <TextInput
                label="Youngest age"
                type="number"
                min={18}
                max={99}
                value={String(form.ageRangeMin)}
                onChange={(event) => update('ageRangeMin', Number(event.target.value))}
              />
              <TextInput
                label="Oldest age"
                type="number"
                min={18}
                max={99}
                value={String(form.ageRangeMax)}
                onChange={(event) => update('ageRangeMax', Number(event.target.value))}
                error={fieldErrors.ageRangeMin}
              />
            </div>
            <TextInput
              label="Maximum distance (km)"
              type="number"
              min={1}
              max={500}
              value={String(form.maxDistanceKm)}
              onChange={(event) => update('maxDistanceKm', Number(event.target.value))}
              hint="You can change this later. Discovery arrives in Milestone 2."
            />
          </div>
        ) : null}

        {step === 'privacy' ? (
          <div>
            <h1 className="text-xl font-semibold text-navy">Quick privacy check</h1>
            <p className="mt-2 text-sm text-muted">
              Four fields people are most protective of. You can change all twenty from your profile
              later.
            </p>
            <div className="mt-3 divide-y divide-line">
              {QUICK_PRIVACY_FIELDS.map((field) => {
                const level = form.visibility[field] ?? 'PUBLIC';
                return (
                  <ToggleRow
                    key={field}
                    id={`privacy-${field}`}
                    checked={level === 'PUBLIC'}
                    onChange={(checked) =>
                      setForm((current) => ({
                        ...current,
                        visibility: { ...current.visibility, [field as ProfileField]: checked ? 'PUBLIC' : 'HIDDEN' } as Record<string, VisibilityLevel>,
                      }))
                    }
                    title={field === 'WORKPLACE' ? 'Workplace name' : field.replace(/_/g, ' ').toLowerCase()}
                    description={
                      level === 'PUBLIC'
                        ? 'Visible on your profile'
                        : 'Hidden — other members will see a private badge'
                    }
                  />
                );
              })}
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mt-4">
            <Alert tone="danger">{error}</Alert>
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (stepIndex > 0) router.push(`/onboarding/${ORDER[stepIndex - 1] ?? 'welcome'}`);
            }}
            disabled={stepIndex <= 0 || saving}
          >
            Back
          </Button>
          <Button type="button" onClick={() => void saveAndContinue()} loading={saving} size="lg">
            {step === 'privacy' ? 'Finish setup' : 'Continue'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
