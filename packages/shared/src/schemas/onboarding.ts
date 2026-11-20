import { z } from 'zod';
import {
  GENDER_IDENTITY_VALUES,
  INTERESTED_IN_VALUES,
  ONBOARDING_STEP_VALUES,
  PROFILE_FIELD_VALUES,
  RELATIONSHIP_GOAL_VALUES,
  SHIFT_SCHEDULE_VALUES,
  VISIBILITY_VALUES,
} from '../enums';
import type { OnboardingStep } from '../enums';
import { BIO_MAX_LENGTH, DEFAULT_AGE_RANGE } from '../constants';
import { isoDateSchema } from './common';

const displayName = z
  .string()
  .trim()
  .min(2, 'Use at least 2 characters')
  .max(40, 'Use at most 40 characters');

export const identityStepSchema = z.object({
  displayName,
  dateOfBirth: isoDateSchema,
  genderIdentity: z.enum(GENDER_IDENTITY_VALUES),
  genderIdentityOther: z.string().trim().max(40).optional(),
  interestedIn: z
    .array(z.enum(INTERESTED_IN_VALUES))
    .min(1, 'Pick at least one option')
    .max(INTERESTED_IN_VALUES.length),
});

export const professionStepSchema = z.object({
  profession: z.string().trim().min(2, 'Tell us what you do').max(60),
  employerName: z.string().trim().max(80).optional(),
  shiftSchedule: z.enum(SHIFT_SCHEDULE_VALUES),
  shiftNotes: z.string().trim().max(200).optional(),
});

export const locationStepSchema = z
  .object({
    city: z.string().trim().min(1, 'Add your city').max(80),
    region: z.string().trim().max(80).optional(),
    country: z.string().trim().length(2, 'Pick a country').toUpperCase(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  })
  .refine((value) => (value.latitude === undefined) === (value.longitude === undefined), {
    message: 'Latitude and longitude must be provided together',
  });

export const preferencesStepSchema = z
  .object({
    lookingFor: z
      .array(z.enum(RELATIONSHIP_GOAL_VALUES))
      .min(1, 'Pick at least one goal')
      .max(3),
    ageRangeMin: z.number().int().min(18).max(99).default(DEFAULT_AGE_RANGE.min),
    ageRangeMax: z.number().int().min(18).max(99).default(DEFAULT_AGE_RANGE.max),
    maxDistanceKm: z.number().int().min(1).max(500).default(50),
  })
  .refine((value) => value.ageRangeMin <= value.ageRangeMax, {
    message: 'The minimum age must not be higher than the maximum',
    path: ['ageRangeMin'],
  });

export const privacyStepSchema = z.object({
  visibility: z
    .array(
      z.object({
        field: z.enum(PROFILE_FIELD_VALUES),
        visibility: z.enum(VISIBILITY_VALUES),
      }),
    )
    .max(PROFILE_FIELD_VALUES.length),
});

export const welcomeStepSchema = z.object({});

export const completeStepSchema = z.object({});

export const onboardingStepSchemas = {
  welcome: welcomeStepSchema,
  identity: identityStepSchema,
  profession: professionStepSchema,
  location: locationStepSchema,
  preferences: preferencesStepSchema,
  privacy: privacyStepSchema,
  complete: completeStepSchema,
} satisfies Record<OnboardingStep, z.ZodTypeAny>;

export function schemaForStep(step: OnboardingStep): z.ZodTypeAny {
  return onboardingStepSchemas[step];
}

/** Steps a client can PATCH. `complete` has its own endpoint. */
export const PATCHABLE_ONBOARDING_STEPS = ONBOARDING_STEP_VALUES.filter(
  (step) => step !== 'complete',
);

export type IdentityStepInput = z.infer<typeof identityStepSchema>;
export type ProfessionStepInput = z.infer<typeof professionStepSchema>;
export type LocationStepInput = z.infer<typeof locationStepSchema>;
export type PreferencesStepInput = z.infer<typeof preferencesStepSchema>;
export type PrivacyStepInput = z.infer<typeof privacyStepSchema>;

export { BIO_MAX_LENGTH };
