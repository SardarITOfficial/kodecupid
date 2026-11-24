import Image from 'next/image';
import Link from 'next/link';

function PairIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 48 48"
      className="size-12 text-crimson sm:size-14"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="29" cy="19" r="12" />
      <path d="M24 17v1.5M33 17v1.5M25 23c1.2 1.6 2.6 2.4 4 2.4s2.8-.8 4-2.4" />
      <circle cx="19" cy="29" r="12" className="fill-crimson-dark" />
      <path d="M14 27v1.5M23 27v1.5M15 33c1.2 1.6 2.6 2.4 4 2.4s2.8-.8 4-2.4" />
    </svg>
  );
}

export function Intro() {
  return (
    <section id="about" className="relative isolate scroll-mt-4 overflow-hidden bg-crimson-dark">
      {/* Darken to a deep maroon */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-b from-black/45 to-black/65" />

      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-28">
        <div className="flex justify-center">
          <PairIcon />
        </div>

        <h2 className="mt-5 font-(family-name:--font-fraunces) text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Dating that fits <em className="italic">your hours.</em>
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
          Nurses, doctors, paramedics and everyone who works while the world sleeps.{' '}
          <strong className="font-semibold text-white">KodeCupid</strong> matches you on the
          schedule you actually live, with privacy controls for everything personal.
        </p>

        {/* Single collage image: save it as apps/web/public/party-collage.png */}
        <div className="mx-auto mt-14 w-full max-w-2xl">
          <Image
            src="/party-collage.webp"
            alt="Four friends laughing together"
            width={1180}
            height={745}
            sizes="(min-width: 768px) 672px, 100vw"
            className="h-auto w-full"
          />
        </div>

        {/* Buttons */}
        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-base font-semibold text-crimson shadow-lg transition-colors hover:bg-alabaster"
          >
            Create your profile
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/30 px-7 text-base font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/10"
          >
            I already have an account
          </Link>
        </div>

        <p className="mt-6 text-xs text-white/60">
          18+ only · Phone verified · Community guidelines enforced
        </p>
      </div>
    </section>
  );
}