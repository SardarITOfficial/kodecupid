import { z } from 'zod';
import { OTP_LENGTH } from '../constants';

export const otpRequestSchema = z.object({
  phone: z.string().trim().min(4, 'Enter your phone number').max(25),
  countryCode: z
    .string()
    .trim()
    .length(2, 'Pick a country')
    .transform((value) => value.toUpperCase()),
});

export type OtpRequestInput = z.infer<typeof otpRequestSchema>;

export const otpVerifySchema = z.object({
  challengeId: z.string().min(8).max(80),
  code: z
    .string()
    .trim()
    .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `Enter the ${OTP_LENGTH}-digit code`),
});

export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
