import { z } from 'zod';
import { isValidCalendarDate } from '../age';

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD')
  .refine(isValidCalendarDate, 'That date does not exist');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(160)
  .pipe(z.email('Enter a valid email address'));

export const passwordSchema = z
  .string()
  .min(10, 'Use at least 10 characters')
  .max(72, 'Use at most 72 characters')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number');

export const idSchema = z.string().min(10).max(60);

export function atLeastOne<T extends z.ZodRawShape>(shape: T) {
  return z
    .object(shape)
    .refine((value) => Object.values(value).some((item) => item !== undefined), {
      message: 'Nothing to update',
    });
}
