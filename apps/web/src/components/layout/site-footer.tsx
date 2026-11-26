import Image from 'next/image';
import Link from 'next/link';

// Placeholder hrefs — replace with real routes when they exist.
const COLUMNS = [
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
      { label: 'Cookie Policy', href: '#' },
      { label: 'Community Guidelines', href: '#' },
      { label: 'Safety Information', href: '#' },
      { label: 'Accessibility Statement', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'FAQ', href: '#' },
      { label: 'Press Room', href: '#' },
      { label: 'Contact', href: '#' },
      { label: 'Support', href: '#' },
      { label: 'Gift Cards', href: '#' },
    ],
  },
  {
    title: 'Careers',
    links: [
      { label: 'Careers Portal', href: '#' },
      { label: 'Blog', href: '#' },
    ],
  },
  {
    title: 'Socials',
    links: [
      { label: 'Instagram', href: '#' },
      { label: 'TikTok', href: '#' },
      { label: 'YouTube', href: '#' },
      { label: 'X', href: '#' },
      { label: 'Facebook', href: '#' },
    ],
  },
  {
    title: 'Get the app!',
    links: [
      { label: 'App Store', href: '#' },
      { label: 'Google Play Store', href: '#' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative isolate overflow-hidden bg-crimson-dark text-white">
      {/* Same deep maroon as the Intro section */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-b from-black/45 to-black/65" />

      <div className="mx-auto container px-4 pt-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_repeat(5,1fr)] lg:gap-8">
          {/* Brand + blurb + language */}
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/icon-192.png"
                alt=""
                width={32}
                height={32}
                className="size-8 rounded-lg object-cover"
              />
              <p className="text-sm text-white/90">© {new Date().getFullYear()} KodeCupid</p>
            </div>

            <p className="mt-6 max-w-xs text-[13px] leading-relaxed text-white/80">
              KodeCupid is where connections fit your schedule. Whether you work days, nights or
              rotating shifts, we match you with verified adults who understand your hours, with
              privacy controls for everything personal.
            </p>
{/* 
            <button
              type="button"
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-black/40 px-5 text-sm font-semibold text-white transition-colors hover:bg-black/60"
            >
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
              English
            </button> */}
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-sm font-bold text-white">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-white/85 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="mt-12 text-xs text-white/50">
          Adults only (18+). Milestone 1 preview build.
        </p>
      </div>

      {/* Giant wordmark, stretched edge to edge */}
      {/* <div className="mt-6 px-2 sm:px-4" aria-hidden>
        <svg viewBox="0 0 1000 190" className="block h-auto w-full text-crimson" role="img">
          <text
            x="0"
            y="178"
            fill="currentColor"
            fontSize="230"
            fontWeight="900"
            fontFamily="ui-sans-serif, system-ui, 'Helvetica Neue', Arial, sans-serif"
            textLength="1000"
            lengthAdjust="spacingAndGlyphs"
          >
            KODECUPID
          </text>
        </svg>
      </div> */}
    </footer>
  );
}