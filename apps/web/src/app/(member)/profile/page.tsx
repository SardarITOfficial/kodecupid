'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  CREDENTIAL_LABELS,
  EDUCATION_LEVEL_LABELS,
  EXERCISE_LABELS,
  FAMILY_PLANS_LABELS,
  GENDER_IDENTITY_LABELS,
  INTERESTED_IN_LABELS,
  KIDS_LABELS,
  LIFESTYLE_LABELS,
  RELATIONSHIP_GOAL_LABELS,
  SHIFT_SCHEDULE_LABELS,
  type ProfileOwnerView,
} from '@kodecupid/shared';
import { apiFetch, errorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, Badge, LoadingBlock, Spinner } from '@/components/ui/feedback';
import { CompletionRing, InfoRow, SectionCard } from '@/components/profile/fields';

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileOwnerView | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<ProfileOwnerView>('/profile/me')
      .then((value) => {
        if (!cancelled) setProfile(value);
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

  async function togglePause(): Promise<void> {
    if (!profile) return;
    setBusy(true);
    setError(null);
    try {
      const path = profile.status === 'PAUSED' ? '/profile/me/resume' : '/profile/me/pause';
      const updated = await apiFetch<ProfileOwnerView>(path, { method: 'POST' });
      setProfile(updated);
    } catch (caught) {
      setError(errorMessage(caught, 'Could not change your profile status.'));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <LoadingBlock label="Loading your profile" rows={4} />;
  }

  if (error && !profile) {
    return <Alert tone="danger">{error}</Alert>;
  }

  if (!profile) {
    return <Alert tone="warning">We could not find your profile.</Alert>;
  }

  const hidden = (field: keyof ProfileOwnerView['visibility']) =>
    profile.visibility[field] === 'HIDDEN';
  const primary = profile.photos?.find((photo) => photo.isPrimary) ?? profile.photos?.[0];

  return (
    <div className="space-y-5">
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
          <div className="flex items-center gap-4">
            <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-navy text-white">
              {primary ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={primary.url} alt="" className="size-full object-cover" />
              ) : (
                <span className="grid size-full place-items-center text-2xl font-semibold">
                  {(profile.displayName ?? 'KC').slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-semibold text-navy">
                  {profile.displayName ?? 'Unnamed profile'}
                </h1>
                {profile.status === 'PAUSED' ? <Badge tone="warning">Paused</Badge> : null}
              </div>
              <p className="mt-0.5 text-sm text-muted">
                {[profile.age ? `${profile.age}` : null, profile.city, profile.profession]
                  .filter(Boolean)
                  .join(' · ') || 'Add a few details to get started'}
              </p>
              {profile.hiddenFields.length === 0 && profile.photos?.length ? null : (
                <p className="mt-1 text-xs text-muted">
                  {profile.photos?.length ?? 0} photo{profile.photos?.length === 1 ? '' : 's'} ·{' '}
                  {profile.completionPercent}% complete
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 sm:ml-auto">
            <CompletionRing percent={profile.completionPercent} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-line p-4">
          <Link href="/profile/edit">
            <Button size="sm">Edit profile</Button>
          </Link>
          <Link href="/profile/privacy">
            <Button size="sm" variant="ghost">
              Privacy
            </Button>
          </Link>
          <Button size="sm" variant="ghost" onClick={() => void togglePause()} loading={busy}>
            {profile.status === 'PAUSED' ? 'Resume profile' : 'Pause profile'}
          </Button>
        </div>
      </Card>

      {profile.status === 'PAUSED' ? (
        <Alert tone="warning">
          Your profile is hidden from other members while paused. Your edits are saved.
        </Alert>
      ) : null}

      <SectionCard title="About" description="What you share about yourself">
        <InfoRow
          label="Gender identity"
          hidden={hidden('GENDER_IDENTITY')}
          value={
            profile.genderIdentity ? GENDER_IDENTITY_LABELS[profile.genderIdentity] : null
          }
        />
        <InfoRow
          label="Interested in"
          hidden={hidden('INTERESTED_IN')}
          value={profile.interestedIn?.map((value) => INTERESTED_IN_LABELS[value]).join(', ') || null}
        />
        <InfoRow
          label="Location"
          hidden={hidden('LOCATION')}
          value={[profile.city, profile.region, profile.country].filter(Boolean).join(', ') || null}
        />
        <InfoRow label="Bio" hidden={hidden('BIO')} value={profile.bio} />
      </SectionCard>

      <SectionCard title="Work" description="Shift workers come first here">
        <InfoRow label="Profession" hidden={hidden('PROFESSION')} value={profile.profession} />
        <InfoRow label="Employer" hidden={hidden('PROFESSION')} value={profile.employerName} />
        <InfoRow
          label="Shift"
          hidden={hidden('SHIFT_SCHEDULE')}
          value={profile.shiftSchedule ? SHIFT_SCHEDULE_LABELS[profile.shiftSchedule] : null}
        />
        <InfoRow label="Workplace" hidden={hidden('WORKPLACE')} value={profile.workplaceName} />
      </SectionCard>

      <SectionCard title="Background">
        <InfoRow label="Religion" hidden={hidden('RELIGION')} value={profile.religion} />
        <InfoRow label="Ethnicity" hidden={hidden('ETHNICITY')} value={profile.ethnicity} />
        <InfoRow
          label="Languages"
          hidden={hidden('LANGUAGES')}
          value={profile.languages?.join(', ') || null}
        />
        <InfoRow
          label="Height"
          hidden={hidden('HEIGHT')}
          value={profile.heightCm ? `${profile.heightCm} cm` : null}
        />
        <InfoRow
          label="Education"
          hidden={hidden('EDUCATION')}
          value={profile.educationLevel ? EDUCATION_LEVEL_LABELS[profile.educationLevel] : null}
        />
        <InfoRow
          label="Credentials"
          hidden={hidden('CREDENTIALS')}
          value={profile.credentials?.map((value) => CREDENTIAL_LABELS[value]).join(', ') || null}
        />
      </SectionCard>

      <SectionCard title="Lifestyle">
        <InfoRow
          label="Drinking"
          hidden={hidden('LIFESTYLE')}
          value={profile.drinking ? LIFESTYLE_LABELS[profile.drinking] : null}
        />
        <InfoRow
          label="Smoking"
          hidden={hidden('LIFESTYLE')}
          value={profile.smoking ? LIFESTYLE_LABELS[profile.smoking] : null}
        />
        <InfoRow
          label="Cannabis"
          hidden={hidden('LIFESTYLE')}
          value={profile.cannabis ? LIFESTYLE_LABELS[profile.cannabis] : null}
        />
        <InfoRow
          label="Exercise"
          hidden={hidden('LIFESTYLE')}
          value={profile.exercise ? EXERCISE_LABELS[profile.exercise] : null}
        />
      </SectionCard>

      <SectionCard title="Looking for">
        <InfoRow
          label="Relationship goals"
          hidden={hidden('RELATIONSHIP_GOALS')}
          value={
            profile.relationshipGoals?.map((value) => RELATIONSHIP_GOAL_LABELS[value]).join(', ') ||
            null
          }
        />
        <InfoRow
          label="Family plans"
          hidden={hidden('FAMILY_PLANS')}
          value={profile.familyPlans ? FAMILY_PLANS_LABELS[profile.familyPlans] : null}
        />
        <InfoRow
          label="Kids"
          hidden={hidden('KIDS')}
          value={profile.kids ? KIDS_LABELS[profile.kids] : null}
        />
      </SectionCard>

      <Card>
        <p className="text-sm font-semibold text-navy">Photos</p>
        {profile.photos && profile.photos.length > 0 ? (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {profile.photos.map((photo) => (
              <div key={photo.id} className="aspect-[3/4] overflow-hidden rounded-xl bg-alabaster">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.isPrimary ? 'Primary photo' : 'Profile photo'}
                  className="size-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted">
            No photos yet. Add up to six from{' '}
            <Link href="/profile/edit" className="font-medium text-crimson underline">
              Edit profile
            </Link>
            .
          </p>
        )}
      </Card>

      {busy ? (
        <div className="flex justify-center">
          <Spinner label="Saving" />
        </div>
      ) : null}
    </div>
  );
}
