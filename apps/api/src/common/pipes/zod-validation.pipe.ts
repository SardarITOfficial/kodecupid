import { PipeTransform } from '@nestjs/common';
import { z } from 'zod';
import { errors } from '../errors';

/**
 * Applies a shared zod schema to a request body/query and converts issues into
 * the standard validation error with per-field messages for the form UI.
 */
export function validateWith<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (result.success) {
    return result.data;
  }

  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_';
    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }

  throw errors.validation('Some details need fixing', { fieldErrors });
}

export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: z.ZodType<T>) {}

  transform(value: unknown): T {
    return validateWith(this.schema, value);
  }
}
