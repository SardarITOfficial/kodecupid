import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/feedback';

export function InfoRow({
  label,
  value,
  hidden = false,
  empty = 'Not set',
}: {
  label: string;
  value: ReactNode;
  hidden?: boolean;
  empty?: string;
}) {
  const hasValue = value !== null && value !== undefined && value !== '';
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-sm text-muted">{label}</span>
      <span className="flex flex-wrap items-center justify-end gap-2 text-right text-sm font-medium text-navy">
        {hasValue ? value : <span className="font-normal text-muted">{empty}</span>}
        {hidden && hasValue ? <Badge tone="neutral">Private</Badge> : null}
      </span>
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="divide-y divide-line">{children}</div>
    </Card>
  );
}

export function CompletionRing({ percent }: { percent: number }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative grid size-[68px] place-items-center">
      <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="#D91E36"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="text-sm font-semibold text-navy">{percent}%</span>
      <span className="sr-only">Profile completeness</span>
    </div>
  );
}
