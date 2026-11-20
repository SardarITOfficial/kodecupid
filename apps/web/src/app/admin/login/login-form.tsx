'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { AdminSession } from '@kodecupid/shared';
import { useSession } from '@/app/providers';
import { apiFetch, ApiError, errorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/field';
import { Alert } from '@/components/ui/feedback';

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshAdmin } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      await apiFetch<AdminSession>('/admin/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      await refreshAdmin();
      const next = searchParams.get('next');
      router.replace(next && next.startsWith('/admin') ? next : '/admin/users');
    } catch (caught) {
      if (caught instanceof ApiError && Object.keys(caught.fieldErrors).length > 0) {
        setFieldErrors(caught.fieldErrors);
      }
      setError(errorMessage(caught, 'Could not sign in.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-navy">
      <header className="mx-auto w-full max-w-md px-5 py-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white">
          Admin
        </span>
      </header>

      <main id="main" className="mx-auto w-full max-w-md flex-1 px-5">
        <h1 className="text-2xl font-semibold text-white">Sign in to the admin area</h1>
        <p className="mt-2 text-sm text-white/70">
          Staff accounts are separate from member accounts and are managed by a Super Admin.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4 rounded-card bg-white p-5" noValidate>
          {error ? <Alert tone="danger">{error}</Alert> : null}

          <TextInput
            label="Work email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
          />
          <TextInput
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
          />

          <Button type="submit" size="lg" fullWidth loading={loading}>
            Sign in
          </Button>

          <p className="text-center text-xs text-muted">
            Invited to join the team?{' '}
            <Link href="/admin/accept-invite" className="font-medium text-navy underline">
              Set up your account
            </Link>
          </p>
        </form>
      </main>

      <footer className="mx-auto w-full max-w-md px-5 py-8 text-xs text-white/50">
        <div className="flex items-center justify-between gap-3">
          <span>KodeCupid administration</span>
          <Link href="/login" className="underline">
            Member sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
