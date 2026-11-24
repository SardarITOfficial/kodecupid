import type { ReactNode } from 'react';

const POINTS = [
  'Match on day, night and rotating shifts',
  'Hide any profile field with its own switch',
  'Phone verified, 18+ members only',
];

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-12 lg:py-16">
      {/* Brand panel (desktop only) */}
      <aside className="relative hidden overflow-hidden rounded-3xl bg-navy p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="absolute -right-20 -top-20 size-72 rounded-full bg-crimson/30 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            For shift workers
          </p>
          <h2 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight">
            Dating that fits <span className="text-crimson">your hours.</span>
          </h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-white/80">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-gold text-[11px] font-bold text-navy">
                  ✓
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative mt-10 text-xs text-white/60">
          KodeCupid is for adults 18 and over. Your number is only used to verify your account.
        </p>
      </aside>

      {/* Form card */}
      <div className="flex items-center justify-center">
        <div className="w-full max-w-md rounded-card border border-line bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-navy">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>

          <div className="mt-6">{children}</div>

          {footer ? (
            <div className="mt-6 border-t border-line pt-5 text-center text-sm text-muted">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}