'use client';

import { useCallback, useEffect, useState } from 'react';
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

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  EXPIRED: 'neutral',
  REVOKED: 'danger',
  DISABLED: 'danger',
  ACCEPTED: 'success',
};

export default function RolesPage() {
  const [assignments, setAssignments] = useState<RoleAssignmentRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

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
              <code className="block break-all rounded-lg bg-white px-3 py-2 text-xs text-charcoal">
                {inviteResult.inviteUrl
                  ? `${window.location.origin}${inviteResult.inviteUrl}`
                  : `${window.location.origin}/admin/accept-invite?token=${inviteResult.inviteToken ?? ''}`}
              </code>
            </>
          )}
        </Alert>
      ) : null}

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">
          Assign a role by email
        </h2>
        <form className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto]" onSubmit={assign}>
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
            options={ADMIN_ROLE_VALUES.map((role) => ({ value: role, label: ADMIN_ROLE_LABELS[role] }))}
          />
          <Button type="submit" loading={busy}>
            Assign role
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">
          People with access
        </h2>
        {assignments?.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No admins or invitations yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {assignments?.map((assignment) => (
              <li
                key={assignment.assignmentId}
                className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy">
                    {assignment.name ?? assignment.email}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {assignment.email} · {assignment.source === 'ADMIN' ? 'admin account' : 'invitation'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {assignment.lastLoginAt
                      ? `Last sign-in ${formatDateTime(assignment.lastLoginAt)}`
                      : assignment.expiresAt
                        ? `Expires ${formatDateTime(assignment.expiresAt)}`
                        : 'Never signed in'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={STATUS_TONE[assignment.status] ?? 'neutral'}>
                    {assignment.status.toLowerCase()}
                  </Badge>
                  <SelectField
                    aria-label={`Role for ${assignment.email}`}
                    value={assignment.role}
                    onChange={(event) =>
                      void changeRole(assignment.assignmentId, event.target.value as AdminRole)
                    }
                    options={ADMIN_ROLE_VALUES.map((role) => ({
                      value: role,
                      label: ADMIN_ROLE_LABELS[role],
                    }))}
                    disabled={busy}
                    className="w-40"
                  />
                  {assignment.status === 'DISABLED' && assignment.source === 'ADMIN' ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => void restore(assignment.assignmentId)}
                    >
                      Restore
                    </Button>
                  ) : assignment.status === 'PENDING' || assignment.status === 'ACTIVE' ? (
                    <Button size="sm" variant="danger" disabled={busy} onClick={() => void revoke(assignment)}>
                      Revoke
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
