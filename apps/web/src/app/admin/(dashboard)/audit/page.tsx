'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_VALUES,
  type AdminAuditLogRow,
  type AdminRole,
  type RoleAssignmentRow,
} from '@kodecupid/shared';
import { useSession } from '@/app/providers';
import { apiFetch, ApiError, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Alert, Badge, EmptyState, LoadingBlock } from '@/components/ui/feedback';
import { TextInput } from '@/components/ui/field';

type Tab = 'accounts' | 'live';
type Tone = 'success' | 'warning' | 'danger' | 'neutral';

const POLL_MS = 15_000;

const ROLE_PILLS: { value: '' | AdminRole; label: string }[] = [
  { value: '', label: 'All' },
  ...ADMIN_ROLE_VALUES.map((role) => ({ value: role, label: ADMIN_ROLE_LABELS[role] })),
];

const AVATAR_TONES = [
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
  'bg-slate-200 text-slate-700',
];

function avatarTone(value: string): string {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length] ?? '';
}

function initialsOf(value: string): string {
  const base = value.includes('@') ? (value.split('@')[0] ?? value) : value;
  const parts = base.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || '?';
}

function dateParts(iso: string): { date: string; time: string } {
  const value = new Date(iso);
  return {
    date: value.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: value.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
}

function Avatar({ label, size = 'md' }: { label: string; size?: 'sm' | 'md' }) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full font-semibold ${avatarTone(label)} ${
        size === 'sm' ? 'size-8 text-[11px]' : 'size-9 text-xs'
      }`}
    >
      {initialsOf(label)}
    </span>
  );
}

const STATUS_STYLE: Record<string, { label: string; pill: string; dot: string }> = {
  ACTIVE: { label: 'Active', pill: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  ACCEPTED: { label: 'Active', pill: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  PENDING: { label: 'Pending', pill: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  DISABLED: { label: 'Disabled', pill: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500' },
  REVOKED: { label: 'Revoked', pill: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500' },
  EXPIRED: { label: 'Expired', pill: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
};

function StatusPill({ status }: { status: string }) {
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.EXPIRED!;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.pill}`}
    >
      <span aria-hidden className={`size-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

function LastLogin({ row }: { row: RoleAssignmentRow }) {
  const iso = row.lastLoginAt ?? null;
  if (!iso) {
    return (
      <span className="text-xs text-muted">
        {row.expiresAt ? `Invite expires ${dateParts(row.expiresAt).date}` : 'Never signed in'}
      </span>
    );
  }
  const { date, time } = dateParts(iso);
  return (
    <span className="whitespace-nowrap text-xs text-charcoal">
      {date}
      <span className="mx-2 text-line">|</span>
      <span className="text-muted">{time}</span>
    </span>
  );
}

/* ───────────── Live activity helpers ───────────── */

function categoryOf(action: string): string {
  if (action.startsWith('admin.login')) return 'login';
  if (action.startsWith('role.') || action === 'admin.role.changed' || action === 'admin.status.changed') {
    return 'role';
  }
  if (action.startsWith('member.')) return 'member';
  if (action.startsWith('admin.invitation')) return 'invitation';
  return 'other';
}

function toneOf(action: string): Tone {
  if (action.endsWith('.failed') || action.endsWith('.revoked') || action === 'member.deleted') {
    return 'danger';
  }
  const category = categoryOf(action);
  if (category === 'login') return 'success';
  if (category === 'role' || category === 'member') return 'warning';
  return 'neutral';
}

function labelOf(action: string): string {
  const text = action.replace(/[._]/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function shortId(id: string): string {
  return id.length > 10 ? `${id.slice(0, 8)}…` : id;
}

function Target({ row }: { row: AdminAuditLogRow }) {
  if (!row.targetType && !row.targetId) return <span className="text-muted">—</span>;
  return (
    <span className="text-xs text-charcoal">
      {row.targetType ? <span className="font-medium">{row.targetType}</span> : null}
      {row.targetId ? (
        <span className="ml-1.5 font-mono text-muted" title={row.targetId}>
          {shortId(row.targetId)}
        </span>
      ) : null}
    </span>
  );
}

function DeniedCard({ title, text }: { title: string; text: string }) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-navy">{title}</h2>
      <p className="mt-2 text-sm text-muted">{text}</p>
    </Card>
  );
}

export default function AdminAuditPage() {
  const { admin } = useSession();
  const canManage = admin?.permissions.includes('admins.manage') ?? false;

  const [tab, setTab] = useState<Tab>('accounts');

  // Accounts
  const [accounts, setAccounts] = useState<RoleAssignmentRow[] | null>(null);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsDenied, setAccountsDenied] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<'' | AdminRole>('');
  const [menuId, setMenuId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Live activity
  const [rows, setRows] = useState<AdminAuditLogRow[] | null>(null);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditDenied, setAuditDenied] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [search, setSearch] = useState('');

  const loadAccounts = useCallback(async (silent = false) => {
    if (!silent) setAccountsLoading(true);
    try {
      const result = await apiFetch<RoleAssignmentRow[]>('/admin/roles', { auth: 'admin' });
      setAccounts(result);
      setAccountsDenied(false);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 403) setAccountsDenied(true);
      else setAccountsError(errorMessage(caught, 'Could not load the admin accounts.'));
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  const loadAudit = useCallback(async (silent = false) => {
    if (!silent) setAuditLoading(true);
    try {
      const result = await apiFetch<AdminAuditLogRow[]>('/admin/audit-logs', { auth: 'admin' });
      setRows(result);
      setAuditDenied(false);
      setAuditError(null);
      setUpdatedAt(new Date());
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 403) setAuditDenied(true);
      else setAuditError(errorMessage(caught, 'Could not load the activity log.'));
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
    void loadAudit();
  }, [loadAccounts, loadAudit]);

  // Live tab refreshes itself while it is open.
  useEffect(() => {
    if (tab !== 'live' || auditDenied) return;
    const timer = window.setInterval(() => void loadAudit(true), POLL_MS);
    return () => window.clearInterval(timer);
  }, [tab, auditDenied, loadAudit]);

  // Close the row menu on outside click or Escape.
  useEffect(() => {
    if (!menuId) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-row-menu]')) setMenuId(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuId(null);
    };
    document.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [menuId]);

  async function run(id: string, request: () => Promise<unknown>, fallback: string): Promise<void> {
    setBusyId(id);
    setMenuId(null);
    setAccountsError(null);
    try {
      await request();
      await loadAccounts(true);
    } catch (caught) {
      setAccountsError(errorMessage(caught, fallback));
    } finally {
      setBusyId(null);
    }
  }

  function changeRole(row: RoleAssignmentRow, role: AdminRole): void {
    void run(
      row.assignmentId,
      () =>
        apiFetch(`/admin/roles/${row.assignmentId}`, {
          method: 'PATCH',
          body: { role },
          auth: 'admin',
        }),
      'Could not change that role.',
    );
  }

  function revoke(row: RoleAssignmentRow): void {
    const label =
      row.source === 'ADMIN'
        ? `Revoke admin access for ${row.email}?`
        : `Revoke the invitation for ${row.email}?`;
    if (!window.confirm(label)) return;
    void run(
      row.assignmentId,
      () => apiFetch(`/admin/roles/${row.assignmentId}`, { method: 'DELETE', auth: 'admin' }),
      'Could not revoke that role.',
    );
  }

  function restore(row: RoleAssignmentRow): void {
    void run(
      row.assignmentId,
      () =>
        apiFetch(`/admin/admins/${row.assignmentId}/status`, {
          method: 'PATCH',
          body: { status: 'ACTIVE' },
          auth: 'admin',
        }),
      'Could not restore that admin.',
    );
  }

  const visibleAccounts = useMemo(() => {
    if (!accounts) return [];
    return roleFilter ? accounts.filter((row) => row.role === roleFilter) : accounts;
  }, [accounts, roleFilter]);

  const visibleRows = useMemo(() => {
    if (!rows) return [];
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      [row.action, labelOf(row.action), row.admin, row.targetType, row.targetId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [rows, search]);

  function rowMenu(row: RoleAssignmentRow) {
    if (!canManage) return null;
    const open = menuId === row.assignmentId;
    const otherRole: AdminRole = row.role === 'SUPER_ADMIN' ? 'MODERATOR' : 'SUPER_ADMIN';
    const canRevoke = row.status === 'ACTIVE' || row.status === 'PENDING';
    const canRestore = row.status === 'DISABLED' && row.source === 'ADMIN';
    const itemClass =
      'flex w-full items-center px-4 py-2 text-left text-sm text-charcoal hover:bg-alabaster';

    return (
      <div className="relative inline-block" data-row-menu="">
        <button
          type="button"
          aria-label={`Actions for ${row.email}`}
          aria-haspopup="menu"
          aria-expanded={open}
          disabled={busyId === row.assignmentId}
          onClick={() => setMenuId(open ? null : row.assignmentId)}
          className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-alabaster hover:text-navy disabled:opacity-50"
        >
          <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="currentColor">
            <circle cx="12" cy="5" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="12" cy="19" r="1.6" />
          </svg>
        </button>
        {open ? (
          <div
            role="menu"
            className="absolute right-0 z-20 mt-1 w-56 rounded-xl border border-line bg-white py-1 shadow-lg"
          >
            <button type="button" role="menuitem" className={itemClass} onClick={() => changeRole(row, otherRole)}>
              Change to {ADMIN_ROLE_LABELS[otherRole]}
            </button>
            {canRestore ? (
              <button type="button" role="menuitem" className={itemClass} onClick={() => restore(row)}>
                Restore access
              </button>
            ) : null}
            {canRevoke ? (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center px-4 py-2 text-left text-sm text-crimson hover:bg-crimson-soft"
                onClick={() => revoke(row)}
              >
                {row.source === 'ADMIN' ? 'Revoke access' : 'Revoke invitation'}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  const tabClass = (active: boolean) =>
    `text-xl font-semibold tracking-tight transition-colors sm:text-2xl ${
      active ? 'text-navy' : 'text-muted hover:text-charcoal'
    }`;

  return (
    <div className="space-y-4">
      {/* Header: tabs + primary action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Activity sections" className="flex items-baseline gap-5">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'accounts'}
            onClick={() => setTab('accounts')}
            className={tabClass(tab === 'accounts')}
          >
            Activity Log
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'live'}
            onClick={() => setTab('live')}
            className={tabClass(tab === 'live')}
          >
            Live Activity
          </button>
        </div>

        {canManage ? (
          <Link
            href="/admin/roles"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-crimson px-5 text-sm font-semibold text-white transition-colors hover:bg-crimson-dark"
          >
            Add New Admin
          </Link>
        ) : null}
      </div>

      {/* ───────── Accounts ───────── */}
      {tab === 'accounts' ? (
        accountsLoading && !accounts ? (
          <LoadingBlock label="Loading admin accounts" rows={4} />
        ) : accountsDenied ? (
          <DeniedCard
            title="Admin accounts are Super Admin only"
            text="Your role cannot view the admin team. Ask a Super Admin if you need access."
          />
        ) : (
          <>
            {accountsError ? <Alert tone="danger">{accountsError}</Alert> : null}

            <div className="rounded-card border border-line bg-white shadow-sm">
              <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-semibold text-navy">Accounts</h2>
                  <div
                    role="group"
                    aria-label="Filter by role"
                    className="inline-flex items-center gap-0.5 rounded-full bg-alabaster p-1"
                  >
                    {ROLE_PILLS.map((pill) => (
                      <button
                        key={pill.value || 'all'}
                        type="button"
                        aria-pressed={roleFilter === pill.value}
                        onClick={() => setRoleFilter(pill.value)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          roleFilter === pill.value
                            ? 'bg-white text-navy shadow-sm'
                            : 'text-muted hover:text-charcoal'
                        }`}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted">
                  {visibleAccounts.length} {visibleAccounts.length === 1 ? 'account' : 'accounts'}
                </p>
              </div>

              {visibleAccounts.length === 0 ? (
                <p className="border-t border-line px-5 py-8 text-center text-sm text-muted">
                  No accounts for this role yet.
                </p>
              ) : (
                <>
                  {/* Desktop / tablet table */}
                  <table className="hidden w-full text-left text-sm md:table">
                    <thead className="bg-alabaster text-[11px] uppercase tracking-wider text-muted">
                      <tr>
                        <th scope="col" className="px-5 py-3 font-semibold first:rounded-tl-none">
                          User
                        </th>
                        <th scope="col" className="px-4 py-3 text-center font-semibold">
                          Role
                        </th>
                        <th scope="col" className="px-4 py-3 text-center font-semibold">
                          Last Login
                        </th>
                        <th scope="col" className="px-4 py-3 text-center font-semibold">
                          Status
                        </th>
                        <th scope="col" className="px-5 py-3 text-right font-semibold">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {visibleAccounts.map((row) => (
                        <tr
                          key={row.assignmentId}
                          className={`transition-colors hover:bg-alabaster/60 ${
                            busyId === row.assignmentId ? 'opacity-60' : ''
                          }`}
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar label={row.name ?? row.email} />
                              <div className="min-w-0">
                                <p className="max-w-56 truncate font-medium text-navy">
                                  {row.name ?? row.email}
                                </p>
                                <p className="max-w-56 truncate text-xs text-muted">
                                  {row.email}
                                  {row.source === 'INVITATION' ? ' · Invitation' : ''}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-center text-charcoal">
                            {ADMIN_ROLE_LABELS[row.role]}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <LastLogin row={row} />
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <StatusPill status={row.status} />
                          </td>
                          <td className="px-5 py-3.5 text-right">{rowMenu(row)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Mobile cards */}
                  <ul className="divide-y divide-line border-t border-line md:hidden">
                    {visibleAccounts.map((row) => (
                      <li
                        key={row.assignmentId}
                        className={`space-y-3 p-4 ${busyId === row.assignmentId ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar label={row.name ?? row.email} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-navy">{row.name ?? row.email}</p>
                            <p className="truncate text-xs text-muted">{row.email}</p>
                          </div>
                          {rowMenu(row)}
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-medium text-charcoal">
                            {ADMIN_ROLE_LABELS[row.role]}
                          </span>
                          <StatusPill status={row.status} />
                        </div>
                        <LastLogin row={row} />
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </>
        )
      ) : null}

      {/* ───────── Live activity ───────── */}
      {tab === 'live' ? (
        auditLoading && !rows ? (
          <LoadingBlock label="Loading the activity log" rows={4} />
        ) : auditDenied ? (
          <DeniedCard
            title="Activity log is Super Admin only"
            text="Audit history is restricted to Super Admins. Moderators still generate entries for the actions they take."
          />
        ) : (
          <>
            {auditError ? <Alert tone="danger">{auditError}</Alert> : null}

            {rows && rows.length === 0 ? (
              <EmptyState title="No activity yet" description="Admin actions will appear here." icon="◎" />
            ) : null}

            {rows && rows.length > 0 ? (
              <div className="overflow-hidden rounded-card border border-line bg-white shadow-sm">
                <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-navy">Live activity</h2>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                        Live
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      Latest {rows.length} entries
                      {updatedAt ? ` · updated ${updatedAt.toLocaleTimeString()}` : ''}
                      {search.trim() ? ` · ${visibleRows.length} shown` : ''}
                    </p>
                  </div>
                  <div className="sm:w-72">
                    <TextInput
                      aria-label="Search activity"
                      placeholder="Search by action, admin or target"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>
                </div>

                {visibleRows.length === 0 ? (
                  <p className="border-t border-line px-5 py-8 text-center text-sm text-muted">
                    No activity matches that search.
                  </p>
                ) : (
                  <>
                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full min-w-175 text-left text-sm">
                        <thead className="bg-alabaster text-[11px] uppercase tracking-wider text-muted">
                          <tr>
                            <th scope="col" className="px-5 py-3 font-semibold">
                              User
                            </th>
                            <th scope="col" className="px-4 py-3 font-semibold">
                              Action
                            </th>
                            <th scope="col" className="px-4 py-3 font-semibold">
                              Target
                            </th>
                            <th scope="col" className="px-5 py-3 text-right font-semibold">
                              Time
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {visibleRows.map((row) => (
                            <tr key={row.id} className="transition-colors hover:bg-alabaster/60">
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <Avatar label={row.admin} size="sm" />
                                  <span className="max-w-56 truncate text-charcoal">{row.admin}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <Badge tone={toneOf(row.action)}>{labelOf(row.action)}</Badge>
                                <p className="mt-1 font-mono text-[11px] text-muted">{row.action}</p>
                              </td>
                              <td className="px-4 py-3.5">
                                <Target row={row} />
                              </td>
                              <td className="whitespace-nowrap px-5 py-3.5 text-right text-xs text-muted">
                                {formatDateTime(row.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <ul className="divide-y divide-line border-t border-line md:hidden">
                      {visibleRows.map((row) => (
                        <li key={row.id} className="space-y-2 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <Badge tone={toneOf(row.action)}>{labelOf(row.action)}</Badge>
                            <span className="shrink-0 text-[11px] text-muted">
                              {formatDateTime(row.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <Avatar label={row.admin} size="sm" />
                            <span className="min-w-0 flex-1 truncate text-sm text-charcoal">
                              {row.admin}
                            </span>
                          </div>
                          <Target row={row} />
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ) : null}
          </>
        )
      ) : null}
    </div>
  );
}