/**
 * Postcode -> region lookup.
 *
 * Polish postal codes are NOT cleanly range-based per voivodeship — Śląskie
 * overlaps with Opolskie and Małopolskie at several boundaries. This is a
 * first-two-digits approximation covering the bulk of Śląskie, not a precise
 * TERYT boundary lookup. Good enough to gate the demo; replace with a real
 * postcode registry (GUS TERYT or Poczta Polska's file) before this decides
 * anything a homeowner pays for.
 */

export interface PostcodeResult {
  valid: boolean;
  inSilesia: boolean;
  prefix: string | null;
}

const SILESIAN_PREFIXES = new Set(["40", "41", "42", "43", "44"]);

const POSTCODE_PATTERN = /^\d{2}-\d{3}$/;

export function isValidPolishPostcode(value: string): boolean {
  return POSTCODE_PATTERN.test(value);
}

export function lookupPostcode(value: string): PostcodeResult {
  if (!isValidPolishPostcode(value)) {
    return { valid: false, inSilesia: false, prefix: null };
  }
  const prefix = value.slice(0, 2);
  return { valid: true, inSilesia: SILESIAN_PREFIXES.has(prefix), prefix };
}

export function maskPostcodeInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 5);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2)}`;
}
