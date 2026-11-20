'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  COUNTRY_DIAL_CODES,
  CREDENTIAL_LABELS,
  EDUCATION_LEVEL_LABELS,
  EXERCISE_LABELS,
  FAMILY_PLANS_LABELS,
  GENDER_IDENTITY_LABELS,
  INTERESTED_IN_LABELS,
  KIDS_LABELS,
  LIFESTYLE_LABELS,
  PROFESSION_CATEGORY_LABELS,
  RELATIONSHIP_GOAL_LABELS,
  SHIFT_SCHEDULE_LABELS,
  type ProfileOwnerView,
} from '@kodecupid/shared';
import { apiFetch, ApiError, errorMessage } from '@/lib/api';
import { optionsFrom } from '@/lib/options';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, LoadingBlock } from '@/components/ui/feedback';
import { SelectableChips } from '@/components/ui/chips';
import { SelectField, TextArea, TextInput } from '@/components/ui/field';
import { ToggleRow } from '@/components/ui/toggle';
import { PhotoManager } from '@/components/profile/photo-manager';

const COUNTRY_OPTIONS = COUNTRY_DIAL_CODES.map((country) => ({
  value: country.iso2,
  label: country.name,
}));

interface EditForm {
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
  religion: string;
  ethnicity: string;
  languagesText: string;
  heightCm: string;
  drinking: string;
  smoking: string;
  cannabis: string;
  exercise: string;
  educationLevel: string;
  credentials: string[];
  relationshipGoals: string[];
  familyPlans: string;
  kids: string;
  bio: string;
  workplaceName: string;
  workplacePrivacyEnabled: boolean;
  workplaceHideRadiusMeters: string;
}

function formFrom(profile: ProfileOwnerView): EditForm {
  return {
    displayName: profile.displayName ?? '',
    dateOfBirth: profile.dateOfBirth ?? '',
    genderIdentity: profile.genderIdentity ?? '',
    genderIdentityOther: profile.genderIdentityOther ?? '',
    interestedIn: profile.interestedIn ?? [],
    profession: profile.profession ?? '',
    professionCategory: profile.professionCategory ?? '',
    employerName: profile.employerName ?? '',
    shiftSchedule: profile.shiftSchedule ?? '',
    shiftNotes: profile.shiftNotes ?? '',
    city: profile.city ?? '',
    region: profile.region ?? '',
    country: profile.country ?? 'US',
    religion: profile.religion ?? '',
    ethnicity: profile.ethnicity ?? '',
    languagesText: (profile.languages ?? []).join(', '),
    heightCm: profile.heightCm ? String(profile.heightCm) : '',
    drinking: profile.drinking ?? '',
    smoking: profile.smoking ?? '',
    cannabis: profile.cannabis ?? '',
    exercise: profile.exercise ?? '',
    educationLevel: profile.educationLevel ?? '',
    credentials: profile.credentials ?? [],
    relationshipGoals: profile.relationshipGoals ?? [],
    familyPlans: profile.familyPlans ?? '',
    kids: profile.kids ?? '',
    bio: profile.bio ?? '',
    workplaceName: profile.workplaceName ?? '',
    workplacePrivacyEnabled: profile.workplacePrivacyEnabled ?? false,
    workplaceHideRadiusMeters: profile.workplaceHideRadiusMeters
      ? String(profile.workplaceHideRadiusMeters)
      : '500',
  };
}

