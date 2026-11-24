'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  GENDER_IDENTITY_LABELS,
  PROFESSION_CATEGORY_LABELS,
  RELATIONSHIP_GOAL_LABELS,
  SHIFT_SCHEDULE_LABELS,
  type ProfileOwnerView,
} from '@kodecupid/shared';
import { useSession } from '@/app/providers';
import { apiFetch, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Alert, Badge, LoadingBlock } from '@/components/ui/feedback';
import { CompletionRing } from '@/components/profile/fields';
import { Button } from '@/components/ui/button';
import { ToggleRow } from '@/components/ui/toggle';
import { DatingOverview } from '@/components/dating/dating-overview';
function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-navy">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </Card>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium text-navy">{value || 'Not set'}</dd>
    </div>
  );
}

function nextStep(profile: ProfileOwnerView): { text: string; href: string } | null {
  if (!profile.photos || profile.photos.length === 0)
    return { text: 'Add a photo. It is the first thing members see.', href: '/profile/edit' };
  if (!profile.bio) return { text: 'Write a short bio to stand out.', href: '/profile/edit' };
  if (!profile.city || !profile.profession)
    return { text: 'Add your city and profession.', href: '/profile/edit' };
  if (profile.completionPercent < 100)
    return { text: 'Fill in a few more details to reach 100%.', href: '/profile/edit' };
  return null;
}

