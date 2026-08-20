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

/**
 * The official national figure. Worth more than any price-comparison portal
 * because it is the basis GUS uses to calculate the deputat węglowy equivalent,
 * so it is defensible in front of someone who checks.
 */
export const COAL_PRICE_GUS_NATIONAL: Sourced<number> = {
  value: 1601.7,
  source:
    "GUS average price of a tonne of coal, 2025, used as the deputat calculation basis",
  readOn: "2026-08-20",
  certainty: "high",
  note: "Fallback anchor when the household does not remember what they paid.",
};

/**
 * Coal is not one substance. Calorific value runs from about 18 MJ/kg for miał
 * to about 30 for orzech. Using one figure for all of them is a ±25% error on
 * heat demand before anything else happens, which is why the tool asks.
 */
export type CoalType = "ekogroszek" | "orzech" | "groszek" | "mial" | "unknown";

export const COAL_CALORIFIC_VALUE: Record<CoalType, SourcedBand> = {
  ekogroszek: {
    low: 24,
    mid: 25.5,
    high: 27,
    unit: "MJ/kg",
    source: "Ekogroszek specification, typical Polish retail grade",
    readOn: "2026-08-20",
    certainty: "medium",
  },
  orzech: {
    low: 26,
    mid: 28,
    high: 30,
    unit: "MJ/kg",
    source: "Węgiel orzech specification, typical Polish retail grade",
    readOn: "2026-08-20",
    certainty: "medium",
  },
  groszek: {
    low: 24,
    mid: 26,
    high: 28,
    unit: "MJ/kg",
    source: "Węgiel groszek specification, typical Polish retail grade",
    readOn: "2026-08-20",
    certainty: "medium",
  },
  mial: {
    low: 18,
    mid: 20.5,
    high: 23,
    unit: "MJ/kg",
    source: "Miał węglowy specification",
    readOn: "2026-08-20",
    certainty: "medium",
    note:
      "BANNED under the Śląskie anti-smog resolution (V/36/1/2017). If a household " +
      "selects this, they have a compliance problem as well as a heating decision.",
  },
  unknown: {
    low: 21,
    mid: 25,
    high: 28,
    unit: "MJ/kg",
    source: "Derived envelope across the grades above",
    readOn: "2026-08-20",
    certainty: "low",
    note: "Deliberately wide. Answering the question instead is worth roughly 9 points of band.",
  },
};

