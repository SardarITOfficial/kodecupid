'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ADMIN_NAV, ADMIN_ROLE_LABELS, can, type AdminRole } from '@kodecupid/shared';
import { useSession } from '@/app/providers';
import { Logo } from '@/components/brand/logo';
import { Badge, LoadingBlock } from '@/components/ui/feedback';

/**
 * Navigation is derived from the same permission matrix the API enforces, so a
 * Moderator simply never receives links they would be refused on.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { admin, adminLogout, loading } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => {
      if (mq.matches) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    mq.addEventListener('change', onChange);
    window.addEventListener('keydown', onKey);
    return () => {
      mq.removeEventListener('change', onChange);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  if (loading && !admin) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <LoadingBlock label="Loading admin area" rows={4} />
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="mx-auto max-w-md p-6">
        <LoadingBlock label="Redirecting to sign in" rows={1} />
      </div>
    );
  }

  const role = admin.admin.role as AdminRole;
  const items = ADMIN_NAV.filter((item) => can(role, item.permission));

  async function signOut(): Promise<void> {
    await adminLogout();
    router.replace('/admin/login');
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex min-h-dvh flex-col bg-alabaster">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-navy text-white shadow-sm">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="admin-mobile-menu"
              className="grid size-10 place-items-center rounded-full text-white hover:bg-white/10 lg:hidden"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
            <Logo href="/admin/users" size="sm" tone="light" />
            <span className="rounded-full bg-crimson px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden max-w-56 truncate text-sm text-white/70 md:inline">
              {admin.admin.email}
            </span>
            <Badge tone="gold">{ADMIN_ROLE_LABELS[role]}</Badge>
            <button
              type="button"
              onClick={() => void signOut()}
              className="hidden h-9 items-center rounded-full border border-white/25 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:inline-flex"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu: full width under the header */}
      {open ? (
        <div
          id="admin-mobile-menu"
          className="fixed inset-x-0 bottom-0 top-16 z-30 flex flex-col overflow-y-auto bg-white lg:hidden"
        >
          <nav aria-label="Admin sections" className="flex-1 px-4 pt-2">
            {items.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={`flex items-center justify-between border-b border-line py-4 text-lg font-medium ${
                  isActive(item.href) ? 'text-crimson' : 'text-navy'
                }`}
              >
                <span>{item.label}</span>
                {item.milestone === 2 ? (
                  <span className="rounded-full bg-alabaster px-2 py-0.5 text-[10px] font-semibold uppercase text-muted">
                    M2
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>
          <div className="space-y-3 border-t border-line bg-alabaster p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <p className="truncate text-center text-xs text-muted">{admin.admin.email}</p>
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex h-12 w-full items-center justify-center rounded-full bg-crimson text-base font-semibold text-white hover:bg-crimson-dark"
            >
              Sign out
            </button>
          </div>
        </div>
      ) : null}

      {/* Body */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6 lg:flex-row lg:px-8 lg:py-10">
        <aside className="hidden lg:block lg:w-64 lg:shrink-0">
          <nav
            aria-label="Admin sections"
            className="sticky top-24 rounded-2xl border border-line bg-white p-3 shadow-sm"
          >
            <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
              Sections
            </p>
            <ul className="space-y-1">
              {items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        active ? 'bg-navy text-white' : 'text-charcoal hover:bg-alabaster'
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      {item.milestone === 2 ? (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                            active ? 'bg-white/15 text-white' : 'bg-alabaster text-muted'
                          }`}
                        >
                          M2
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} KodeCupid · Admin console</p>
          <div className="flex items-center gap-5">
            <Link href="/" className="hover:text-navy">
              Member site
            </Link>
            <Link href="/admin/audit" className="hover:text-navy">
              Activity log
            </Link>
            <span>Staff use only</span>
          </div>
        </div>
      </footer>
    </div>
  );
}