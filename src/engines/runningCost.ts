/**
 * runningCost.ts — the spine of the product.
 *
 * Turns one honest answer ("I burned 4 tonnes of coal last winter") into the
 * annual running cost of every heating option, with the uncertainty carried
 * through.
 *
 * Why tonnage and not floor area: tonnage is measured energy that already
 * happened in this specific house, with this insulation, at this family's
 * comfort level. Floor area is a guess about all three. Every competing Polish
 * calculator asks for floor area. This is the difference.
 *
 * This module knows nothing about React, subsidies, loans or verdicts.
 */

import {
  Confidence,
  Range,
  add,
  divide,
  exact,
  fromSpread,
  multiply,
  range,
  scale,
} from "./range";
import * as C from "../data/constants.pl";

// --- inputs -----------------------------------------------------------------

export type Tariff = "G11" | "G12w";

export interface HouseFacts {
  /** Tonnes of coal BOUGHT for the last heating season. */
  coalTonnesBought: number;
  /**
   * Tonnes still unburnt at the end of the season. Bought is not burned — a
   * tonne left in the cellar overstates demand by around 25% on a four-tonne
   * house, which is larger than most of the corrections this model applies.
   */
  coalTonnesLeftOver?: number;
  /** Which grade. Drives calorific value; "unknown" widens the band substantially. */
  coalType: C.CoalType;
  /** Emission class and feed type. Drive combustion efficiency. */
  boilerClass: C.BoilerClass;
  feedType: C.FeedType;
  /**
   * Did the household also burn wood or offcuts? A flag, not a volume —
   * nobody knows their cubic metres, and a bad guess on a high-leverage input
   * is worse than an honest widening.
   */
  burntWoodToo?: boolean;
  /** Heated floor area in m2. Used only for the insulate-first check, never for demand. */
  heatedAreaM2: number;
  /**
   * Seasonal coefficient of performance for the heat pump in THIS house.
   * Comes from radiators.ts (photos -> flow temperature -> SCOP).
   * Passed in rather than computed here so this module stays independent.
   */
  heatPumpScop: Range;
  /** What they actually paid per tonne, if they remember. Beats any dataset. */
  coalPricePaidPerTonne?: number;
  /** Which electricity tariff to price the heat pump on. */
  tariff: Tariff;
  /** Annual kWh the PV array is expected to offset, if any. From a PV model. */
  pvOffsetKwhPerYear?: Range;
  /** People living here. Drives hot water volume, nothing else. */
  occupants?: number;
  /**
   * How hot water is made TODAY. This decides the sign of the whole hot water
   * correction, so it is asked rather than assumed:
   *
   *   coalAllYear   the tonnage already paid for hot water, so the coal
   *                 baseline is complete and space heat is the remainder
   *   coalThenElectric  the boiler is shut in summer and an immersion tank
   *                 takes over, so the household is already paying for
   *                 resistance heating that never appears in the coal figure
   *   electricAllYear   none of the hot water is in the tonnage
   *   other         gas, district, or unknown. Not modelled, left alone.
   */
  hotWaterNow?: HotWaterSource;
}

export type HotWaterSource =
  "coalAllYear" | "coalThenElectric" | "electricAllYear" | "other";

export interface RunningCost {
  /** Annual cost in zloty. */
  annual: Range;
  /** Annual cost divided by twelve. What the homeowner actually reads. */
  monthly: Range;
  /** Annual energy purchased, in the unit that fuel is sold in. */
  fuelQuantity: Range;
  fuelUnit: string;
  /**
   * Confidence in this scenario's cost, lifted from the annual band.
   * Present so callers cannot accidentally read `.confidence` off the wrapper
   * and get undefined. It is derived, never set independently.
   */
  confidence: Confidence;
}

// --- helpers ----------------------------------------------------------------

function band(b: C.SourcedBand): Range {
  return range(b.low, b.mid, b.high);
}

function toRunningCost(
  annual: Range,
  fuelQuantity: Range,
  fuelUnit: string,
): RunningCost {
  return {
    annual,
    monthly: scale(annual, 1 / 12),
    fuelQuantity,
    fuelUnit,
    confidence: annual.confidence,
  };
}

// --- step 1: what does this house actually need? ----------------------------

