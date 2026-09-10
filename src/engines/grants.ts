/**
 * grants.ts : how much of the capex Czyste Powietrze actually pays for.
 *
 * Source: the sheet's `subsidies` tab, transcribed into `sheet.constants.ts`.
 * Read that tab's own row ids (H3, H4, H7) in the results below : every złoty
 * here can be traced back to one line of the sheet in a few seconds.
 *
 * --- Two limits, not one ----------------------------------------------------
 *
 * A grant is the SMALLER of two things, and conflating them is the classic way
 * to overstate one:
 *
 *   the rate  : the programme pays 40% / 70% / 100% of eligible cost by tier
 *   the cap   : and never more than a fixed złoty ceiling for that device
 *
 * so `grant = min(cap, cost x rate)`. On a cheap job the rate binds; on an
 * expensive one the cap does. The result below says which one bit, because
 * "you have hit the ceiling" and "the programme pays 40%" lead a household to
 * completely different next moves.
 *
 * --- The gate that pays nothing ---------------------------------------------
 *
 * The single most consequential rule in the whole programme is not an amount.
 * Above 140 kWh/m²/y of pre-project demand, a heat-source-only project is NOT
 * ELIGIBLE AT ALL. The building has to be insulated as well, to at least a 40%
 * cut. HeatFit models heat-source swaps and nothing else, so for a household in
 * that band the honest answer is zero, plus an explanation : not a grant they
 * would apply for and be refused.
 *
 * That band is also the only one where the highest tier exists. A household
 * below 140 kWh/m²/y cannot reach it however low their income is, so a tier
 * they have selected is clamped down rather than paid out.
 */

import * as S from "../data/sheet.constants";
import type { AlternativeHeatingId } from "./alternativeHeating";

export type IncomeTier = S.IncomeTier;

/** Which subsidies-tab line each replacement option claims against. */
export const GRANT_LINE_FOR_OPTION: Record<AlternativeHeatingId, string> = {
  airToWaterHp: "H3",
  airToAirHp: "H4",
  pellet: "H7",
};

export const INCOME_TIER_LABEL: Record<IncomeTier, string> = {
  basic: "Basic",
  increased: "Increased",
  highest: "Highest",
};

export interface GrantLine {
  /** The subsidies tab row this came from, e.g. "H3". */
  sheetLineId: string;
  label: string;
  /** Cost this line is claimed against. */
  eligibleCostPln: number;
  /** Share of eligible cost the tier pays. */
  rate: number;
  /** Ceiling for this line at this tier. */
  capPln: number;
  /** min(cap, cost x rate). */
  amountPln: number;
  /** True when the ceiling bit, false when the rate did. */
  cappedOut: boolean;
}

export interface GrantResult {
  /** The tier actually used, which may have been clamped down from the one asked for. */
  tier: IncomeTier;
  /** The tier the caller asked for, before any clamp. */
  requestedTier: IncomeTier;
  band: S.SheetScopeBand;
  /** False when a heat-source-only project cannot claim in this band at all. */
  heatSourceEligible: boolean;
  heating: GrantLine | null;
  solar: GrantLine | null;
  totalGrantPln: number;
  /** Things the household must be told. Shown verbatim. */
  warnings: string[];
}

/** The scope band a building's pre-project demand falls in. */
export function scopeBandFor(spaceHeatPerM2: number): S.SheetScopeBand {
  return S.SHEET_SCOPE_BANDS.find((b) => spaceHeatPerM2 < b.maxKwhPerM2)!;
}

/**
 * Which tier a household's income puts them in, or null when they earn too
 * much to claim at all.
 *
 * Checked highest-first because the thresholds nest: anyone under the highest
 * threshold is also under the increased one, so testing in the other order
 * would put the poorest households in the least generous tier.
 */
