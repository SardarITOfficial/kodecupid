import type { ReactNode } from 'react';

export function AdminAuthFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md">
      <span className="inline-flex rounded-full bg-navy px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white">
        Admin
      </span>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
      <div className="mt-6 rounded-card border border-line bg-white p-6 shadow-sm sm:p-8">
        {children}
      </div>
    </div>
  );
}