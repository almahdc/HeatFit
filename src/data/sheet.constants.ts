/**
 * Constants transcribed from the `price_calculator` Google Sheet.
 *
 * Scope: every tab EXCEPT the subsidies tab. Each block below names the tab
 * section it came from so any number here can be checked against the sheet in
 * a few seconds.
 *
 * These are POINT values, exactly as the sheet holds them. That is deliberate
 * and it is the difference between this file and `constants.pl.ts`:
 *
 *   constants.pl.ts   independently sourced Polish market data, held as
 *                     low/mid/high bands, feeds the uncertainty-aware engines
 *   sheet.constants.ts  the spreadsheet's own working assumptions, held as
 *                     single numbers, so `baseline.ts` can reproduce the
 *                     sheet's arithmetic exactly and be tested against it
 *
 * Where the two disagree, the disagreement is real and is listed in
 * docs/baseline-model.md. Do not quietly reconcile them here.
 *
 * Transcribed: 2026-09-09 from the sheet as last modified 2026-09-09.
 */

// --- CONSTANTS block ---------------------------------------------------------

/**
 * Energy to raise one litre of water by 45 °C.
 *
 * Sheet cell is labelled "water kWh/l per 45 °C lift". Physics check:
 * 1 l x 45 K x 4.186 kJ/kg·K / 3600 = 0.0523 kWh, so the sheet's 0.05 is the
 * rounded-down figure and carries no tank or circulation losses.
 */
export const WATER_KWH_PER_LITRE_45C = 0.05;

// --- ELECTRICITY TARIFFS block -----------------------------------------------

export type SheetTariff = "Standard" | "Dynamic";

/**
 * All-in electricity price, PLN/kWh.
 *
 * The sheet models the household's tariff as one blended number rather than
 * separate peak and off-peak rates. "Dynamic" is the sheet's name for the
 * cheaper time-of-use tariff, which the wizard collects as G12.
 */
export const SHEET_ELECTRICITY_PRICE: Record<SheetTariff, number> = {
  Standard: 1.0,
  Dynamic: 0.7,
};

/** Wizard tariff answer -> the sheet's tariff column. */
export const TARIFF_FROM_WIZARD: Record<"G11" | "G12", SheetTariff> = {
  G11: "Standard",
  G12: "Dynamic",
};

// --- PV block (the small Field/Value table beside FUEL) ----------------------

export const SHEET_PV = {
  /** Annual generation assumed for a fitted array, kWh/y. */
  productionKwhPerYear: 5000,
  /**
   * Share of the household's OWN consumption that the array covers directly.
   *
   * Note this is a share of consumption, not of generation. That reading is not
   * obvious from the label but it is what reproduces the sheet's scenario
   * outputs exactly — see the verification table in docs/baseline-model.md.
   */
  shareUsedDirectly: 0.25,
  /** What the grid pays for exported kWh, PLN/kWh. */
  exportPricePerKwh: 0.3,
} as const;

// --- COOLING block -----------------------------------------------------------

export type SheetCoolingSource =
  "none" | "AC" | "air-to-air HP" | "air-to-water HP AC fan coils";

export interface SheetCooling {
  /** Seasonal energy efficiency ratio. Null for "none". */
  seer: number | null;
  /** The sheet's own worked electricity figure for House 1, kWh/y. */
  sheetElectricityKwh: number;
  /** True when the unit cools only, so it cannot also displace heating. */
  coolingOnly: boolean;
}

export const SHEET_COOLING: Record<SheetCoolingSource, SheetCooling> = {
  none: { seer: null, sheetElectricityKwh: 0, coolingOnly: false },
  AC: { seer: 5.0, sheetElectricityKwh: 750, coolingOnly: true },
  "air-to-air HP": { seer: 5.0, sheetElectricityKwh: 750, coolingOnly: false },
  "air-to-water HP AC fan coils": {
    seer: 4.0,
    sheetElectricityKwh: 940,
    coolingOnly: true,
  },
};

