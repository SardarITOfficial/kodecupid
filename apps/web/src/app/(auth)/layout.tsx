import { Logo } from '@/components/brand/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-alabaster">
      <header className="mx-auto w-full max-w-md px-5 py-6">
        <Logo />
      </header>
      <main id="main" className="mx-auto w-full max-w-md flex-1 px-5 pb-10">
        {children}
      </main>
      <footer className="mx-auto w-full max-w-md px-5 pb-8 text-xs text-muted">
        <p>KodeCupid is for adults 18 and over. Your number is only used to verify your account.</p>
      </footer>
    </div>
  );
}
