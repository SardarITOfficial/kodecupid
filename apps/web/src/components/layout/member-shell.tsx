'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/app/providers';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';

const NAV = [
  { href: '/app', label: 'Home', tab: true, match: (p: string) => p === '/app', icon: 'M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z' },
  { href: '/discover', label: 'Discover', tab: true, match: (p: string) => p.startsWith('/discover'), icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm3.8 6.2-2 5.6-5.6 2 2-5.6 5.6-2Z' },
  { href: '/matches', label: 'Matches', tab: true, match: (p: string) => p.startsWith('/matches'), icon: 'M12 21s-8-4.9-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 6.1-8 11-8 11Z' },
  { href: '/messages', label: 'Messages', tab: true, match: (p: string) => p.startsWith('/messages'), icon: 'M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H8l-5 4V5a1 1 0 0 1 1-1Z' },
  { href: '/profile', label: 'Profile', tab: true, match: (p: string) => p === '/profile' || p.startsWith('/profile/edit'), icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 0 1 16 0Z' },
  { href: '/profile/privacy', label: 'Privacy', tab: false, match: (p: string) => p.startsWith('/profile/privacy'), icon: 'M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm0 6a2.5 2.5 0 0 1 1.2 4.7V15h-2.4v-2.3A2.5 2.5 0 0 1 12 8Z' },
  { href: '/settings', label: 'Settings', tab: false, match: (p: string) => p.startsWith('/settings'), icon: 'M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Zm8-4.2v1.4l2 1.6-2 3.4-2.4-.8a7.7 7.7 0 0 1-1.2.7l-.4 2.5h-4l-.4-2.5a7.7 7.7 0 0 1-1.2-.7L6 18l-2-3.4 2-1.6v-1.4l-2-1.6 2-3.4 2.4.8c.4-.3.8-.5 1.2-.7l.4-2.5h4l.4 2.5c.4.2.8.4 1.2.7l2.4-.8 2 3.4Z' },
];

export function MemberShell({ children }: { children: React.ReactNode }) {
  const { member, logout } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const displayName = member?.user.displayName ?? 'Your profile';

  async function signOut(): Promise<void> {
    await logout();
    router.replace('/login');
  }

  return (
    <div className="min-h-dvh bg-alabaster lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col justify-between bg-navy p-5 text-white lg:flex">
        <div>
          <div className="rounded-xl bg-white px-3 py-2">
            <Logo href="/app" size="sm" />
          </div>
          <nav aria-label="Main" className="mt-8 space-y-1">
            {NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                    active ? 'bg-crimson text-white' : 'text-white/75 hover:bg-white/10 hover:text-white',
                  ].join(' ')}
                >
                  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
                    <path d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <p className="truncate text-sm font-semibold">{displayName}</p>
          <p className="mt-0.5 truncate text-xs text-white/60">{member?.user.phone}</p>
          <button type="button" onClick={() => void signOut()} className="mt-3 text-xs font-semibold text-gold hover:underline">
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur lg:hidden">
          <div className="flex h-14 items-center justify-between px-4 sm:px-6">
            <Logo href="/app" size="sm" />
            <div className="flex items-center gap-1">
              <Link href="/settings" className="rounded-full px-3 py-2 text-sm font-medium text-charcoal hover:bg-alabaster">
                Settings
              </Link>
              <Button variant="ghost" size="sm" onClick={() => void signOut()}>
                Sign out
              </Button>
            </div>
          </div>
        </header>

        <main id="main" className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-10">
          {children}
        </main>
      </div>

      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        <ul className="mx-auto flex max-w-md">
          {NAV.filter((item) => item.tab).map((item) => {
            const active = item.match(pathname);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={['flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium', active ? 'text-crimson' : 'text-muted'].join(' ')}
                >
                  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
                    <path d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}