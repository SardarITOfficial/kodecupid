'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError, errorMessage } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Alert, Badge, EmptyState, LoadingBlock } from '@/components/ui/feedback';

interface SectionPayload {
  milestone: 1 | 2;
  title: string;
  description: string;
  items: {
    id: string;
    action?: string;
    admin?: string;
    createdAt?: string;
    targetType?: string | null;
    targetId?: string | null;
  }[];
}

/**
 * Permission-gated shell used by the admin sections that Milestone 2 fills in.
 * The fetch still goes through the API guard, which is what proves the
 * role difference server-side.
 */
export function AdminSectionShell({ endpoint }: { endpoint: string }) {
  const [data, setData] = useState<SectionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch<SectionPayload>(`/admin/${endpoint}`, { auth: 'admin' })
      .then((value) => {
        if (!cancelled) setData(value);
      })
      .catch((caught) => {
        if (cancelled) return;
        if (caught instanceof ApiError && caught.status === 403) {
          setDenied(true);
        } else {
          setError(errorMessage(caught, 'Could not load this section.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  if (loading) {
    return <LoadingBlock label="Loading section" rows={3} />;
  }

  if (denied) {
    return (
      <Card className="p-6 sm:p-8">
        <h1 className="text-xl font-semibold text-navy">Not available for your role</h1>
        <p className="mt-2 text-sm text-muted">
          Your admin role does not include this section. Ask a Super Admin if you need access.
        </p>
      </Card>
    );
  }

  if (!data) {
    return <Alert tone="danger">{error ?? 'Could not load this section.'}</Alert>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-crimson">Admin</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-navy">{data.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">{data.description}</p>
        </div>
        {data.milestone === 2 ? <Badge tone="gold">Milestone 2</Badge> : <Badge tone="success">Live</Badge>}
      </header>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {data.items.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          description={
            data.milestone === 2
              ? 'This queue starts receiving data when the matching milestone ships.'
              : 'Nothing has happened yet.'
          }
          icon="◎"
        />
      ) : (
        <Card className="p-2 sm:p-3">
          <ul className="divide-y divide-line text-sm">
            {data.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-1 rounded-xl px-3 py-3 transition-colors hover:bg-alabaster sm:flex-row sm:items-center sm:justify-between sm:gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-navy">{item.action ?? item.id}</p>
                  <p className="truncate text-xs text-muted">
                    {[item.targetType, item.targetId].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <div className="shrink-0 text-xs text-muted sm:text-right">
                  <p className="font-medium text-charcoal">{item.admin ?? 'system'}</p>
                  <p>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}