/**
 * Cooling demand per square metre, kWh/m²/y.
 *
 * DERIVED, not stated in the sheet: House 1 carries 3 750 kWh of cooling demand
 * over 150 m². The SEER column then checks out both ways — 3750/5 = 750 and
 * 3750/4 = 937.5, which the sheet rounds to 940.
 */
export const COOLING_DEMAND_KWH_PER_M2 = 25;

// --- FUEL block --------------------------------------------------------------

export type SheetFuel =
  | "Groszek"
  | "Orzech"
  | "Kostka"
  | "Mul"
  | "Miner"
  | "Pellet"
  | "gas"
  | "electric boiler"
  | "air-to-air HP"
  | "air-to-water HP"
  | "air-to-air HP water"
  | "air-to-water HP water";

export interface SheetFuelSpec {
  /** Energy content of one unit, kWh. */
  kwhPerUnit: number;
  /** The unit the fuel is bought in. */
  unit: "t" | "m3" | "kWh";
  /**
   * Conversion efficiency. For the heat pump rows this is a COP and so is
   * greater than one; the sheet keeps both in the same column deliberately,
   * because both are used the same way (useful heat = input x efficiency).
   */
  efficiency: number;
  /** Price per unit, PLN. Zero where the sheet prices the fuel elsewhere. */
  plnPerUnit: number;
  /** Standing charge, PLN/y. Only gas carries one. */
  fixedPlnPerYear: number;
  /** True when the fuel is bought as electricity and so is tariff-priced. */
  isElectric: boolean;
  /** True when hot water needs a separate appliance from the space heat one. */
  extraDeviceForWaterHeating: boolean;
}

/**
 * The sheet's FUEL table, verbatim.
 *
 * "Miner" is the deputat węglowy — coal received free or at a deep discount,
 * which is why its price is zero while it still carries full energy content.
 * The wizard collects this as `freeCoalReceived` / `freeCoalTonnes`.
 */
export const SHEET_FUELS: Record<SheetFuel, SheetFuelSpec> = {
  Groszek: {
    kwhPerUnit: 7222,
    unit: "t",
    efficiency: 0.8,
    plnPerUnit: 1150,
    fixedPlnPerYear: 0,
    isElectric: false,
    extraDeviceForWaterHeating: false,
  },
  Orzech: {
    kwhPerUnit: 8056,
    unit: "t",
    efficiency: 0.8,
    plnPerUnit: 1150,
    fixedPlnPerYear: 0,
    isElectric: false,
    extraDeviceForWaterHeating: false,
  },
  Kostka: {
    kwhPerUnit: 8056,
    unit: "t",
    efficiency: 0.8,
    plnPerUnit: 1200,
    fixedPlnPerYear: 0,
    isElectric: false,
    extraDeviceForWaterHeating: false,
  },
  Mul: {
    kwhPerUnit: 5300,
    unit: "t",
    efficiency: 0.55,
    plnPerUnit: 500,
    fixedPlnPerYear: 0,
    isElectric: false,
    extraDeviceForWaterHeating: false,
  },
  Miner: {
    kwhPerUnit: 7800,
    unit: "t",
    efficiency: 0.8,
    plnPerUnit: 0,
    fixedPlnPerYear: 0,
    isElectric: false,
    extraDeviceForWaterHeating: false,
  },
  Pellet: {
    kwhPerUnit: 4800,
    unit: "t",
    efficiency: 0.85,
    plnPerUnit: 1450,
    fixedPlnPerYear: 0,
    isElectric: false,
    extraDeviceForWaterHeating: false,
  },
  gas: {
    kwhPerUnit: 9.8,
    unit: "m3",
    efficiency: 0.92,
    plnPerUnit: 3.2,
    fixedPlnPerYear: 900,
    isElectric: false,
    extraDeviceForWaterHeating: false,
  },
  "electric boiler": {
    kwhPerUnit: 1.0,
    unit: "kWh",
    efficiency: 0.98,
    plnPerUnit: 0,
    fixedPlnPerYear: 0,
    isElectric: true,
    extraDeviceForWaterHeating: true,
  },
  "air-to-air HP": {
    kwhPerUnit: 1.0,
    unit: "kWh",
    efficiency: 4.0,
    plnPerUnit: 0,
    fixedPlnPerYear: 0,
    isElectric: true,
    extraDeviceForWaterHeating: false,
  },
  "air-to-water HP": {
    kwhPerUnit: 1.0,
    unit: "kWh",
    efficiency: 3.0,
    plnPerUnit: 0,
    fixedPlnPerYear: 0,
    isElectric: true,
    extraDeviceForWaterHeating: false,
  },
  "air-to-air HP water": {
    kwhPerUnit: 1.0,
    unit: "kWh",
    efficiency: 2.6,
    plnPerUnit: 0,
    fixedPlnPerYear: 0,
    isElectric: true,
    extraDeviceForWaterHeating: true,
  },
  "air-to-water HP water": {
    kwhPerUnit: 1.0,
    unit: "kWh",
    efficiency: 2.3,
    plnPerUnit: 0,
    fixedPlnPerYear: 0,
    isElectric: true,
    extraDeviceForWaterHeating: true,
  },
};

