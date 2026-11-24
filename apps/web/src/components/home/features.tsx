import Image from 'next/image';

// Put your images in apps/web/public/ with these names (or change src).
// Sample quotes and names: replace with real member stories before launch.
const STORIES = [
  {
    src: '/story-1.webp',
    quote: 'We worked opposite shifts for years. KodeCupid was the first place that made that a feature, not a problem.',
    name: 'Ayesha and Rahim',
    photo: 'left-[46.5%] top-0 z-10',
    text: 'left-[68.9%] top-[11.7%]',
  },
  {
    src: '/story-2.webp',
    quote: 'I can now say, without reservation, that I have found a partner who understands my night shifts.',
    name: 'Nadia and Imran',
    photo: 'left-[33.3%] top-[34.2%] z-20',
    text: 'left-[10.9%] top-[47.5%]',
  },
  {
    src: '/story-3.webp',
    quote: 'Controlling what I shared made all the difference. I felt safe from the very first message.',
    name: 'Farhana and Tanvir',
    photo: 'left-[56%] top-[46.8%] z-30',
    text: 'left-[78.5%] top-[60%]',
  },
];

function QuoteMark({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none select-none font-(family-name:--font-fraunces) text-8xl font-black leading-none text-crimson/20 ${className}`}
    >
      &ldquo;
    </span>
  );
}

export function Features() {
  return (
    <section className="bg-alabaster">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        {/* Desktop: collage layout */}
        <div className="relative hidden aspect-[1290/711] w-full lg:block">
          <div className="absolute left-0 top-0 w-[30%]">
            <p className="text-lg font-semibold text-crimson">Real couples</p>
            <h2 className="mt-2 font-(family-name:--font-fraunces) text-5xl font-bold tracking-tight text-navy xl:text-6xl">
              Success stories
            </h2>
            <p className="mt-8 text-[15px] leading-relaxed text-charcoal">
              We believe in love that fits real life. KodeCupid matches you on the schedule you
              actually live, with verified adults and privacy controls you own, and we have the
              stories to prove it.
            </p>
          </div>

          {STORIES.map((story) => (
            <div
              key={story.name}
              className={`absolute aspect-[266/378] w-[20.6%] overflow-hidden rounded-2xl bg-navy/10 shadow-lg shadow-navy/15 ring-4 ring-white ${story.photo}`}
            >
              <Image
                src={story.src}
                alt={`${story.name}`}
                fill
                sizes="270px"
                className="object-cover"
              />
            </div>
          ))}

          {STORIES.map((story) => (
            <figure key={`${story.name}-quote`} className={`absolute w-[18%] ${story.text}`}>
              <QuoteMark className="absolute -left-6 -top-8 text-9xl" />
              <blockquote className="relative text-[13px] leading-relaxed text-charcoal xl:text-[15px]">
                &ldquo;{story.quote}&rdquo;
              </blockquote>
              <figcaption className="relative mt-4 text-sm font-bold text-navy">
                {story.name}
              </figcaption>
            </figure>
          ))}
        </div>

        {/* Mobile / tablet: simple stack */}
        <div className="lg:hidden">
          <p className="text-base font-semibold text-crimson">Real couples</p>
          <h2 className="mt-2 font-(family-name:--font-fraunces) text-4xl font-bold tracking-tight text-navy sm:text-5xl">
            Success stories
          </h2>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-charcoal">
            We believe in love that fits real life. KodeCupid matches you on the schedule you
            actually live, with verified adults and privacy controls you own, and we have the
            stories to prove it.
          </p>

          <div className="mt-10 grid gap-10 sm:grid-cols-2">
            {STORIES.map((story) => (
              <figure key={story.name}>
                <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-navy/10 shadow-lg shadow-navy/15 ring-4 ring-white">
                  <Image
                    src={story.src}
                    alt={`${story.name}`}
                    fill
                    sizes="(min-width: 640px) 45vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="relative mt-5">
                  <QuoteMark className="absolute -left-1 -top-6 text-7xl" />
                  <blockquote className="relative text-sm leading-relaxed text-charcoal">
                    &ldquo;{story.quote}&rdquo;
                  </blockquote>
                  <figcaption className="relative mt-3 text-sm font-bold text-navy">
                    {story.name}
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}