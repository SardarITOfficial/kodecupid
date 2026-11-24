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
import { AdminAuthFrame } from '@/components/admin/admin-auth-frame';

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
    <AdminAuthFrame
      title="Sign in to the admin area"
      subtitle="Staff accounts are separate from member accounts and are managed by a Super Admin."
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
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

        <div className="space-y-2 border-t border-line pt-5 text-center text-sm text-muted">
          <p>
            Invited to join the team?{' '}
            <Link href="/admin/accept-invite" className="font-semibold text-crimson hover:underline">
              Set up your account
            </Link>
          </p>
          <p className="text-xs">
            Not staff?{' '}
            <Link href="/login" className="font-medium text-navy underline">
              Member sign in
            </Link>
          </p>
        </div>
      </form>
    </AdminAuthFrame>
  );
}