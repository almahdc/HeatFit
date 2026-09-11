/**
 * Silesian anti-smog resolution: solid-fuel boiler deadlines and fines.
 *
 * Source: Uchwała nr V/36/1/2017 Sejmiku Województwa Śląskiego z dnia 7
 * kwietnia 2017 r. w sprawie wprowadzenia na obszarze województwa śląskiego
 * ograniczeń w zakresie eksploatacji instalacji, w których następuje
 * spalanie paliw (the "Silesian anti-smog resolution"), §8.
 * https://przywracamyblekit.slaskie.pl/pl/baza-wiedzy/uchwala-antysmogowa.html
 *
 * This is regulatory data rendered straight onto the results screen, not a
 * modelling assumption: a wrong date or amount here is one a household could
 * act on. Every value below carries its own VERIFY comment for that reason,
 * in the same spirit as the Sourced<T>/SourcedBand convention in
 * constants.pl.ts, even though the shape here is simpler (plain dates and
 * amounts, not low/mid/high bands).
 *
 * Last verified: 2026-09-11
 */

/** The four tiers §8 sorts a solid-fuel boiler into. Age tiers are measured
 *  from the boiler's age when the resolution took effect, not from today;
 *  `class3Or4` is not an age band at all: it overrides age whenever the
 *  boiler already meets one of those two classes. See
 *  engines/regulatoryDeadlines.ts for how a household's answers map here. */
export type SilesianBoilerDeadlineTier =
  "over10Years" | "fiveToTenYears" | "under5Years" | "class3Or4";

/** The Class 5 deadline for each tier, ISO yyyy-mm-dd. */
export const SILESIAN_CLASS5_DEADLINE: Record<
  SilesianBoilerDeadlineTier,
  string
> = {
  over10Years:
    // VERIFY: §8 ust. 1 pkt 1: boilers over 10 years old on the resolution's
    // effective date (or with no nameplate to prove otherwise) had to reach
    // Class 5 by 1 January 2022.
    // Source: przywracamyblekit.slaskie.pl/pl/baza-wiedzy/uchwala-antysmogowa.html
    // Last verified: 2026-09-11
    "2022-01-01",
  fiveToTenYears:
    // VERIFY: §8 ust. 1 pkt 2: boilers 5-10 years old on the effective date
    // had until 1 January 2024 to reach Class 5.
    // Source: przywracamyblekit.slaskie.pl/pl/baza-wiedzy/uchwala-antysmogowa.html
    // Last verified: 2026-09-11
    "2024-01-01",
  under5Years:
    // VERIFY: §8 ust. 1 pkt 3: boilers under 5 years old on the effective
    // date had until 1 January 2026 to reach Class 5.
    // Source: przywracamyblekit.slaskie.pl/pl/baza-wiedzy/uchwala-antysmogowa.html
    // Last verified: 2026-09-11
    "2026-01-01",
  class3Or4:
    // VERIFY: §8 ust. 2: boilers already meeting Class 3 or Class 4, of any
    // age, have until 1 January 2028 to reach Class 5.
    // Source: przywracamyblekit.slaskie.pl/pl/baza-wiedzy/uchwala-antysmogowa.html
    // Last verified: 2026-09-11
    "2028-01-01",
};

/** Fines for operating an installation in breach of the resolution. Can be
 *  reimposed each time the installation is found in use again after its
 *  deadline: this is not a one-off penalty. */
export const SILESIAN_ANTI_SMOG_FINE = {
  // VERIFY: on-the-spot mandate ceiling.
  // Source: przywracamyblekit.slaskie.pl/pl/baza-wiedzy/uchwala-antysmogowa.html
  // Last verified: 2026-09-11
  onTheSpotMaxPln: 500,
  // VERIFY: ceiling when pursued as a wykroczenie via court motion (wniosek
  // o ukaranie) rather than an on-the-spot mandate.
  // Source: przywracamyblekit.slaskie.pl/pl/baza-wiedzy/uchwala-antysmogowa.html
  // Last verified: 2026-09-11
  courtMotionMaxPln: 5000,
};

export const SILESIAN_ANTI_SMOG_SOURCE_URL =
  "https://przywracamyblekit.slaskie.pl/pl/baza-wiedzy/uchwala-antysmogowa.html";
