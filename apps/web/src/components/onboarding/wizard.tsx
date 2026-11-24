'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  COUNTRY_DIAL_CODES,
  GENDER_IDENTITY_LABELS,
  INTERESTED_IN_LABELS,
  ONBOARDING_STEP_LABELS,
  PROFESSION_CATEGORY_LABELS,
  QUICK_PRIVACY_FIELDS,
  RELATIONSHIP_GOAL_LABELS,
  SHIFT_SCHEDULE_LABELS,
  schemaForStep,
  type MemberSession,
  type OnboardingStatus,
  type OnboardingStep,
  type ProfileOwnerView,
  type ProfileField,
  type ProfilePhotoView,
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
import { PhotoManager } from '@/components/profile/photo-manager';

const ORDER = ONBOARDING_STEP_ORDER as unknown as OnboardingStep[];
const VISIBLE_STEPS: OnboardingStep[] = [
  'welcome',
  'identity',
  'profession',
  'location',
  'preferences',
  'privacy',
  'complete',
];

interface FormState {
  displayName: string;
  dateOfBirth: string;
  genderIdentity: string;
  genderIdentityOther: string;
  interestedIn: string[];
  profession: string;
  professionCategory: string;
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
    professionCategory: profile?.professionCategory ?? '',
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

const WELCOME_POINTS = [
  { title: 'Quick', body: 'Five short steps, saved as you go. Leave and come back anytime.' },
  { title: 'Private', body: 'Every field gets its own privacy switch.' },
  { title: 'Flexible', body: 'You can pause your profile whenever you need a break.' },
];

function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl">{title}</h1>
      {subtitle ? (
        <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{subtitle}</p>
      ) : null}
    </div>
  );
}

