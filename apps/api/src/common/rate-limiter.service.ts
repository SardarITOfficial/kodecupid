import { Injectable } from '@nestjs/common';
import { ErrorCode, errors } from './errors';

interface WindowState {
  count: number;
  resetAt: number;
}

/**
 * Small in-process sliding-window limiter for OTP and login attempts. A single
 * API instance is enough for Milestone 1; swap for Redis when the API scales out.
 */
@Injectable()
export class RateLimiterService {
  private readonly buckets = new Map<string, WindowState>();

  consume(key: string, limit: number, windowMs: number): void {
    const now = Date.now();
    const current = this.buckets.get(key);

    if (!current || current.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }

    if (current.count >= limit) {
      const seconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      throw errors.tooManyRequests(
        ErrorCode.RATE_LIMITED,
        `Too many attempts. Try again in ${seconds} seconds.`,
        { retryAfterSeconds: seconds },
      );
    }

    current.count += 1;
  }

  /** Remaining attempts in the current window (for tests and UI hints). */
  remaining(key: string, limit: number): number {
    const current = this.buckets.get(key);
    if (!current || current.resetAt <= Date.now()) return limit;
    return Math.max(0, limit - current.count);
  }

  reset(key: string): void {
    this.buckets.delete(key);
  }

  clear(): void {
    this.buckets.clear();
  }
}
