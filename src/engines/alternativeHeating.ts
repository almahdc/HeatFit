/**
 * alternativeHeating.ts: what the SAME household would pay if only the space
 * heating source changed, everything else held fixed.
 *
 * This is Block 2 and Block 3 of the financials screen: for each replacement
 * option, the running cost on today's numbers (Block 2), and the plain
 * subtraction against the baseline (Block 3). Nothing here proposes what to
 * actually install: that is `verdict.ts`'s job, once it has more than running
 * cost to weigh. This module only answers "what would the meter say".
 *
 * Deliberately narrow, the same way `baseline.ts` is narrow:
 *
 *   - Only the space heating fuel changes. Hot water and "everything else on
 *     the meter" (lighting, appliances, cooling) are carried over from the
 *     baseline unchanged. A heat pump swap in real life might also replace the
 *     water heater; that is a real question, but a different one from "what
 *     does the space heating alone cost", and folding it in here would hide
 *     which number moved. See docs/alternative-heating-model.md.
 *   - No capex, no financing, no subsidy. Those layer on top of this number
 *     later; they do not change it. PV running-cost netting is the one
 *     exception: see below.
 *   - The useful heat a replacement has to deliver is taken from the coal
 *     system's own `spaceHeatKwh`: the building needs the same warmth
 *     regardless of what makes it, so anchoring on the coal system's own
 *     delivered heat is what keeps this comparable to the baseline it is
 *     measured against, rather than a second, independent guess at heat
 *     demand.
 *   - Efficiencies and COPs come from `sheet.constants.ts`'s own FUEL rows —
 *     the same point-value source `baseline.ts` reproduces: so the two sides
 *     of the comparison come from one consistent model rather than mixing
 *     sheet point values here with the low/mid/high bands `constants.pl.ts`
 *     uses elsewhere in this codebase.
 *
 * PV: a heat pump's new electricity draw joins the SAME household meter that
 * `baseline.ts` already nets PV self-consumption and export against: it is
 * not a separate pool. So a heat pump's space heating cost here is priced as
 * the MARGINAL cost of adding its kWh on top of the household's existing
 * consumption, run back through `baseline.ts`'s own `electricityCost()`:
 *
 *   marginal cost = electricityCost(existing + new, ...) - electricityCost(existing, ...)
 *
 * With no PV this collapses to exactly `new kWh x price`: the same figure
 * this file always computed, so nothing changes for a household without
 * panels. With PV, the extra consumption raises the self-consumed share
 * (a fixed 25% of whatever the meter draws), so the marginal cost of the new
 * kWh comes out lower than the flat rate would suggest. Water heating and
 * "electricity & cooling" are untouched either way: they are still whatever
 * `baseline.ts` already priced for the household's existing consumption, PV
 * included.
 */

import * as S from "../data/sheet.constants";
import { electricityCost } from "./baseline";
import type { Baseline } from "./baseline";
import type { ElectricityTariffCase } from "../wizard/householdCases";

export type AlternativeHeatingId = "airToAirHp" | "airToWaterHp" | "pellet";

/**
 * The options, in the order they should be offered.
 *
 * Ids only. Every word a household reads about these appliances (name,
 * description, how to say their efficiency) lives in the i18n dictionary
 * under `alternatives.options`, keyed by these same ids, so there is one
 * source of display text per language and no English to leak through.
 */
export const ALTERNATIVE_HEATING_IDS: AlternativeHeatingId[] = [
  "airToAirHp",
  "airToWaterHp",
  "pellet",
];

/**
 * Every assumption behind one option's numbers, said plainly enough for a
 * household to read : not "missing data filled in" the way
 * `BaselineAssumption` is (nothing here is optional or answer-dependent),
 * but the modelling choices this file always makes for that option and PV
 * state, since the household never entered a COP or a self-consumption
 * share themselves.
 */
export type AlternativeHeatingAssumption =
  | { code: "usefulHeatCarriedOver"; kwhPerYear: number }
  | {
      code: "pelletEfficiencyAndPrice";
      efficiencyPct: number;
      pricePerTonnePln: number;
    }
  | {
      code: "heatPumpCop";
      id: "airToAirHp" | "airToWaterHp";
      cop: number;
      pricePerKwh: number;
      tariff: ElectricityTariffCase;
    }
  | { code: "pvMarginalPricing"; selfConsumedSharePct: number }
  | { code: "carriedOverFromBaseline" };

export interface AlternativeHeatingCost {
  id: AlternativeHeatingId;

  /** Said plainly, for the "What we assumed" section on screen. */
  assumptions: AlternativeHeatingAssumption[];

  /** What the replacement itself burns or draws, space heating only. */
  fuelPerYear: number;
  fuelUnit: "kWh" | "t";
  /** What that fuel costs, space heating only: the one line that changed. */
  spaceHeatingPlnPerYear: number;
  /**
   * How much of `spaceHeatingPlnPerYear`'s absence PV is responsible for:
   * the flat, un-netted cost of the same kWh minus what was actually
   * charged. Zero for a household with no PV, and always zero for pellet
   * (combustion, not electricity: PV cannot touch its fuel cost).
   */
  pvSavingsOnSpaceHeatingPlnPerYear: number;

  /** Carried over from the baseline, unchanged by this swap. */
  waterHeatingPlnPerYear: number;
  electricityAndCoolingPlnPerYear: number;