/** Wizard coal grade -> the sheet's FUEL row. */
export const FUEL_FROM_COAL_TYPE: Record<
  "groszek" | "orzech" | "kostka" | "mul" | "other",
  SheetFuel
> = {
  groszek: "Groszek",
  orzech: "Orzech",
  kostka: "Kostka",
  mul: "Mul",
  // "other" is unanswered rather than a grade. Orzech is the sheet's most
  // common row and sits mid-range on energy content, so it is the least wrong
  // stand-in. The UI should say the answer was assumed.
  other: "Orzech",
};

/** The FUEL row for coal received free or discounted, whatever grade it is. */
export const FREE_COAL_FUEL: SheetFuel = "Miner";

// --- HOUSE SCENARIOS block ---------------------------------------------------

/**
 * House 1, the sheet's worked example. Kept because every formula in
 * baseline.ts is regression-tested against the sheet's own outputs for it.
 *
 * Two of these numbers do not reproduce from the sheet's own constants, and
 * both are flagged in docs/baseline-model.md rather than silently corrected:
 *
 *   spaceHeatKwh   18 050, where 150 m² x 120 kWh/m²/y = 18 000
 *   waterEnergyKwh  2 600, where 50 000 l x 0.05 kWh/l = 2 500
 */
export const SHEET_HOUSE_1 = {
  people: 4,
  areaM2: 150,
  conditionKwhPerM2Year: 120,
  spaceHeatKwh: 18050,
  hotWaterLitresPerYear: 50000,
  baseElectricityKwh: 2500,
  coolingDemandKwh: 3750,
  waterEnergyKwh: 2600,
} as const;

/**
 * Household electricity excluding heating, hot water and cooling, kWh/y.
 *
 * The sheet holds this as a per-house input (2 500 for House 1) rather than a
 * formula. Used only when the household cannot give a bill.
 */
export const DEFAULT_BASE_ELECTRICITY_KWH = SHEET_HOUSE_1.baseElectricityKwh;

/**
 * Building condition, kWh/m²/y, when nothing better is known.
 *
 * The sheet types this per house. 120 is House 1's value and sits in the middle
 * band of the subsidy scope gate (80-140), so it is a neutral default. Prefer
 * the figure derived from actual coal tonnage whenever there is one — that is
 * measured energy for this specific house, and it is the whole point of asking.
 */
export const DEFAULT_CONDITION_KWH_PER_M2 = SHEET_HOUSE_1.conditionKwhPerM2Year;

// --- assumptions the sheet does NOT provide ----------------------------------

