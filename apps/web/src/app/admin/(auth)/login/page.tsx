import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AdminLoginForm } from './login-form';

export const metadata: Metadata = { title: 'Admin sign in' };

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={<div className="py-10 text-center text-sm text-muted">Loading admin sign in…</div>}
    >
      <AdminLoginForm />
    </Suspense>
  );
}