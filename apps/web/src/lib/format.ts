import type { ProfileField, ProfileView, VisibilityLevel } from '@kodecupid/shared';
import { PROFILE_FIELD_LABELS } from '@kodecupid/shared';

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    date,
  );
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function initialsOf(name: string | null | undefined): string {
  if (!name) return 'KC';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function visibilityLabel(level: VisibilityLevel): string {
  return level === 'PUBLIC' ? 'Visible' : level === 'HIDDEN' ? 'Hidden' : 'Matches only';
}

export function fieldLabel(field: ProfileField): string {
  return PROFILE_FIELD_LABELS[field] ?? field;
}

/** Human summary used on profile cards and the admin detail screen. */
export function profileHeadline(profile: ProfileView | null | undefined): string {
  if (!profile) return 'No profile yet';
  const parts = [profile.age ? `${profile.age}` : null, profile.city ?? null].filter(Boolean);
  return parts.join(' · ') || 'Profile in progress';
}

export function metersLabel(km: number): string {
  return km >= 1000 ? `${Math.round(km / 100) / 10}k km` : `${km} km`;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}