export function incomeTierFor(
  monthlyHouseholdIncomePln: number,
  occupants: number,
): IncomeTier | null {
  const t = S.SHEET_INCOME_TIERS;
  const key = occupants <= 1 ? "single" : "multi";
  const perPerson = monthlyHouseholdIncomePln / Math.max(1, occupants);

  if (perPerson <= t.highestMaxPerPersonPlnPerMonth[key]) return "highest";
  if (perPerson <= t.increasedMaxPerPersonPlnPerMonth[key]) return "increased";
  if (monthlyHouseholdIncomePln <= t.basicMaxHouseholdPlnPerMonth)
    return "basic";
  return null;
}

function claim(
  line: S.SheetGrantLine,
  eligibleCostPln: number,
  tier: IncomeTier,
): GrantLine {
  const rate = S.SHEET_FUNDING_RATE[tier];
  const capPln = line.capByTier[tier];
  const byRate = eligibleCostPln * rate;
  return {
    sheetLineId: line.id,
    label: line.label,
    eligibleCostPln,
    rate,
    capPln,
    amountPln: Math.min(capPln, byRate),
    cappedOut: capPln < byRate,
  };
}

/**
 * What this household gets towards this project.
 *
 * `heatingCapexPln` is whatever gross figure the UI is showing : the grant is
 * always claimed against the cost actually on screen, so the arithmetic a
 * household can do in their head (gross minus grant is net) always holds.
 *
 * `solarCapexPln` is zero unless they have chosen to add panels. Solar is a
 * different programme with its own rules, so it is claimed as its own line and
 * is not subject to the Czyste Powietrze scope gate above.
 */
export function calculateGrant({
  optionId,
  heatingCapexPln,
  solarCapexPln = 0,
  tier: requestedTier,
  spaceHeatPerM2,
}: {
  optionId: AlternativeHeatingId;
  heatingCapexPln: number;
  solarCapexPln?: number;
  tier: IncomeTier;
  spaceHeatPerM2: number;
}): GrantResult {
  const band = scopeBandFor(spaceHeatPerM2);
  const warnings: string[] = [];

  let tier = requestedTier;
  if (tier === "highest" && !band.highestTierAvailable) {
    tier = "increased";
    warnings.push(
      `The highest funding level is only open to buildings above 140 kWh/m²/y. ` +
        `This one is around ${Math.round(spaceHeatPerM2)}, so the increased level applies instead.`,
    );
  }

  const heatSourceEligible = band.heatSourceAloneEligible;
  let heating: GrantLine | null = null;

  if (!heatSourceEligible) {
    warnings.push(
      `At around ${Math.round(spaceHeatPerM2)} kWh/m²/y, Czyste Powietrze will not fund a new heat source on its own. ` +
        `The building has to be insulated as part of the same project, reaching ${band.requiredEndState}. ` +
        `HeatFit does not price insulation work yet, so no grant is counted here.`,
    );
  } else {
    const line = S.SHEET_GRANT_LINES[GRANT_LINE_FOR_OPTION[optionId]]!;
    heating = claim(line, heatingCapexPln, tier);
  }

  let solar: GrantLine | null = null;
  if (solarCapexPln > 0) {
    const rate = S.SHEET_PV_GRANT_RATE[tier];
    solar = {
      sheetLineId: "PV",
      label: "Solar panels",
      eligibleCostPln: solarCapexPln,
      rate,
      capPln: Number.POSITIVE_INFINITY,
      amountPln: solarCapexPln * rate,
      cappedOut: false,
    };
    warnings.push(
      `The solar figure follows the sheet's own PV rate. The subsidies tab records PV support running through ` +
        `przydomowemagazyny.gov.pl, capped at ${S.SHEET_PV_GRANT_PAUSED_CAP_PLN.toLocaleString("pl-PL", { useGrouping: true })} zł, ` +
        `and marks that programme PAUSED : so treat this line as indicative, not as money you can count on.`,
    );
  }

  return {
    tier,
    requestedTier,
    band,
    heatSourceEligible,
    heating,
    solar,
    totalGrantPln: (heating?.amountPln ?? 0) + (solar?.amountPln ?? 0),
    warnings,
  };
}