/** Coal actually burned = bought minus whatever is still in the cellar. */
export function coalActuallyBurned(bought: number, leftOver = 0): number {
  const burned = bought - leftOver;
  if (burned <= 0) {
    throw new Error(
      "coalActuallyBurned: leftover coal cannot equal or exceed what was bought",
    );
  }
  return burned;
}

export interface HeatDemandInputs {
  coalTonnesBought: number;
  coalTonnesLeftOver?: number;
  coalType: C.CoalType;
  boilerClass: C.BoilerClass;
  feedType: C.FeedType;
  burntWoodToo?: boolean;
}

/**
 * Coal burned -> useful heat delivered into the house, in kWh per year.
 *
 *   tonnes x 1000 kg/t x MJ/kg x boiler efficiency / 3.6 MJ per kWh
 *
 * Both the calorific value and the efficiency now come from lookup tables, so
 * answering "what do you burn" and "what class is it" narrows the band instead
 * of the model assuming an average house.
 *
 * The wood flag widens the result rather than adding a guessed quantity: a
 * household that also burnt wood has more demand than their coal implies, and
 * we say so honestly instead of inventing cubic metres.
 */
export function heatDemandFromCoal(input: HeatDemandInputs): Range {
  const tonnes = coalActuallyBurned(
    input.coalTonnesBought,
    input.coalTonnesLeftOver ?? 0,
  );

  const kg = exact(tonnes * 1000);
  const calorific = band(C.COAL_CALORIFIC_VALUE[input.coalType]);
  const efficiency = band(
    C.coalBoilerEfficiency(input.boilerClass, input.feedType),
  );

  const energyIn = scale(multiply(kg, calorific), 1 / C.MJ_PER_KWH);
  const fromCoal = multiply(energyIn, efficiency);

  if (!input.burntWoodToo) return fromCoal;

  // Wood adds unmeasured demand. Centre the estimate modestly above coal-only
  // and widen, so a heat pump sized from this is not undersized in January.
  return multiply(fromCoal, range(1.05, 1.25, 1.45));
}

/** Useful heat per square metre. Feeds the insulate-first verdict. */
export function heatDemandPerM2(demand: Range, heatedAreaM2: number): Range {
  if (heatedAreaM2 <= 0)
    throw new Error("heatDemandPerM2: area must be positive");
  return scale(demand, 1 / heatedAreaM2);
}

// --- hot water ---------------------------------------------------------------

/**
 * Useful hot water energy per year, from occupants alone.
 *
 * Deliberately not derived from floor area: hot water is a function of people
 * and habits, not square metres. Returns zero when we were not told, so every
 * caller degrades to the old behaviour rather than inventing a household.
 */
export function dhwDemand(occupants?: number): Range {
  if (!occupants || occupants <= 0) return exact(0);
  return scale(band(C.DHW_KWH_PER_PERSON_YEAR), occupants);
}

/**
 * How the total tonnage-derived demand splits.
 *
 * `heatDemandFromCoal` measures everything the coal boiler delivered. If that
 * boiler also heated water, hot water is already inside the total and must come
 * out before the remainder is called space heating. If it did not, the total is
 * space heating and hot water sits on top, paid for some other way.
 */
export function splitDemand(
  total: Range,
  dhw: Range,
  source: HotWaterSource | undefined,
): { spaceHeat: Range; dhw: Range; dhwInsideTonnage: Range } {
  if (!source || dhw.mid === 0) {
    return { spaceHeat: total, dhw: exact(0), dhwInsideTonnage: exact(0) };
  }

  const summerShare = band(C.SUMMER_DHW_SHARE);

  // Fraction of annual hot water the coal boiler actually made.
  let insideFraction: Range;
  if (source === "coalAllYear") insideFraction = exact(1);
  else if (source === "coalThenElectric") {
    insideFraction = range(
      1 - summerShare.high,
      1 - summerShare.mid,
      1 - summerShare.low,
    );
  } else insideFraction = exact(0);

  const inside = multiply(dhw, insideFraction);

  // Never let hot water exceed the measured total: a household that burns very
  // little coal and has many occupants would otherwise get negative space heat.
  const cappedInside = range(
    Math.min(inside.low, total.low),
    Math.min(inside.mid, total.mid),
    Math.min(inside.high, total.high),
  );

  const spaceHeat = range(
    Math.max(0, total.low - cappedInside.high),
    Math.max(0, total.mid - cappedInside.mid),
    Math.max(0, total.high - cappedInside.low),
  );

  return { spaceHeat, dhw, dhwInsideTonnage: cappedInside };
}

