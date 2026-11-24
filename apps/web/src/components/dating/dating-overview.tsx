import Link from 'next/link';
import { CONVERSATIONS, MATCH_IDS, MEMBERS, memberById } from '@/lib/mock-dating';
import { MemberAvatar } from './member-avatar';

export function DatingOverview() {
  const picks = MEMBERS.filter((m) => !MATCH_IDS.includes(m.id)).slice(0, 3);
  const matches = MATCH_IDS.map(memberById).filter((m) => m !== undefined);
  const likes = MEMBERS.filter((m) => m.likesYou && !MATCH_IDS.includes(m.id));

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-navy p-5 text-white sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Today</p>
            <h2 className="mt-1 text-xl font-semibold sm:text-2xl">{picks.length} people fit your shifts</h2>
            <p className="mt-1 text-sm text-white/70">{likes.length} already liked you.</p>
          </div>
          <Link href="/discover" className="inline-flex h-12 w-full items-center justify-center rounded-full bg-crimson px-7 text-sm font-semibold text-white hover:bg-crimson-dark sm:w-auto">
            Start discovering
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-navy">Top picks for you</h2>
          <Link href="/discover" className="text-sm font-semibold text-crimson hover:underline">See all</Link>
        </div>
        <ul className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {picks.map((m) => (
            <li key={m.id} className="min-w-0">
              <Link href="/discover" className="block rounded-2xl border border-line bg-white p-4 shadow-sm transition-colors hover:border-crimson/30">
                <div className="flex items-center gap-3">
                  <MemberAvatar member={m} className="size-12 text-lg" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy">{m.name}, {m.age}</p>
                    <p className="truncate text-xs text-muted">{m.profession}</p>
                  </div>
                </div>
                <p className="mt-3 truncate text-xs font-semibold text-crimson">{m.compatibility}% match · {m.shift}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="min-w-0 rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-navy">New matches</h2>
            <Link href="/matches" className="text-sm font-semibold text-crimson hover:underline">View</Link>
          </div>
          <ul className="flex gap-4 overflow-x-auto pb-1">
            {matches.map((m) => (
              <li key={m.id} className="shrink-0 text-center">
                <Link href={`/messages?with=${m.id}`} aria-label={`Message ${m.name}`}>
                  <MemberAvatar member={m} className="mx-auto size-14 text-xl ring-2 ring-crimson" />
                  <p className="mt-1 text-xs font-medium text-navy">{m.name}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="min-w-0 rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-navy">Recent messages</h2>
            <Link href="/messages" className="text-sm font-semibold text-crimson hover:underline">Open</Link>
          </div>
          <ul className="space-y-1">
            {MATCH_IDS.map((id) => {
              const m = memberById(id);
              const last = CONVERSATIONS[id]?.at(-1);
              if (!m) return null;
              return (
                <li key={id}>
                  <Link href={`/messages?with=${id}`} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-alabaster">
                    <MemberAvatar member={m} className="size-10 shrink-0 text-sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy">{m.name}</p>
                      <p className="truncate text-xs text-muted">{last?.text ?? 'Say hello'}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}