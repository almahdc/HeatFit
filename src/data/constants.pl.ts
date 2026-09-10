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
export type CoalType = "orzech" | "groszek" | "mial" | "unknown";

export const COAL_CALORIFIC_VALUE: Record<CoalType, SourcedBand> = {
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
    "supply shortages. The wide band is the finding, not a modelling weakness, pellet is not the " +
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
  "noClass" | "class3" | "class4" | "class5" | "ecodesign";
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
    "Polish installer pricing 2026; orzech boilers quoted 15 000-25 000 zł installed",
  readOn: "2026-08-19",
  certainty: "low",
  note:
    "Class 5 plus a buffer tank of at least 30 l/kW is mandatory for Czyste Powietrze, which " +
    "lifts this above a bare boiler swap. Needs a real quote.",
};

/**
 * Air-to-air heat pump (multisplit), turnkey, hardware and installation.
 *
 * `HEAT_PUMP_INSTALLED_COST` above is specifically an air-to-water figure —
 * its own source text is about hydronic systems sized for a whole house. An
 * air-to-air multisplit is a different, materially cheaper job: no radiator
 * or hydronic plumbing work, so the split between the two bands below is
 * sourced independently rather than inherited from the air-to-water number.
 */
export const AIR_TO_AIR_HP_HARDWARE_COST: SourcedBand = {
  low: 6000,
  mid: 9000,
  high: 12000,
  unit: "zł, equipment only, incl. VAT",
  source:
    "Polish multisplit/AC market pricing 2026: outdoor unit plus 2-4 indoor " +
    "units quoted 6 000-12 000 zł for equipment alone",
  readOn: "2026-09-10",
  certainty: "low",
  note:
    "Sourced from air conditioning market pricing, since most inverter split " +
    "units sold in Poland are already reverse-cycle (heating-capable). Not " +
    "confirmed against a heat-pump-labelled quote specifically.",
};

export const AIR_TO_AIR_HP_INSTALLATION_COST: SourcedBand = {
  low: 3000,
  mid: 3600,
  high: 4300,
  unit: "zł, installation labour only, incl. VAT",
  source:
    "Polish installer pricing 2026: multisplit installation (2-3 indoor " +
    "units) quoted 2 967-4 300 zł, national average around 3 622 zł",
  readOn: "2026-09-10",
  certainty: "medium",
  note:
    "More indoor units or a longer pipe run push this toward the high end. " +
    "Some sources report a higher all-in total (up to ~18 000 zł) than " +
    "hardware plus installation here sums to; that gap is unresolved and " +
    "probably reflects bigger units or four-plus rooms.",
};

/**
 * Share of the AIR-TO-WATER heat pump's turnkey price that is installation
 * labour, not equipment. Used only to split `HEAT_PUMP_INSTALLED_COST`
 * into a hardware line and an installation line for display — it changes
 * nothing about the total, which stays whatever that constant already says.
 */
export const HEAT_PUMP_INSTALL_SHARE_OF_TOTAL: Sourced<number> = {
  value: 0.35,
  source:
    "Polish installer pricing 2026: installation labour commonly cited at " +
    "30-40% of total price; a worked 10 kW example (17 000-25 000 zł " +
    "equipment, 12 000-16 000 zł installation) implies close to 40%. 35% " +
    "is the midpoint of the commonly-cited range.",
  readOn: "2026-09-10",
  certainty: "low",
  note:
    "The least certain number in this file's capex section. It moves how a " +
    "single turnkey quote is split into two display lines, never the total.",
};

