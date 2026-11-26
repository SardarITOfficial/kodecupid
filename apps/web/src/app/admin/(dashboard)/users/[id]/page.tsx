'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  DOCUMENT_TYPE_LABELS,
  USER_STATUS_LABELS,
  type AdminMemberDetail,
} from '@kodecupid/shared';
import { useSession } from '@/app/providers';
import { apiFetch, errorMessage } from '@/lib/api';
import { formatDate, formatDateTime, profileHeadline } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, Badge, LoadingBlock } from '@/components/ui/feedback';
import { InfoRow } from '@/components/profile/fields';

function initialsOf(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || '?';
}

/** Profile photo when the member has one, initials otherwise. */
function DetailAvatar({ name, url }: { name: string | null | undefined; url: string | null }) {
  const [failed, setFailed] = useState(false);

  if (url && !failed) {
    return (
      <span className="block size-20 shrink-0 overflow-hidden rounded-full bg-alabaster ring-2 ring-line sm:size-24">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={name ? `${name} profile photo` : 'Member profile photo'}
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className="grid size-20 shrink-0 place-items-center rounded-full bg-navy text-xl font-semibold tracking-wide text-white sm:size-24 sm:text-2xl"
    >
      {initialsOf(name)}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">{children}</h2>;
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { admin } = useSession();
  const [member, setMember] = useState<AdminMemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<AdminMemberDetail>(`/admin/users/${params.id}`, {
        auth: 'admin',
      });
      setMember(result);
    } catch (caught) {
      setError(errorMessage(caught, 'Could not load that member.'));
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeStatus(status: 'ACTIVE' | 'SUSPENDED' | 'DELETION_REQUESTED'): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/admin/users/${params.id}/status`, {
        method: 'PATCH',
        body: { status },
        auth: 'admin',
      });
      await load();
    } catch (caught) {
      setError(errorMessage(caught, 'Could not change the member status.'));
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(): Promise<void> {
    if (!window.confirm('Delete this member account? Their profile is hidden and sessions end.')) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/admin/users/${params.id}`, { method: 'DELETE', auth: 'admin' });
      router.push('/admin/users');
    } catch (caught) {
      setError(errorMessage(caught, 'Could not delete the member.'));
      setBusy(false);
    }
  }

  if (loading) {
    return <LoadingBlock label="Loading member" rows={4} />;
  }

  if (!member) {
    return (
      <div className="space-y-3">
        <Alert tone="danger">{error ?? 'Member not found.'}</Alert>
        <Link href="/admin/users" className="text-sm font-semibold text-crimson underline">
          Back to members
        </Link>
      </div>
    );
  }

  const canWrite = admin?.permissions.includes('users.write') ?? false;
  const canDelete = admin?.permissions.includes('users.delete') ?? false;
  const profile = member.profile;
  const primaryPhoto = profile?.photos?.find((photo) => photo.isPrimary) ?? profile?.photos?.[0];

  return (
    <div className="space-y-4">
      <Link href="/admin/users" className="inline-flex text-sm font-medium text-muted hover:text-navy">
        ← Back to members
      </Link>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {/* Header card */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <DetailAvatar name={profile?.displayName} url={primaryPhoto?.url ?? null} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-navy">
                {profile?.displayName ?? 'Unnamed member'}
              </h1>
              <Badge tone={member.status === 'ACTIVE' ? 'success' : 'warning'}>
                {USER_STATUS_LABELS[member.status]}
              </Badge>
              {profile?.status === 'PAUSED' ? <Badge tone="warning">Profile paused</Badge> : null}
            </div>
            <p className="mt-1 font-mono text-sm text-charcoal">{member.phone}</p>
            <p className="mt-0.5 text-xs text-muted">
              {profileHeadline(profile)} · joined {formatDate(member.createdAt)}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main column */}
        <div className="space-y-4">
          <Card className="p-5">
            <SectionTitle>Account</SectionTitle>
            <div className="mt-2 divide-y divide-line">
              <InfoRow label="Created" value={formatDate(member.createdAt)} />
              <InfoRow label="Last sign-in" value={formatDateTime(member.lastLoginAt)} />
              <InfoRow label="Age verified" value={member.ageVerifiedAt ? 'Yes (18+)' : 'No'} />
              <InfoRow
                label="Onboarding"
                value={member.onboardingCompletedAt ? 'Completed' : 'Incomplete'}
              />
              <InfoRow label="Profile visibility" value={profile?.status ?? 'No profile'} />
            </div>
          </Card>

          {profile ? (
            <>
              <Card className="p-5">
                <SectionTitle>Profile &amp; privacy</SectionTitle>
                <p className="mt-0.5 text-xs text-muted">
                  Hidden fields are shown here so staff can answer support questions; member-facing
                  views never include them.
                </p>

                <div className="mt-3 grid gap-x-6 gap-y-0 sm:grid-cols-2">
                  <div className="divide-y divide-line">
                    <InfoRow label="Age" value={profile.age ? String(profile.age) : null} />
                    <InfoRow
                      label="Gender"
                      value={profile.genderIdentity?.replace(/_/g, ' ').toLowerCase() ?? null}
                      hidden={profile.visibility.GENDER_IDENTITY === 'HIDDEN'}
                    />
                    <InfoRow
                      label="Interested in"
                      value={
                        profile.interestedIn?.map((value) => value.toLowerCase()).join(', ') || null
                      }
                      hidden={profile.visibility.INTERESTED_IN === 'HIDDEN'}
                    />
                    <InfoRow
                      label="Location"
                      value={
                        [profile.city, profile.region, profile.country].filter(Boolean).join(', ') ||
                        null
                      }
                      hidden={profile.visibility.LOCATION === 'HIDDEN'}
                    />
                    <InfoRow
                      label="Profession"
                      value={profile.profession}
                      hidden={profile.visibility.PROFESSION === 'HIDDEN'}
                    />
                    <InfoRow
                      label="Workplace"
                      value={profile.workplaceName}
                      hidden={profile.visibility.WORKPLACE === 'HIDDEN'}
                    />
                  </div>
                  <div className="divide-y divide-line">
                    <InfoRow
                      label="Religion"
                      value={profile.religion}
                      hidden={profile.visibility.RELIGION === 'HIDDEN'}
                    />
                    <InfoRow
                      label="Ethnicity"
                      value={profile.ethnicity}
                      hidden={profile.visibility.ETHNICITY === 'HIDDEN'}
                    />
                    <InfoRow
                      label="Languages"
                      value={profile.languages?.join(', ') || null}
                      hidden={profile.visibility.LANGUAGES === 'HIDDEN'}
                    />
                    <InfoRow
                      label="Bio"
                      value={profile.bio}
                      hidden={profile.visibility.BIO === 'HIDDEN'}
                    />
                    <InfoRow
                      label="Photos"
                      value={profile.photos?.length ? `${profile.photos.length} uploaded` : null}
                      hidden={profile.visibility.PHOTOS === 'HIDDEN'}
                    />
                    <InfoRow label="Completion" value={`${profile.completionPercent}%`} />
                  </div>
                </div>
              </Card>

              {profile.photos && profile.photos.length > 0 ? (
                <Card className="p-5">
                  <SectionTitle>Photos</SectionTitle>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {profile.photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative aspect-3/4 overflow-hidden rounded-xl bg-alabaster"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt=""
                          className="size-full object-cover"
                          loading="lazy"
                        />
                        {photo.isPrimary ? (
                          <span className="absolute left-2 top-2 rounded-full bg-navy/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                            Primary
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}
            </>
          ) : (
            <Card className="p-5">
              <p className="text-sm text-muted">This member has not created a profile yet.</p>
            </Card>
          )}
        </div>

        {/* Side column */}
        <div className="space-y-4">
          <Card className="p-5">
            <SectionTitle>Actions</SectionTitle>
            <div className="mt-3 flex flex-col gap-2">
              {canWrite && member.status !== 'ACTIVE' ? (
                <Button size="sm" onClick={() => void changeStatus('ACTIVE')} loading={busy}>
                  Reactivate
                </Button>
              ) : null}
              {canWrite && member.status === 'ACTIVE' ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void changeStatus('SUSPENDED')}
                  loading={busy}
                >
                  Suspend
                </Button>
              ) : null}
              {canWrite && member.status !== 'DELETION_REQUESTED' ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void changeStatus('DELETION_REQUESTED')}
                  loading={busy}
                >
                  Mark for deletion
                </Button>
              ) : null}
              {canDelete ? (
                <Button size="sm" variant="danger" onClick={() => void removeMember()} loading={busy}>
                  Delete account
                </Button>
              ) : null}
              {!canWrite && !canDelete ? (
                <p className="text-sm text-muted">Your role has read-only access to members.</p>
              ) : null}
            </div>

            {!canDelete ? (
              <p className="mt-3 rounded-xl bg-alabaster p-3 text-xs text-muted">
                Account deletion is restricted to Super Admins. You can suspend the account or mark
                it for deletion.
              </p>
            ) : null}
          </Card>

          <Card className="p-5">
            <SectionTitle>Legal acceptances</SectionTitle>
            {member.legalAcceptances.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No acceptance on record.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {member.legalAcceptances.map((acceptance) => (
                  <li
                    key={`${acceptance.documentType}-${acceptance.documentVersion}`}
                    className="rounded-xl bg-alabaster px-3 py-2"
                  >
                    <p className="font-medium text-charcoal">
                      {DOCUMENT_TYPE_LABELS[acceptance.documentType]}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      v{acceptance.documentVersion} · {formatDateTime(acceptance.acceptedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}