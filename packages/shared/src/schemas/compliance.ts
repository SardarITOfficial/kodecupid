import { z } from 'zod';
import { isoDateSchema } from './common';

/**
 * One screen, three promises plus the age gate: real date of birth, 18+, Terms,
 * Community Guidelines and Safety Tips. Every literal must be `true` — the API
 * refuses partial consent and stores the version + timestamp of each document.
 */
export const complianceAcceptSchema = z.object({
  dateOfBirth: isoDateSchema,
  confirmAdult: z.literal(true, { message: 'You must confirm you are 18 or older' }),
  acceptTerms: z.literal(true, { message: 'You must accept the Terms of Service' }),
  acceptGuidelines: z.literal(true, { message: 'You must accept the Community Guidelines' }),
  acceptSafetyTips: z.literal(true, { message: 'You must accept the Safety Tips' }),
  termsVersion: z.string().min(1),
  guidelinesVersion: z.string().min(1),
  safetyTipsVersion: z.string().min(1),
});

export type ComplianceAcceptInput = z.infer<typeof complianceAcceptSchema>;
