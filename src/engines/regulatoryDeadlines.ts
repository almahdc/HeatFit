/**
 * regulatoryDeadlines.ts: whether, and by when, a household's boiler is
 * required to meet the Silesian anti-smog resolution's emission class.
 *
 * Scope is deliberately narrow: only the Silesian voivodeship (Uchwała
 * V/36/1/2017, §8) and only solid-fuel central heating boilers. HeatFit's
 * intake is exclusively single-family homes currently heated by a coal-fired
 * central heating boiler (see the wizard's welcome copy, and the required
 * boilerYear/boilerClass fields: there is no "fireplace or stove only" path
 * through the intake). Every household that reaches this engine already has
 * a solid-fuel boiler, so that half of the eligibility check needs no extra
 * intake field; region is derived from the postal code already collected on
 * step 1.
 *
 * Knows nothing about React or verdict phrasing: see
 * RegulatoryCountdownCard.tsx for how this is worded on screen.
 */

import { getPolishRegion } from "../utils/postalCode";
import type { BoilerClass } from "../wizard/householdCases";
import {
  SILESIAN_CLASS5_DEADLINE,
  type SilesianBoilerDeadlineTier,
} from "../data/silesianAntiSmogResolution";

/** The voivodeship the resolution applies to. `getPolishRegion` already
 *  names it this way. */
const SILESIAN_REGION = "Śląskie";

/** §8's age bands are measured from the boiler's age when the resolution
 *  took effect, not from today: a boiler already 8 years old in 2017 was
 *  always going to cross into the ">10 years" band in 2019, years before
 *  today's date. */
const RESOLUTION_YEAR = 2017;

export type BoilerDeadlineStatus = "passed" | "upcoming";

export interface BoilerDeadline {
  tier: SilesianBoilerDeadlineTier;
  /** ISO yyyy-mm-dd the boiler must meet Class 5 by. */
  deadline: string;
  /** Derived from `now`, not stored: a tier that reads "upcoming" today
   *  must read "passed" once its own date is behind us. */
  status: BoilerDeadlineStatus;
  /** True when the tier was inferred from age alone because the only
   *  credential the household gave us is Ecodesign certification: a
   *  separate EU standard (Regulation (EU) 2015/1189) that does not by
   *  itself confirm the Class 5 rating this resolution is written against.
   *  A boiler this applies to may in fact be compliant; the household's own
   *  answer just cannot tell us either way, so the card hedges instead of
   *  asserting non-compliance outright. */
  ecodesignCaveat: boolean;
}

/** Whether a postal code falls inside the Silesian voivodeship. Returns
 *  false for a malformed or non-Polish code rather than guessing. */
export function isSilesianPostalCode(postalCode: string): boolean {
  return getPolishRegion(postalCode) === SILESIAN_REGION;
}

/**
 * Which of §8's four tiers a boiler falls into, or null when the boiler
 * already meets Class 5 and owes nothing further under this resolution.
 *
 * Class 3/4 overrides age: §8 ust. 2 gives those boilers until 2028
 * regardless of how old they are. Age decides the tier for anything else,
 * including a boiler that does not yet meet any class ("bezklasowy") and one
 * whose only credential is Ecodesign certification.
 *
 * Ecodesign is deliberately NOT treated as Class 5. It is a separate EU
 * standard (Regulation (EU) 2015/1189) with its own emission and efficiency
 * floor, not the Polish PN-EN 303-5 class rating this resolution is written
 * against; a household knowing "Ecodesign" tells us nothing certain about
 * Class 5. So an Ecodesign-only boiler is bucketed by age exactly like an
 * unclassed one, and the result carries `ecodesignCaveat: true` so the card
 * can hedge ("may not meet") rather than assert non-compliance it cannot
 * actually confirm.
 *
 * An unknown installation year is treated the same as "more than 10 years
 * old" (the most conservative tier), for both bezklasowy and Ecodesign.
 */
export function getSilesianBoilerDeadline(
  boilerClass: BoilerClass,
  boilerYear: number | "",
  now: Date = new Date(),
): BoilerDeadline | null {
  if (boilerClass === "class5") return null;

  const tier: SilesianBoilerDeadlineTier =
    boilerClass === "class3" || boilerClass === "class4"
      ? "class3Or4"
      : ageTier(boilerYear);

  const deadline = SILESIAN_CLASS5_DEADLINE[tier];
  return {
    tier,
    deadline,
    status: now >= new Date(deadline) ? "passed" : "upcoming",
    ecodesignCaveat: boilerClass === "ecodesign",
  };
}

function ageTier(
  boilerYear: number | "",
): Extract<
  SilesianBoilerDeadlineTier,
  "over10Years" | "fiveToTenYears" | "under5Years"
> {
  if (boilerYear === "") return "over10Years";
  const ageAtResolution = RESOLUTION_YEAR - boilerYear;
  if (ageAtResolution > 10) return "over10Years";
  if (ageAtResolution >= 5) return "fiveToTenYears";
  return "under5Years";
}

/**
 * The deadline to show on the results screen, or null when no card should
 * show: outside Silesia, or a boiler that already meets Class 5.
 */
export function getRegulatoryCountdown(
  postalCode: string,
  boilerClass: BoilerClass,
  boilerYear: number | "",
  now: Date = new Date(),
): BoilerDeadline | null {
  if (!isSilesianPostalCode(postalCode)) return null;
  return getSilesianBoilerDeadline(boilerClass, boilerYear, now);
}

/** Months and days between two dates, e.g. for "15 months, 21 days
 *  remaining". Assumes `to` is on or after `from`; the countdown card only
 *  ever calls this for an "upcoming" deadline, so that always holds. */
export function monthsAndDaysUntil(
  from: Date,
  to: Date,
): { months: number; days: number } {
  let months =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth());

  const monthMark = new Date(from);
  monthMark.setMonth(monthMark.getMonth() + months);

  if (monthMark > to) {
    months -= 1;
    monthMark.setMonth(monthMark.getMonth() - 1);
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.round((to.getTime() - monthMark.getTime()) / msPerDay);

  return { months: Math.max(0, months), days: Math.max(0, days) };
}