export function OnboardingWizard({ step }: { step: OnboardingStep }) {
  const router = useRouter();
  const { setMember } = useSession();

  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [form, setForm] = useState<FormState>(initialForm(null));
  const [photos, setPhotos] = useState<ProfilePhotoView[]>([]);
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
          apiFetch<OnboardingStatus>('/onboarding/status'),
          apiFetch<ProfileOwnerView>('/profile/me'),
        ]);
        if (cancelled) return;
        setStatus(state);
        setForm(initialForm(profile));
        setPhotos(profile.photos ?? []);
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
          professionCategory: form.professionCategory,
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
      await apiFetch('/onboarding/step', { method: 'PATCH', body: { step, data: payload } });
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
      if (caught instanceof ApiError && caught.code === 'PHOTO_REQUIRED') {
        setError('Add at least one photo to finish — it is the first thing members see.');
      } else {
        setError(errorMessage(caught, 'We could not finish your setup.'));
      }
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
        <Card className="mt-8 text-center shadow-sm sm:p-8">
          <span aria-hidden className="text-4xl">
            🎉
          </span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
            Almost there, {form.displayName || 'friend'}
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            One last thing: a profile needs at least one photo. You can add up to six, and change
            them any time from your profile.
          </p>

          <div className="mt-6 text-left">
            <PhotoManager photos={photos} onChange={setPhotos} />
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-3 text-left text-sm">
            <div className="rounded-xl bg-alabaster p-3.5 ring-1 ring-line">
              <dt className="text-xs text-muted">City</dt>
              <dd className="font-medium text-navy">{form.city || 'Not set'}</dd>
            </div>
            <div className="rounded-xl bg-alabaster p-3.5 ring-1 ring-line">
              <dt className="text-xs text-muted">Shift</dt>
              <dd className="font-medium text-navy">
                {SHIFT_SCHEDULE_LABELS[form.shiftSchedule as keyof typeof SHIFT_SCHEDULE_LABELS] ??
                  'Not set'}
              </dd>
            </div>
            <div className="rounded-xl bg-alabaster p-3.5 ring-1 ring-line">
              <dt className="text-xs text-muted">Looking for</dt>
              <dd className="font-medium text-navy">
                {form.lookingFor
                  .map((goal) => RELATIONSHIP_GOAL_LABELS[goal as keyof typeof RELATIONSHIP_GOAL_LABELS])
                  .join(', ') || 'Not set'}
              </dd>
            </div>
            <div className="rounded-xl bg-alabaster p-3.5 ring-1 ring-line">
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

          <Button
            className="mt-8"
            size="lg"
            fullWidth
            loading={finishing}
            disabled={photos.length === 0}
            onClick={() => void finish()}
          >
            {photos.length === 0 ? 'Add a photo to continue' : 'Enter KodeCupid'}
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

      <Card className="mt-8 shadow-sm sm:p-8">
        {step === 'welcome' ? (
          <div>
            <div className="grid size-14 place-items-center rounded-2xl bg-crimson-soft text-crimson">
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="size-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.8a4.3 4.3 0 0 1 7.5 2.7c0 5.4-7.5 10-7.5 10z" />
              </svg>
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
              Welcome to <span className="text-crimson">KodeCupid</span>
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-charcoal sm:text-base">
              We built this for people whose lives run on shift patterns — nurses, doctors,
              paramedics, teachers, first responders, engineers and technicians working when the rest
              of the world sleeps.
            </p>
            <ul className="mt-7 grid gap-3 sm:grid-cols-3">
              {WELCOME_POINTS.map((point) => (
                <li
                  key={point.title}
                  className="rounded-2xl bg-alabaster p-4 ring-1 ring-line"
                >
                  <p className="flex items-center gap-2 text-sm font-semibold text-navy">
                    <span aria-hidden className="text-crimson">
                      ✓
                    </span>
                    {point.title}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">{point.body}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {step === 'identity' ? (
          <div className="space-y-5">
            <StepHeader title="About you" subtitle="The basics other members will see." />
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
          <div className="space-y-5">
            <StepHeader
              title="Work &amp; shifts"
              subtitle="This is how we match you with people on a compatible schedule."
            />
            <SelectableChips
              legend="Profession category"
              options={optionsFrom(PROFESSION_CATEGORY_LABELS)}
              value={form.professionCategory || null}
              onChange={(value) => update('professionCategory', value as string)}
            />
            {fieldErrors.professionCategory ? (
              <p className="text-xs font-medium text-crimson">{fieldErrors.professionCategory}</p>
            ) : null}
            <TextInput
              label="Job title"
              required
              placeholder="e.g. Registered Nurse"
              value={form.profession}
              onChange={(event) => update('profession', event.target.value)}
              error={fieldErrors.profession}
            />
            <TextInput
              label="Employer or institution"
              optional
              value={form.employerName}
              onChange={(event) => update('employerName', event.target.value)}
              hint="Hidden by default if you switch on workplace privacy later."
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
          <div className="space-y-5">
            <StepHeader title="Where are you based?" subtitle="Only your city is shown to members." />
            <TextInput
              label="City"
              required
              value={form.city}
              onChange={(event) => update('city', event.target.value)}
              error={fieldErrors.city}
            />
            <TextInput
              label="State / province"
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
            <div className="rounded-2xl border border-line bg-alabaster p-4">
              <p className="text-sm font-semibold text-navy">Approximate location</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Optional. Used for distance-based matching in a later release; exact coordinates are
                never shown to members.
              </p>
              <Button type="button" variant="ghost" size="sm" className="mt-3" onClick={useMyLocation}>
                Use my current location
              </Button>
              {geoNote ? <p className="mt-2 text-xs text-muted">{geoNote}</p> : null}
            </div>
          </div>
        ) : null}

        {step === 'preferences' ? (
          <div className="space-y-5">
            <StepHeader title="What are you looking for?" subtitle="You can change this any time." />
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
            <div className="grid grid-cols-2 gap-4">
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
              hint="You can change this later. Discovery arrives in a later milestone."
            />
          </div>
        ) : null}

        {step === 'privacy' ? (
          <div>
            <StepHeader
              title="Quick privacy check"
              subtitle="Four fields people are most protective of. You can change all twenty from your profile later."
            />
            <div className="divide-y divide-line rounded-2xl border border-line bg-white px-4">
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
                        visibility: {
                          ...current.visibility,
                          [field as ProfileField]: checked ? 'PUBLIC' : 'HIDDEN',
                        } as Record<string, VisibilityLevel>,
                      }))
                    }
                    title={
                      field === 'WORKPLACE'
                        ? 'Workplace name'
                        : field.replace(/_/g, ' ').toLowerCase()
                    }
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
          <div className="mt-5">
            <Alert tone="danger">{error}</Alert>
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-6">
          {stepIndex > 0 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push(`/onboarding/${ORDER[stepIndex - 1] ?? 'welcome'}`)}
              disabled={saving}
            >
              Back
            </Button>
          ) : (
            <span />
          )}
          <Button type="button" onClick={() => void saveAndContinue()} loading={saving} size="lg">
            {step === 'welcome'
              ? 'Get started'
              : step === 'privacy'
                ? 'Continue to finish'
                : 'Continue'}
          </Button>
        </div>
      </Card>
    </div>
  );
}