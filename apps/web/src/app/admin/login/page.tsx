import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AdminLoginForm } from './login-form';

export const metadata: Metadata = { title: 'Admin sign in' };

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-dvh place-items-center bg-navy text-sm text-white/70">
          Loading admin sign in…
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
