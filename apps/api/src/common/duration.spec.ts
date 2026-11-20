import { parseDurationToMs } from './duration';

describe('parseDurationToMs', () => {
  it('parses the formats used by the environment file', () => {
    expect(parseDurationToMs('900s', 0)).toBe(900_000);
    expect(parseDurationToMs('15m', 0)).toBe(900_000);
    expect(parseDurationToMs('1h', 0)).toBe(3_600_000);
    expect(parseDurationToMs('7d', 0)).toBe(604_800_000);
    expect(parseDurationToMs('250', 0)).toBe(250);
  });

  it('falls back for unparseable values rather than crashing the API', () => {
    expect(parseDurationToMs('soon', 42)).toBe(42);
    expect(parseDurationToMs('', 42)).toBe(42);
  });
});