  totalPlnPerYear: number;
  totalPlnPerMonth: number;

  /** Baseline total minus this total. Positive means cheaper than coal. */
  savingsPlnPerYear: number;
  savingsPlnPerMonth: number;
}

function electricityPricePerKwh(tariff: ElectricityTariffCase): number {
  return S.SHEET_ELECTRICITY_PRICE[S.TARIFF_FROM_WIZARD[tariff]];
}

/**
 * Running cost of one replacement option, on the household's baseline.
 *
 * `usefulHeatKwh` is the coal system's own `spaceHeatKwh` unless a caller has
 * a better figure: there usually is not one, since a building's heat demand
 * does not depend on what currently meets it.
 *
 * `hasPvPanels` should be the same value `baseline` itself was computed with
 *: this only prices the NEW electricity a heat pump adds; it does not
 * re-derive whether the household has panels at all.
 */
export function calculateAlternativeHeatingCost(
  id: AlternativeHeatingId,
  baseline: Baseline,
  electricityTariff: ElectricityTariffCase,
  usefulHeatKwh: number = baseline.energy.spaceHeatKwh,
  hasPvPanels: boolean = false,
): AlternativeHeatingCost {
  let fuelPerYear: number;
  let fuelUnit: "kWh" | "t";
  let spaceHeatingPlnPerYear: number;
  let pvSavingsOnSpaceHeatingPlnPerYear = 0;
  const assumptions: AlternativeHeatingAssumption[] = [
    { code: "usefulHeatCarriedOver", kwhPerYear: usefulHeatKwh },
  ];

  if (id === "pellet") {
    // Combustion efficiency below one: input = useful heat / efficiency.
    // Not electric, so PV has nothing to net against here.
    const spec = S.SHEET_FUELS.Pellet;
    const tonnes = usefulHeatKwh / (spec.kwhPerUnit * spec.efficiency);
    fuelPerYear = tonnes;
    fuelUnit = "t";
    spaceHeatingPlnPerYear = tonnes * spec.plnPerUnit + spec.fixedPlnPerYear;
    assumptions.push({
      code: "pelletEfficiencyAndPrice",
      efficiencyPct: Math.round(spec.efficiency * 100),
      pricePerTonnePln: spec.plnPerUnit,
    });
  } else {
    // Heat pump COP above one, same formula: input = useful heat / COP.
    const fuelKey: S.SheetFuel =
      id === "airToAirHp" ? "air-to-air HP" : "air-to-water HP";
    const spec = S.SHEET_FUELS[fuelKey];
    const kwh = usefulHeatKwh / spec.efficiency;
    fuelPerYear = kwh;
    fuelUnit = "kWh";

    const price = electricityPricePerKwh(electricityTariff);
    const tariff = S.TARIFF_FROM_WIZARD[electricityTariff];
    const flatCost = kwh * price;

    // This new draw shares the household's one meter with everything else,
    // so it is priced as what adding it changes the household's total
    // electricity bill by: not as if it were its own separate, unpaneled
    // connection.
    const existingKwh =
      baseline.electricity.measuredKwh ?? baseline.electricity.modelledKwh;
    const marginalCost =
      electricityCost(existingKwh + kwh, tariff, hasPvPanels) -
      electricityCost(existingKwh, tariff, hasPvPanels);

    spaceHeatingPlnPerYear = marginalCost;
    pvSavingsOnSpaceHeatingPlnPerYear = flatCost - marginalCost;

    assumptions.push({
      code: "heatPumpCop",
      id,
      cop: spec.efficiency,
      pricePerKwh: price,
      tariff: electricityTariff,
    });
    if (hasPvPanels) {
      assumptions.push({
        code: "pvMarginalPricing",
        selfConsumedSharePct: Math.round(S.SHEET_PV.shareUsedDirectly * 100),
      });
    }
  }

  assumptions.push({ code: "carriedOverFromBaseline" });

  const waterHeatingPlnPerYear = baseline.cost.waterHeatingPlnPerYear;
  const electricityAndCoolingPlnPerYear =
    baseline.cost.electricityAndCoolingPlnPerYear;

  const totalPlnPerYear =
    spaceHeatingPlnPerYear +
    waterHeatingPlnPerYear +
    electricityAndCoolingPlnPerYear;

  const savingsPlnPerYear = baseline.cost.totalPlnPerYear - totalPlnPerYear;

  return {
    id,
    assumptions,
    fuelPerYear,
    fuelUnit,
    spaceHeatingPlnPerYear,
    pvSavingsOnSpaceHeatingPlnPerYear,
    waterHeatingPlnPerYear,
    electricityAndCoolingPlnPerYear,
    totalPlnPerYear,
    totalPlnPerMonth: totalPlnPerYear / 12,
    savingsPlnPerYear,
    savingsPlnPerMonth: savingsPlnPerYear / 12,
  };
}

/** All three options, in the order they should be offered. */
export function calculateAllAlternativeHeatingCosts(
  baseline: Baseline,
  electricityTariff: ElectricityTariffCase,
  hasPvPanels: boolean = false,
): AlternativeHeatingCost[] {
  return ALTERNATIVE_HEATING_IDS.map((id) =>
    calculateAlternativeHeatingCost(
      id,
      baseline,
      electricityTariff,
      undefined,
      hasPvPanels,
    ),
  );
}
