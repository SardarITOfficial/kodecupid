'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MemberSession, OtpRequestResult } from '@kodecupid/shared';
import { useSession } from '@/app/providers';
import { apiFetch, ApiError, errorMessage } from '@/lib/api';
import { clearPendingOtp, readPendingOtp, savePendingOtp, type PendingOtp } from '@/lib/otp';
import { routeAfterAuth } from '@/lib/routing';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/field';
import { Alert, LoadingBlock } from '@/components/ui/feedback';

export default function VerifyPage() {
  const router = useRouter();
  const { setMember } = useSession();
  const [pending, setPending] = useState<PendingOtp | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    const stored = readPendingOtp();
    setPending(stored);
    setLoaded(true);
    if (stored) {
      const seconds = Math.max(
        0,
        Math.ceil((new Date(stored.resendAvailableAt).getTime() - Date.now()) / 1000),
      );
      setResendIn(seconds);
    }
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  const maskedPhone = useMemo(() => {
    if (!pending) return '';
    return pending.phone.replace(/.(?=.{3})/g, '•');
  }, [pending]);

  async function verify(): Promise<void> {
    if (!pending) return;
    setError(null);
    setLoading(true);
    try {
      const result = await apiFetch<{ created: boolean; session: MemberSession }>(
        '/auth/verify-otp',
        { method: 'POST', body: { challengeId: pending.challengeId, code } },
      );
      clearPendingOtp();
      setMember(result.session);
      routeAfterAuth(result.session, router);
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'VALIDATION_ERROR') {
        setError(caught.message);
      } else {
        setError(errorMessage(caught, 'That code could not be verified.'));
      }
    } finally {
      setLoading(false);
    }
  }

  async function resend(): Promise<void> {
    if (!pending) return;
    setError(null);
    setLoading(true);
    try {
      const result = await apiFetch<OtpRequestResult>('/auth/request-otp', {
        method: 'POST',
        body: { phone: pending.phone, countryCode: 'US' },
      });
      const next: PendingOtp = {
        ...pending,
        challengeId: result.challengeId,
        expiresAt: result.expiresAt,
        resendAvailableAt: result.resendAvailableAt,
        ...(result.debugCode ? { debugCode: result.debugCode } : {}),
      };
      savePendingOtp(next);
      setPending(next);
      setCode('');
      setResendIn(60);
    } catch (caught) {
      if (caught instanceof ApiError && caught.details) {
        const details = caught.details as { retryAfterSeconds?: number };
        if (details.retryAfterSeconds) setResendIn(details.retryAfterSeconds);
      }
      setError(errorMessage(caught, 'We could not resend the code yet.'));
    } finally {
      setLoading(false);
    }
  }

  if (!loaded) {
    return <LoadingBlock label="Checking your code" rows={2} />;
  }

  if (!pending) {
    return (
      <div className="pt-2">
        <h1 className="text-2xl font-semibold text-navy">No code to check</h1>
        <p className="mt-2 text-sm text-muted">
          Start again and we will text you a new verification code.
        </p>
        <div className="mt-5 flex gap-3">
          <Link
            href="/register"
            className="inline-flex h-11 items-center rounded-full bg-crimson px-5 text-sm font-semibold text-white"
          >
            Register
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-full border border-line bg-white px-5 text-sm font-semibold text-navy"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <h1 className="text-2xl font-semibold tracking-tight text-navy">Enter your code</h1>
      <p className="mt-2 text-sm text-muted">
        We sent a 6-digit code to <span className="font-medium text-charcoal">{maskedPhone}</span>.
      </p>

      {pending.debugCode ? (
        <div className="mt-4">
          <Alert tone="warning" title="Test mode">
            SMS is not connected in this environment. Use the code{' '}
            <strong className="font-semibold">{pending.debugCode}</strong>.
          </Alert>
        </div>
      ) : null}

      <form
        className="mt-6 space-y-5 rounded-card border border-line bg-white p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void verify();
        }}
        noValidate
      >
        {error ? <Alert tone="danger">{error}</Alert> : null}

        <TextInput
          label="Verification code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          className="text-center text-xl tracking-[0.5em]"
          autoFocus
        />

        <Button type="submit" size="lg" fullWidth loading={loading} disabled={code.length !== 6}>
          Verify and continue
        </Button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => void resend()}
            disabled={resendIn > 0 || loading}
            className="font-semibold text-crimson disabled:text-muted"
          >
            {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
          </button>
          <Link href={pending.flow === 'login' ? '/login' : '/register'} className="text-muted underline">
            Change number
          </Link>
        </div>
      </form>
    </div>
  );
}
