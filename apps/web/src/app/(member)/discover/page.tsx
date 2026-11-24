'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { MEMBERS, type DatingMember, type ShiftKind } from '@/lib/mock-dating';
import { MemberAvatar, toneFor } from '@/components/dating/member-avatar';
import { CompatRing } from '@/components/dating/compat-ring';

const FILTERS: ('All' | ShiftKind)[] = ['All', 'Day shift', 'Night shift', 'Rotating'];

type Dir = 'left' | 'right' | 'up';

const THRESHOLD = 110; // px dragged before a release counts as a decision
const FLY_MS = 380;

function ProfileCard({ member, children }: { member: DatingMember; children?: React.ReactNode }) {
  return (
    <div
      className={`relative h-128 w-full overflow-hidden rounded-[2rem] bg-linear-to-br ${toneFor(member.id)} shadow-2xl shadow-navy/15 ring-1 ring-line sm:h-144`}
    >
      {member.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.photoUrl}
          alt={`${member.name}, ${member.age}`}
          draggable={false}
          className="pointer-events-none absolute inset-0 size-full select-none object-cover"
        />
      ) : null}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-72 bg-linear-to-t from-black/80 via-black/40 to-transparent" />

      <div className="absolute inset-x-5 top-5 flex items-start justify-between">
        <span className="rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-crimson shadow">
          {member.compatibility}% match
        </span>
        {member.verified ? (
          <span className="rounded-full bg-gold px-3.5 py-1.5 text-xs font-semibold text-navy shadow">✓ Verified</span>
        ) : null}
      </div>

      <div className="absolute inset-x-6 bottom-6 text-white">
        <h2 className="text-4xl font-semibold tracking-tight">
          {member.name}
          <span className="ml-2 font-normal text-white/80">{member.age}</span>
        </h2>
        <p className="mt-1 text-sm text-white/85">
          {member.profession} · {member.city}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white/20 px-3 py-1 font-semibold backdrop-blur">{member.shift}</span>
          <span className="rounded-full bg-crimson px-3 py-1 font-semibold">{member.sharedHours}</span>
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-white/85">{member.bio}</p>
      </div>

      {children}
    </div>
  );
}

