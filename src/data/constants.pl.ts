/**
 * Polish market constants.
 *
 * Every constant carries its source and the date it was read. This is not
 * documentation — it is data the UI renders and the test suite asserts on.
 * A constant without a source is a bug, and there is a test that says so.
 *
 * Last verified: 19.08.2026
 */

export type Certainty = "high" | "medium" | "low";

export interface Sourced<T> {
  value: T;
  source: string;
  readOn: string;
  certainty: Certainty;
  note?: string;
}

/** A quantity we only know within bounds. */
export interface SourcedBand {
  low: number;
  mid: number;
  high: number;
  unit: string;
  source: string;
  readOn: string;
  certainty: Certainty;
  note?: string;
}

// --- fuels ------------------------------------------------------------------

export const COAL_PRICE_PER_TONNE: SourcedBand = {
  low: 1200,
  mid: 1500,
  high: 1800,
  unit: "zł/t",
  source:
    "Polish fuel price trackers, August 2026; a Silesian merchant quoted ~1470 zł/t for 5-25mm groszek",
  readOn: "2026-08-19",
  certainty: "medium",
  note: "Bulk vs bagged moves this by 100-400 zł/t. Silesia is at the cheaper end, being at source.",
};

export const COAL_CALORIFIC_VALUE: SourcedBand = {
  low: 24,
  mid: 25,
  high: 26,
  unit: "MJ/kg",
  source: "Standard ekogroszek specification",
  readOn: "2026-08-19",
  certainty: "high",
};

export const PELLET_PRICE_PER_TONNE: SourcedBand = {
  low: 1400,
  mid: 1900,
  high: 2800,
  unit: "zł/t",
  source: "Polish market reporting, April 2026",
  readOn: "2026-08-19",
  certainty: "low",
  note:
    "VOLATILE. Winter 2025/26 saw A1 pellet reach 2500-4000 zł/t at some distributors amid sawdust " +
    "supply shortages. The wide band is the finding, not a modelling weakness — pellet is not the " +
    "price-stable option it is assumed to be. Do not narrow this without evidence.",
};

export const PELLET_CALORIFIC_VALUE: SourcedBand = {
  low: 16.5,
  mid: 17.5,
  high: 18.5,
  unit: "MJ/kg",
  source: "A1 class wood pellet specification (EN ISO 17225-2)",
  readOn: "2026-08-19",
  certainty: "high",
};

// --- boiler and heat pump efficiency ---------------------------------------

export const OLD_COAL_BOILER_EFFICIENCY: SourcedBand = {
  low: 0.5,
  mid: 0.6,
  high: 0.68,
  unit: "fraction",
  source: "Assumption for a pre-class-5 solid fuel boiler (kopciuch)",
  readOn: "2026-08-19",
  certainty: "low",
  note:
    "LOAD-BEARING AND WEAKEST LINK. This single band drives the +-15% on heat demand, which " +
    "propagates into every scenario. Replace with measured data from real interviews as soon as " +
    "Magda has it. A hand-fed boiler run badly can drop below 0.5.",
};

export const PELLET_BOILER_EFFICIENCY: SourcedBand = {
  low: 0.85,
  mid: 0.88,
  high: 0.9,
  unit: "fraction",
  source: "Class 5 / Ecodesign requirement, mandatory for Czyste Powietrze eligibility",
  readOn: "2026-08-19",
  certainty: "medium",
};

// --- electricity ------------------------------------------------------------

export const ELECTRICITY_G11_PER_KWH: SourcedBand = {
  low: 1.04,
  mid: 1.07,
  high: 1.1,
  unit: "zł/kWh gross, all-in incl. distribution",
  source:
    "URE-approved 2026 tariffs; energy component averaged 495.16 zł/MWh net, down ~14% on 2025",
  readOn: "2026-08-19",
  certainty: "high",
};

export const ELECTRICITY_G12W_OFFPEAK_PER_KWH: SourcedBand = {
  low: 0.59,
  mid: 0.66,
  high: 0.73,
  unit: "zł/kWh gross, all-in incl. distribution",
  source: "Polish tariff comparisons, 2026",
  readOn: "2026-08-19",
  certainty: "medium",
};

export const ELECTRICITY_G12W_PEAK_PER_KWH: SourcedBand = {
  low: 1.15,
  mid: 1.2,
  high: 1.28,
  unit: "zł/kWh gross, all-in incl. distribution",
  source: "Polish tariff comparisons, 2026",
  readOn: "2026-08-19",
  certainty: "medium",
  note: "G12w peak is dearer than flat G11. Switching only pays if enough load moves off-peak.",
};

export const G12W_STANDING_CHARGE_PREMIUM: SourcedBand = {
  low: 3,
  mid: 9,
  high: 15,
  unit: "zł/month above G11",
  source: "Polish tariff comparisons, 2026",
  readOn: "2026-08-19",
  certainty: "medium",
};

/**
 * Share of heat pump electricity that can realistically land in the G12w cheap
 * window (nights, weekends, holidays) with a buffer tank and a sane schedule.
 */
export const HEAT_PUMP_OFFPEAK_SHARE: SourcedBand = {
  low: 0.45,
  mid: 0.6,
  high: 0.7,
  unit: "fraction",
  source: "Modelling assumption",
  readOn: "2026-08-19",
  certainty: "low",
  note: "Unsourced. Needs a real load profile or an installer's view. Flag on any slide using it.",
};

// --- equipment life ---------------------------------------------------------

export const HEAT_PUMP_LIFE_YEARS: Sourced<number> = {
  value: 15,
  source: "Polish industry sources, 2026 (range given as 10-20, one claims 20-30)",
  readOn: "2026-08-19",
  certainty: "medium",
  note: "Conservative end chosen deliberately, so 'crossover too late to matter' fires more often.",
};

export const PELLET_BOILER_LIFE_YEARS: Sourced<number> = {
  value: 15,
  source: "Polish industry sources, 2026 (range given as 15-20)",
  readOn: "2026-08-19",
  certainty: "medium",
  note: "Burner and auger are wear parts replaced sooner; not modelled yet.",
};

// --- building ---------------------------------------------------------------

export const INSULATE_FIRST_THRESHOLD: Sourced<number> = {
  value: 150,
  source:
    "Anchored to Czyste Powietrze: comprehensive modernisation requires the useful-energy " +
    "indicator (EU) below 80 kWh/m2/yr after works, or a 40% reduction",
  readOn: "2026-08-19",
  certainty: "medium",
  note: "A house above 150 cannot reach 80 by swapping the heat source alone.",
};

// --- unit conversion --------------------------------------------------------

export const MJ_PER_KWH = 3.6;

// --- integrity check --------------------------------------------------------

/** Every constant above, for the test that asserts each one carries a source. */
export const ALL_CONSTANTS: Record<string, Sourced<unknown> | SourcedBand> = {
  COAL_PRICE_PER_TONNE,
  COAL_CALORIFIC_VALUE,
  PELLET_PRICE_PER_TONNE,
  PELLET_CALORIFIC_VALUE,
  OLD_COAL_BOILER_EFFICIENCY,
  PELLET_BOILER_EFFICIENCY,
  ELECTRICITY_G11_PER_KWH,
  ELECTRICITY_G12W_OFFPEAK_PER_KWH,
  ELECTRICITY_G12W_PEAK_PER_KWH,
  G12W_STANDING_CHARGE_PREMIUM,
  HEAT_PUMP_OFFPEAK_SHARE,
  HEAT_PUMP_LIFE_YEARS,
  PELLET_BOILER_LIFE_YEARS,
  INSULATE_FIRST_THRESHOLD,
};
