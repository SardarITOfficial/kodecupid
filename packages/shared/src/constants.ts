export const APP_NAME = 'KodeCupid';

/* Age gate */
export const MIN_AGE = 18;

/* OTP */
export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 5;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

/* Profile media */
export const MAX_PHOTOS = 6;
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
export const ALLOWED_PHOTO_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const BIO_MAX_LENGTH = 1000;

/* Preferences defaults used by onboarding */
export const DEFAULT_AGE_RANGE: { min: number; max: number } = { min: 18, max: 99 };
export const DEFAULT_MAX_DISTANCE_KM = 50;

/* Cookies — deliberately short, prefixed names */
export const MEMBER_COOKIE = {
  access: 'kc_at',
  refresh: 'kc_rt',
} as const;
export const ADMIN_COOKIE = {
  access: 'kc_admin_at',
  refresh: 'kc_admin_rt',
} as const;

/* JWT audiences keep member and admin tokens non-interchangeable */
export const JWT_AUDIENCE = {
  member: 'kodecupid:member',
  admin: 'kodecupid:admin',
} as const;

export const PROFILE_COMPLETION_WEIGHTS: Record<string, number> = {
  displayName: 10,
  dateOfBirth: 10,
  genderIdentity: 10,
  interestedIn: 10,
  profession: 10,
  shiftSchedule: 10,
  city: 10,
  photos: 10,
  bio: 10,
  lookingFor: 10,
};
