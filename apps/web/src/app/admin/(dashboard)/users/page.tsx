'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PROFILE_STATUS_VALUES,
  USER_STATUS_LABELS,
  USER_STATUS_VALUES,
  type AdminMemberRow,
  type Paginated,
} from '@kodecupid/shared';
import { useSession } from '@/app/providers';
import { apiFetch, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, Badge, EmptyState, LoadingBlock } from '@/components/ui/feedback';
import { SelectField, TextInput } from '@/components/ui/field';

const PAGE_SIZE = 20;

function statusTone(status: AdminMemberRow['status']) {
  if (status === 'ACTIVE') return 'success' as const;
  if (status === 'SUSPENDED') return 'danger' as const;
  if (status === 'PENDING_COMPLIANCE') return 'warning' as const;
  return 'neutral' as const;
}

export default function AdminUsersPage() {
  const { admin } = useSession();
  const [data, setData] = useState<Paginated<AdminMemberRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [profileStatus, setProfileStatus] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        ...(q ? { q } : {}),
        ...(status ? { status } : {}),
        ...(profileStatus ? { profileStatus } : {}),
      });
      const result = await apiFetch<Paginated<AdminMemberRow>>(`/admin/users?${params.toString()}`, {
        auth: 'admin',
      });
      setData(result);
    } catch (caught) {
      setError(errorMessage(caught, 'Could not load members.'));
    } finally {
      setLoading(false);
    }
  }, [page, q, status, profileStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-navy">Members</h1>
        <p className="text-sm text-muted">
          {admin?.admin.role === 'MODERATOR'
            ? 'Phone numbers are masked for your role. Ask a Super Admin for full contact details.'
            : 'Full contact details, profile state and privacy settings for every member.'}
        </p>
      </div>

      <Card>
        <form
          className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            void load();
          }}
        >
          <TextInput
            aria-label="Search members"
            placeholder="Search by phone or display name"
            value={q}
            onChange={(event) => setQ(event.target.value)}
          />
          <SelectField
            aria-label="Account status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            placeholder="Any status"
            options={USER_STATUS_VALUES.map((value) => ({
              value,
              label: USER_STATUS_LABELS[value],
            }))}
          />
          <SelectField
            aria-label="Profile status"
            value={profileStatus}
            onChange={(event) => {
              setProfileStatus(event.target.value);
              setPage(1);
            }}
            placeholder="Any profile"
            options={PROFILE_STATUS_VALUES.map((value) => ({ value, label: value }))}
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </Card>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {loading && !data ? <LoadingBlock label="Loading members" rows={5} /> : null}

      {data && !loading && data.items.length === 0 ? (
        <EmptyState
          title="No members match that search"
          description="Try a different phone number, display name or clear the filters."
        />
      ) : null}

      {data && data.items.length > 0 ? (
        <>
          <div className="hidden overflow-hidden rounded-card border border-line bg-white sm:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-alabaster text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Member
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Phone
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Age
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    City
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Account
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Profile
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Joined
                  </th>
                  <th scope="col" className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.items.map((member) => (
                  <tr key={member.id} className="hover:bg-alabaster/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-navy">{member.displayName ?? '—'}</p>
                      <p className="text-xs text-muted">
                        {member.onboardingCompletedAt ? 'Onboarded' : 'Setup incomplete'}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-charcoal">{member.phone}</td>
                    <td className="px-4 py-3 text-charcoal">{member.age ?? '—'}</td>
                    <td className="px-4 py-3 text-charcoal">{member.city ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(member.status)}>
                        {USER_STATUS_LABELS[member.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={member.profileStatus === 'PAUSED' ? 'warning' : 'neutral'}>
                        {member.profileStatus ?? 'No profile'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{formatDate(member.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/users/${member.id}`}
                        className="text-sm font-semibold text-crimson hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-2 sm:hidden">
            {data.items.map((member) => (
              <li key={member.id}>
                <Link href={`/admin/users/${member.id}`} className="block">
                  <Card className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-navy">
                          {member.displayName ?? 'Unnamed member'}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-muted">{member.phone}</p>
                        <p className="mt-1 text-xs text-muted">
                          {[member.age ? `${member.age}` : null, member.city]
                            .filter(Boolean)
                            .join(' · ') || 'No location'}
                        </p>
                      </div>
                      <Badge tone={statusTone(member.status)}>{USER_STATUS_LABELS[member.status]}</Badge>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted">
              {(data.page - 1) * data.pageSize + 1}–
              {Math.min(data.page * data.pageSize, data.total)} of {data.total} members
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={page <= 1 || loading}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