/**
 * Litres of hot water per shower or bath.
 *
 * NOT IN THE SHEET. The sheet types House 1's hot water as a flat 50 000 l/y,
 * but the wizard asks for showers per week per person, so a per-shower figure
 * is needed to connect the two.
 *
 * 40 l is chosen to be consistent with the sheet rather than imported from
 * elsewhere: 4 people x 6 showers/week x 40 l x 52 weeks = 49 920 l/y, which is
 * House 1's 50 000 to within rounding.
 *
 * This is the softest number in this file. Confirm it before any figure that
 * depends on it goes in front of a household.
 */
export const LITRES_PER_SHOWER = 40;

/**
 * Share of a shower or bath's drawn volume that actually needed the full
 * 45 °C lift.
 *
 * NOT IN THE SHEET, and not a sourced figure — an engineering-judgment
 * correction, softer than `LITRES_PER_SHOWER` itself and equally reviewable.
 *
 * A shower is not neat hot water at the tap: a mixing valve tempers water
 * heated in the tank (or the coal boiler's coil) with cold mains to reach a
 * comfortable ~38-40 °C, so a chunk of the 40 l counted per shower never went
 * near the heat source. Without this correction, `hotWaterLitres` scales
 * linearly with occupants × showers per week, and a large household showering
 * often (Grandma Krysia: 5 people × 7/week) reads as needing far more hot-water
 * energy than a real coal boiler or immersion tank would show for it.
 *
 * Applying 0.6 here changes only the ENERGY side of the calculation
 * (`waterEnergyKwh`, and everything downstream of it — the coal/electric split,
 * the electricity reconciliation gap, the water-heating cost line). It does
 * NOT change `hotWaterLitresPerYear`, which stays the full drawn volume: that
 * number describes water a household actually used, and shrinking it to match
 * the energy figure would misreport their own usage back to them.
 */
export const HOT_WATER_BLEND_FACTOR = 0.6;

/**
 * Boiler efficiency by emission class.
 *
 * NOT IN THE SHEET, and a deliberate departure from it. The sheet folds a flat
 * 0.80 into every coal FUEL row, so a 1990s kopciuch and a modern class 5 unit
 * burning the same orzech deliver the same heat. They do not, and the gap is
 * large enough to move the number this whole product turns on: the building
 * condition figure, which decides the Czyste Powietrze scope band.
 *
 * Using these means a household that burns a lot of coal through a bad boiler
 * is no longer credited with a well-insulated house.
 *
 * These are the working figures agreed for the model, not sheet values. They
 * sit in the range the class definitions imply (PN-EN 303-5 sets minimum
 * efficiencies that rise with class) but they have no single published source
 * yet, so treat them as reviewable.
 */
export const BOILER_EFFICIENCY: Record<
  "bezklasowy" | "class3" | "class4" | "class5",
  number
> = {
  bezklasowy: 0.6,
  class3: 0.75,
  class4: 0.75,
  class5: 0.85,
};

/** Human-readable name per class, for assumption lines shown to the user. */
export const BOILER_CLASS_LABEL: Record<
  "bezklasowy" | "class3" | "class4" | "class5",
  string
> = {
  bezklasowy: "no-class (bezklasowy)",
  class3: "class 3",
  class4: "class 4",
  class5: "class 5",
};

/**
 * Electric resistance water heater / boiler efficiency.
 *
 * Agrees with the sheet's own "electric boiler" FUEL row (0.98), so nothing
 * moves by naming it here. It exists as its own constant because the water
 * heating path should not have to reach into a fuel table to find it.
 */
export const ELECTRIC_BOILER_EFFICIENCY = 0.98;

/**
 * Gas boiler efficiency.
 *
 * DISAGREES WITH THE SHEET, which carries 0.92 in its gas FUEL row. 0.95 is the
 * agreed working figure for a modern condensing unit. The sheet row is left
 * untouched — this file does not quietly reconcile the two — so anything
 * pricing gas must choose deliberately which one it means.
 *
 * Unused at baseline: a household still on coal has no gas boiler. Here for the
 * replacement-scenario step.
 */
export const GAS_BOILER_EFFICIENCY = 0.95;
