import type { ProfileField, VisibilityLevel } from './enums';

/**
 * Privacy defaults. Dating safety rule of thumb: identity and intent are
 * discoverable, while anything that could locate or profile someone offline
 * (workplace, religion, ethnicity) starts hidden.
 */
export const DEFAULT_VISIBILITY: Record<ProfileField, VisibilityLevel> = {
  DISPLAY_NAME: 'PUBLIC',
  AGE: 'PUBLIC',
  GENDER_IDENTITY: 'PUBLIC',
  INTERESTED_IN: 'PUBLIC',
  LOCATION: 'PUBLIC',
  PROFESSION: 'PUBLIC',
  SHIFT_SCHEDULE: 'PUBLIC',
  WORKPLACE: 'HIDDEN',
  RELIGION: 'HIDDEN',
  ETHNICITY: 'HIDDEN',
  LANGUAGES: 'PUBLIC',
  HEIGHT: 'PUBLIC',
  LIFESTYLE: 'PUBLIC',
  EDUCATION: 'PUBLIC',
  CREDENTIALS: 'PUBLIC',
  RELATIONSHIP_GOALS: 'PUBLIC',
  FAMILY_PLANS: 'PUBLIC',
  KIDS: 'PUBLIC',
  BIO: 'PUBLIC',
  PHOTOS: 'PUBLIC',
};

/** Fields the onboarding "quick privacy" step exposes. */
export const QUICK_PRIVACY_FIELDS: ProfileField[] = [
  'GENDER_IDENTITY',
  'PROFESSION',
  'RELIGION',
  'WORKPLACE',
];

/** Fields that are never rendered to other members, regardless of a toggle. */
export const ALWAYS_PRIVATE_FIELDS = ['phone', 'email', 'dateOfBirth', 'workplaceLatitude', 'workplaceLongitude', 'latitude', 'longitude'] as const;

export function defaultVisibilityFor(field: ProfileField): VisibilityLevel {
  return DEFAULT_VISIBILITY[field] ?? 'PUBLIC';
}

/**
 * Merge stored overrides onto the defaults. Missing rows fall back to the
 * default level, so newly added fields are safe without a migration.
 */
export function resolveVisibility(
  overrides: Partial<Record<ProfileField, VisibilityLevel>>,
): Record<ProfileField, VisibilityLevel> {
  const merged = { ...DEFAULT_VISIBILITY };
  for (const [field, level] of Object.entries(overrides)) {
    if (field in merged && level) {
      merged[field as ProfileField] = level as VisibilityLevel;
    }
  }
  return merged;
}
