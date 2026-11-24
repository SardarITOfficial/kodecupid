import Image from 'next/image';
import Link from 'next/link';

const CARDS = [
  {
    title: 'Date on your schedule',
    body: 'Whether you are new to dating or ready to try again, KodeCupid matches you with people who share your shifts, so plans actually happen.',
    cta: 'Find your person',
    href: '/register',
    card: 'bg-navy border-navy',
    titleColor: 'text-white',
    bodyColor: 'text-white/80',
    linkColor: 'text-white hover:text-gold',
  },
  {
    title: 'Privacy you control',
    body: 'Every profile field has its own switch. Hide your workplace, religion or area, and share only what feels right.',
    cta: 'Get started',
    href: '/register',
    card: 'bg-white border-line',
    titleColor: 'text-navy',
    bodyColor: 'text-charcoal',
    linkColor: 'text-crimson hover:text-crimson-dark',
  },
];

export function Spotlight() {
  return (
    <section className="bg-alabaster">
      <div className="mx-auto container space-y-6 px-4 py-10 sm:px-6 lg:py-16">
        {/* Banner */}
        <div className="rounded-3xl border border-line bg-white p-4 shadow-sm sm:p-6">
          <div className="grid items-center gap-6 md:grid-cols-2 md:gap-10">
            <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-navy/10 md:aspect-auto md:min-h-90">
              <Image
                src="/spotlight-dates.webp"
                alt=""
                fill
                sizes="(min-width: 768px) 520px, 100vw"
                className="object-cover"
              />
            </div>

            <div className="md:pr-6">
              <h2 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
                Help shape <span className="text-crimson">KodeCupid</span>
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-charcoal">
                Join our early member group and share ideas directly with our team through chats,
                discussions and product tests.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-charcoal">
                Members get early access to new features, sneak peeks at what is coming, and the
                chance to help make KodeCupid better for every shift worker.
              </p>
              <Link
                href="/register"
                className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-crimson px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-crimson-dark"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>

        {/* Promo cards: text only */}
        <div className="grid gap-6 md:grid-cols-2">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className={`rounded-2xl border p-6 shadow-sm sm:p-8 ${card.card}`}
            >
              <h3 className={`text-xl font-semibold ${card.titleColor}`}>{card.title}</h3>
              <p className={`mt-3 text-sm leading-relaxed ${card.bodyColor}`}>{card.body}</p>
              <Link
                href={card.href}
                className={`mt-6 inline-block text-sm font-semibold underline underline-offset-4 transition-colors ${card.linkColor}`}
              >
                {card.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}