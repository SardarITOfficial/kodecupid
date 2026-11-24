'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiFetch, errorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/field';
import { Alert } from '@/components/ui/feedback';
import { AdminAuthFrame } from '@/components/admin/admin-auth-frame';

export function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') ?? '');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ email: string; role: string } | null>(null);

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const result = await apiFetch<{ email: string; role: string }>('/admin/auth/accept-invite', {
        method: 'POST',
        body: { token, name, password },
      });
      setDone(result);
    } catch (caught) {
      setError(errorMessage(caught, 'That invitation could not be used.'));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AdminAuthFrame
        title="You're set up"
        subtitle="Your admin account is active. Sign in to continue."
      >
        <p className="text-sm leading-relaxed text-charcoal">
          The account <strong className="text-navy">{done.email}</strong> is active as{' '}
          {done.role.replace('_', ' ').toLowerCase()}.
        </p>
        <Link
          href="/admin/login"
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-crimson text-base font-semibold text-white transition-colors hover:bg-crimson-dark"
        >
          Go to admin sign in
        </Link>
      </AdminAuthFrame>
    );
  }

  return (
    <AdminAuthFrame
      title="Accept your admin invitation"
      subtitle="A Super Admin invited you to KodeCupid administration. Set your name and password to activate the account."
    >
      <form onSubmit={submit} className="space-y-5">
        {error ? <Alert tone="danger">{error}</Alert> : null}

        <TextInput
          label="Invitation token"
          required
          value={token}
          onChange={(event) => setToken(event.target.value)}
          hint="Paste the token from your invitation."
        />
        <TextInput
          label="Full name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <TextInput
          label="Password"
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          hint="At least 10 characters with a letter and a number."
        />
        <TextInput
          label="Confirm password"
          type="password"
          required
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />

        <Button type="submit" fullWidth size="lg" loading={loading}>
          Activate account
        </Button>
      </form>
    </AdminAuthFrame>
  );
}