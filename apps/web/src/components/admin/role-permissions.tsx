'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ADMIN_ROLE_LABELS,
  PERMISSIONS,
  SUPER_ADMIN_ONLY_PERMISSIONS,
  ROLE_PERMISSIONS,
  type Permission,
  type RolePermissionsView,
} from '@kodecupid/shared';
import { apiFetch, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, LoadingBlock } from '@/components/ui/feedback';
import {
  PermissionHeader,
  PermissionMatrix,
  cellKey,
  type MatrixGroup,
  type MatrixValue,
} from '@/components/admin/permission-matrix';

const ACTIONS = [
  { key: 'read', label: 'Read' },
  { key: 'write', label: 'Write' },
  { key: 'delete', label: 'Delete' },
  { key: 'manage', label: 'Manage' },
];

const RESOURCE_LABELS: Record<string, string> = {
  users: 'Members',
  admins: 'Admins & roles',
  settings: 'Settings',
  monetization: 'Monetization',
  verification: 'Verification',
  complaints: 'Complaints',
  deletion: 'Data deletion',
  corrections: 'Profile corrections',
  audit: 'Activity log',
};

function splitPermission(permission: Permission): { resource: string; action: string } {
  const index = permission.indexOf('.');
  return { resource: permission.slice(0, index), action: permission.slice(index + 1) };
}

const RESOURCES = Array.from(new Set(PERMISSIONS.map((p) => splitPermission(p).resource)));

function buildGroups(role: string, locked: boolean): MatrixGroup[] {
  const rows = RESOURCES.map((resource) => ({
    id: resource,
    label: RESOURCE_LABELS[resource] ?? resource,
    supports: PERMISSIONS.filter(
      (p) =>
        splitPermission(p).resource === resource &&
        (locked || !SUPER_ADMIN_ONLY_PERMISSIONS.includes(p)),
    ).map((p) => splitPermission(p).action),
  }));
  return [{ id: `permissions-${role}`, label: 'Resource', columns: ACTIONS, rows }];
}

function toValue(permissions: readonly Permission[]): MatrixValue {
  const value: MatrixValue = {};
  for (const permission of permissions) {
    const { resource, action } = splitPermission(permission);
    value[cellKey(resource, action)] = true;
  }
  return value;
}

function fromValue(value: MatrixValue): Permission[] {
  return PERMISSIONS.filter((permission) => {
    const { resource, action } = splitPermission(permission);
    return value[cellKey(resource, action)] === true;
  });
}

function sameSet(a: readonly Permission[], b: readonly Permission[]): boolean {
  return a.length === b.length && a.every((permission) => b.includes(permission));
}

export function RolePermissions() {
  const [views, setViews] = useState<RolePermissionsView[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, MatrixValue>>({});
  const [loading, setLoading] = useState(true);
  const [savingRole, setSavingRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedRole, setSavedRole] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<RolePermissionsView[]>('/admin/role-permissions', {
        auth: 'admin',
      });
      setViews(result);
      setDrafts(Object.fromEntries(result.map((view) => [view.role, toValue(view.permissions)])));
    } catch (caught) {
      setError(errorMessage(caught, 'Could not load role permissions.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function handleChange(role: string, key: string, next: boolean): void {
    setSavedRole(null);
    setDrafts((current) => {
      const value: MatrixValue = { ...(current[role] ?? {}) };
      value[key] = next;
      const separator = key.indexOf(':');
      const resource = key.slice(0, separator);
      const action = key.slice(separator + 1);
      if (next && action === 'write') value[cellKey(resource, 'read')] = true;
      if (!next && action === 'read') value[cellKey(resource, 'write')] = false;
      return { ...current, [role]: value };
    });
  }

  function restoreDefaults(role: string): void {
    const defaults = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];
    if (!defaults) return;
    setSavedRole(null);
    setDrafts((current) => ({ ...current, [role]: toValue(defaults) }));
  }

  async function save(view: RolePermissionsView): Promise<void> {
    setSavingRole(view.role);
    setError(null);
    setSavedRole(null);
    try {
      const updated = await apiFetch<RolePermissionsView>(`/admin/role-permissions/${view.role}`, {
        method: 'PATCH',
        body: { permissions: fromValue(drafts[view.role] ?? {}) },
        auth: 'admin',
      });
      setViews((current) =>
        current ? current.map((entry) => (entry.role === updated.role ? updated : entry)) : current,
      );
      setDrafts((current) => ({ ...current, [updated.role]: toValue(updated.permissions) }));
      setSavedRole(updated.role);
    } catch (caught) {
      setError(errorMessage(caught, 'Could not save those permissions.'));
    } finally {
      setSavingRole(null);
    }
  }

  if (loading && !views) {
    return <LoadingBlock label="Loading role permissions" rows={3} />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">
          Role permissions
        </h2>
        <p className="mt-0.5 text-xs text-muted">
          Choose what each role can do. Super Admin always has full access, and admin management and
          member deletion are reserved for Super Admins.
        </p>
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {(views ?? []).map((view) => {
        const draft = drafts[view.role] ?? {};
        const dirty = !sameSet(fromValue(draft), view.permissions);
        const saving = savingRole === view.role;
        const subtitle = view.locked
          ? 'Always has full access'
          : view.updatedAt
            ? `Updated ${formatDateTime(view.updatedAt)}`
            : 'Using built-in defaults';

        return (
          <Card key={view.role} className="overflow-hidden p-0">
            <PermissionHeader
              name={ADMIN_ROLE_LABELS[view.role]}
              subtitle={subtitle}
              onRestore={() => restoreDefaults(view.role)}
              restoring={view.locked || saving}
            />
            <PermissionMatrix
              groups={buildGroups(view.role, view.locked)}
              value={draft}
              onChange={(key, next) => handleChange(view.role, key, next)}
              disabled={view.locked || saving}
            />
            {view.locked ? null : (
              <div className="flex items-center justify-end gap-3 border-t border-line px-6 py-4">
                {savedRole === view.role ? <span className="text-xs text-muted">Saved</span> : null}
                <Button
                  size="sm"
                  loading={saving}
                  disabled={!dirty || saving}
                  onClick={() => void save(view)}
                >
                  Save changes
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
