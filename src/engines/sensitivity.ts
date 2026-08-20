/**
 * sensitivity.ts — which numbers actually decide this, and by how much.
 *
 * The finding that motivates the whole file: a Silesian household's answer is
 * driven far more by the pellet price and the electricity price than by
 * anything they can control. Telling someone "pellet wins" without telling them
 * that pellet went from 1 400 to 4 000 zł a tonne in one winter is the kind of
 * confident, useless advice every other calculator gives.
 *
 * --- How it works -----------------------------------------------------------
 *
 * Nothing here is hand-written. Each driver names a constant and how wrong it
 * could plausibly be. The engine swings that constant to each edge, re-runs the
 * caller's model, and measures how far the monthly answer moved. The ranking is
 * whatever falls out.
 *
 * That matters for maintenance: when a constant is verified and its band
 * narrows, this list re-ranks itself. A hand-written "pellet price matters
 * most" paragraph would quietly become a lie the day the band changes.
 *
 * --- Why band edges and not a fixed percentage ------------------------------
 *
 * Every constant in constants.pl.ts already carries a low and a high reflecting
 * how well we actually know it. Pellet is a wide band because pellet is
 * genuinely volatile; electricity is narrow because the tariff is published.
 * Swinging both by an arbitrary ±20% would flatter electricity and understate
 * pellet, which is exactly backwards.
 */

import * as C from "../data/constants.pl";

/** A model the sensitivity engine can re-run. Returns złoty per month. */
export type MonthlyModel = (overrides: ConstantOverrides) => number;

/**
 * Constants the engine is allowed to swing. Anything not listed is held fixed.
 * Keys mirror constants.pl.ts so a reader can find the source.
 */
export interface ConstantOverrides {
  coalPricePerTonne?: number;
  pelletPricePerTonne?: number;
  electricityG11PerKwh?: number;
  electricityG12wOffpeakPerKwh?: number;
  heatPumpInstalledCost?: number;
  pelletBoilerInstalledCost?: number;
  heatPumpScop?: number;
  loanRatePct?: number;
  cleanAirSharePct?: number;
}

export interface Driver {
  /** Plain language, aimed at a homeowner, not an analyst. */
  label: string;
  /** How far the monthly answer moves across this constant's whole band. */
  swingPlnPerMonth: number;
  /** Value at the cheap edge and the dear edge, for the tooltip. */
  lowValue: string;
  highValue: string;
  /** True when the household has some say over this. */
  withinTheirControl: boolean;
  /** Does moving this change which option wins? Filled by the caller. */
  source: string;
}

interface DriverSpec {
  label: string;
  low: number;
  high: number;
  format: (v: number) => string;
  withinTheirControl: boolean;
  source: string;
  apply: (v: number) => ConstantOverrides;
}

const pln = (unit: string) => (v: number) =>
  `${v.toLocaleString("pl-PL", { maximumFractionDigits: 2 })} ${unit}`;

/**
 * The drivers, each tied to a real constant and its published band.
 * Adding a constant here is the only step needed to get it ranked.
 */
