/**
 * alternativeHeating.ts — what the SAME household would pay if only the space
 * heating source changed, everything else held fixed.
 *
 * This is Block 2 and Block 3 of the financials screen: for each replacement
 * option, the running cost on today's numbers (Block 2), and the plain
 * subtraction against the baseline (Block 3). Nothing here proposes what to
 * actually install — that is `verdict.ts`'s job, once it has more than running
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
 *   - No PV netting, no capex, no financing, no subsidy. Those layer on top of
 *     this number later; they do not change it.
 *   - The useful heat a replacement has to deliver is taken from the coal
 *     system's own `spaceHeatKwh` — the building needs the same warmth
 *     regardless of what makes it, so anchoring on the coal system's own
 *     delivered heat is what keeps this comparable to the baseline it is
 *     measured against, rather than a second, independent guess at heat
 *     demand.
 *   - Efficiencies and COPs come from `sheet.constants.ts`'s own FUEL rows —
 *     the same point-value source `baseline.ts` reproduces — so the two sides
 *     of the comparison come from one consistent model rather than mixing
 *     sheet point values here with the low/mid/high bands `constants.pl.ts`
 *     uses elsewhere in this codebase.
 *
 * Knows nothing about React.
 */

import * as S from "../data/sheet.constants";
import type { Baseline } from "./baseline";
import type { ElectricityTariffCase } from "../wizard/householdCases";

export type AlternativeHeatingId = "airToAirHp" | "airToWaterHp" | "pellet";

export interface AlternativeHeatingOption {
  id: AlternativeHeatingId;
  name: string;
  /** Plain-language description of the appliance, no jargon. */
  description: string;
  /** How to say its conversion efficiency to a household, not an engineer. */
  efficiencyLabel: string;
}

export const ALTERNATIVE_HEATING_OPTIONS: AlternativeHeatingOption[] = [
  {
    id: "airToAirHp",
    name: "Air-to-air heat pump",
    description:
      "Wall or ceiling units that heat air directly, the way a reverse-cycle air conditioner does.",
    efficiencyLabel:
      "delivers about 4 kWh of heat for every 1 kWh of electricity it uses",
  },
  {
    id: "airToWaterHp",
    name: "Air-to-water heat pump",
    description:
      "Connects to your existing radiators, heating the water that runs through them the way your coal boiler does now.",
    efficiencyLabel:
      "delivers about 3 kWh of heat for every 1 kWh of electricity it uses",
  },
  {
    id: "pellet",
    name: "Pellet boiler",
    description:
      "Burns compressed wood pellets automatically in place of coal, through a similar boiler and the same radiators.",
    efficiencyLabel: "turns about 85% of the pellets' energy into heat",
  },
];

export interface AlternativeHeatingCost {
  id: AlternativeHeatingId;
  name: string;
  description: string;
  efficiencyLabel: string;

  /** What the replacement itself burns or draws, space heating only. */
  fuelPerYear: number;
  fuelUnit: "kWh" | "t";
  /** What that fuel costs, space heating only — the one line that changed. */
  spaceHeatingPlnPerYear: number;

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
 * a better figure — there usually is not one, since a building's heat demand
 * does not depend on what currently meets it.
 */
export function calculateAlternativeHeatingCost(
  id: AlternativeHeatingId,
  baseline: Baseline,
  electricityTariff: ElectricityTariffCase,
  usefulHeatKwh: number = baseline.energy.spaceHeatKwh,
): AlternativeHeatingCost {
  const option = ALTERNATIVE_HEATING_OPTIONS.find((o) => o.id === id);
  if (!option) {
    throw new Error(`Unknown alternative heating option: ${id}`);
  }

  let fuelPerYear: number;
  let fuelUnit: "kWh" | "t";
  let spaceHeatingPlnPerYear: number;

  if (id === "pellet") {
    // Combustion efficiency below one: input = useful heat / efficiency.
    const spec = S.SHEET_FUELS.Pellet;
    const tonnes = usefulHeatKwh / (spec.kwhPerUnit * spec.efficiency);
    fuelPerYear = tonnes;
    fuelUnit = "t";
    spaceHeatingPlnPerYear = tonnes * spec.plnPerUnit + spec.fixedPlnPerYear;
  } else {
    // Heat pump COP above one, same formula: input = useful heat / COP.
    const fuelKey: S.SheetFuel =
      id === "airToAirHp" ? "air-to-air HP" : "air-to-water HP";
    const spec = S.SHEET_FUELS[fuelKey];
    const kwh = usefulHeatKwh / spec.efficiency;
    fuelPerYear = kwh;
    fuelUnit = "kWh";
    spaceHeatingPlnPerYear = kwh * electricityPricePerKwh(electricityTariff);
  }

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
    name: option.name,
    description: option.description,
    efficiencyLabel: option.efficiencyLabel,
    fuelPerYear,
    fuelUnit,
    spaceHeatingPlnPerYear,
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
): AlternativeHeatingCost[] {
  return ALTERNATIVE_HEATING_OPTIONS.map((option) =>
    calculateAlternativeHeatingCost(option.id, baseline, electricityTariff),
  );
}
