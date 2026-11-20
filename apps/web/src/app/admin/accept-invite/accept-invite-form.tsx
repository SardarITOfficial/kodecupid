'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiFetch, errorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/field';
import { Alert } from '@/components/ui/feedback';

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
      <div className="mx-auto max-w-md px-5 py-12">
        <div className="rounded-card border border-line bg-white p-6">
          <h1 className="text-xl font-semibold text-navy">You&apos;re set up</h1>
          <p className="mt-2 text-sm text-muted">
            The account <strong className="text-charcoal">{done.email}</strong> is active as{' '}
            {done.role.replace('_', ' ').toLowerCase()}. Sign in to continue.
          </p>
          <Link
            href="/admin/login"
            className="mt-5 inline-flex h-11 items-center rounded-full bg-crimson px-5 text-sm font-semibold text-white"
          >
            Go to admin sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-5 py-10">
      <h1 className="text-2xl font-semibold text-navy">Accept your admin invitation</h1>
      <p className="mt-2 text-sm text-muted">
        A Super Admin invited you to KodeCupid administration. Set your name and password to activate
        the account.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4 rounded-card border border-line bg-white p-5">
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
    </div>
  );
}
