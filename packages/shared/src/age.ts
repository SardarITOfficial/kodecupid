/**
 * Age gate helpers. Age is always calculated from the date of birth in UTC so
 * two clients in different time zones can never disagree about who is an adult.
 */

export function toIsoDate(input: Date | string): string {
  if (typeof input === 'string') {
    return input.slice(0, 10);
  }
  return input.toISOString().slice(0, 10);
}

/** Calendar-accurate age, ignoring time of day. */
export function calculateAge(dateOfBirth: Date | string, now: Date = new Date()): number {
  const dobIso = toIsoDate(dateOfBirth);
  const [year, month, day] = dobIso.split('-').map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) {
    throw new Error('Invalid date of birth');
  }

  let age = now.getUTCFullYear() - year;
  const monthDelta = now.getUTCMonth() + 1 - month;
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < day)) {
    age -= 1;
  }
  return age;
}

export function isAdult(dateOfBirth: Date | string, now: Date = new Date(), minimum = 18): boolean {
  return calculateAge(dateOfBirth, now) >= minimum;
}

/** True for calendar dates that exist (rejects 2001-02-30). */
export function isValidCalendarDate(isoDate: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  );
}