export function driverSpecs(loanRatePct: number): DriverSpec[] {
  return [
    {
      label: "The price of pellet",
      low: C.PELLET_PRICE_PER_TONNE.low,
      high: C.PELLET_PRICE_PER_TONNE.high,
      format: pln("zł/t"),
      withinTheirControl: false,
      source: C.PELLET_PRICE_PER_TONNE.source,
      apply: (v) => ({ pelletPricePerTonne: v }),
    },
    {
      label: "The price of electricity",
      low: C.ELECTRICITY_G11_PER_KWH.low,
      high: C.ELECTRICITY_G11_PER_KWH.high,
      format: pln("zł/kWh"),
      withinTheirControl: false,
      source: C.ELECTRICITY_G11_PER_KWH.source,
      apply: (v) => ({ electricityG11PerKwh: v }),
    },
    {
      label: "The price of coal",
      low: C.COAL_PRICE_PER_TONNE.low,
      high: C.COAL_PRICE_PER_TONNE.high,
      format: pln("zł/t"),
      withinTheirControl: false,
      source: C.COAL_PRICE_PER_TONNE.source,
      apply: (v) => ({ coalPricePerTonne: v }),
    },
    {
      label: "What the heat pump costs to install",
      low: C.HEAT_PUMP_INSTALLED_COST.low,
      high: C.HEAT_PUMP_INSTALLED_COST.high,
      format: pln("zł"),
      withinTheirControl: true,
      source: C.HEAT_PUMP_INSTALLED_COST.source,
      apply: (v) => ({ heatPumpInstalledCost: v }),
    },
    {
      label: "What the pellet boiler costs to install",
      low: C.PELLET_BOILER_INSTALLED_COST.low,
      high: C.PELLET_BOILER_INSTALLED_COST.high,
      format: pln("zł"),
      withinTheirControl: true,
      source: C.PELLET_BOILER_INSTALLED_COST.source,
      apply: (v) => ({ pelletBoilerInstalledCost: v }),
    },
    {
      label: "How well the heat pump runs in your house",
      low: 2.2,
      high: 4.0,
      format: (v) => `${v.toFixed(1)}x`,
      withinTheirControl: true,
      source:
        "Seasonal efficiency, set by your radiators and flow temperature. " +
        "Bigger radiators move this more than any other single change.",
      apply: (v) => ({ heatPumpScop: v }),
    },
    {
      label: "Your loan interest rate",
      low: Math.max(0, loanRatePct - 3),
      high: loanRatePct + 3,
      format: (v) => `${v.toFixed(2).replace(".", ",")}%`,
      withinTheirControl: true,
      source: "Shopping between lenders, and where rates go from here.",
      apply: (v) => ({ loanRatePct: v }),
    },
    {
      label: "Which grant tier you land in",
      low: 40,
      high: 100,
      format: (v) => `${v}% of cost`,
      withinTheirControl: false,
      source: "Clean Air pays a larger share to lower-income households.",
      apply: (v) => ({ cleanAirSharePct: v }),
    },
  ];
}

/**
 * Rank the drivers for one scenario.
 *
 * `model` must be pure: given overrides, return that scenario's monthly cost.
 * Anything not overridden must fall back to the published constant, or the
 * measured swing will be nonsense.
 */
export function sensitivity(
  model: MonthlyModel,
  opts: { loanRatePct: number; minSwingPln?: number } = { loanRatePct: 8.43 },
): Driver[] {
  const floor = opts.minSwingPln ?? 5;

  return driverSpecs(opts.loanRatePct)
    .map((spec) => {
      const atLow = model(spec.apply(spec.low));
      const atHigh = model(spec.apply(spec.high));
      return {
        label: spec.label,
        swingPlnPerMonth: Math.abs(atHigh - atLow),
        lowValue: spec.format(spec.low),
        highValue: spec.format(spec.high),
        withinTheirControl: spec.withinTheirControl,
        source: spec.source,
      };
    })
    .filter((d) => Number.isFinite(d.swingPlnPerMonth))
    .filter((d) => d.swingPlnPerMonth >= floor)
    .sort((a, b) => b.swingPlnPerMonth - a.swingPlnPerMonth);
}

/**
 * One sentence for the top of the panel. Written from the ranking, never fixed.
 * Deliberately names whether the biggest lever is theirs or the market's,
 * because that changes what a person should do next.
 */
export function sensitivityHeadline(drivers: Driver[]): string {
  const top = drivers[0];
  if (!top) return "Nothing we know about moves this answer much.";

  const outOfTheirHands = drivers.filter((d) => !d.withinTheirControl);
  const biggestExternal = outOfTheirHands[0];

  if (biggestExternal && biggestExternal.label === top.label) {
    return (
      `${top.label} moves this by about ${Math.round(top.swingPlnPerMonth)} zł a month, ` +
      `and it is not something you control. Anyone who gives you a single confident ` +
      `number here is hiding that.`
    );
  }
  return (
    `${top.label} moves this by about ${Math.round(top.swingPlnPerMonth)} zł a month, ` +
    `and it is largely in your hands.`
  );
}