/**
 * Hot water the household currently buys as electricity, and never sees as a
 * heating cost. Immersion heating is COP 1.0, so this is the most expensive
 * possible way to make hot water and the easiest saving a heat pump makes.
 */
export function immersionKwh(
  dhw: Range,
  dhwInsideTonnage: Range,
  source: HotWaterSource | undefined,
): Range {
  if (!source || source === "coalAllYear" || source === "other")
    return exact(0);
  const outside = range(
    Math.max(0, dhw.low - dhwInsideTonnage.high),
    Math.max(0, dhw.mid - dhwInsideTonnage.mid),
    Math.max(0, dhw.high - dhwInsideTonnage.low),
  );
  return scale(outside, 1 / C.IMMERSION_EFFICIENCY.value);
}

// --- step 2: cost of each option --------------------------------------------

/**
 * Scenario A: change nothing. Keep buying coal.
 *
 * If the household remembers what they paid, use it — they know this number
 * precisely and no dataset does. Otherwise fall back to the regional band.
 */
export function coalRunningCost(
  coalTonnesBurnedPerYear: number,
  pricePaidPerTonne?: number,
  immersionKwhPerYear?: Range,
  tariff: Tariff = "G11",
): RunningCost {
  const tonnes = fromSpread(coalTonnesBurnedPerYear, 0.05); // recall, not a meter
  const price = pricePaidPerTonne
    ? fromSpread(pricePaidPerTonne, 0.05)
    : band(C.COAL_PRICE_PER_TONNE);
  let annual = multiply(tonnes, price);

  // A household that shuts the boiler in summer heats water with an immersion
  // tank for months. They pay for it on the electricity bill and never count it
  // as heating, so leaving it out understates what staying on coal costs.
  if (immersionKwhPerYear && immersionKwhPerYear.mid > 0) {
    annual = add(
      annual,
      multiply(immersionKwhPerYear, electricityPricePerKwh(tariff)),
    );
  }

  return toRunningCost(annual, tonnes, "t");
}

/**
 * Scenario B: pellet boiler.
 *
 * Same heat, better efficiency, different fuel. The wide pellet price band means
 * this scenario often lands inside another's error band, which is the honest
 * result given what happened to pellet prices last winter.
 */
export function pelletRunningCost(demand: Range): RunningCost {
  const energyNeededMj = scale(
    divide(demand, band(C.PELLET_BOILER_EFFICIENCY)),
    C.MJ_PER_KWH,
  );
  const kg = divide(energyNeededMj, band(C.PELLET_CALORIFIC_VALUE));
  const tonnes = scale(kg, 1 / 1000);
  const annual = multiply(tonnes, band(C.PELLET_PRICE_PER_TONNE));
  return toRunningCost(annual, tonnes, "t");
}

/**
 * Electricity a heat pump needs to deliver the same heat.
 * Demand divided by seasonal efficiency. Small radiators mean a high flow
 * temperature, a low SCOP, and a heat pump that loses on cost.
 */
export function heatPumpElectricityKwh(demand: Range, scop: Range): Range {
  if (scop.low <= 0)
    throw new Error("heatPumpElectricityKwh: SCOP must be positive");
  return divide(demand, scop);
}

/** Blended electricity price for a given tariff, given how much load moves off-peak. */
export function electricityPricePerKwh(tariff: Tariff): Range {
  if (tariff === "G11") return band(C.ELECTRICITY_G11_PER_KWH);

  const offpeakShare = band(C.HEAT_PUMP_OFFPEAK_SHARE);
  const peakShare = range(
    1 - offpeakShare.high,
    1 - offpeakShare.mid,
    1 - offpeakShare.low,
  );
  return add(
    multiply(offpeakShare, band(C.ELECTRICITY_G12W_OFFPEAK_PER_KWH)),
    multiply(peakShare, band(C.ELECTRICITY_G12W_PEAK_PER_KWH)),
  );
}

