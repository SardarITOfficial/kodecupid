import Link from 'next/link';
import type { Metadata } from 'next';
import { PhoneAuthForm } from '@/components/auth/phone-auth-form';

export const metadata: Metadata = { title: 'Create your account' };

export default function RegisterPage() {
  return (
    <div className="pt-2">
      <h1 className="text-2xl font-semibold tracking-tight text-navy">Create your account</h1>
      <p className="mt-2 text-sm text-muted">
        One phone number, one code, then a short guided setup. It takes about two minutes.
      </p>

      <div className="mt-6 rounded-card border border-line bg-white p-5">
        <PhoneAuthForm flow="register" />
      </div>

      <p className="mt-5 text-center text-sm text-muted">
        Already a member?{' '}
        <Link href="/login" className="font-semibold text-crimson hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
