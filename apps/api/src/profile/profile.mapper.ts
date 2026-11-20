import {
  PROFILE_COMPLETION_WEIGHTS,
  calculateAge,
  resolveVisibility,
  type ProfileField,
  type ProfileOwnerView,
  type ProfilePhotoView,
  type ProfileView,
  type VisibilityLevel,
} from '@kodecupid/shared';
import type { Profile, ProfileFieldVisibility, ProfilePhoto } from '../prisma/generated';

export type ProfileWithRelations = Profile & {
  visibility: ProfileFieldVisibility[];
  photos: ProfilePhoto[];
};

export type PhotoUrlResolver = (storageKey: string) => string;

export function visibilityMap(profile: ProfileWithRelations): Record<ProfileField, VisibilityLevel> {
  const overrides: Partial<Record<ProfileField, VisibilityLevel>> = {};
  for (const row of profile.visibility) {
    overrides[row.field] = row.visibility;
  }
  return resolveVisibility(overrides);
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

function dateOnly(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

export function photosOf(profile: ProfileWithRelations, url: PhotoUrlResolver): ProfilePhotoView[] {
  return [...profile.photos]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((photo) => ({
      id: photo.id,
      url: url(photo.storageKey),
      isPrimary: photo.isPrimary,
      sortOrder: photo.sortOrder,
    }));
}

/**
 * Builds the member-facing profile: a hidden field is omitted entirely, never
 * sent as `null`, so a malicious client cannot distinguish "empty" from
 * "hidden" by inspecting the payload.
 */
export function toPublicView(
  profile: ProfileWithRelations,
  url: PhotoUrlResolver,
): ProfileView {
  const visibility = visibilityMap(profile);
  const hiddenFields: ProfileField[] = [];
  const view: ProfileView = {
    id: profile.id,
    paused: profile.status === 'PAUSED',
    hiddenFields,
  };

  const reveal = <K extends keyof ProfileView>(field: ProfileField, key: K, value: unknown) => {
    if (key === 'hiddenFields' || key === 'id' || key === 'paused') return;
    if (!hasValue(value)) return;
    if (visibility[field] === 'PUBLIC') {
      (view as unknown as Record<string, unknown>)[key as string] = value;
    } else if (!hiddenFields.includes(field)) {
      hiddenFields.push(field);
    }
  };

  const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : null;

  reveal('DISPLAY_NAME', 'displayName', profile.displayName);
  reveal('AGE', 'age', age);
  reveal('GENDER_IDENTITY', 'genderIdentity', profile.genderIdentity);
  if (profile.genderIdentity === 'OTHER') {
    reveal('GENDER_IDENTITY', 'genderIdentityOther', profile.genderIdentityOther);
  }
  reveal('INTERESTED_IN', 'interestedIn', profile.interestedIn);

  reveal('LOCATION', 'city', profile.city);
  reveal('LOCATION', 'region', profile.region);
  reveal('LOCATION', 'country', profile.country);

  reveal('PROFESSION', 'profession', profile.profession);
  reveal('PROFESSION', 'employerName', profile.employerName);
  reveal('SHIFT_SCHEDULE', 'shiftSchedule', profile.shiftSchedule);
  reveal('SHIFT_SCHEDULE', 'shiftNotes', profile.shiftNotes);

  reveal('WORKPLACE', 'workplaceName', profile.workplaceName);

  reveal('RELIGION', 'religion', profile.religion);
  reveal('ETHNICITY', 'ethnicity', profile.ethnicity);
  reveal('LANGUAGES', 'languages', profile.languages);
  reveal('HEIGHT', 'heightCm', profile.heightCm);

  reveal('LIFESTYLE', 'drinking', profile.drinking);
  reveal('LIFESTYLE', 'smoking', profile.smoking);
  reveal('LIFESTYLE', 'cannabis', profile.cannabis);
  reveal('LIFESTYLE', 'exercise', profile.exercise);

  reveal('EDUCATION', 'educationLevel', profile.educationLevel);
  reveal('CREDENTIALS', 'credentials', profile.credentials);
  reveal('RELATIONSHIP_GOALS', 'relationshipGoals', profile.relationshipGoals);
  reveal('FAMILY_PLANS', 'familyPlans', profile.familyPlans);
  reveal('KIDS', 'kids', profile.kids);
  reveal('BIO', 'bio', profile.bio);

  const photos = photosOf(profile, url);
  reveal('PHOTOS', 'photos', photos.length > 0 ? photos : undefined);

  return view;
}

/**
 * Owner view: every value (including hidden ones), plus the visibility map and
 * the completion score. Built explicitly rather than over the public view so a
 * hidden field can never be missing here.
 */
export function toOwnerView(
  profile: ProfileWithRelations,
  url: PhotoUrlResolver,
): ProfileOwnerView {
  const photos = photosOf(profile, url);

  return {
    id: profile.id,
    paused: profile.status === 'PAUSED',
    hiddenFields: [],
    displayName: profile.displayName ?? undefined,
    age: profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : undefined,
    genderIdentity: profile.genderIdentity ?? undefined,
    genderIdentityOther: profile.genderIdentityOther ?? undefined,
    interestedIn: profile.interestedIn,
    city: profile.city ?? undefined,
    region: profile.region ?? undefined,
    country: profile.country ?? undefined,
    profession: profile.profession ?? undefined,
    employerName: profile.employerName ?? undefined,
    shiftSchedule: profile.shiftSchedule ?? undefined,
    shiftNotes: profile.shiftNotes ?? undefined,
    religion: profile.religion ?? undefined,
    ethnicity: profile.ethnicity ?? undefined,
    languages: profile.languages,
    heightCm: profile.heightCm ?? undefined,
    drinking: profile.drinking ?? undefined,
    smoking: profile.smoking ?? undefined,
    cannabis: profile.cannabis ?? undefined,
    exercise: profile.exercise ?? undefined,
    educationLevel: profile.educationLevel ?? undefined,
    credentials: profile.credentials,
    relationshipGoals: profile.relationshipGoals,
    familyPlans: profile.familyPlans ?? undefined,
    kids: profile.kids ?? undefined,
    bio: profile.bio ?? undefined,
    workplaceName: profile.workplaceName ?? undefined,
    photos,
    dateOfBirth: dateOnly(profile.dateOfBirth),
    latitude: profile.latitude,
    longitude: profile.longitude,
    workplaceLatitude: profile.workplaceLatitude,
    workplaceLongitude: profile.workplaceLongitude,
    workplaceRadiusM: profile.workplaceRadiusM,
    status: profile.status,
    visibility: visibilityMap(profile),
    completionPercent: completionPercent(profile, photos.length),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

/** Weighted completeness used by the profile ring and the admin list. */
export function completionPercent(profile: ProfileWithRelations, photoCount: number): number {
  const signals: Record<string, boolean> = {
    displayName: hasValue(profile.displayName),
    dateOfBirth: profile.dateOfBirth !== null,
    genderIdentity: profile.genderIdentity !== null,
    interestedIn: profile.interestedIn.length > 0,
    profession: hasValue(profile.profession),
    shiftSchedule: profile.shiftSchedule !== null,
    city: hasValue(profile.city),
    photos: photoCount > 0,
    bio: hasValue(profile.bio),
    lookingFor: profile.relationshipGoals.length > 0,
  };

  const total = Object.values(PROFILE_COMPLETION_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
  let earned = 0;
  for (const [key, weight] of Object.entries(PROFILE_COMPLETION_WEIGHTS)) {
    if (signals[key]) earned += weight;
  }
  return Math.min(100, Math.round((earned / total) * 100));
}
