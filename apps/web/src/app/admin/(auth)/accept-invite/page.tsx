import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AcceptInviteForm } from './accept-invite-form';

export const metadata: Metadata = { title: 'Accept admin invitation' };

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-sm text-muted">Loading…</div>}>
      <AcceptInviteForm />
    </Suspense>
  );
}