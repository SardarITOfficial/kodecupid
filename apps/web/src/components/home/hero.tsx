import Image from 'next/image';

export function Hero() {
  return (
    <section className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-black">
      {/* Background image: put your file at apps/web/public/hero.jpg */}
      <Image src="/hero.jpg" alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
      {/* Black overlay */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-40 bg-linear-to-b from-black/50 to-transparent"
      />

      {/* Title, bottom-left */}
      <div className="mx-auto flex w-full max-w-350 flex-1 flex-col items-start justify-end px-4 pb-6 pt-16 text-left sm:px-6 lg:px-8">
        <h1 className="relative max-w-5xl font-(family-name:--font-fraunces) text-3xl font-medium leading-[1.02] tracking-tight text-white sm:text-7xl lg:text-8xl xl:text-[6.5rem]">
          It starts with a shift.
          {/* <span className="absolute -right-2 top-0 font-(family-name:--font-fraunces) text-xs font-bold tracking-normal sm:-right-6 sm:text-sm lg:-right-8">
            TM
          </span> */}
        </h1>
      </div>

      {/* Bottom tagline */}
      <div className="px-4 pb-6 text-center text-sm text-white/80">
        <p>Someone on KodeCupid might give you butterflies.</p>
        <a href="#about" className="mt-0.5 inline-block font-medium text-white hover:text-crimson">
          Find out who ↓
        </a>
      </div>

      {/* Disclaimer */}
      {/* <p className="px-4 pb-3 text-center text-[11px] text-white/60 sm:absolute sm:bottom-3 sm:right-5 sm:p-0 sm:text-right">
        All photos are of models and used for illustrative purposes only
      </p> */}
    </section>
  );
}
