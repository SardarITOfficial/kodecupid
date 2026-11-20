import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

export interface CountryDialCode {
  /** ISO 3166-1 alpha-2 — cast to CountryCode where libphonenumber needs it. */
  iso2: string;
  name: string;
  dialCode: string;
}

/** Curated selector list — covers the launch markets plus the common diaspora. */
export const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  { iso2: 'US', name: 'United States', dialCode: '+1' },
  { iso2: 'CA', name: 'Canada', dialCode: '+1' },
  { iso2: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { iso2: 'AU', name: 'Australia', dialCode: '+61' },
  { iso2: 'NZ', name: 'New Zealand', dialCode: '+64' },
  { iso2: 'IE', name: 'Ireland', dialCode: '+353' },
  { iso2: 'BD', name: 'Bangladesh', dialCode: '+880' },
  { iso2: 'IN', name: 'India', dialCode: '+91' },
  { iso2: 'PK', name: 'Pakistan', dialCode: '+92' },
  { iso2: 'NP', name: 'Nepal', dialCode: '+977' },
  { iso2: 'LK', name: 'Sri Lanka', dialCode: '+94' },
  { iso2: 'AE', name: 'United Arab Emirates', dialCode: '+971' },
  { iso2: 'SA', name: 'Saudi Arabia', dialCode: '+966' },
  { iso2: 'QA', name: 'Qatar', dialCode: '+974' },
  { iso2: 'KW', name: 'Kuwait', dialCode: '+965' },
  { iso2: 'SG', name: 'Singapore', dialCode: '+65' },
  { iso2: 'MY', name: 'Malaysia', dialCode: '+60' },
  { iso2: 'PH', name: 'Philippines', dialCode: '+63' },
  { iso2: 'ID', name: 'Indonesia', dialCode: '+62' },
  { iso2: 'TH', name: 'Thailand', dialCode: '+66' },
  { iso2: 'VN', name: 'Vietnam', dialCode: '+84' },
  { iso2: 'JP', name: 'Japan', dialCode: '+81' },
  { iso2: 'KR', name: 'South Korea', dialCode: '+82' },
  { iso2: 'CN', name: 'China', dialCode: '+86' },
  { iso2: 'ZA', name: 'South Africa', dialCode: '+27' },
  { iso2: 'NG', name: 'Nigeria', dialCode: '+234' },
  { iso2: 'KE', name: 'Kenya', dialCode: '+254' },
  { iso2: 'GH', name: 'Ghana', dialCode: '+233' },
  { iso2: 'EG', name: 'Egypt', dialCode: '+20' },
  { iso2: 'DE', name: 'Germany', dialCode: '+49' },
  { iso2: 'FR', name: 'France', dialCode: '+33' },
  { iso2: 'NL', name: 'Netherlands', dialCode: '+31' },
  { iso2: 'ES', name: 'Spain', dialCode: '+34' },
  { iso2: 'IT', name: 'Italy', dialCode: '+39' },
  { iso2: 'PT', name: 'Portugal', dialCode: '+351' },
  { iso2: 'SE', name: 'Sweden', dialCode: '+46' },
  { iso2: 'NO', name: 'Norway', dialCode: '+47' },
  { iso2: 'DK', name: 'Denmark', dialCode: '+45' },
  { iso2: 'BR', name: 'Brazil', dialCode: '+55' },
  { iso2: 'MX', name: 'Mexico', dialCode: '+52' },
].sort((a, b) => a.name.localeCompare(b.name));

export const DEFAULT_COUNTRY: CountryCode = 'US';

export type PhoneParseResult =
  | { ok: true; e164: string; iso2: CountryCode; national: string }
  | { ok: false; reason: 'INVALID_PHONE'; message: string };

/**
 * Normalize user input to E.164. Accepts a leading "+" (country code included)
 * or a national number resolved against `iso2`.
 */
export function normalizePhone(raw: string, iso2: CountryCode = DEFAULT_COUNTRY): PhoneParseResult {
  const trimmed = (raw ?? '').trim().replace(/[\s\-().]/g, '');
  if (!trimmed) {
    return { ok: false, reason: 'INVALID_PHONE', message: 'Enter a phone number' };
  }

  try {
    const parsed = trimmed.startsWith('+')
      ? parsePhoneNumberFromString(trimmed)
      : parsePhoneNumberFromString(trimmed, iso2);

    if (!parsed || !parsed.isValid()) {
      return { ok: false, reason: 'INVALID_PHONE', message: 'That phone number does not look right' };
    }

    return {
      ok: true,
      e164: parsed.number,
      iso2: parsed.country ?? iso2,
      national: parsed.formatNational(),
    };
  } catch {
    return { ok: false, reason: 'INVALID_PHONE', message: 'That phone number does not look right' };
  }
}

/** Country of an E.164 number, or null when it cannot be determined. */
export function countryOf(e164: string): CountryCode | null {
  try {
    return parsePhoneNumberFromString(e164)?.country ?? null;
  } catch {
    return null;
  }
}

/** Human-readable form for admin screens and logs. Never used as an identifier. */
export function formatPhoneDisplay(e164: string): string {
  try {
    const parsed = parsePhoneNumberFromString(e164);
    return parsed ? parsed.formatInternational() : e164;
  } catch {
    return e164;
  }
}

/** Privacy-safe form for moderator lists: +1 ••• ••• 4821 */
export function maskPhone(e164: string): string {
  if (e164.length <= 4) return '••••';
  const visible = e164.slice(-4);
  const dial = e164.match(/^\+\d{1,3}/)?.[0] ?? '+';
  return `${dial} ••• ••• ${visible}`;
}
