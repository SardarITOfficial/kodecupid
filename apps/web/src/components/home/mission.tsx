import Image from 'next/image';
import Link from 'next/link';
const CARDS = [
  {
    src: '/card1.webp',
    label: 'Night shift',
    wrapper: 'left-0 z-30 h-full w-[63%]',
    pill: 'right-3 top-3 w-10 py-4 text-lg sm:right-4 sm:top-4 sm:w-14 sm:py-5 sm:text-3xl',
  },
  {
    src: '/card2.webp',
    label: 'Day shift',
    wrapper: 'left-[50%] z-20 top-[7.5%] h-[85%] w-[31%]',
    pill: 'right-2 top-3 w-7 py-3 text-xs sm:w-9 sm:py-4 sm:text-xl',
  },
  {
    src: '/card3.webp',
    label: 'Rotating',
    wrapper: 'left-[66%] z-10 top-[15%] h-[70%] w-[34%]',
    pill: 'right-2 top-3 w-6 py-2 text-[10px] sm:w-8 sm:py-3 sm:text-sm',
  },
];

export function Mission() {
  return (
    <section className="bg-alabaster">
      <div className="mx-auto grid container items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div>
          <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight text-navy sm:text-5xl lg:text-6xl">
            We exist to bring shift workers{' '}
            <span className="text-crimson">closer to love.</span>
          </h2>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-charcoal">
            We want our members to find meaningful and authentic relationships that ignite
            confidence and joy.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-2xl bg-crimson px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-crimson-dark"
          >
            Sign up
          </Link>
        </div>

        <div className="relative mx-auto h-80 w-full max-w-xl sm:h-115">
          {CARDS.map((card) => (
            <div
              key={card.label}
              className={`absolute overflow-hidden rounded-3xl bg-navy/10 shadow-sm ring-1 ring-line ${card.wrapper}`}
            >
              <Image
                src={card.src}
                alt=""
                fill
                sizes="(min-width: 1024px) 400px, 70vw"
                className="object-cover"
              />
              {/* <span
                className={`absolute flex items-start justify-center rounded-full bg-white font-medium text-navy ring-1 ring-crimson/30 [writing-mode:vertical-rl] ${card.pill}`}
              >
                {card.label}
              </span> */}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}