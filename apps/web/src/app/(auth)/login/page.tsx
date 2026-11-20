import Link from 'next/link';
import type { Metadata } from 'next';
import { PhoneAuthForm } from '@/components/auth/phone-auth-form';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <div className="pt-2">
      <h1 className="text-2xl font-semibold tracking-tight text-navy">Welcome back</h1>
      <p className="mt-2 text-sm text-muted">
        Sign in with the phone number you registered. We will text you a fresh code.
      </p>

      <div className="mt-6 rounded-card border border-line bg-white p-5">
        <PhoneAuthForm flow="login" />
      </div>

      <p className="mt-5 text-center text-sm text-muted">
        New to KodeCupid?{' '}
        <Link href="/register" className="font-semibold text-crimson hover:underline">
          Create an account
        </Link>
      </p>

      <p className="mt-6 text-center text-xs text-muted">
        Admin?{' '}
        <Link href="/admin/login" className="font-medium text-navy underline">
          Admin sign in
        </Link>
      </p>
    </div>
  );
}
