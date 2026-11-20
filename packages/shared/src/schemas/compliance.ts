import { z } from 'zod';
import { isoDateSchema } from './common';

/**
 * One screen, four promises: real date of birth, 18+, Terms, Community
 * Guidelines. Every literal must be `true` — the API refuses partial consent.
 */
export const complianceAcceptSchema = z.object({
  dateOfBirth: isoDateSchema,
  confirmAdult: z.literal(true, { message: 'You must confirm you are 18 or older' }),
  acceptTerms: z.literal(true, { message: 'You must accept the Terms of Service' }),
  acceptGuidelines: z.literal(true, {
    message: 'You must accept the Community Guidelines & Safety Tips',
  }),
  termsVersion: z.string().min(1),
  guidelinesVersion: z.string().min(1),
});

export type ComplianceAcceptInput = z.infer<typeof complianceAcceptSchema>;
