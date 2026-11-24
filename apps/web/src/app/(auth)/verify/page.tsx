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
import { Alert, LoadingBlock } from '@/components/ui/feedback';
import { OtpInput } from '@/components/auth/otp-input';

function VerifyWrap({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="absolute left-1/2 top-0 -z-10 size-130 -translate-x-1/2 -translate-y-1/3 rounded-full bg-crimson/10 blur-3xl"
      />
      <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-20">
        <div className="rounded-3xl border border-line bg-white p-6 text-center shadow-xl shadow-navy/5 sm:p-10">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-crimson-soft text-crimson">
            {icon}
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
            {title}
          </h1>
          <div className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</div>
          <div className="mt-8 text-left">{children}</div>
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          Your number is only used to verify your account.
        </p>
      </div>
    </div>
  );
}

const PhoneIcon = (
  <svg
    aria-hidden
    viewBox="0 0 24 24"
    className="size-8"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
    <path d="M11 18.5h2" />
    <path d="m9.5 10.5 1.8 1.8 3.2-3.6" />
  </svg>
);

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
    return (
      <VerifyWrap icon={PhoneIcon} title="Checking your code" subtitle="One moment please.">
        <LoadingBlock label="Checking your code" rows={2} />
      </VerifyWrap>
    );
  }

  if (!pending) {
    return (
      <VerifyWrap
        icon={PhoneIcon}
        title="No code to check"
        subtitle="Start again and we will text you a new verification code."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-crimson px-5 text-sm font-semibold text-white transition-colors hover:bg-crimson-dark"
          >
            Register
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-line bg-white px-5 text-sm font-semibold text-navy transition-colors hover:border-navy/30"
          >
            Sign in
          </Link>
        </div>
      </VerifyWrap>
    );
  }

  return (
    <VerifyWrap
      icon={PhoneIcon}
      title="Enter your code"
      subtitle={
        <>
          We sent a 6-digit code to
          <span className="mt-2 block">
            <span className="inline-block rounded-full bg-alabaster px-3 py-1 font-semibold tracking-wide text-navy ring-1 ring-line">
              {maskedPhone}
            </span>
          </span>
        </>
      }
    >
      {pending.debugCode ? (
        <div className="mb-5">
          <Alert tone="warning" title="Test mode">
            SMS is not connected in this environment. Use the code{' '}
            <strong className="font-semibold">{pending.debugCode}</strong>.
          </Alert>
        </div>
      ) : null}

      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          void verify();
        }}
        noValidate
      >
        {error ? <Alert tone="danger">{error}</Alert> : null}

        <OtpInput value={code} onChange={setCode} disabled={loading} invalid={Boolean(error)} />

        <Button type="submit" size="lg" fullWidth loading={loading} disabled={code.length !== 6}>
          Verify and continue
        </Button>

        <div className="flex items-center justify-between border-t border-line pt-5 text-sm">
          <button
            type="button"
            onClick={() => void resend()}
            disabled={resendIn > 0 || loading}
            className="font-semibold text-crimson hover:underline disabled:text-muted disabled:no-underline"
          >
            {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
          </button>
          <Link
            href={pending.flow === 'login' ? '/login' : '/register'}
            className="text-muted underline hover:text-navy"
          >
            Change number
          </Link>
        </div>
      </form>
    </VerifyWrap>
  );
}