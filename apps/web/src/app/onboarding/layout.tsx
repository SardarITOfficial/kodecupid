import { Logo } from '@/components/brand/logo';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-alabaster">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-5 py-5">
        <Logo />
        <span className="text-xs font-medium uppercase tracking-wider text-muted">Setup</span>
      </header>
      <main id="main" className="mx-auto w-full max-w-md px-5 pb-12">
        {children}
      </main>
    </div>
  );
}
