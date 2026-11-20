import Link from 'next/link';

export function Logo({ href = '/', size = 'md' }: { href?: string | null; size?: 'sm' | 'md' }) {
  const mark = size === 'sm' ? 'size-8' : 'size-10';
  const text = size === 'sm' ? 'text-lg' : 'text-xl';

  const content = (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden
        className={`${mark} grid place-items-center rounded-2xl bg-crimson text-white shadow-sm`}
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
          <path d="M12 21s-7.5-4.7-9.4-9.2C1.2 8.2 3.3 4.8 6.7 4.1c2-.4 3.9.5 5.3 2.2 1.4-1.7 3.3-2.6 5.3-2.2 3.4.7 5.5 4.1 4.1 7.7C19.5 16.3 12 21 12 21Z" />
        </svg>
      </span>
      <span className={`${text} font-semibold tracking-tight text-navy`}>
        Kode<span className="text-crimson">Cupid</span>
      </span>
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} className="inline-flex rounded-xl" aria-label="KodeCupid home">
      {content}
    </Link>
  );
}
