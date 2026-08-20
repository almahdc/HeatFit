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
  /** Tonnes of coal burned in the last heating season. The load-bearing input. */
  coalTonnesPerYear: number;
  /** Heated floor area in m2. Used only for the insulate-first check, never for demand. */
  heatedAreaM2: number;
  /**
   * Seasonal coefficient of performance for the heat pump in THIS house.
   * Comes from radiators.ts (photos -> flow temperature -> SCOP).
   * Passed in rather than computed here so this module stays independent.
   */
  heatPumpScop: Range;
  /** Which electricity tariff to price the heat pump on. */
  tariff: Tariff;
  /** Annual kWh the PV array is expected to offset, if any. From a PV model. */
  pvOffsetKwhPerYear?: Range;
}

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

function toRunningCost(annual: Range, fuelQuantity: Range, fuelUnit: string): RunningCost {
  return {
    annual,
    monthly: scale(annual, 1 / 12),
    fuelQuantity,
    fuelUnit,
    confidence: annual.confidence,
  };
}

// --- step 1: what does this house actually need? ----------------------------

/**
 * Coal burned -> useful heat delivered into the house, in kWh per year.
 *
 *   tonnes x 1000 kg/t x MJ/kg x boiler efficiency / 3.6 MJ per kWh
 *
 * The boiler efficiency band is the widest source of error here and it is the
 * first thing real interview data should replace.
 */
export function heatDemandFromCoal(coalTonnesPerYear: number): Range {
  if (coalTonnesPerYear <= 0) {
    throw new Error("heatDemandFromCoal: coal tonnage must be positive");
  }

  const kg = exact(coalTonnesPerYear * 1000);
  const energyIn = scale(multiply(kg, band(C.COAL_CALORIFIC_VALUE)), 1 / C.MJ_PER_KWH);
  return multiply(energyIn, band(C.OLD_COAL_BOILER_EFFICIENCY));
}

/** Useful heat per square metre. Feeds the insulate-first verdict. */
export function heatDemandPerM2(demand: Range, heatedAreaM2: number): Range {
  if (heatedAreaM2 <= 0) throw new Error("heatDemandPerM2: area must be positive");
  return scale(demand, 1 / heatedAreaM2);
}

// --- step 2: cost of each option --------------------------------------------

/** Scenario A: change nothing. Keep buying coal. */
export function coalRunningCost(coalTonnesPerYear: number): RunningCost {
  const tonnes = fromSpread(coalTonnesPerYear, 0.05); // homeowner recall, not a meter
  const annual = multiply(tonnes, band(C.COAL_PRICE_PER_TONNE));
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
  const energyNeededMj = scale(divide(demand, band(C.PELLET_BOILER_EFFICIENCY)), C.MJ_PER_KWH);
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
  if (scop.low <= 0) throw new Error("heatPumpElectricityKwh: SCOP must be positive");
  return divide(demand, scop);
}

/** Blended electricity price for a given tariff, given how much load moves off-peak. */
export function electricityPricePerKwh(tariff: Tariff): Range {
  if (tariff === "G11") return band(C.ELECTRICITY_G11_PER_KWH);

  const offpeakShare = band(C.HEAT_PUMP_OFFPEAK_SHARE);
  const peakShare = range(
    1 - offpeakShare.high,
    1 - offpeakShare.mid,
    1 - offpeakShare.low
  );
  return add(
    multiply(offpeakShare, band(C.ELECTRICITY_G12W_OFFPEAK_PER_KWH)),
    multiply(peakShare, band(C.ELECTRICITY_G12W_PEAK_PER_KWH))
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
  pvOffsetKwhPerYear?: Range
): RunningCost {
  const gross = heatPumpElectricityKwh(demand, scop);

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
}

/**
 * Every scenario's running cost from one set of house facts.
 * Running cost only — no capital, no grant, no loan. financing.ts adds those.
 */
export function runningCosts(facts: HouseFacts): RunningCosts {
  const demand = heatDemandFromCoal(facts.coalTonnesPerYear);

  return {
    demand,
    demandPerM2: heatDemandPerM2(demand, facts.heatedAreaM2),
    coal: coalRunningCost(facts.coalTonnesPerYear),
    pellet: pelletRunningCost(demand),
    heatPump: heatPumpRunningCost(demand, facts.heatPumpScop, facts.tariff),
    heatPumpPlusPv: heatPumpRunningCost(
      demand,
      facts.heatPumpScop,
      facts.tariff,
      facts.pvOffsetKwhPerYear ?? exact(0)
    ),
  };
}

/**
 * Domestic hot water demand, in kWh/year, when it is NOT already inside the
 * coal tonnage (Q6 = separate heater). Uses a simple ΔT model: heating mains
 * water (assumed 10°C) to a usable 45°C.
 */
export function dhwDemandKwh(people: number): Range {
  if (people <= 0) throw new Error("dhwDemandKwh: people must be positive");

  const litresPerYear = exact(people * 365).mid; // people is exact, not a Range
  const litres = fromSpread(litresPerYear, 0); // placeholder shape, see note below
  // litres/day x 365 x specific heat x deltaT, converted to kWh
  const deltaT = 35; // 10C mains to 45C usable, Polish convention
  const kwhPerLitre = (1 * 4.186 * deltaT) / 3600; // ~0.0407 kWh/litre
  return scale(band(C.DHW_LITRES_PER_PERSON_PER_DAY), people * 365 * kwhPerLitre);
}