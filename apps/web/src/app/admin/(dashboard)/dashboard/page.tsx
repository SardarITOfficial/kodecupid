'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { apiFetch, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, PageHeader } from '@/components/ui/card';
import { Alert, Badge, LoadingBlock } from '@/components/ui/feedback';

interface RecentMember {
  id: string;
  displayName: string | null;
  phoneMasked: string;
  city: string | null;
  status: string;
  createdAt: string;
}

interface DashboardStats {
  generatedAt: string;
  rangeDays: number;
  members: {
    total: number;
    newInRange: number;
    newInPreviousRange: number;
    byStatus: Record<string, number>;
    recent: RecentMember[];
  };
  moderation: {
    pendingPhotos: number;
    deletionRequests: number;
  };
}

type Tone = 'success' | 'warning' | 'danger' | 'neutral';

const RANGES = [7, 30, 90] as const;

const STATUS_ROWS: { key: string; label: string; color: string; tone: Tone }[] = [
  { key: 'ACTIVE', label: 'Active', color: '#16263e', tone: 'success' },
  { key: 'PENDING_COMPLIANCE', label: 'Pending compliance', color: '#d99b26', tone: 'warning' },
  { key: 'SUSPENDED', label: 'Suspended', color: '#d91e36', tone: 'danger' },
  { key: 'DELETION_REQUESTED', label: 'Deletion requested', color: '#64748b', tone: 'warning' },
  { key: 'DELETED', label: 'Deleted', color: '#cbd5e1', tone: 'neutral' },
];

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const ICON_USERS = (
  <Icon>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </Icon>
);
const ICON_USER_PLUS = (
  <Icon>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M19 8v6M22 11h-6" />
  </Icon>
);
const ICON_IMAGE = (
  <Icon>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
  </Icon>
);
const ICON_TRASH = (
  <Icon>
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
  </Icon>
);

function trendBadge(current: number, previous: number): ReactNode {
  if (previous === 0) {
    return current === 0 ? <Badge tone="neutral">No change</Badge> : <Badge tone="success">New</Badge>;
  }
  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) return <Badge tone="neutral">0%</Badge>;
  return (
    <Badge tone={change > 0 ? 'success' : 'danger'}>
      {change > 0 ? '▲' : '▼'} {Math.abs(change)}%
    </Badge>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon,
  trend,
}: {
  label: string;
  value: number;
  hint: string;
  icon: ReactNode;
  trend?: ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-alabaster text-navy">
          {icon}
        </span>
      </div>
      <div className="mt-3 flex items-end gap-2">
        <p className="text-3xl font-semibold tracking-tight text-navy">{value.toLocaleString()}</p>
        {trend ? <div className="mb-1">{trend}</div> : null}
      </div>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </Card>
  );
}

