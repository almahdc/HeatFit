/**
 * Polish postal code validation and utilities.
 * Format: XX-XXX (e.g., 10-115, 00-001, 31-999)
 */

const POLISH_POSTAL_CODE_REGEX = /^\d{2}-\d{3}$/;

/**
 * Postal code prefix (first two digits) -> voivodeship, per Poczta Polska's
 * routing ranges. The ranges are contiguous across the full 00-99 span, so
 * every correctly formatted postal code resolves to a region: the tool
 * covers all of Poland, not just one voivodeship.
 */
const PREFIX_REGIONS: { from: number; to: number; region: string }[] = [
  { from: 0, to: 5, region: "Mazowieckie" }, // Warsaw & surrounding districts
  { from: 6, to: 9, region: "Mazowieckie" }, // Ciechanów, Płock, Ostrołęka
  { from: 10, to: 13, region: "Warmińsko-Mazurskie" }, // Olsztyn & Warmia
  { from: 14, to: 16, region: "Podlaskie" }, // Białystok, Suwałki, Łomża
  { from: 17, to: 19, region: "Mazowieckie" }, // Biała Podlaska / Siedlce border
  { from: 20, to: 24, region: "Lubelskie" }, // Lublin & Zamość
  { from: 25, to: 29, region: "Świętokrzyskie" }, // Kielce & Radom
  { from: 30, to: 34, region: "Małopolskie" }, // Kraków & Podhale
  { from: 35, to: 39, region: "Podkarpackie" }, // Rzeszów & Tarnów
  { from: 40, to: 44, region: "Śląskie" }, // Katowice & Upper Silesia
  { from: 45, to: 49, region: "Opolskie" }, // Opole
  { from: 50, to: 59, region: "Dolnośląskie" }, // Wrocław & Lower Silesia
  { from: 60, to: 64, region: "Wielkopolskie" }, // Poznań & Greater Poland
  { from: 65, to: 69, region: "Lubuskie" }, // Zielona Góra / Gorzów Wielkopolski
  { from: 70, to: 74, region: "Zachodniopomorskie" }, // Szczecin & West Pomerania
  { from: 75, to: 79, region: "Zachodniopomorskie" }, // Koszalin (coastal)
  { from: 80, to: 84, region: "Pomorskie" }, // Gdańsk, Gdynia
  { from: 85, to: 89, region: "Kujawsko-Pomorskie" }, // Bydgoszcz & Toruń
  { from: 90, to: 99, region: "Łódzkie" }, // Łódź & central region
];

/** Inserts the dash as the user types, so "40001" becomes "40-001" instead
 *  of tripping the format warning. Strips anything that isn't a digit and
 *  caps at five digits. */
export function formatPolishPostalCode(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 5);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2)}`;
}

/** The voivodeship for a postal code's prefix, or null if the code isn't
 *  formatted as XX-XXX or its prefix falls outside the known ranges. */
export function getPolishRegion(postalCode: string): string | null {
  const trimmed = postalCode.trim();
  if (!POLISH_POSTAL_CODE_REGEX.test(trimmed)) return null;
  const prefix = Number(trimmed.slice(0, 2));
  const match = PREFIX_REGIONS.find((r) => prefix >= r.from && prefix <= r.to);
  return match ? match.region : null;
}

export function isPolishPostalCode(postalCode: string): boolean {
  return getPolishRegion(postalCode) !== null;
}

/** What is wrong with this postal code, or null when nothing is. */
export type PostalCodeIssue = "invalidFormat";

/**
 * The problem, not the sentence: the wording lives in the i18n dictionary
 * under `postalCode`, keyed by the returned issue.
 */
export function postalCodeIssue(postalCode: string): PostalCodeIssue | null {
  const trimmed = postalCode.trim();
  if (!trimmed) return null;
  return isPolishPostalCode(trimmed) ? null : "invalidFormat";
}
