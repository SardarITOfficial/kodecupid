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

  return (
    <div className="space-y-4">
      <Link href="/admin/users" className="text-sm font-medium text-muted hover:text-navy">
        ← Back to members
      </Link>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-navy">
                {member.profile?.displayName ?? 'Unnamed member'}
              </h1>
              <Badge tone={member.status === 'ACTIVE' ? 'success' : 'warning'}>
                {USER_STATUS_LABELS[member.status]}
              </Badge>
              {member.profile?.status === 'PAUSED' ? <Badge tone="warning">Profile paused</Badge> : null}
            </div>
            <p className="mt-1 font-mono text-sm text-charcoal">{member.phone}</p>
            <p className="mt-0.5 text-xs text-muted">
              {profileHeadline(profile)} · joined {formatDate(member.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canWrite && member.status !== 'ACTIVE' ? (
              <Button size="sm" onClick={() => void changeStatus('ACTIVE')} loading={busy}>
                Reactivate
              </Button>
            ) : null}
            {canWrite && member.status === 'ACTIVE' ? (
              <Button size="sm" variant="ghost" onClick={() => void changeStatus('SUSPENDED')} loading={busy}>
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
          </div>
        </div>

        {!canDelete ? (
          <p className="mt-3 rounded-xl bg-alabaster p-3 text-xs text-muted">
            Account deletion is restricted to Super Admins. You can suspend the account or mark it
            for deletion.
          </p>
        ) : null}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">Account</h2>
          <div className="mt-1 divide-y divide-line">
            <InfoRow label="Created" value={formatDate(member.createdAt)} />
            <InfoRow label="Last sign-in" value={formatDateTime(member.lastLoginAt)} />
            <InfoRow label="Age verified" value={member.ageVerifiedAt ? 'Yes (18+)' : 'No'} />
            <InfoRow
              label="Onboarding"
              value={member.onboardingCompletedAt ? 'Completed' : 'Incomplete'}
            />
            <InfoRow label="Profile visibility" value={member.profile?.status ?? 'No profile'} />
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">
            Legal acceptances
          </h2>
          {member.legalAcceptances.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No acceptance on record.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {member.legalAcceptances.map((acceptance) => (
                <li
                  key={`${acceptance.documentType}-${acceptance.documentVersion}`}
                  className="flex items-center justify-between gap-2 rounded-xl bg-alabaster px-3 py-2"
                >
                  <span className="font-medium text-charcoal">
                    {DOCUMENT_TYPE_LABELS[acceptance.documentType]}
                  </span>
                  <span className="text-xs text-muted">
                    v{acceptance.documentVersion} · {formatDateTime(acceptance.acceptedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {profile ? (
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">
            Profile &amp; privacy
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Hidden fields are shown here so staff can answer support questions; member-facing views
            never include them.
          </p>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="divide-y divide-line">
              <InfoRow label="Age" value={profile.age ? String(profile.age) : null} />
              <InfoRow
                label="Gender"
                value={profile.genderIdentity?.replace(/_/g, ' ').toLowerCase() ?? null}
                hidden={profile.visibility.GENDER_IDENTITY === 'HIDDEN'}
              />
              <InfoRow
                label="Interested in"
                value={profile.interestedIn?.map((value) => value.toLowerCase()).join(', ') || null}
                hidden={profile.visibility.INTERESTED_IN === 'HIDDEN'}
              />
              <InfoRow
                label="Location"
                value={[profile.city, profile.region, profile.country].filter(Boolean).join(', ') || null}
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

          {profile.photos && profile.photos.length > 0 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {profile.photos.map((photo) => (
                <div key={photo.id} className="h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-alabaster">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="" className="size-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-muted">This member has not created a profile yet.</p>
        </Card>
      )}
    </div>
  );
}