/**
 * Scenarios C and D: heat pump, optionally with PV.
 *
 * PV is modelled here only as kWh offset at the same blended price. Net billing
 * (export at market price, import at retail) is deliberately NOT modelled in
 * this module — it belongs in a pv.ts that understands the settlement rules.
 * Passing a naive offset in is fine for the demo, but the caller must know it
 * is optimistic for PV, and the demo should say so.
 */
export function heatPumpRunningCost(
  demand: Range,
  scop: Range,
  tariff: Tariff,
  pvOffsetKwhPerYear?: Range,
  dhwKwhPerYear?: Range,
): RunningCost {
  // Space heat at the radiator SCOP, hot water at its own, worse COP. A tank is
  // held at 50-55 C, well above radiator flow, so charging hot water at the
  // heating SCOP overstates how cheaply a heat pump can make it.
  const gross =
    dhwKwhPerYear && dhwKwhPerYear.mid > 0
      ? add(
          heatPumpElectricityKwh(demand, scop),
          divide(dhwKwhPerYear, band(C.DHW_HEAT_PUMP_COP)),
        )
      : heatPumpElectricityKwh(demand, scop);

  let net = gross;
  if (pvOffsetKwhPerYear) {
    const lo = Math.max(0, gross.low - pvOffsetKwhPerYear.high);
    const mid = Math.max(0, gross.mid - pvOffsetKwhPerYear.mid);
    const hi = Math.max(0, gross.high - pvOffsetKwhPerYear.low);
    net = range(lo, mid, Math.max(hi, lo));
  }

  let annual = multiply(net, electricityPricePerKwh(tariff));

  if (tariff === "G12w") {
    annual = add(annual, scale(band(C.G12W_STANDING_CHARGE_PREMIUM), 12));
  }

  return toRunningCost(annual, net, "kWh");
}

// --- step 3: all four, in one call ------------------------------------------

export interface RunningCosts {
  demand: Range;
  demandPerM2: Range;
  coal: RunningCost;
  pellet: RunningCost;
  heatPump: RunningCost;
  heatPumpPlusPv: RunningCost;
  /** Space heating only, once hot water is taken out of the tonnage. */
  spaceHeatDemand: Range;
  /** Annual useful hot water energy, from occupants. Zero when not asked. */
  dhwDemand: Range;
  /** Hot water the household currently buys as electricity at COP 1.0. */
  immersionKwh: Range;
}

/**
 * Every scenario's running cost from one set of house facts.
 * Running cost only — no capital, no grant, no loan. financing.ts adds those.
 */
export function runningCosts(facts: HouseFacts): RunningCosts {
  const demand = heatDemandFromCoal(facts);
  const burned = coalActuallyBurned(
    facts.coalTonnesBought,
    facts.coalTonnesLeftOver ?? 0,
  );

  // Hot water is split out of the measured total before any scenario prices it.
  // With no occupants or no hot water answer, dhw is zero and every scenario
  // behaves exactly as it did before this existed.
  const dhw = dhwDemand(facts.occupants);
  const split = splitDemand(demand, dhw, facts.hotWaterNow);
  const immersion = immersionKwh(
    dhw,
    split.dhwInsideTonnage,
    facts.hotWaterNow,
  );

  // Pellet replaces the coal boiler and does exactly the same job, hot water
  // included, so it keeps the full measured demand.
  return {
    demand,
    demandPerM2: heatDemandPerM2(demand, facts.heatedAreaM2),
    spaceHeatDemand: split.spaceHeat,
    dhwDemand: dhw,
    immersionKwh: immersion,
    coal: coalRunningCost(
      burned,
      facts.coalPricePaidPerTonne,
      immersion,
      facts.tariff,
    ),
    pellet: pelletRunningCost(demand),
    heatPump: heatPumpRunningCost(
      split.spaceHeat,
      facts.heatPumpScop,
      facts.tariff,
      undefined,
      dhw,
    ),
    heatPumpPlusPv: heatPumpRunningCost(
      split.spaceHeat,
      facts.heatPumpScop,
      facts.tariff,
      facts.pvOffsetKwhPerYear ?? exact(0),
      dhw,
    ),
  };
}