export default function EditProfilePage() {
  const [profile, setProfile] = useState<ProfileOwnerView | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    apiFetch<ProfileOwnerView>('/profile/me')
      .then((value) => {
        if (cancelled) return;
        setProfile(value);
        setForm(formFrom(value));
      })
      .catch((caught) => {
        if (!cancelled) setError(errorMessage(caught, 'Could not load your profile.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function update<K extends keyof EditForm>(key: K, value: EditForm[K]): void {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setSaved(false);
  }

  async function save(): Promise<void> {
    if (!form) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    setFieldErrors({});

    const languages = form.languagesText
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    const payload: Record<string, unknown> = {
      ...(form.displayName.trim().length >= 2 ? { displayName: form.displayName.trim() } : {}),
      ...(form.dateOfBirth ? { dateOfBirth: form.dateOfBirth } : {}),
      ...(form.genderIdentity ? { genderIdentity: form.genderIdentity } : {}),
      genderIdentityOther: form.genderIdentityOther.trim() || null,
      ...(form.interestedIn.length > 0 ? { interestedIn: form.interestedIn } : {}),
      profession: form.profession.trim() || null,
      professionCategory: form.professionCategory || null,
      employerName: form.employerName.trim() || null,
      ...(form.shiftSchedule ? { shiftSchedule: form.shiftSchedule } : {}),
      shiftNotes: form.shiftNotes.trim() || null,
      city: form.city.trim() || null,
      region: form.region.trim() || null,
      country: form.country || null,
      religion: form.religion.trim() || null,
      ethnicity: form.ethnicity.trim() || null,
      languages,
      heightCm: form.heightCm ? Number(form.heightCm) : null,
      drinking: form.drinking || null,
      smoking: form.smoking || null,
      cannabis: form.cannabis || null,
      exercise: form.exercise || null,
      educationLevel: form.educationLevel || null,
      credentials: form.credentials,
      relationshipGoals: form.relationshipGoals,
      familyPlans: form.familyPlans || null,
      kids: form.kids || null,
      bio: form.bio.trim() || null,
      workplaceName: form.workplaceName.trim() || null,
      workplacePrivacyEnabled: form.workplacePrivacyEnabled,
      workplaceHideRadiusMeters: form.workplaceHideRadiusMeters
        ? Number(form.workplaceHideRadiusMeters)
        : null,
    };

    try {
      const updated = await apiFetch<ProfileOwnerView>('/profile/me', {
        method: 'PATCH',
        body: payload,
      });
      setProfile(updated);
      setForm(formFrom(updated));
      setSaved(true);
    } catch (caught) {
      if (caught instanceof ApiError && Object.keys(caught.fieldErrors).length > 0) {
        setFieldErrors(caught.fieldErrors);
      }
      setError(errorMessage(caught, 'We could not save your profile.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingBlock label="Loading your profile" rows={5} />;
  }

  if (!form || !profile) {
    return <Alert tone="danger">{error ?? 'Your profile could not be loaded.'}</Alert>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy">Edit profile</h1>
        <p className="mt-1 text-sm text-muted">
          Add what you like — every extra detail improves your matches, and every field can be
          hidden afterwards.
        </p>
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {saved ? <Alert tone="success">Profile saved.</Alert> : null}

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy">Photos</h2>
        <PhotoManager
          photos={profile.photos ?? []}
          onChange={(photos) => setProfile((current) => (current ? { ...current, photos } : current))}
        />
      </Card>

      <Card className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">Basics</h2>
        <TextInput
          label="Display name"
          value={form.displayName}
          onChange={(event) => update('displayName', event.target.value)}
          error={fieldErrors.displayName}
        />
        <TextInput
          label="Date of birth"
          type="date"
          value={form.dateOfBirth}
          onChange={(event) => update('dateOfBirth', event.target.value)}
          error={fieldErrors.dateOfBirth}
          hint="Changing this re-runs the 18+ check."
        />
        <SelectableChips
          legend="Gender identity"
          options={optionsFrom(GENDER_IDENTITY_LABELS)}
          value={form.genderIdentity || null}
          onChange={(value) => update('genderIdentity', value as string)}
        />
        {form.genderIdentity === 'OTHER' ? (
          <TextInput
            label="How do you describe your gender?"
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
      </Card>

      <Card className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">Work</h2>
        <SelectField
          label="Profession category"
          value={form.professionCategory}
          onChange={(event) => update('professionCategory', event.target.value)}
          placeholder="Select…"
          options={optionsFrom(PROFESSION_CATEGORY_LABELS)}
          error={fieldErrors.professionCategory}
        />
        <TextInput
          label="Job title"
          value={form.profession}
          onChange={(event) => update('profession', event.target.value)}
          error={fieldErrors.profession}
        />
        <TextInput
          label="Employer or institution"
          optional
          value={form.employerName}
          onChange={(event) => update('employerName', event.target.value)}
        />
        <SelectableChips
          legend="Shift pattern"
          options={optionsFrom(SHIFT_SCHEDULE_LABELS)}
          value={form.shiftSchedule || null}
          onChange={(value) => update('shiftSchedule', value as string)}
        />
        <TextInput
          label="Shift notes"
          optional
          value={form.shiftNotes}
          onChange={(event) => update('shiftNotes', event.target.value)}
        />
        <TextInput
          label="Workplace name"
          optional
          value={form.workplaceName}
          onChange={(event) => update('workplaceName', event.target.value)}
          hint="Hidden by default. Turn on workplace privacy to keep it hidden for everyone."
        />
        <div className="rounded-xl border border-line bg-alabaster p-3">
          <ToggleRow
            id="workplace-privacy"
            checked={form.workplacePrivacyEnabled}
            onChange={(checked) => update('workplacePrivacyEnabled', checked)}
            title="Workplace privacy"
            description="Never show my workplace until geofenced matching ships. You can set the hide radius now."
          />
          {form.workplacePrivacyEnabled ? (
            <TextInput
              label="Hide radius (metres)"
              type="number"
              min={50}
              max={5000}
              value={form.workplaceHideRadiusMeters}
              onChange={(event) => update('workplaceHideRadiusMeters', event.target.value)}
              hint="Stored for the future geofencing feature; no location is published today."
            />
          ) : null}
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">Location</h2>
        <TextInput
          label="City"
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
          value={form.country}
          onChange={(event) => update('country', event.target.value)}
          options={COUNTRY_OPTIONS}
        />
      </Card>

      <Card className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">Background</h2>
        <TextInput
          label="Religion"
          optional
          value={form.religion}
          onChange={(event) => update('religion', event.target.value)}
        />
        <TextInput
          label="Ethnicity"
          optional
          value={form.ethnicity}
          onChange={(event) => update('ethnicity', event.target.value)}
        />
        <TextInput
          label="Languages"
          optional
          value={form.languagesText}
          onChange={(event) => update('languagesText', event.target.value)}
          hint="Separate with commas, e.g. English, Bengali"
        />
        <TextInput
          label="Height (cm)"
          optional
          type="number"
          min={120}
          max={230}
          value={form.heightCm}
          onChange={(event) => update('heightCm', event.target.value)}
        />
        <SelectField
          label="Education"
          optional
          value={form.educationLevel}
          onChange={(event) => update('educationLevel', event.target.value)}
          placeholder="Select…"
          options={optionsFrom(EDUCATION_LEVEL_LABELS)}
        />
        <SelectableChips
          legend="Credentials"
          multiple
          options={optionsFrom(CREDENTIAL_LABELS)}
          value={form.credentials}
          onChange={(value) => update('credentials', value as string[])}
        />
      </Card>

      <Card className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">Lifestyle</h2>
        <SelectField
          label="Drinking"
          optional
          value={form.drinking}
          onChange={(event) => update('drinking', event.target.value)}
          placeholder="Prefer not to say"
          options={optionsFrom(LIFESTYLE_LABELS)}
        />
        <SelectField
          label="Smoking"
          optional
          value={form.smoking}
          onChange={(event) => update('smoking', event.target.value)}
          placeholder="Prefer not to say"
          options={optionsFrom(LIFESTYLE_LABELS)}
        />
        <SelectField
          label="Cannabis"
          optional
          value={form.cannabis}
          onChange={(event) => update('cannabis', event.target.value)}
          placeholder="Prefer not to say"
          options={optionsFrom(LIFESTYLE_LABELS)}
        />
        <SelectField
          label="Exercise"
          optional
          value={form.exercise}
          onChange={(event) => update('exercise', event.target.value)}
          placeholder="Prefer not to say"
          options={optionsFrom(EXERCISE_LABELS)}
        />
      </Card>

      <Card className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">Looking for</h2>
        <SelectableChips
          legend="Relationship goals"
          multiple
          options={optionsFrom(RELATIONSHIP_GOAL_LABELS)}
          value={form.relationshipGoals}
          onChange={(value) => update('relationshipGoals', value as string[])}
        />
        <SelectField
          label="Family plans"
          optional
          value={form.familyPlans}
          onChange={(event) => update('familyPlans', event.target.value)}
          placeholder="Prefer not to say"
          options={optionsFrom(FAMILY_PLANS_LABELS)}
        />
        <SelectField
          label="Kids"
          optional
          value={form.kids}
          onChange={(event) => update('kids', event.target.value)}
          placeholder="Prefer not to say"
          options={optionsFrom(KIDS_LABELS)}
        />
        <TextArea
          label="Bio"
          optional
          value={form.bio}
          onChange={(event) => update('bio', event.target.value)}
          hint={`${form.bio.length}/1000 characters`}
        />
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => void save()} loading={saving} size="lg">
          Save profile
        </Button>
        <Link
          href="/profile"
          className="inline-flex h-12 items-center rounded-full px-4 text-sm font-semibold text-muted hover:text-navy"
        >
          Back to profile
        </Link>
      </div>
    </div>
  );
}
