'use client';

import { useEffect, useState } from 'react';
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

function initialsOf(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || '?';
}

function locationOf(member: AdminMemberRow): string {
  return [member.age ? `${member.age}` : null, member.city].filter(Boolean).join(' · ');
}

function MemberAvatar({ name }: { name: string | null }) {
  return (
    <span
      aria-hidden
      className="grid size-10 shrink-0 place-items-center rounded-full bg-navy text-xs font-semibold tracking-wide text-white"
    >
      {initialsOf(name)}
    </span>
  );
}

function OnboardingLine({ done }: { done: boolean }) {
  return (
    <span className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted">
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${done ? 'bg-emerald-500' : 'bg-gold'}`}
      />
      {done ? 'Onboarded' : 'Setup incomplete'}
    </span>
  );
}

/** Page numbers with ellipses, e.g. 1 … 4 5 6 … 12 */
function pageWindow(current: number, total: number): (number | 'gap-left' | 'gap-right')[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages: (number | 'gap-left' | 'gap-right')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push('gap-left');
  for (let value = start; value <= end; value += 1) pages.push(value);
  if (end < total - 1) pages.push('gap-right');
  pages.push(total);
  return pages;
}

export default function AdminUsersPage() {
  const { admin } = useSession();
  const [data, setData] = useState<Paginated<AdminMemberRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // What the admin is typing (not applied until Search / Enter).
  const [draft, setDraft] = useState('');
  // What is actually applied to the list.
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [profileStatus, setProfileStatus] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
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
        const result = await apiFetch<Paginated<AdminMemberRow>>(
          `/admin/users?${params.toString()}`,
          { auth: 'admin' },
        );
        if (!cancelled) setData(result);
      } catch (caught) {
        if (!cancelled) setError(errorMessage(caught, 'Could not load members.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [page, q, status, profileStatus]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const hasFilters = Boolean(q || status || profileStatus || draft);

  function applySearch(): void {
    setQ(draft.trim());
    setPage(1);
  }

  function clearAll(): void {
    setDraft('');
    setQ('');
    setStatus('');
    setProfileStatus('');
    setPage(1);
  }

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

      {/* Search + filters */}
      <Card className="p-4">
        <form
          role="search"
          className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_200px_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            applySearch();
          }}
        >
          <TextInput
            aria-label="Search members"
            placeholder="Search by phone or display name"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
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
          <div className="flex gap-2">
            <Button type="submit" variant="secondary" className="flex-1 md:flex-none">
              Search
            </Button>
            {hasFilters ? (
              <Button type="button" variant="ghost" onClick={clearAll}>
                Clear
              </Button>
            ) : null}
          </div>
        </form>

        {q || status || profileStatus ? (
          <p className="mt-3 text-xs text-muted">
            Showing results
            {q ? <> for “{q}”</> : null}
            {status ? <> · {USER_STATUS_LABELS[status as keyof typeof USER_STATUS_LABELS]}</> : null}
            {profileStatus ? <> · {profileStatus}</> : null}
          </p>
        ) : null}
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
        <div
          className={`space-y-4 transition-opacity ${loading ? 'opacity-60' : 'opacity-100'}`}
          aria-busy={loading}
        >
          {/* Desktop / tablet table */}
          <div className="hidden overflow-hidden rounded-card border border-line bg-white shadow-sm md:block">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <p className="text-sm font-semibold text-navy">All members</p>
              <p className="text-xs text-muted">
                {data.total} {data.total === 1 ? 'member' : 'members'}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-205 text-left text-sm">
                <thead className="bg-alabaster text-[11px] uppercase tracking-wider text-muted">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Member
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Phone
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Location
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Account
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Profile
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Joined
                    </th>
                    <th scope="col" className="px-5 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.items.map((member) => {
                    const location = locationOf(member);
                    return (
                      <tr key={member.id} className="transition-colors hover:bg-alabaster/70">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <MemberAvatar name={member.displayName} />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-navy">
                                {member.displayName ?? 'Unnamed member'}
                              </p>
                              <OnboardingLine done={Boolean(member.onboardingCompletedAt)} />
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-charcoal">
                          {member.phone}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-charcoal">
                          {location || <span className="text-muted">—</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge tone={statusTone(member.status)}>
                            {USER_STATUS_LABELS[member.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge tone={member.profileStatus === 'PAUSED' ? 'warning' : 'neutral'}>
                            {member.profileStatus ?? 'No profile'}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted">
                          {formatDate(member.createdAt)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            href={`/admin/users/${member.id}`}
                            aria-label={`View ${member.displayName ?? 'member'}`}
                            className="inline-flex h-8 items-center rounded-full border border-line px-4 text-xs font-semibold text-navy transition-colors hover:border-crimson hover:text-crimson"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {data.items.map((member) => {
              const location = locationOf(member);
              return (
                <li key={member.id}>
                  <Link href={`/admin/users/${member.id}`} className="block">
                    <Card className="p-4">
                      <div className="flex items-start gap-3">
                        <MemberAvatar name={member.displayName} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate font-medium text-navy">
                              {member.displayName ?? 'Unnamed member'}
                            </p>
                            <Badge tone={statusTone(member.status)}>
                              {USER_STATUS_LABELS[member.status]}
                            </Badge>
                          </div>
                          <p className="mt-0.5 font-mono text-xs text-muted">{member.phone}</p>
                          <p className="mt-1 text-xs text-muted">{location || 'No location'}</p>
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                            <Badge tone={member.profileStatus === 'PAUSED' ? 'warning' : 'neutral'}>
                              {member.profileStatus ?? 'No profile'}
                            </Badge>
                            <span className="text-xs text-muted">
                              Joined {formatDate(member.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Pagination */}
          <nav
            aria-label="Members pagination"
            className="flex flex-col items-center gap-3 rounded-card border border-line bg-white px-4 py-3 shadow-sm sm:flex-row sm:justify-between"
          >
            <p className="text-xs text-muted">
              Showing {(data.page - 1) * data.pageSize + 1}–
              {Math.min(data.page * data.pageSize, data.total)} of {data.total} members
            </p>

            <div className="flex flex-wrap items-center justify-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                disabled={page <= 1 || loading}
                onClick={() => setPage(1)}
                aria-label="First page"
              >
                «
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={page <= 1 || loading}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Previous
              </Button>

              <div className="hidden items-center gap-1 sm:flex">
                {pageWindow(page, totalPages).map((entry) =>
                  typeof entry === 'number' ? (
                    <button
                      key={entry}
                      type="button"
                      disabled={loading}
                      onClick={() => setPage(entry)}
                      aria-label={`Page ${entry}`}
                      aria-current={entry === page ? 'page' : undefined}
                      className={`grid h-8 min-w-8 place-items-center rounded-full px-2 text-xs font-semibold transition-colors ${
                        entry === page
                          ? 'bg-navy text-white'
                          : 'text-charcoal hover:bg-alabaster'
                      }`}
                    >
                      {entry}
                    </button>
                  ) : (
                    <span key={entry} aria-hidden className="px-1 text-xs text-muted">
                      …
                    </span>
                  ),
                )}
              </div>
              <span className="px-2 text-xs text-muted sm:hidden">
                Page {page} of {totalPages}
              </span>

              <Button
                size="sm"
                variant="ghost"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={page >= totalPages || loading}
                onClick={() => setPage(totalPages)}
                aria-label="Last page"
              >
                »
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}