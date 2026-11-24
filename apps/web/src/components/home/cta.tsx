import Link from 'next/link';

export function Cta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="rounded-card bg-crimson px-6 py-10 text-center text-white sm:px-12">
        <h2 className="text-2xl font-semibold sm:text-3xl">Your next date should not need a shift swap.</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/85">
          Join in under two minutes with your phone number. No social media required, no photos
          public until you choose.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-base font-semibold text-crimson hover:bg-alabaster"
          >
            Get started
          </Link>
        </div>
      </div>
    </section>
  );
}