/** Same idea as above, for the pellet boiler. */
export const PELLET_BOILER_INSTALL_SHARE_OF_TOTAL: Sourced<number> = {
  value: 0.15,
  source:
    "Polish installer pricing 2026: pellet boiler installation labour " +
    "quoted 2 500-5 000 zł against a 20 000-24 000 zł boiler price " +
    "('z pełnym osprzętem') - roughly 10-20% of the combined figure",
  readOn: "2026-09-10",
  certainty: "low",
  note:
    "Markedly lower than the heat pump share above: a pellet boiler swap " +
    "is plumbing and a flue, not refrigerant lines and an outdoor unit. " +
    "One general source claims installation can reach 30-40% of a full " +
    "boiler-room job, which would include work (a new flue, a buffer tank) " +
    "that may already sit inside PELLET_BOILER_INSTALLED_COST's own range " +
    "rather than being additional to it.",
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

/**
 * Flat capex for a NEW PV array sized to the sheet's own flat production
 * assumption (`SHEET_PV.productionKwhPerYear`, 5 000 kWh/y — see
 * sheet.constants.ts).
 *
 * This is a point figure, not a band, given directly for this feature rather
 * than independently re-derived. Cross-check against the per-kWp band above:
 * 5 000 kWh/y at a typical Polish yield of ~1 000 kWh/kWp/y is roughly a
 * 5 kWp system, and 5 kWp x PV_INSTALLED_COST_PER_KWP.mid (4 200 zł/kWp) is
 * 21 000 zł — noticeably below this figure. The two are not reconciled here;
 * that gap is real and should be looked at before this number is quoted
 * anywhere that matters.
 */
export const PV_CAPEX_PLN: Sourced<number> = {
  value: 30000,
  source: "Given directly for the PV capex feature, 2026-09",
  readOn: "2026-09",
  certainty: "low",
  note:
    "Runs above the per-kWp cross-check (~21 000 zł for an equivalent " +
    "5 kWp system). Treat as a placeholder pending a real quote.",
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

// --- domestic hot water -----------------------------------------------------
// The model ignored hot water entirely until now, which quietly flattered the
// heat pump: tonnage-derived demand includes whatever the coal boiler heated,
// and all of it was handed to the pump at radiator SCOP. Hot water needs a
// higher temperature, so it runs at a worse COP. Splitting it out corrects
// that, and also lets us count immersion heating the household already pays
// for but never sees itemised.

export const DHW_KWH_PER_PERSON_YEAR: SourcedBand = {
  low: 700,
  mid: 1000,
  high: 1400,
  unit: "kWh/person/yr",
  source:
    "50 L per person per day at a 45 K rise is 955 kWh of useful energy " +
    "(50 x 45 x 4.186 / 3600 x 365), plus 15-25% tank and circulation losses",
  readOn: "2026-08-21",
  certainty: "medium",
  // VERIFY: arithmetic is sound, the 50 L/person/day figure is a European
  // convention rather than a Polish measurement. Worth one question in Magda's
  // interviews: how many people, how many showers.
};

export const DHW_HEAT_PUMP_COP: SourcedBand = {
  low: 2.0,
  mid: 2.6,
  high: 3.2,
  unit: "COP",
  source:
    "Hot water is stored at 50-55 C, well above a radiator flow temperature, " +
    "so a heat pump makes it at a materially lower COP than its heating SCOP",
  readOn: "2026-08-21",
  certainty: "low",
  note: "Unsourced band. Needs a manufacturer figure or an installer's view.",
};

export const SUMMER_DHW_SHARE: SourcedBand = {
  low: 0.33,
  mid: 0.42,
  high: 0.5,
  unit: "fraction",
  source:
    "Share of annual hot water made in the months a coal boiler is shut down, " +
    "roughly May to September",
  readOn: "2026-08-21",
  certainty: "low",
  note: "Modelling assumption. Flag on any slide using it.",
};

export const IMMERSION_EFFICIENCY: Sourced<number> = {
  value: 1.0,
  source:
    "Resistance heating converts electricity to heat at unity by definition",
  readOn: "2026-08-21",
  certainty: "high",
};

export const BASELINE_HOUSEHOLD_KWH_YEAR: SourcedBand = {
  low: 1800,
  mid: 2400,
  high: 3200,
  unit: "kWh/yr",
  source:
    "Household electricity excluding space heating and hot water: lighting, " +
    "appliances, electronics",
  readOn: "2026-08-21",
  certainty: "low",
  note:
    "Used only to reconcile a stated bill against expected use. A large excess " +
    "usually means electric heaters or an immersion tank nobody mentioned.",
};

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
  AIR_TO_AIR_HP_HARDWARE_COST,
  AIR_TO_AIR_HP_INSTALLATION_COST,
  HEAT_PUMP_INSTALL_SHARE_OF_TOTAL,
  PELLET_BOILER_INSTALL_SHARE_OF_TOTAL,
  PV_INSTALLED_COST_PER_KWP,
  PV_CAPEX_PLN,
  COAL_BOILER_REPLACEMENT_COST,
  HEAT_PUMP_LIFE_YEARS,
  PELLET_BOILER_LIFE_YEARS,
  DHW_KWH_PER_PERSON_YEAR,
  DHW_HEAT_PUMP_COP,
  SUMMER_DHW_SHARE,
  IMMERSION_EFFICIENCY,
  BASELINE_HOUSEHOLD_KWH_YEAR,
  INSULATE_FIRST_THRESHOLD,
  ...TABLE_CONSTANTS,
};
