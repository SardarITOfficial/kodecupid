'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_VALUES,
  type AdminRole,
  type RoleAssignmentResult,
  type RoleAssignmentRow,
} from '@kodecupid/shared';
import { apiFetch, ApiError, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, Badge, LoadingBlock } from '@/components/ui/feedback';
import { SelectField, TextInput } from '@/components/ui/field';
import { RolePermissions } from '@/components/admin/role-permissions';

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  EXPIRED: 'neutral',
  REVOKED: 'danger',
  DISABLED: 'danger',
  ACCEPTED: 'success',
};

const ROLE_OPTIONS = ADMIN_ROLE_VALUES.map((role) => ({
  value: role,
  label: ADMIN_ROLE_LABELS[role],
}));

function initialsOf(value: string): string {
  const base = value.includes('@') ? (value.split('@')[0] ?? value) : value;
  const parts = base.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || '?';
}

function PersonAvatar({ label, pending }: { label: string; pending: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid size-10 shrink-0 place-items-center rounded-full text-xs font-semibold tracking-wide ${
        pending ? 'border border-dashed border-line bg-alabaster text-muted' : 'bg-navy text-white'
      }`}
    >
      {initialsOf(label)}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">{children}</h2>;
}

function activityLine(assignment: RoleAssignmentRow): string {
  if (assignment.lastLoginAt) return `Last sign-in ${formatDateTime(assignment.lastLoginAt)}`;
  if (assignment.expiresAt) return `Expires ${formatDateTime(assignment.expiresAt)}`;
  return 'Never signed in';
}

export default function RolesPage() {
  const [assignments, setAssignments] = useState<RoleAssignmentRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const [filter, setFilter] = useState('');
  const [copied, setCopied] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AdminRole>('MODERATOR');
  const [inviteResult, setInviteResult] = useState<RoleAssignmentResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<RoleAssignmentRow[]>('/admin/roles', { auth: 'admin' });
      setAssignments(result);
      setDenied(false);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 403) {
        setDenied(true);
      } else {
        setError(errorMessage(caught, 'Could not load the admin team.'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeRole(assignmentId: string, role: AdminRole): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/admin/roles/${assignmentId}`, {
        method: 'PATCH',
        body: { role },
        auth: 'admin',
      });
      await load();
    } catch (caught) {
      setError(errorMessage(caught, 'Could not change that role.'));
    } finally {
      setBusy(false);
    }
  }

  async function assign(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setInviteResult(null);
    setCopied(false);
    try {
      const result = await apiFetch<RoleAssignmentResult>('/admin/roles/assign', {
        method: 'POST',
        body: { email: inviteEmail, role: inviteRole },
        auth: 'admin',
      });
      setInviteResult(result);
      setInviteEmail('');
      await load();
    } catch (caught) {
      setError(errorMessage(caught, 'Could not assign that role.'));
    } finally {
      setBusy(false);
    }
  }

  async function revoke(assignment: RoleAssignmentRow): Promise<void> {
    const label =
      assignment.source === 'ADMIN'
        ? `Revoke admin access for ${assignment.email}?`
        : `Revoke the invitation for ${assignment.email}?`;
    if (!window.confirm(label)) return;

    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/admin/roles/${assignment.assignmentId}`, {
        method: 'DELETE',
        auth: 'admin',
      });
      await load();
    } catch (caught) {
      setError(errorMessage(caught, 'Could not revoke that role.'));
    } finally {
      setBusy(false);
    }
  }

  async function restore(assignmentId: string): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/admin/admins/${assignmentId}/status`, {
        method: 'PATCH',
        body: { status: 'ACTIVE' },
        auth: 'admin',
      });
      await load();
    } catch (caught) {
      setError(errorMessage(caught, 'Could not restore that admin.'));
    } finally {
      setBusy(false);
    }
  }

  const inviteLink = inviteResult
    ? inviteResult.inviteUrl
      ? `${window.location.origin}${inviteResult.inviteUrl}`
      : `${window.location.origin}/admin/accept-invite?token=${inviteResult.inviteToken ?? ''}`
    : '';

  async function copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const visible = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!assignments) return [];
    if (!needle) return assignments;
    return assignments.filter(
      (assignment) =>
        assignment.email.toLowerCase().includes(needle) ||
        (assignment.name ?? '').toLowerCase().includes(needle),
    );
  }, [assignments, filter]);

  if (loading && !assignments) {
    return <LoadingBlock label="Loading the admin team" rows={4} />;
  }

  if (denied) {
    return (
      <Card>
        <h1 className="text-xl font-semibold text-navy">Role management is Super Admin only</h1>
        <p className="mt-2 text-sm text-muted">
          Your Moderator role can review members, complaints and verification requests, but changing
          who has access is restricted to Super Admins.
        </p>
      </Card>
    );
  }

  function roleSelect(assignment: RoleAssignmentRow, className: string) {
    return (
      <SelectField
        aria-label={`Role for ${assignment.email}`}
        value={assignment.role}
        onChange={(event) =>
          void changeRole(assignment.assignmentId, event.target.value as AdminRole)
        }
        options={ROLE_OPTIONS}
        disabled={busy}
        className={className}
      />
    );
  }

  function rowActions(assignment: RoleAssignmentRow) {
    if (assignment.status === 'DISABLED' && assignment.source === 'ADMIN') {
      return (
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() => void restore(assignment.assignmentId)}
        >
          Restore
        </Button>
      );
    }
    if (assignment.status === 'PENDING' || assignment.status === 'ACTIVE') {
      return (
        <Button size="sm" variant="danger" disabled={busy} onClick={() => void revoke(assignment)}>
          Revoke
        </Button>
      );
    }
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy">Roles &amp; access</h1>
        <p className="text-sm text-muted">
          Assign a role by email. Existing admins change immediately; new emails receive a one-time
          invitation link. At least one active Super Admin must always remain.
        </p>
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {inviteResult ? (
        <Alert tone="warning" title="Role assignment created">
          {inviteResult.applied ? (
            <p>
              {inviteResult.email} is now{' '}
              {inviteResult.role === 'SUPER_ADMIN' ? 'a Super Admin' : 'a Moderator'} — the change is
              already active.
            </p>
          ) : (
            <>
              <p className="mb-2">
                Email delivery is not wired up in Milestone 1. Send this one-time link to the person
                directly:
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="block min-w-0 flex-1 break-all rounded-lg bg-white px-3 py-2 text-xs text-charcoal">
                  {inviteLink}
                </code>
                <Button type="button" size="sm" variant="secondary" onClick={() => void copyLink()}>
                  {copied ? 'Copied' : 'Copy link'}
                </Button>
              </div>
            </>
          )}
        </Alert>
      ) : null}

      {/* Assign */}
      <Card className="p-5">
        <SectionTitle>Assign a role by email</SectionTitle>
        <p className="mt-0.5 text-xs text-muted">
          Use an existing admin&apos;s email to change their role, or a new email to invite them.
        </p>
        <form
          className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_auto]"
          onSubmit={assign}
        >
          <TextInput
            aria-label="Email address"
            type="email"
            required
            placeholder="name@practice.com"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
          />
          <SelectField
            aria-label="Role"
            value={inviteRole}
            onChange={(event) => setInviteRole(event.target.value as AdminRole)}
            options={ROLE_OPTIONS}
          />
          <Button type="submit" loading={busy}>
            Assign role
          </Button>
        </form>
      </Card>

      {/* People */}
      <div className="overflow-hidden rounded-card border border-line bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <SectionTitle>People with access</SectionTitle>
            <p className="mt-0.5 text-xs text-muted">
              {assignments?.length ?? 0} {assignments?.length === 1 ? 'person' : 'people'}
              {filter.trim() ? ` · ${visible.length} shown` : ''}
            </p>
          </div>
          <div className="sm:w-64">
            <TextInput
              aria-label="Filter people"
              placeholder="Filter by name or email"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          </div>
        </div>

        {assignments?.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted">No admins or invitations yet.</p>
        ) : visible.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted">No one matches that filter.</p>
        ) : (
          <>
            {/* Desktop / tablet table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-alabaster text-[11px] uppercase tracking-wider text-muted">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Person
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Role
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Activity
                    </th>
                    <th scope="col" className="px-5 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visible.map((assignment) => (
                    <tr
                      key={assignment.assignmentId}
                      className="transition-colors hover:bg-alabaster/70"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <PersonAvatar
                            label={assignment.name ?? assignment.email}
                            pending={assignment.source === 'INVITATION'}
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-navy">
                              {assignment.name ?? assignment.email}
                            </p>
                            <p className="truncate text-xs text-muted">
                              {assignment.name ? `${assignment.email} · ` : ''}
                              {assignment.source === 'ADMIN' ? 'Admin account' : 'Invitation'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">{roleSelect(assignment, 'w-40')}</td>
                      <td className="px-4 py-3.5">
                        <Badge tone={STATUS_TONE[assignment.status] ?? 'neutral'}>
                          {assignment.status.toLowerCase()}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted">
                        {activityLine(assignment)}
                      </td>
                      <td className="px-5 py-3.5 text-right">{rowActions(assignment)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-line md:hidden">
              {visible.map((assignment) => (
                <li key={assignment.assignmentId} className="space-y-3 p-4">
                  <div className="flex items-start gap-3">
                    <PersonAvatar
                      label={assignment.name ?? assignment.email}
                      pending={assignment.source === 'INVITATION'}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-medium text-navy">
                          {assignment.name ?? assignment.email}
                        </p>
                        <Badge tone={STATUS_TONE[assignment.status] ?? 'neutral'}>
                          {assignment.status.toLowerCase()}
                        </Badge>
                      </div>
                      <p className="truncate text-xs text-muted">
                        {assignment.name ? `${assignment.email} · ` : ''}
                        {assignment.source === 'ADMIN' ? 'Admin account' : 'Invitation'}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted">{activityLine(assignment)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {roleSelect(assignment, 'w-44')}
                    {rowActions(assignment)}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Role permissions (loads from /admin/role-permissions) */}
      <RolePermissions />
    </div>
  );
}