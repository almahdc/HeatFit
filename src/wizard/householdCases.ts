// Real interview-derived household profiles.
//
// These exist so the form below can be quick-filled with a known-good
// dataset while testing or demoing, rather than retyping each interview by
// hand. The fields here are deliberately Poland/coal-specific: a different,
// narrower domain than the generic AssessmentState used by the rest of the
// wizard: so this stays its own module rather than folding into
// assessmentTypes.ts.
//
// The free-text fields below (radiatorNote, coalPriceNote,
// freeCoalNote, electricityBillNote, additionalNotes) are left
// empty here on purpose: they are display prose, not data, so their real
// values live in the i18n dictionary under `personas.cases.<id>.seed` and are
// merged in at load time, in whichever language is active. See
// `loadPreset` in HouseholdCaseStudy.tsx.

export type CoalType = "orzech" | "groszek" | "kostka" | "mul" | "other";
/**
 * "ecodesign" is a household-known credential, not a Polish emission class:
 * boilers meeting the EU Ecodesign regulation are often assumed to be as
 * clean as Class 5, but the two are separate standards and Ecodesign alone
 * does not confirm the Class 5 rating the Silesian anti-smog resolution
 * actually requires. See engines/regulatoryDeadlines.ts for how this
 * uncertainty is handled rather than guessed away.
 */
export type BoilerClass =
  "bezklasowy" | "class3" | "class4" | "class5" | "ecodesign";
export type CityDeadlineNotice =
  "none" | "pressOrMediaOnly" | "officialLetter" | "chimneySweep";
export type RadiatorKind = "standard" | "floorHeating" | "mixed";
export type HouseKind = "detached" | "semiDetached";
export type UnheatedPortion = "wholeFloor" | "someRooms" | "basementOrGarage";

/**
 * Fixed reduction applied to total floor area when only part of the house is
 * heated, in place of asking the household to estimate a percentage
 * themselves. Working assumptions, not measured figures: revisit once the
 * 50-household Silesia pilot gives a real sense of the heated/unheated split
 * in the target housing stock.
 */
export const UNHEATED_PORTION_REDUCTION: Record<UnheatedPortion, number> = {
  // VERIFY: assumes a roughly two-storey house with comparable floor sizes.
  wholeFloor: 0.5,
  // VERIFY: rough midpoint for "a handful of rooms", not derived from data.
  someRooms: 0.15,
  // VERIFY: placeholder default.
  basementOrGarage: 0.1,
};

/**
 * Effective heated area from the structured Step 2/3 answers: the total
 * floor area itself when the whole house is heated, otherwise the total
 * reduced by the fixed assumption for whatever is not heated.
 *
 * There is currently no floor-by-floor or room-by-room radiator signal
 * elsewhere in the intake (see `radiatorType`/`radiatorNote`, which describe
 * technology and condition, not location) to prefer over the fixed
 * percentage. If one is added later, it should be checked here first for
 * "wholeFloor" and "someRooms" before falling back to these reductions.
 */
export function computeHeatedAreaM2(
  totalAreaM2: number,
  wholeHouseHeated: boolean,
  unheatedPortion: UnheatedPortion | null,
): number {
  if (wholeHouseHeated || !unheatedPortion) return totalAreaM2;
  return Math.round(
    totalAreaM2 * (1 - UNHEATED_PORTION_REDUCTION[unheatedPortion]),
  );
}
export type ElectricityTariffCase = "G11" | "G12";
export type WaterHeatingCase =
  | "electricBoilerNew"
  | "electricSummerCoalWinter"
  | "coalCentralAllYear"
  | "electricNightTariff";
export type ReplacementPreference =
  "gas" | "pelletBoiler" | "heatPump" | "pelletOrHeatPump" | "undecided";
export type InsulationLevel = "none" | "standard" | "veryGood";
export type WindowFrame = "woodenOld" | "doublePanePvc" | "triplePanePvc";

export interface HouseholdCaseInputs {
  // Location & municipal contact: asked alongside the postal code on step 1,
  // even though it lives on the household record rather than AssessmentState.
  cityDeadlineNotice: CityDeadlineNotice;

