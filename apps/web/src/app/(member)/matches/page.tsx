'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MATCH_IDS, MEMBERS, memberById, type DatingMember } from '@/lib/mock-dating';
import { MemberAvatar, toneFor } from '@/components/dating/member-avatar';

function Banner({ member }: { member: DatingMember }) {
  return (
    <div className={`relative h-28 overflow-hidden bg-linear-to-br ${toneFor(member.id)}`}>
      <div aria-hidden className="absolute -right-6 -top-10 size-40 rounded-full bg-white/10 blur-xl" />
      <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-crimson shadow">
        {member.compatibility}% match
      </span>
      {member.verified ? (
        <span className="absolute right-4 top-4 rounded-full bg-gold px-2.5 py-1 text-[11px] font-semibold text-navy shadow">
          ✓ Verified
        </span>
      ) : null}
    </div>
  );
}

function Empty({ title, body, href, cta }: { title: string; body: string; href?: string; cta?: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-white p-12 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-crimson-soft text-xl text-crimson">♥</div>
      <h2 className="mt-4 text-lg font-semibold text-navy">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted">{body}</p>
      {href && cta ? (
        <Link href={href} className="mt-5 inline-flex h-11 items-center rounded-full bg-crimson px-6 text-sm font-semibold text-white hover:bg-crimson-dark">
          {cta}
        </Link>
      ) : null}
    </div>
  );
}

export default function MatchesPage() {
  const [tab, setTab] = useState<'matches' | 'likes'>('matches');
  const [matchIds, setMatchIds] = useState<string[]>(MATCH_IDS);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const matches = matchIds.map(memberById).filter((m): m is DatingMember => m !== undefined);
  const likes = MEMBERS.filter((m) => m.likesYou && !matchIds.includes(m.id) && !dismissed.includes(m.id));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-crimson">Matches</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">Your connections</h1>
          <p className="mt-2 text-sm text-muted">People you matched with, and people who already like you.</p>
        </div>
        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-line bg-white px-5 py-3 shadow-sm">
            <dt className="text-xs font-medium uppercase tracking-wider text-muted">Matches</dt>
            <dd className="mt-0.5 text-2xl font-semibold text-navy">{matches.length}</dd>
          </div>
          <div className="rounded-2xl border border-line bg-white px-5 py-3 shadow-sm">
            <dt className="text-xs font-medium uppercase tracking-wider text-muted">Liked you</dt>
            <dd className="mt-0.5 text-2xl font-semibold text-crimson">{likes.length}</dd>
          </div>
        </dl>
      </div>

      <div className="inline-flex rounded-full border border-line bg-white p-1 shadow-sm">
        {(['matches', 'likes'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-colors ${
              tab === key ? 'bg-navy text-white shadow' : 'text-charcoal hover:bg-alabaster'
            }`}
          >
            {key === 'matches' ? 'Matches' : 'Liked you'}
            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${tab === key ? 'bg-white/20' : 'bg-alabaster text-muted'}`}>
              {key === 'matches' ? matches.length : likes.length}
            </span>
          </button>
        ))}
      </div>

      {tab === 'matches' ? (
        matches.length ? (
          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {matches.map((m) => (
              <li key={m.id} className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm transition-shadow hover:shadow-xl hover:shadow-navy/10">
                <Banner member={m} />
                <div className="px-6 pb-6">
                  <MemberAvatar member={m} showStatus className="-mt-10 size-20 text-3xl ring-4 ring-white" />
                  <h2 className="mt-3 text-xl font-semibold text-navy">{m.name}, {m.age}</h2>
                  <p className="text-sm text-muted">{m.profession} · {m.city}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-navy px-3 py-1 font-semibold text-white">{m.shift}</span>
                    <span className="rounded-full bg-crimson-soft px-3 py-1 font-semibold text-crimson">{m.sharedHours}</span>
                  </div>
                  <Link href={`/messages?with=${m.id}`} className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-crimson text-sm font-semibold text-white shadow-lg shadow-crimson/20 hover:bg-crimson-dark">
                    Send a message
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="No matches yet" body="Like a few people in Discover and they will show up here." href="/discover" cta="Go to Discover" />
        )
      ) : likes.length ? (
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {likes.map((m) => (
            <li key={m.id} className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm transition-shadow hover:shadow-xl hover:shadow-navy/10">
              <Banner member={m} />
              <div className="px-6 pb-6">
                <MemberAvatar member={m} showStatus className="-mt-10 size-20 text-3xl ring-4 ring-white" />
                <h2 className="mt-3 text-xl font-semibold text-navy">{m.name}, {m.age}</h2>
                <p className="text-sm text-muted">{m.profession} · {m.shift}</p>
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-charcoal">{m.bio}</p>
                <div className="mt-5 flex gap-3">
                  <button type="button" onClick={() => setDismissed((d) => [...d, m.id])} className="h-11 flex-1 rounded-full border border-line text-sm font-semibold text-navy hover:bg-alabaster">
                    Pass
                  </button>
                  <button type="button" onClick={() => setMatchIds((ids) => [...ids, m.id])} className="h-11 flex-1 rounded-full bg-crimson text-sm font-semibold text-white shadow-lg shadow-crimson/20 hover:bg-crimson-dark">
                    Like back
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty title="No new likes right now" body="When someone likes your profile, you will see them here." />
      )}
    </div>
  );
}