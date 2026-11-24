import type { DatingMember } from '@/lib/mock-dating';

const TONES = [
  'from-navy to-crimson',
  'from-crimson to-crimson-dark',
  'from-navy-light to-navy',
  'from-crimson-dark to-navy',
];

export const ONLINE_IDS = ['m1', 'm4', 'm5'];

export function toneFor(id: string): string {
  const n = Number(id.replace(/\D/g, '')) || 0;
  return TONES[n % TONES.length] ?? TONES[0]!;
}

export function MemberAvatar({
  member,
  className = 'size-12 text-base',
  showStatus = false,
}: {
  member: DatingMember;
  className?: string;
  showStatus?: boolean;
}) {
  const online = ONLINE_IDS.includes(member.id);
  return (
    <div className={`relative shrink-0 rounded-full ${className}`}>
      <div
        className={`absolute inset-0 overflow-hidden rounded-full bg-linear-to-br font-semibold text-white ${toneFor(member.id)}`}
      >
        {member.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.photoUrl} alt="" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center">{member.name.slice(0, 1)}</span>
        )}
      </div>
      {showStatus ? (
        <span
          aria-label={online ? 'Online' : 'Offline'}
          className={`absolute bottom-0 right-0 size-3 rounded-full ring-2 ring-white ${
            online ? 'bg-emerald-500' : 'bg-muted/60'
          }`}
        />
      ) : null}
    </div>
  );
}