  // Home & comfort
  houseKind: HouseKind;
  insulation: InsulationLevel;
  windowFrame: WindowFrame;
  /** Total floor area, as given directly by the household (Step 1). */
  totalAreaM2: number;
  /** Step 2: is the whole house heated? */
  wholeHouseHeated: boolean;
  /** Step 3, only asked when `wholeHouseHeated` is false. */
  unheatedPortion: UnheatedPortion | null;
  /**
   * Heated area actually fed to the engines: equal to `totalAreaM2` when
   * `wholeHouseHeated`, otherwise `totalAreaM2` reduced by the fixed
   * assumption for `unheatedPortion` (see `computeHeatedAreaM2`). Labelled
   * "estimated heated area" in the UI whenever it is not the household's own
   * stated total.
   */
  heatedAreaM2: number;
  radiatorType: RadiatorKind;
  radiatorNote: string;
  occupants: number;
  acAvailable: boolean;

  // Current heating & fuel
  coalType: CoalType;
  usesWoodToo: boolean;
  coalTonnesPerSeason: number;
  coalPricePerTonnePln: number;
  coalPriceNote: string;
  freeCoalReceived: boolean;
  freeCoalTonnes: number | "";
  freeCoalNote: string;
  boilerYear: number | "";
  boilerClass: BoilerClass;
  replacementPreference: ReplacementPreference;

  // Electricity & water
  electricityTariff: ElectricityTariffCase;
  electricityBillPlnPerMonth: number;
  electricityBillNote: string;
  waterHeating: WaterHeatingCase;
  showersBathsPerWeek: number;
  gasConnectionAvailable: boolean;
  districtHeatingAvailable: boolean;
  hasPvPanels: boolean;
  hasBattery: boolean;
  hasHeatStorage: boolean;
  additionalNotes: string;
}

export const initialHouseholdCase: HouseholdCaseInputs = {
  cityDeadlineNotice: "none",

  houseKind: "detached",
  insulation: "standard",
  windowFrame: "doublePanePvc",
  totalAreaM2: 130,
  wholeHouseHeated: true,
  unheatedPortion: null,
  heatedAreaM2: 130,
  radiatorType: "standard",
  radiatorNote: "",
  occupants: 3,
  acAvailable: false,

  coalType: "orzech",
  usesWoodToo: false,
  coalTonnesPerSeason: 4,
  coalPricePerTonnePln: 1300,
  coalPriceNote: "",
  freeCoalReceived: false,
  freeCoalTonnes: "",
  freeCoalNote: "",
  boilerYear: "",
  boilerClass: "class4",
  replacementPreference: "undecided",

  electricityTariff: "G11",
  electricityBillPlnPerMonth: 200,
  electricityBillNote: "",
  waterHeating: "electricBoilerNew",
  showersBathsPerWeek: 7,
  gasConnectionAvailable: false,
  districtHeatingAvailable: false,
  hasPvPanels: false,
  hasBattery: false,
  hasHeatStorage: false,
  additionalNotes: "",
};

/** Ids double as i18n keys: see `personas.cases` in the dictionaries. */
export type HouseholdCaseId =
  "warmthGuardian" | "methodicalPlanner" | "groundFloorManager" | "nightWatch";

export interface HouseholdCasePreset {
  id: HouseholdCaseId;
  data: HouseholdCaseInputs;
}

