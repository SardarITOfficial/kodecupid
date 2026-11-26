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
  const currentTitle = items.find((item) => isActive(item.href))?.label ?? 'Dashboard';

  /* Shared by the desktop sidebar and the mobile drawer. */
  const sidebarContent = (
    <>
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-5">
        <Logo href="/admin/users" size="sm" tone="light" />
        <span className="rounded-full bg-crimson px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
          Admin
        </span>
      </div>

      <nav aria-label="Admin sections" className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
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
                    active
                      ? 'bg-crimson text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  {item.milestone === 2 ? (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                        active ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
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

      <div className="shrink-0 space-y-3 border-t border-white/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Link
          href="/"
          className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <span>Member site</span>
          <span aria-hidden>↗</span>
        </Link>
        <div className="rounded-xl bg-white/5 p-3">
          <p className="truncate text-xs text-white/70">{admin.admin.email}</p>
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-gold">
            {ADMIN_ROLE_LABELS[role]}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex h-10 w-full items-center justify-center rounded-full border border-white/25 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-alabaster">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-navy text-white lg:flex">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-navy/60"
          />
          <aside
            id="admin-mobile-menu"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-navy text-white shadow-xl"
          >
            {sidebarContent}
          </aside>
        </div>
      ) : null}

      {/* Right side: header + scrolling content + footer */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="z-30 shrink-0 border-b border-line bg-white">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open}
                aria-controls="admin-mobile-menu"
                className="grid size-10 shrink-0 place-items-center rounded-full text-navy hover:bg-alabaster lg:hidden"
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
              <h2 className="truncate text-base font-semibold text-navy sm:text-lg">
                {currentTitle}
              </h2>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden max-w-56 truncate text-sm text-muted md:inline">
                {admin.admin.email}
              </span>
              <Badge tone="gold">{ADMIN_ROLE_LABELS[role]}</Badge>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col overflow-y-auto">
          <main
            id="main"
            className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
          >
            {children}
          </main>

          <footer className="shrink-0 border-t border-line bg-white">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <p>© {new Date().getFullYear()} KodeCupid · Admin console</p>
              <div className="flex items-center gap-5">
                <Link href="/admin/audit" className="hover:text-navy">
                  Activity log
                </Link>
                <span>Staff use only</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
