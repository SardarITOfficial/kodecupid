'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_VALUES,
  type AdminInvitationRow,
  type AdminRole,
  type AdminSummary,
} from '@kodecupid/shared';
import { apiFetch, ApiError, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, Badge, LoadingBlock } from '@/components/ui/feedback';
import { SelectField, TextInput } from '@/components/ui/field';

interface AdminsResponse {
  admins: AdminSummary[];
  invitations: AdminInvitationRow[];
}

export default function RolesPage() {
  const [data, setData] = useState<AdminsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AdminRole>('MODERATOR');
  const [inviteResult, setInviteResult] = useState<{ inviteToken: string; inviteUrl: string } | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<AdminsResponse>('/admin/admins', { auth: 'admin' });
      setData(result);
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

  async function changeRole(adminId: string, role: AdminRole): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/admin/admins/${adminId}/role`, {
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

  async function toggleStatus(admin: AdminSummary): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/admin/admins/${admin.id}/status`, {
        method: 'PATCH',
        body: { status: admin.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' },
        auth: 'admin',
      });
      await load();
    } catch (caught) {
      setError(errorMessage(caught, 'Could not update that admin.'));
    } finally {
      setBusy(false);
    }
  }

  async function invite(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setInviteResult(null);
    try {
      const result = await apiFetch<{ inviteToken: string; inviteUrl: string }>(
        '/admin/admins/invite',
        { method: 'POST', body: { email: inviteEmail, role: inviteRole }, auth: 'admin' },
      );
      setInviteResult(result);
      setInviteEmail('');
      await load();
    } catch (caught) {
      setError(errorMessage(caught, 'Could not create the invitation.'));
    } finally {
      setBusy(false);
    }
  }

  async function revoke(invitationId: string): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/admin/admins/invitations/${invitationId}`, {
        method: 'DELETE',
        auth: 'admin',
      });
      await load();
    } catch (caught) {
      setError(errorMessage(caught, 'Could not revoke that invitation.'));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
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
          Invite admins by email, then change their role at any time. At least one active Super Admin
          must always remain.
        </p>
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {inviteResult ? (
        <Alert tone="warning" title="Invitation created">
          <p className="mb-2">
            Email delivery is not wired up in Milestone 1. Send this one-time link to the person
            directly:
          </p>
          <code className="block break-all rounded-lg bg-white px-3 py-2 text-xs text-charcoal">
            {`${window.location.origin}${inviteResult.inviteUrl}`}
          </code>
          <p className="mt-2 text-xs">Token: {inviteResult.inviteToken}</p>
        </Alert>
      ) : null}

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">Invite an admin</h2>
        <form className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto]" onSubmit={invite}>
          <TextInput
            aria-label="Invitee email"
            type="email"
            required
            placeholder="name@practice.com"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
          />
          <SelectField
            aria-label="Invite role"
            value={inviteRole}
            onChange={(event) => setInviteRole(event.target.value as AdminRole)}
            options={ADMIN_ROLE_VALUES.map((role) => ({ value: role, label: ADMIN_ROLE_LABELS[role] }))}
          />
          <Button type="submit" loading={busy}>
            Send invite
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">Admin accounts</h2>
        <ul className="mt-2 divide-y divide-line">
          {data?.admins.map((admin) => (
            <li key={admin.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-navy">{admin.name}</p>
                <p className="truncate text-xs text-muted">{admin.email}</p>
                <p className="mt-0.5 text-[11px] text-muted">
                  Last sign-in {formatDateTime(admin.lastLoginAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={admin.status === 'ACTIVE' ? 'success' : 'danger'}>
                  {admin.status.toLowerCase()}
                </Badge>
                <SelectField
                  aria-label={`Role for ${admin.email}`}
                  value={admin.role}
                  onChange={(event) => void changeRole(admin.id, event.target.value as AdminRole)}
                  options={ADMIN_ROLE_VALUES.map((role) => ({
                    value: role,
                    label: ADMIN_ROLE_LABELS[role],
                  }))}
                  disabled={busy}
                  className="w-40"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void toggleStatus(admin)}
                >
                  {admin.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">Invitations</h2>
        {data?.invitations.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No invitations yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {data?.invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-navy">{invitation.email}</p>
                  <p className="text-xs text-muted">
                    {ADMIN_ROLE_LABELS[invitation.role]} · invited by {invitation.invitedBy ?? 'system'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    tone={
                      invitation.status === 'PENDING'
                        ? 'warning'
                        : invitation.status === 'ACCEPTED'
                          ? 'success'
                          : 'neutral'
                    }
                  >
                    {invitation.status.toLowerCase()}
                  </Badge>
                  <span className="text-[11px] text-muted">
                    expires {formatDateTime(invitation.expiresAt)}
                  </span>
                  {invitation.status === 'PENDING' ? (
                    <Button size="sm" variant="danger" disabled={busy} onClick={() => void revoke(invitation.id)}>
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