function StatusDonut({ byStatus }: { byStatus: Record<string, number> }) {
  const total = STATUS_ROWS.reduce((sum, row) => sum + (byStatus[row.key] ?? 0), 0);
  let accumulated = 0;
  const segments = STATUS_ROWS.map((row) => {
    const value = byStatus[row.key] ?? 0;
    const percent = total > 0 ? (value / total) * 100 : 0;
    const segment = { ...row, value, percent, offset: 25 - accumulated };
    accumulated += percent;
    return segment;
  });

  return (
    <Card>
      <h2 className="text-base font-semibold text-navy">Members by status</h2>
      <p className="mt-0.5 text-xs text-muted">All members, current status</p>

      <div className="mt-5 flex justify-center">
        <div className="relative size-44">
          <svg viewBox="0 0 42 42" className="size-full" role="img" aria-label="Members by status">
            <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#e2e8f0" strokeWidth="5" />
            {segments
              .filter((segment) => segment.percent > 0)
              .map((segment) => (
                <circle
                  key={segment.key}
                  cx="21"
                  cy="21"
                  r="15.9155"
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="5"
                  strokeDasharray={`${segment.percent} ${100 - segment.percent}`}
                  strokeDashoffset={segment.offset}
                />
              ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold text-navy">{total.toLocaleString()}</span>
            <span className="text-xs text-muted">members</span>
          </div>
        </div>
      </div>

      <ul className="mt-5 space-y-2.5">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-charcoal">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="truncate">{segment.label}</span>
            </span>
            <span className="shrink-0 text-muted">
              <span className="font-semibold text-navy">{segment.value.toLocaleString()}</span>
              {' · '}
              {Math.round(segment.percent)}%
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function initialsOf(name: string | null): string {
  const base = (name ?? '').trim();
  if (!base) return '?';
  const parts = base.split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || '?';
}

function RecentMembers({ members }: { members: RecentMember[] }) {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-navy">Recent members</h2>
          <p className="mt-0.5 text-xs text-muted">The newest sign-ups</p>
        </div>
        <Link href="/admin/users" className="text-sm font-medium text-crimson hover:underline">
          View all
        </Link>
      </div>

      {members.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted">No members yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-alabaster text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Member
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  City
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {members.map((member) => {
                const row = STATUS_ROWS.find((entry) => entry.key === member.status);
                return (
                  <tr key={member.id} className="transition-colors hover:bg-alabaster/70">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/users/${member.id}`}
                        className="flex items-center gap-3 hover:underline"
                      >
                        <span
                          aria-hidden
                          className="grid size-9 shrink-0 place-items-center rounded-full bg-navy text-xs font-semibold text-white"
                        >
                          {initialsOf(member.displayName)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-navy">
                            {member.displayName ?? 'Unnamed member'}
                          </span>
                          <span className="block truncate text-xs text-muted">
                            {member.phoneMasked}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{member.city ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={row?.tone ?? 'neutral'}>
                        {row?.label ?? member.status.toLowerCase()}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-muted">
                      {formatDateTime(member.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [days, setDays] = useState<number>(30);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<DashboardStats>(`/admin/dashboard/stats?days=${days}`, {
        auth: 'admin',
      });
      setStats(result);
    } catch (caught) {
      setError(errorMessage(caught, 'Could not load the dashboard.'));
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !stats) {
    return <LoadingBlock label="Loading dashboard" rows={4} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="A snapshot of members and the items waiting for review."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Date range"
              className="inline-flex rounded-full border border-line bg-white p-1"
            >
              {RANGES.map((range) => (
                <button
                  key={range}
                  type="button"
                  aria-pressed={days === range}
                  onClick={() => setDays(range)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    days === range ? 'bg-navy text-white' : 'text-muted hover:text-navy'
                  }`}
                >
                  {range} days
                </button>
              ))}
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              loading={loading}
              onClick={() => void load()}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Total members"
              value={stats.members.total}
              hint="All accounts, any status"
              icon={ICON_USERS}
            />
            <KpiCard
              label="New members"
              value={stats.members.newInRange}
              hint={`Last ${stats.rangeDays} days vs the ${stats.rangeDays} before`}
              icon={ICON_USER_PLUS}
              trend={trendBadge(stats.members.newInRange, stats.members.newInPreviousRange)}
            />
            <KpiCard
              label="Photos awaiting review"
              value={stats.moderation.pendingPhotos}
              hint="Moderation status: pending"
              icon={ICON_IMAGE}
            />
            <KpiCard
              label="Deletion requests"
              value={stats.moderation.deletionRequests}
              hint="Members who asked to delete their data"
              icon={ICON_TRASH}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="min-w-0 xl:col-span-2">
              <RecentMembers members={stats.members.recent} />
            </div>
            <div className="min-w-0">
              <StatusDonut byStatus={stats.members.byStatus} />
            </div>
          </div>

          <p className="text-xs text-muted">Updated {formatDateTime(stats.generatedAt)}</p>
        </>
      ) : null}
    </div>
  );
}