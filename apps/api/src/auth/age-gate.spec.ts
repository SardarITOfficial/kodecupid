import { calculateAge, isAdult, isValidCalendarDate } from '@kodecupid/shared';

/**
 * Age gate boundaries. Exact-18-today must pass; one day short must fail, and
 * the answer must not depend on the local time zone.
 */
describe('age gate', () => {
  const now = new Date('2026-11-21T12:00:00.000Z');

  it('allows someone who turns 18 today', () => {
    expect(isAdult('2008-11-21', now)).toBe(true);
    expect(calculateAge('2008-11-21', now)).toBe(18);
  });

  it('blocks someone one day short of 18', () => {
    expect(isAdult('2008-11-22', now)).toBe(false);
    expect(calculateAge('2008-11-22', now)).toBe(17);
  });

  it('handles a leap-day birthday', () => {
    expect(calculateAge('2004-02-29', new Date('2022-02-28T00:00:00.000Z'))).toBe(17);
    expect(calculateAge('2004-02-29', new Date('2022-03-01T00:00:00.000Z'))).toBe(18);
  });

  it('rejects impossible calendar dates', () => {
    expect(isValidCalendarDate('2001-02-30')).toBe(false);
    expect(isValidCalendarDate('2001-13-01')).toBe(false);
    expect(isValidCalendarDate('2001-02-28')).toBe(true);
  });

  it('computes age from the calendar, not the clock', () => {
    expect(calculateAge('2000-01-01', new Date('2026-01-01T23:59:59.000Z'))).toBe(26);
  });
});
