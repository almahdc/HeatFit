/**
 * Formatting shared by every report renderer (generateReportPdf.ts,
 * generateReportText.ts): one place so the PDF a household downloads and the
 * plain-text copy emailed to the team always agree on how a złoty amount or
 * a date reads.
 */

import type { Language } from "../i18n";

export const zl = (n: number) =>
  `${Math.round(n)
    .toLocaleString("pl-PL", { useGrouping: true })
    .replace(/\xa0/g, " ")} zł`;

export function formatReportDate(date: Date, lang: Language): string {
  return date.toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
