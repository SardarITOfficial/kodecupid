'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CONVERSATIONS,
  MATCH_IDS,
  memberById,
  type ChatMessage,
  type DatingMember,
} from '@/lib/mock-dating';
import { MemberAvatar, ONLINE_IDS } from '@/components/dating/member-avatar';

const QUICK_REPLIES = ['How was your shift?', 'Free tomorrow morning?', 'Coffee after work?'];

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back to inbox"
      className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-white text-navy shadow-sm transition-colors hover:bg-alabaster active:scale-95 lg:hidden"
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m15 6-6 6 6 6" />
      </svg>
    </button>
  );
}

function MessagesView() {
  const params = useSearchParams();
  const withId = params.get('with');
  const validWith = withId && memberById(withId) ? withId : null;

  const [threads, setThreads] = useState<Record<string, ChatMessage[]>>(CONVERSATIONS);
  const [activeId, setActiveId] = useState<string | null>(validWith);
  const [read, setRead] = useState<string[]>(validWith ? [validWith] : []);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!validWith) return;
    setActiveId(validWith);
    setRead((r) => (r.includes(validWith) ? r : [...r, validWith]));
  }, [validWith]);

  const people = useMemo(() => {
    const ids = validWith && !MATCH_IDS.includes(validWith) ? [...MATCH_IDS, validWith] : MATCH_IDS;
    return ids
      .map(memberById)
      .filter((m): m is DatingMember => m !== undefined)
      .filter((m) => m.name.toLowerCase().includes(query.toLowerCase()));
  }, [query, validWith]);

  const active = activeId ? memberById(activeId) : undefined;
  const messages = activeId ? (threads[activeId] ?? []) : [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, activeId]);

  function open(id: string): void {
    setActiveId(id);
    setRead((r) => (r.includes(id) ? r : [...r, id]));
  }

  function send(text: string): void {
    const clean = text.trim();
    if (!clean || !activeId) return;
    const message: ChatMessage = { id: `${Date.now()}`, from: 'me', text: clean, at: 'Now' };
    setThreads((t) => ({ ...t, [activeId]: [...(t[activeId] ?? []), message] }));
    setDraft('');
  }

  return (
    <div className="lg:space-y-6">
      {/* Heading: desktop only */}
      <div className="hidden lg:block">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-crimson">Messages</p>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight text-navy">Conversations</h1>
      </div>

      {/* Mobile: fixed between the top bar and the bottom tabs, edge to edge. Desktop: normal card. */}
      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] top-14 z-20 grid grid-rows-[minmax(0,1fr)] overflow-hidden bg-white lg:static lg:h-[calc(100dvh-13rem)] lg:min-h-120 lg:grid-cols-[20rem_minmax(0,1fr)] lg:rounded-4xl lg:border lg:border-line lg:shadow-xl lg:shadow-navy/5">
        {/* Inbox */}
        <div
          className={`min-h-0 min-w-0 flex-col border-line lg:flex lg:border-r ${active ? 'hidden' : 'flex'}`}
        >
          <div className="shrink-0 border-b border-line p-3 sm:p-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search matches"
              aria-label="Search matches"
              className="h-11 w-full rounded-full border border-line bg-alabaster px-5 text-base text-charcoal placeholder:text-muted/70 focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20 sm:text-sm"
            />
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
            {people.length === 0 ? (
              <li className="p-6 text-center text-sm text-muted">No matches found.</li>
            ) : null}
            {people.map((m) => {
              const last = threads[m.id]?.at(-1);
              const unread = last?.from === 'them' && !read.includes(m.id);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => open(m.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-alabaster ${
                      activeId === m.id ? 'bg-alabaster ring-1 ring-line' : ''
                    }`}
                  >
                    <MemberAvatar member={m} showStatus className="size-12 text-lg" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate whitespace-nowrap text-sm font-semibold text-navy">
                          {m.name}
                        </span>
                        <span className="shrink-0 whitespace-nowrap text-[11px] text-muted">
                          {last?.at}
                        </span>
                      </span>
                      <span
                        className={`mt-0.5 block overflow-hidden text-ellipsis whitespace-nowrap text-xs ${
                          unread ? 'font-semibold text-navy' : 'text-muted'
                        }`}
                      >
                        {last?.from === 'me' ? 'You: ' : ''}
                        {last?.text ?? 'New match. Say hello'}
                      </span>
                    </span>
                    {unread ? (
                      <span
                        aria-label="Unread"
                        className="size-2.5 shrink-0 rounded-full bg-crimson"
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Thread */}
        <section className={`min-h-0 min-w-0 flex-col lg:flex ${active ? 'flex' : 'hidden'}`}>
          {active ? (
            <>
              <header className="flex shrink-0 items-center gap-3 border-b border-line bg-white px-3 py-3 sm:px-6 sm:py-3.5">
                <BackButton onClick={() => setActiveId(null)} />
                <MemberAvatar member={active} showStatus className="size-10 text-base sm:size-11" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-semibold text-navy">
                    <span className="truncate whitespace-nowrap">{active.name}</span>
                    {active.verified ? (
                      <span className="shrink-0 whitespace-nowrap rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-navy">
                        ✓ Verified
                      </span>
                    ) : null}
                  </p>
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted">
                    {ONLINE_IDS.includes(active.id) ? 'Online now' : 'Offline'} · {active.shift}
                  </p>
                </div>
                <span className="hidden max-w-56 shrink-0 truncate whitespace-nowrap rounded-full bg-crimson-soft px-3 py-1 text-xs font-semibold text-crimson md:inline-block">
                  {active.sharedHours}
                </span>
              </header>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain bg-alabaster px-3 py-5 sm:px-6 sm:py-6">
                <p className="pb-2 text-center text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Today
                </p>
                {messages.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted">
                    You matched with {active.name}. Say hello.
                  </p>
                ) : null}
                {messages.map((msg, i) => {
                  const mine = msg.from === 'me';
                  const sameAsPrev = messages[i - 1]?.from === msg.from;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${mine ? 'justify-end' : 'justify-start'} ${sameAsPrev ? '' : 'pt-2'}`}
                    >
                      <div
                        className={`max-w-[85%] wrap-break-word px-4 py-2.5 text-sm leading-relaxed shadow-sm sm:max-w-[78%] ${
                          mine
                            ? 'rounded-3xl rounded-br-lg bg-crimson text-white'
                            : 'rounded-3xl rounded-bl-lg bg-white text-charcoal ring-1 ring-line'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <p className={`mt-1 text-[10px] ${mine ? 'text-white/70' : 'text-muted'}`}>
                          {msg.at}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              <div className="shrink-0 border-t border-line bg-white p-3 sm:p-4">
                {messages.length === 0 ? (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {QUICK_REPLIES.map((reply) => (
                      <button
                        key={reply}
                        type="button"
                        onClick={() => setDraft(reply)}
                        className="rounded-full border border-line bg-white px-3.5 py-1.5 text-left text-xs font-medium text-navy transition-colors hover:border-crimson/40 hover:text-crimson"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                ) : null}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send(draft);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={`Message ${active.name}`}
                    aria-label="Message"
                    className="h-12 min-w-0 flex-1 rounded-full border border-line bg-alabaster px-5 text-base text-charcoal placeholder:text-muted/70 focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20 sm:text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim()}
                    aria-label="Send"
                    className="grid size-12 shrink-0 place-items-center rounded-full bg-crimson text-white shadow-lg shadow-crimson/25 transition hover:bg-crimson-dark disabled:opacity-40 disabled:shadow-none"
                  >
                    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
                      <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12 2-12 2z" />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-10 text-center">
              <div>
                <div className="mx-auto grid size-16 place-items-center rounded-full bg-crimson-soft text-2xl text-crimson">
                  ✉
                </div>
                <h2 className="mt-4 text-lg font-semibold text-navy">Select a conversation</h2>
                <p className="mt-1 text-sm text-muted">
                  Pick a match on the left to start talking.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesView />
    </Suspense>
  );
}
