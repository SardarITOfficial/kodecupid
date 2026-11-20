/**
 * Parses `15m`, `900s`, `1h`, `7d` or plain milliseconds. Extracted from the
 * token service so it can be tested without loading the Nest runtime.
 */
export function parseDurationToMs(value: string, fallback: number): number {
  const match = /^(\d+)\s*(ms|s|m|h|d)?$/i.exec(value.trim());
  if (!match) return fallback;
  const amount = Number.parseInt(match[1]!, 10);
  switch ((match[2] ?? 'ms').toLowerCase()) {
    case 'ms':
      return amount;
    case 's':
      return amount * 1000;
    case 'm':
      return amount * 60 * 1000;
    case 'h':
      return amount * 60 * 60 * 1000;
    case 'd':
      return amount * 24 * 60 * 60 * 1000;
    default:
      return fallback;
  }
}