export const HOUSEHOLD_CASE_PRESETS: HouseholdCasePreset[] = [
  {
    id: "warmthGuardian",
    data: {
      cityDeadlineNotice: "pressOrMediaOnly",

      houseKind: "detached",
      insulation: "none",
      windowFrame: "woodenOld",
      totalAreaM2: 125,
      wholeHouseHeated: true,
      unheatedPortion: null,
      heatedAreaM2: 125,
      radiatorType: "standard",
      radiatorNote: "",
      occupants: 3,
      acAvailable: false,

      coalType: "orzech",
      usesWoodToo: true,
      coalTonnesPerSeason: 5,
      coalPricePerTonnePln: 1300,
      coalPriceNote: "",
      freeCoalReceived: false,
      freeCoalTonnes: "",
      freeCoalNote: "",
      boilerYear: 2011,
      boilerClass: "bezklasowy",
      replacementPreference: "gas",

      electricityTariff: "G11",
      electricityBillPlnPerMonth: 400,
      electricityBillNote: "",
      waterHeating: "electricBoilerNew",
      showersBathsPerWeek: 5,
      gasConnectionAvailable: true,
      districtHeatingAvailable: false,
      hasPvPanels: false,
      hasBattery: false,
      hasHeatStorage: false,
      additionalNotes: "",
    },
  },
  {
    id: "methodicalPlanner",
    data: {
      cityDeadlineNotice: "none",

      houseKind: "detached",
      insulation: "none",
      windowFrame: "woodenOld",
      totalAreaM2: 130,
      wholeHouseHeated: false,
      unheatedPortion: "someRooms",
      heatedAreaM2: 110,
      radiatorType: "standard",
      radiatorNote: "",
      occupants: 2,
      acAvailable: false,

      coalType: "groszek",
      usesWoodToo: false,
      coalTonnesPerSeason: 4.8,
      coalPricePerTonnePln: 1250,
      coalPriceNote: "",
      freeCoalReceived: true,
      freeCoalTonnes: 1,
      freeCoalNote: "",
      boilerYear: 2017,
      boilerClass: "class4",
      replacementPreference: "gas",

      electricityTariff: "G11",
      electricityBillPlnPerMonth: 190,
      electricityBillNote: "",
      waterHeating: "electricSummerCoalWinter",
      showersBathsPerWeek: 4,
      gasConnectionAvailable: true,
      districtHeatingAvailable: false,
      hasPvPanels: false,
      hasBattery: false,
      hasHeatStorage: false,
      additionalNotes: "",
    },
  },
  {
    id: "groundFloorManager",
    data: {
      cityDeadlineNotice: "none",

      houseKind: "detached",
      insulation: "none",
      windowFrame: "woodenOld",
      totalAreaM2: 130,
      wholeHouseHeated: false,
      unheatedPortion: "wholeFloor",
      heatedAreaM2: 65,
      radiatorType: "standard",
      radiatorNote: "",
      occupants: 1,
      acAvailable: false,

      coalType: "kostka",
      usesWoodToo: false,
      coalTonnesPerSeason: 4.5,
      coalPricePerTonnePln: 1400,
      coalPriceNote: "",
      freeCoalReceived: false,
      freeCoalTonnes: "",
      freeCoalNote: "",
      boilerYear: 2011,
      boilerClass: "class3",
      replacementPreference: "pelletOrHeatPump",

      electricityTariff: "G11",
      electricityBillPlnPerMonth: 150,
      electricityBillNote: "",
      waterHeating: "coalCentralAllYear",
      showersBathsPerWeek: 4,
      gasConnectionAvailable: false,
      districtHeatingAvailable: false,
      hasPvPanels: false,
      hasBattery: false,
      hasHeatStorage: false,
      additionalNotes: "",
    },
  },
  {
    id: "nightWatch",
    data: {
      cityDeadlineNotice: "none",

      houseKind: "detached",
      insulation: "standard",
      windowFrame: "doublePanePvc",
      totalAreaM2: 150,
      wholeHouseHeated: false,
      unheatedPortion: "someRooms",
      heatedAreaM2: 128,
      radiatorType: "standard",
      radiatorNote: "",
      occupants: 4,
      acAvailable: false,

      coalType: "orzech",
      usesWoodToo: false,
      coalTonnesPerSeason: 5.5,
      coalPricePerTonnePln: 1300,
      coalPriceNote: "",
      freeCoalReceived: false,
      freeCoalTonnes: "",
      freeCoalNote: "",
      boilerYear: 2013,
      boilerClass: "class3",
      replacementPreference: "pelletOrHeatPump",

      electricityTariff: "G12",
      electricityBillPlnPerMonth: 380,
      electricityBillNote: "",
      waterHeating: "electricNightTariff",
      showersBathsPerWeek: 4,
      gasConnectionAvailable: false,
      districtHeatingAvailable: false,
      hasPvPanels: false,
      hasBattery: false,
      hasHeatStorage: false,
      additionalNotes: "",
    },
  },
];