export default function DiscoverPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [done, setDone] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [matched, setMatched] = useState<DatingMember | null>(null);

  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exit, setExit] = useState<Dir | null>(null);
  const startX = useRef(0);
  const last = useRef({ x: 0, t: 0, v: 0 });

  const queue = useMemo(
    () => MEMBERS.filter((m) => !done.includes(m.id) && (filter === 'All' || m.shift === filter)),
    [done, filter],
  );
  const current = queue[0];
  const next = queue[1];
  const savedMembers = MEMBERS.filter((m) => saved.includes(m.id));

  const fling = useCallback(
    (dir: Dir) => {
      if (!current || exit || matched) return;
      const member = current;
      setDragging(false);
      setExit(dir);
      window.setTimeout(() => {
        setDone((d) => [...d, member.id]);
        if (dir === 'up') setSaved((s) => [...s, member.id]);
        if (dir === 'right' && member.likesYou) setMatched(member);
        setExit(null);
        setDragX(0);
      }, FLY_MS);
    },
    [current, exit, matched],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent): void {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (event.key === 'ArrowLeft') fling('left');
      if (event.key === 'ArrowRight') fling('right');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fling]);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>): void {
    if (exit) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    startX.current = event.clientX;
    last.current = { x: event.clientX, t: performance.now(), v: 0 };
    setDragging(true);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>): void {
    if (!dragging) return;
    const now = performance.now();
    const dt = now - last.current.t;
    if (dt > 0) last.current.v = (event.clientX - last.current.x) / dt;
    last.current.x = event.clientX;
    last.current.t = now;
    setDragX(event.clientX - startX.current);
  }

  function onPointerUp(): void {
    if (!dragging) return;
    const v = last.current.v;
    if (dragX > THRESHOLD || (dragX > 30 && v > 0.6)) {
      fling('right');
    } else if (dragX < -THRESHOLD || (dragX < -30 && v < -0.6)) {
      fling('left');
    } else {
      setDragging(false);
      setDragX(0);
    }
  }

  function onPointerCancel(): void {
    setDragging(false);
    setDragX(0);
  }

  // Top card motion
  const flyX = exit === 'left' || exit === 'right' ? (typeof window !== 'undefined' ? window.innerWidth : 1000) : 0;
  const tx = exit === 'left' ? -flyX : exit === 'right' ? flyX : exit === 'up' ? 0 : dragX;
  const ty = exit === 'up' ? -900 : exit ? 60 : Math.abs(dragX) * 0.08;
  const rot = exit === 'left' ? -24 : exit === 'right' ? 24 : exit === 'up' ? 0 : dragX / 16;
  const likeOpacity = exit === 'right' ? 1 : Math.min(1, Math.max(0, dragX / 90));
  const nopeOpacity = exit === 'left' ? 1 : Math.min(1, Math.max(0, -dragX / 90));
  const saveOpacity = exit === 'up' ? 1 : 0;

  // Card behind grows as the top card leaves
  const progress = exit ? 1 : Math.min(1, Math.abs(dragX) / 140);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-crimson">Discover</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">People who fit your hours</h1>
          <p className="mt-2 text-sm text-muted">
            {queue.length} {queue.length === 1 ? 'person' : 'people'} waiting for you today.
          </p>
        </div>
        <div className="inline-flex flex-wrap gap-1 rounded-full border border-line bg-white p-1 shadow-sm">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                filter === item ? 'bg-navy text-white shadow' : 'text-charcoal hover:bg-alabaster'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,28rem)_1fr] lg:items-start lg:justify-center">
        {/* Deck */}
        <div>
          {current ? (
            <>
              <div className="relative mx-auto mb-8 w-full max-w-md">
                {next ? (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                      transform: `scale(${0.94 + 0.06 * progress}) translateY(${(1 - progress) * 18}px)`,
                      transition: dragging ? 'none' : `transform ${FLY_MS}ms ease-out`,
                    }}
                  >
                    <ProfileCard member={next} />
                  </div>
                ) : null}

                <div
                  key={current.id}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerCancel}
                  className="relative cursor-grab touch-pan-y select-none active:cursor-grabbing"
                  style={{
                    transform: `translate3d(${tx}px, ${ty}px, 0) rotate(${rot}deg)`,
                    transformOrigin: '50% 90%',
                    opacity: exit ? 0 : 1,
                    willChange: 'transform',
                    transition: dragging
                      ? 'none'
                      : exit
                        ? `transform ${FLY_MS}ms cubic-bezier(0.3, 0.1, 0.6, 1), opacity ${FLY_MS}ms ease-in`
                        : 'transform 450ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  <ProfileCard member={current}>
                    <span
                      aria-hidden
                      className="absolute left-6 top-16 -rotate-12 rounded-xl border-4 border-crimson bg-white/90 px-4 py-1 text-3xl font-black tracking-widest text-crimson"
                      style={{ opacity: likeOpacity }}
                    >
                      LIKE
                    </span>
                    <span
                      aria-hidden
                      className="absolute right-6 top-16 rotate-12 rounded-xl border-4 border-navy bg-white/90 px-4 py-1 text-3xl font-black tracking-widest text-navy"
                      style={{ opacity: nopeOpacity }}
                    >
                      NOPE
                    </span>
                    <span
                      aria-hidden
                      className="absolute left-1/2 top-1/3 -translate-x-1/2 rounded-xl border-4 border-gold bg-gold px-4 py-1 text-3xl font-black tracking-widest text-navy"
                      style={{ opacity: saveOpacity }}
                    >
                      SAVED
                    </span>
                  </ProfileCard>
                </div>
              </div>

              <div className="flex items-center justify-center gap-5">
                <button
                  type="button"
                  onClick={() => fling('left')}
                  aria-label="Pass"
                  className="grid size-16 place-items-center rounded-full border border-line bg-white text-2xl text-muted shadow-lg shadow-navy/10 transition hover:-translate-y-0.5 hover:border-navy/40 hover:text-navy active:scale-95"
                >
                  ✕
                </button>
                <button
                  type="button"
                  onClick={() => fling('up')}
                  aria-label="Save for later"
                  className="grid size-12 place-items-center rounded-full border border-line bg-white text-lg text-gold shadow-md shadow-navy/10 transition hover:-translate-y-0.5 hover:border-gold active:scale-95"
                >
                  ★
                </button>
                <button
                  type="button"
                  onClick={() => fling('right')}
                  aria-label="Like"
                  className="grid size-20 place-items-center rounded-full bg-crimson text-3xl text-white shadow-xl shadow-crimson/30 transition hover:-translate-y-0.5 hover:bg-crimson-dark active:scale-95"
                >
                  ♥
                </button>
              </div>
              <p className="mt-5 text-center text-xs text-muted">
                Drag the card, or press <kbd className="rounded border border-line bg-white px-1.5 py-0.5">←</kbd> to pass and{' '}
                <kbd className="rounded border border-line bg-white px-1.5 py-0.5">→</kbd> to like.
              </p>
            </>
          ) : (
            <div className="rounded-[2rem] border border-line bg-white p-12 text-center shadow-sm">
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-crimson-soft text-2xl text-crimson">♥</div>
              <h2 className="mt-5 text-2xl font-semibold text-navy">You are all caught up</h2>
              <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
                New people appear as members join. Check back after your next shift.
              </p>
              <button
                type="button"
                onClick={() => setDone([])}
                className="mt-6 rounded-full bg-crimson px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-crimson/20 hover:bg-crimson-dark"
              >
                Start over
              </button>
            </div>
          )}
        </div>

        {/* Side panel */}
        <aside className="space-y-5">
          {current ? (
            <section className="rounded-3xl border border-line bg-white p-6 shadow-sm">
              <div className="flex items-center gap-5">
                <CompatRing value={current.compatibility} />
                <div>
                  <h2 className="text-lg font-semibold text-navy">Why you match with {current.name}</h2>
                  <p className="mt-1 text-sm text-muted">Based on shifts, city and what you both enjoy.</p>
                </div>
              </div>
              <ul className="mt-5 space-y-3 text-sm text-charcoal">
                {[
                  current.sharedHours,
                  `Both based near ${current.city}`,
                  `Enjoys ${current.interests.join(', ')}`,
                  current.verified ? 'Phone and profession verified' : 'Phone verified',
                ].map((line) => (
                  <li key={line} className="flex gap-3">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-crimson-soft text-[11px] font-bold text-crimson">
                      ✓
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-3xl border border-line bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-navy">Saved for later</h2>
            {savedMembers.length ? (
              <ul className="mt-4 space-y-3">
                {savedMembers.map((m) => (
                  <li key={m.id} className="flex items-center gap-3">
                    <MemberAvatar member={m} className="size-10 text-sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-navy">{m.name}, {m.age}</p>
                      <p className="truncate text-xs text-muted">{m.profession}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">Tap the star on a profile to keep it here.</p>
            )}
          </section>
        </aside>
      </div>

      {matched ? (
        <div role="dialog" aria-modal="true" aria-label="New match" className="fixed inset-0 z-50 grid place-items-center bg-navy/85 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-sm overflow-hidden rounded-[2rem] bg-white p-8 text-center shadow-2xl">
            <div aria-hidden className="absolute -top-16 left-1/2 size-56 -translate-x-1/2 rounded-full bg-crimson/15 blur-3xl" />
            <p className="relative text-xs font-semibold uppercase tracking-[0.25em] text-crimson">It is a match</p>
            <h2 className="relative mt-2 text-3xl font-semibold tracking-tight text-navy">You and {matched.name}</h2>
            <p className="relative mt-2 text-sm text-muted">{matched.sharedHours}</p>
            <div className="relative my-8 flex items-center justify-center">
              <div className="grid size-20 place-items-center rounded-full bg-navy text-lg font-semibold text-white ring-4 ring-white">You</div>
              <MemberAvatar member={matched} className="-ml-4 size-20 text-3xl ring-4 ring-white" />
            </div>
            <div className="relative flex flex-col gap-2">
              <Link
                href={`/messages?with=${matched.id}`}
                className="rounded-full bg-crimson px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-crimson/20 hover:bg-crimson-dark"
              >
                Message {matched.name}
              </Link>
              <button type="button" onClick={() => setMatched(null)} className="rounded-full border border-line px-6 py-3.5 text-sm font-semibold text-navy hover:bg-alabaster">
                Keep exploring
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}