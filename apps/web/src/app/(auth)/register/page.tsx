import Link from 'next/link';
import type { Metadata } from 'next';
import { PhoneAuthForm } from '@/components/auth/phone-auth-form';
import { AuthShell } from '@/components/auth/auth-shell';

export const metadata: Metadata = { title: 'Create your account' };

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="One phone number, one code, then a short guided setup. It takes about two minutes."
      footer={
        <>
          Already a member?{' '}
          <Link href="/login" className="font-semibold text-crimson hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <PhoneAuthForm flow="register" />
    </AuthShell>
  );
}