export default function MemberHomePage() {
  const { member } = useSession();
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

  async function togglePause(nextPaused: boolean): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const updated = await apiFetch<ProfileOwnerView>(
        nextPaused ? '/profile/pause' : '/profile/resume',
        { method: 'PATCH' },
      );
      setProfile(updated);
    } catch (caught) {
      setError(errorMessage(caught, 'Could not update your profile status.'));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <LoadingBlock label="Loading your home" rows={3} />;
  }

  if (error && !profile) {
    return <Alert tone="danger">{error}</Alert>;
  }

  if (!profile) {
    return <Alert tone="warning">We could not find your profile.</Alert>;
  }

  const firstName = profile.displayName?.split(' ')[0] ?? 'there';
  const paused = profile.status === 'PAUSED';
  const primary = profile.photos?.find((photo) => photo.isPrimary) ?? profile.photos?.[0];
  const photoCount = profile.photos?.length ?? 0;
  const hiddenCount = profile.hiddenFields?.length ?? 0;
  const totalFields = Object.keys(profile.visibility ?? {}).length || 20;
  const goals = (profile.relationshipGoals ?? [])
    .map((goal) => RELATIONSHIP_GOAL_LABELS[goal])
    .join(', ');
  const next = nextStep(profile);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">Signed in as {member?.user.phone}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            Hi {firstName} <span className="text-crimson">👋</span>
          </h1>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Link href="/profile/edit" className="flex-1 sm:flex-none">
            <Button size="md" fullWidth>
              Edit profile
            </Button>
          </Link>
          <Link href="/profile" className="flex-1 sm:flex-none">
            <Button size="md" variant="ghost" fullWidth>
              View profile
            </Button>
          </Link>
        </div>
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {paused ? (
        <Alert tone="warning" title="Your profile is paused">
          Other members cannot see you right now. Switch visibility back on below whenever you are
          ready.
        </Alert>
      ) : null}
      <DatingOverview />
      {/* Profile summary */}
      <Card className="p-0">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-navy text-white sm:size-28">
            {primary ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={primary.url} alt="" className="size-full object-cover" />
            ) : (
              <span className="grid size-full place-items-center text-3xl font-semibold">
                {(profile.displayName ?? 'KC').slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-semibold text-navy">
                {profile.displayName ?? 'Add your display name'}
              </h2>
              {paused ? <Badge tone="warning">Paused</Badge> : null}
              {member?.user.ageVerifiedAt ? <Badge tone="gold">Verified 18+</Badge> : null}
            </div>
            <p className="mt-1 text-sm text-muted">
              {[profile.age ? `${profile.age}` : null, profile.city, profile.profession]
                .filter(Boolean)
                .join(' · ') || 'Add a city and profession to stand out'}
            </p>
            {goals ? (
              <p className="mt-1 text-xs text-muted">Open to {goals.toLowerCase()}</p>
            ) : null}
          </div>

          <div className="shrink-0">
            <CompletionRing percent={profile.completionPercent ?? 0} />
          </div>
        </div>

        {next ? (
          <div className="flex flex-col gap-2 border-t border-line bg-crimson-soft/60 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-navy">
              <span className="font-semibold text-crimson">Next step:</span> {next.text}
            </p>
            <Link href={next.href} className="text-sm font-semibold text-crimson hover:underline">
              Do it now
            </Link>
          </div>
        ) : null}
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Profile" value={`${profile.completionPercent ?? 0}%`} hint="Completeness" />
        <Stat label="Photos" value={`${photoCount} / 6`} hint="Up to six" />
        <Stat label="Hidden fields" value={`${hiddenCount} / ${totalFields}`} hint="Your privacy" />
        <Stat
          label="Status"
          value={paused ? 'Paused' : 'Visible'}
          hint={paused ? 'Hidden from members' : 'Members can find you'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Left column */}
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-navy">Shift &amp; work</h2>
              <Link
                href="/profile/edit"
                className="text-sm font-semibold text-crimson hover:underline"
              >
                Edit
              </Link>
            </div>
            <dl className="mt-2 divide-y divide-line">
              <Row
                label="Shift pattern"
                value={profile.shiftSchedule ? SHIFT_SCHEDULE_LABELS[profile.shiftSchedule] : null}
              />
              <Row label="Job title" value={profile.profession} />
              <Row
                label="Category"
                value={
                  profile.professionCategory
                    ? PROFESSION_CATEGORY_LABELS[profile.professionCategory]
                    : null
                }
              />
              <Row
                label="Gender identity"
                value={
                  profile.genderIdentity ? GENDER_IDENTITY_LABELS[profile.genderIdentity] : null
                }
              />
              <Row
                label="Location"
                value={[profile.city, profile.region, profile.country].filter(Boolean).join(', ')}
              />
            </dl>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-navy">Photos</h2>
              <Link
                href="/profile/edit"
                className="text-sm font-semibold text-crimson hover:underline"
              >
                Manage
              </Link>
            </div>
            {photoCount > 0 ? (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {profile.photos?.map((photo) => (
                  <div
                    key={photo.id}
                    className="aspect-3/4 overflow-hidden rounded-xl bg-alabaster"
                  >
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
              <p className="mt-2 text-sm text-muted">
                No photos yet. Add up to six from{' '}
                <Link href="/profile/edit" className="font-medium text-crimson underline">
                  Edit profile
                </Link>
                .
              </p>
            )}
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-navy">Discovery is next</h2>
                <p className="mt-1 text-sm text-muted">
                  Browse and matching arrive in Milestone 2. For now, your profile is ready and
                  reviewable in the admin area.
                </p>
              </div>
              <Badge tone="gold">M2</Badge>
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card>
            <h2 className="text-base font-semibold text-navy">Visibility</h2>
            <p className="mt-1 text-sm text-muted">
              Pausing hides you from other members without deleting anything.
            </p>
            <div className="mt-2">
              <ToggleRow
                id="pause-profile"
                checked={!paused}
                disabled={busy}
                onChange={(value) => void togglePause(!value)}
                title={paused ? 'Profile paused' : 'Profile visible'}
                description={
                  paused
                    ? 'Nobody can see your profile. Switch on to resume.'
                    : 'Members can see the fields you have not hidden.'
                }
              />
            </div>
            <Link
              href="/profile/privacy"
              className="mt-3 inline-block text-sm font-semibold text-crimson hover:underline"
            >
              Manage privacy for each field
            </Link>
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-navy">Account</h2>
            <dl className="mt-2 divide-y divide-line">
              <Row label="Phone" value={member?.user.phone} />
              <Row label="Member since" value={formatDate(member?.user.createdAt)} />
              <Row
                label="Age check"
                value={member?.user.ageVerifiedAt ? 'Verified 18+' : 'Not verified'}
              />
            </dl>
            <Link
              href="/settings"
              className="mt-3 inline-block text-sm font-semibold text-crimson hover:underline"
            >
              All settings
            </Link>
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-navy">Your safety basics</h2>
            <ul className="mt-3 space-y-2.5 text-sm text-charcoal">
              {[
                'Your phone number and date of birth are never shown to members.',
                'Hidden fields show a “Private” badge instead of a value.',
                'Pause your profile any time you need a break.',
              ].map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden className="text-crimson">
                    ✓
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
