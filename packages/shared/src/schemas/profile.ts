import { z } from 'zod';
import {
  CREDENTIAL_VALUES,
  EDUCATION_LEVEL_VALUES,
  EXERCISE_VALUES,
  FAMILY_PLANS_VALUES,
  GENDER_IDENTITY_VALUES,
  INTERESTED_IN_VALUES,
  KIDS_VALUES,
  LIFESTYLE_VALUES,
  PROFESSION_CATEGORY_VALUES,
  PROFILE_FIELD_VALUES,
  RELATIONSHIP_GOAL_VALUES,
  SHIFT_SCHEDULE_VALUES,
  VISIBILITY_VALUES,
} from '../enums';
import { BIO_MAX_LENGTH } from '../constants';
import { isoDateSchema } from './common';

const optionalText = (max: number) => z.string().trim().max(max).nullable();

/**
 * Patch body for the owner's profile. Every field is optional so the same
 * schema serves onboarding step saves and targeted edits.
 */
export const profileUpdateSchema = z
  .object({
    displayName: z.string().trim().min(2).max(40),
    dateOfBirth: isoDateSchema,
    genderIdentity: z.enum(GENDER_IDENTITY_VALUES),
    genderIdentityOther: optionalText(40),
    interestedIn: z.array(z.enum(INTERESTED_IN_VALUES)).min(1).max(INTERESTED_IN_VALUES.length),

    profession: optionalText(60),
    professionCategory: z.enum(PROFESSION_CATEGORY_VALUES).nullable(),
    employerName: optionalText(80),
    shiftSchedule: z.enum(SHIFT_SCHEDULE_VALUES),
    shiftNotes: optionalText(200),

    city: optionalText(80),
    region: optionalText(80),
    country: z.string().trim().length(2).toUpperCase().nullable(),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),

    religion: optionalText(40),
    ethnicity: optionalText(40),
    languages: z.array(z.string().trim().min(1).max(30)).max(10),
    heightCm: z.number().int().min(120).max(230).nullable(),

    drinking: z.enum(LIFESTYLE_VALUES).nullable(),
    smoking: z.enum(LIFESTYLE_VALUES).nullable(),
    cannabis: z.enum(LIFESTYLE_VALUES).nullable(),
    exercise: z.enum(EXERCISE_VALUES).nullable(),

    educationLevel: z.enum(EDUCATION_LEVEL_VALUES).nullable(),
    credentials: z.array(z.enum(CREDENTIAL_VALUES)).max(10),

    relationshipGoals: z.array(z.enum(RELATIONSHIP_GOAL_VALUES)).max(3),
    familyPlans: z.enum(FAMILY_PLANS_VALUES).nullable(),
    kids: z.enum(KIDS_VALUES).nullable(),

    bio: z.string().trim().max(BIO_MAX_LENGTH).nullable(),

    workplaceName: optionalText(80),
    workplaceLatitude: z.number().min(-90).max(90).nullable(),
    workplaceLongitude: z.number().min(-180).max(180).nullable(),
    workplacePrivacyEnabled: z.boolean(),
    workplaceHideRadiusMeters: z.number().int().min(50).max(5000).nullable(),
  })
  .partial();

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const visibilityUpdateSchema = z.object({
  field: z.enum(PROFILE_FIELD_VALUES),
  visibility: z.enum(VISIBILITY_VALUES),
});

export type VisibilityUpdateInput = z.infer<typeof visibilityUpdateSchema>;

export const visibilityBulkSchema = z.object({
  updates: z.array(visibilityUpdateSchema).min(1).max(PROFILE_FIELD_VALUES.length),
});

export type VisibilityBulkInput = z.infer<typeof visibilityBulkSchema>;

export const photoOrderSchema = z.object({
  photoIds: z.array(z.string().min(10)).max(20),
});

export type PhotoOrderInput = z.infer<typeof photoOrderSchema>;