export const WOOD_CALORIFIC_VALUE: SourcedBand = {
  low: 14,
  mid: 15,
  high: 16,
  unit: "MJ/kg",
  source: "Dry seasoned hardwood, ~20% moisture",
  readOn: "2026-08-20",
  certainty: "medium",
  note: "Used only to widen the band when a household says they also burnt wood.",
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

/**
 * Boiler efficiency by emission class and feed type.
 *
 * Feed type moves this as much as class does — a hand-fed boiler is stoked by a
 * person, and people are worse at it than an auger. "unknown" is the expensive
 * answer: it roughly triples this factor's contribution to the band, which is
 * why the tool pushes the nameplate photo instead of accepting it.
 */
export type BoilerClass =
  "noClass" | "class3" | "class4" | "class5" | "ecodesign" | "unknown";
export type FeedType = "handFed" | "automatic";

export const COAL_BOILER_EFFICIENCY: Record<
  BoilerClass,
  Record<FeedType, SourcedBand>
> = {
  noClass: {
    handFed: {
      low: 0.4,
      mid: 0.5,
      high: 0.6,
      unit: "fraction",
      source: "Pre-class solid fuel boiler (kopciuch), hand-fed",
      readOn: "2026-08-20",
      certainty: "low",
      note: "A badly run hand-fed boiler can drop below 0.4. Replace with interview data.",
    },
    automatic: {
      low: 0.55,
      mid: 0.62,
      high: 0.7,
      unit: "fraction",
      source: "Pre-class solid fuel boiler with feeder",
      readOn: "2026-08-20",
      certainty: "low",
    },
  },
  class3: {
    handFed: {
      low: 0.6,
      mid: 0.66,
      high: 0.72,
      unit: "fraction",
      source: "PN-EN 303-5 class 3 minimum, hand-fed",
      readOn: "2026-08-20",
      certainty: "medium",
    },
    automatic: {
      low: 0.62,
      mid: 0.68,
      high: 0.74,
      unit: "fraction",
      source: "PN-EN 303-5 class 3 minimum, with feeder",
      readOn: "2026-08-20",
      certainty: "medium",
    },
  },
  class4: {
    handFed: {
      low: 0.72,
      mid: 0.77,
      high: 0.82,
      unit: "fraction",
      source: "PN-EN 303-5 class 4 minimum, hand-fed",
      readOn: "2026-08-20",
      certainty: "medium",
    },
    automatic: {
      low: 0.74,
      mid: 0.79,
      high: 0.84,
      unit: "fraction",
      source: "PN-EN 303-5 class 4 minimum, with feeder",
      readOn: "2026-08-20",
      certainty: "medium",
    },
  },
  class5: {
    handFed: {
      low: 0.78,
      mid: 0.83,
      high: 0.87,
      unit: "fraction",
      source: "PN-EN 303-5 class 5; hand-fed class 5 units are uncommon",
      readOn: "2026-08-20",
      certainty: "medium",
    },
    automatic: {
      low: 0.8,
      mid: 0.85,
      high: 0.89,
      unit: "fraction",
      source: "PN-EN 303-5 class 5, with feeder",
      readOn: "2026-08-20",
      certainty: "medium",
    },
  },
  ecodesign: {
    handFed: {
      low: 0.83,
      mid: 0.87,
      high: 0.9,
      unit: "fraction",
      source: "Ecodesign regulation minimum",
      readOn: "2026-08-20",
      certainty: "medium",
    },
    automatic: {
      low: 0.85,
      mid: 0.885,
      high: 0.92,
      unit: "fraction",
      source: "Ecodesign regulation minimum, with feeder",
      readOn: "2026-08-20",
      certainty: "medium",
    },
  },
  unknown: {
    handFed: {
      low: 0.45,
      mid: 0.6,
      high: 0.75,
      unit: "fraction",
      source: "Derived envelope across all classes",
      readOn: "2026-08-20",
      certainty: "low",
      note: "The single biggest avoidable band-widener in the model. Route to the nameplate photo.",
    },
    automatic: {
      low: 0.45,
      mid: 0.6,
      high: 0.75,
      unit: "fraction",
      source: "Derived envelope across all classes",
      readOn: "2026-08-20",
      certainty: "low",
    },
  },
};

/** Convenience lookup so callers don't index a nested record by hand. */
export function coalBoilerEfficiency(
  cls: BoilerClass,
  feed: FeedType,
): SourcedBand {
  return COAL_BOILER_EFFICIENCY[cls][feed];
}

export const PELLET_BOILER_EFFICIENCY: SourcedBand = {
  low: 0.85,
  mid: 0.88,
  high: 0.9,
  unit: "fraction",
  source:
    "Class 5 / Ecodesign requirement, mandatory for Czyste Powietrze eligibility",
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

// --- capital cost of each option -------------------------------------------
// Turnkey, VAT included. Polish installers quote "with installation" so these
// are whole-job prices, not equipment-only.

export const HEAT_PUMP_INSTALLED_COST: SourcedBand = {
  low: 28000,
  mid: 42000,
  high: 60000,
  unit: "zł, turnkey incl. VAT",
  source:
    "Polish installer pricing 2026: air-to-water quoted 25 000-55 000 zł with installation; " +
    "8-12 kW for a 120-160 m2 house quoted 28 000-48 000 zł; one source gives 38 000-65 000 zł",
  readOn: "2026-08-19",
  certainty: "medium",
  note:
    "Old radiators push toward the high end - several sources price heat pump plus radiator " +
    "modernisation at 40 000-70 000 zł. Sizing should move this, but does not yet.",
};

export const PELLET_BOILER_INSTALLED_COST: SourcedBand = {
  low: 18000,
  mid: 24000,
  high: 32000,
  unit: "zł, turnkey incl. VAT",
  source:
    "Polish installer pricing 2026; ekogroszek boilers quoted 15 000-25 000 zł installed",
  readOn: "2026-08-19",
  certainty: "low",
  note:
    "Class 5 plus a buffer tank of at least 30 l/kW is mandatory for Czyste Powietrze, which " +
    "lifts this above a bare boiler swap. Needs a real quote.",
};

export const PV_INSTALLED_COST_PER_KWP: SourcedBand = {
  low: 3500,
  mid: 4200,
  high: 5000,
  unit: "zł/kWp, turnkey incl. VAT",
  source: "Polish PV market pricing 2026",
  readOn: "2026-08-19",
  certainty: "low",
  note: "Unverified this session. Confirm before any slide quotes a heat pump plus PV figure.",
};

export const COAL_BOILER_REPLACEMENT_COST: SourcedBand = {
  low: 0,
  mid: 0,
  high: 0,
  unit: "zł",
  source:
    "Not a legal option in the beachhead - kopciuch replacement is mandatory",
  readOn: "2026-08-19",
  certainty: "high",
  note:
    "Scenario A is 'keep burning coal', priced at zero capital deliberately. It is the " +
    "counterfactual, not a recommendation, and the UI must say the swap is not optional.",
};

// --- equipment life ---------------------------------------------------------

export const HEAT_PUMP_LIFE_YEARS: Sourced<number> = {
  value: 15,
  source:
    "Polish industry sources, 2026 (range given as 10-20, one claims 20-30)",
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
/** Flattened view of the nested tables, so the source-integrity test covers them. */
export const TABLE_CONSTANTS: Record<string, SourcedBand> = {
  ...Object.fromEntries(
    Object.entries(COAL_CALORIFIC_VALUE).map(([k, v]) => [
      `COAL_CALORIFIC_VALUE.${k}`,
      v,
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(COAL_BOILER_EFFICIENCY).flatMap(([cls, feeds]) =>
      Object.entries(feeds).map(([feed, v]) => [
        `COAL_BOILER_EFFICIENCY.${cls}.${feed}`,
        v,
      ]),
    ),
  ),
};

export const ALL_CONSTANTS: Record<string, Sourced<unknown> | SourcedBand> = {
  COAL_PRICE_PER_TONNE,
  PELLET_PRICE_PER_TONNE,
  PELLET_CALORIFIC_VALUE,
  COAL_PRICE_GUS_NATIONAL,
  WOOD_CALORIFIC_VALUE,
  PELLET_BOILER_EFFICIENCY,
  ELECTRICITY_G11_PER_KWH,
  ELECTRICITY_G12W_OFFPEAK_PER_KWH,
  ELECTRICITY_G12W_PEAK_PER_KWH,
  G12W_STANDING_CHARGE_PREMIUM,
  HEAT_PUMP_OFFPEAK_SHARE,
  HEAT_PUMP_INSTALLED_COST,
  PELLET_BOILER_INSTALLED_COST,
  PV_INSTALLED_COST_PER_KWP,
  COAL_BOILER_REPLACEMENT_COST,
  HEAT_PUMP_LIFE_YEARS,
  PELLET_BOILER_LIFE_YEARS,
  INSULATE_FIRST_THRESHOLD,
  ...TABLE_CONSTANTS,
};
