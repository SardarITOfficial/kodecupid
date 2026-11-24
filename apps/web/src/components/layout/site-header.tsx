'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/logo';

// Placeholder hrefs — replace with real routes/anchors when they exist.
const NAV_LINKS = [
  { label: 'Product', href: '#' },
  { label: 'Subscriptions', href: '#' },
  { label: 'Safety', href: '#' },
  { label: 'Support', href: '#' },
  // { label: 'Download', href: '#' },
  { label: 'Gift Cards', href: '#' },
  // { label: 'Events', href: '#' },
];

function GlobeIcon() {
  return (
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
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" />
    </svg>
  );
}

/**
 * overlay = true: fixed, transparent with white text until the page scrolls
 * (use on pages that start with a dark hero). Otherwise a solid sticky header.
 */
export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

  const light = overlay && !scrolled && !open;
  const linkColor = light ? 'text-white hover:text-white/70' : 'text-navy hover:text-crimson';

  return (
    <>
      <header
        className={`${overlay ? 'fixed' : 'sticky'} inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
          light
            ? 'border-transparent bg-transparent'
            : 'border-line bg-white/95 shadow-sm backdrop-blur'
        }`}
      >
        <div className="mx-auto flex h-16 w-full max-w-350 items-center justify-between px-4 sm:px-6 lg:grid lg:h-20 lg:grid-cols-[1fr_auto_1fr] lg:px-8">
          {/* Left: logo */}
          <div className="flex items-center">
            <Logo tone={light ? 'light' : 'dark'} />
          </div>

          {/* Center: nav (desktop) */}
          <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex xl:gap-10">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`text-[15px] font-medium transition-colors ${linkColor}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: language + log in + menu button */}
          <div className="flex items-center justify-end gap-3 sm:gap-5">
            <button
              type="button"
              className={`hidden items-center gap-2 rounded-full px-2 py-1.5 text-[15px] font-semibold transition-colors sm:inline-flex ${linkColor}`}
            >
              <GlobeIcon />
              Language
            </button>

            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-full bg-crimson px-5 text-[15px] font-semibold text-white transition-colors hover:bg-crimson-dark sm:h-11 sm:px-6"
            >
              Log in
            </Link>

            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className={`grid size-10 place-items-center rounded-full transition-colors lg:hidden ${
                light ? 'text-white hover:bg-white/10' : 'text-navy hover:bg-alabaster'
              }`}
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
          </div>
        </div>
      </header>

      {/* Mobile menu: full width, full height under the header */}
      {open ? (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col overflow-y-auto bg-white lg:hidden"
        >
          <nav aria-label="Mobile" className="flex-1 px-4 pt-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between border-b border-line py-4 text-lg font-medium text-navy transition-colors active:text-crimson"
              >
                {link.label}
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="size-5 text-muted"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </Link>
            ))}
          </nav>

          <div className="space-y-3 border-t border-line bg-alabaster p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex h-12 w-full items-center justify-center rounded-full bg-crimson text-base font-semibold text-white hover:bg-crimson-dark"
            >
              Log in
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="flex h-12 w-full items-center justify-center rounded-full border border-line bg-white text-base font-semibold text-navy hover:border-navy/30"
            >
              Create account
            </Link>
            <button
              type="button"
              className="flex h-11 w-full items-center justify-center gap-2 text-sm font-semibold text-navy"
            >
              <GlobeIcon />
              Language
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}