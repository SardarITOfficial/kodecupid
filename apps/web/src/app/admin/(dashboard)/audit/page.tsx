'use client';

import { useEffect, useState } from 'react';
import type { AdminAuditLogRow } from '@kodecupid/shared';
import { apiFetch, ApiError, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Alert, Badge, EmptyState, LoadingBlock } from '@/components/ui/feedback';

export default function AdminAuditPage() {
  const [rows, setRows] = useState<AdminAuditLogRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch<AdminAuditLogRow[]>('/admin/audit-logs', { auth: 'admin' })
      .then((value) => {
        if (!cancelled) setRows(value);
      })
      .catch((caught) => {
        if (cancelled) return;
        if (caught instanceof ApiError && caught.status === 403) setDenied(true);
        else setError(errorMessage(caught, 'Could not load the activity log.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingBlock label="Loading the activity log" rows={4} />;

  if (denied) {
    return (
      <Card>
        <h1 className="text-xl font-semibold text-navy">Activity log is Super Admin only</h1>
        <p className="mt-2 text-sm text-muted">
          Audit history is restricted to Super Admins. Moderators still generate entries for the
          actions they take.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy">Activity log</h1>
        <p className="text-sm text-muted">
          Every privileged action — logins, member status changes, role assignments and revocations.
        </p>
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {rows && rows.length === 0 ? (
        <EmptyState title="No activity yet" description="Admin actions will appear here." icon="◎" />
      ) : null}

      {rows && rows.length > 0 ? (
        <Card>
          <ul className="divide-y divide-line">
            {rows.map((row) => (
              <li key={row.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-charcoal">{row.action}</p>
                  <p className="text-xs text-muted">
                    {[row.targetType, row.targetId].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-right text-xs text-muted">
                  <Badge tone="neutral">{row.admin}</Badge>
                  <span>{formatDateTime(row.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
