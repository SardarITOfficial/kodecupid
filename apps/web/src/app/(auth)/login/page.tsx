import Link from 'next/link';
import type { Metadata } from 'next';
import { PhoneAuthForm } from '@/components/auth/phone-auth-form';
import { AuthShell } from '@/components/auth/auth-shell';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in with the phone number you registered. We will text you a fresh code."
      footer={
        <>
          <p>
            New to KodeCupid?{' '}
            <Link href="/register" className="font-semibold text-crimson hover:underline">
              Create an account
            </Link>
          </p>
          <p className="mt-3 text-xs">
            Admin?{' '}
            <Link href="/admin/login" className="font-medium text-navy underline">
              Admin sign in
            </Link>
          </p>
        </>
      }
    >
      <PhoneAuthForm flow="login" />
    </AuthShell>
  );
}