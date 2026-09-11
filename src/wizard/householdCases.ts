// Real interview-derived household profiles.
//
// These exist so the form below can be quick-filled with a known-good
// dataset while testing or demoing, rather than retyping each interview by
// hand. The fields here are deliberately Poland/coal-specific: a different,
// narrower domain than the generic AssessmentState used by the rest of the
// wizard: so this stays its own module rather than folding into
// assessmentTypes.ts.
//
// The free-text fields below (radiatorNote, unheatedRooms, coalPriceNote,
// freeCoalNote, coalProvider, electricityBillNote, additionalNotes) are left
// empty here on purpose: they are display prose, not data, so their real
// values live in the i18n dictionary under `personas.cases.<id>.seed` and are
// merged in at load time, in whichever language is active. See
// `loadPreset` in HouseholdCaseStudy.tsx.

export type CoalType = "orzech" | "groszek" | "kostka" | "mul" | "other";
export type BoilerClass = "bezklasowy" | "class3" | "class4" | "class5";
export type CityDeadlineNotice = "none" | "pressOrMediaOnly" | "officialLetter";
export type RadiatorKind = "standard" | "floorHeating" | "mixed";
export type HouseKind = "detached" | "semiDetached" | "apartment";
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
  // Home & comfort
  houseKind: HouseKind;
  insulation: InsulationLevel;
  windowFrame: WindowFrame;
  heatedAreaM2: number;
  radiatorType: RadiatorKind;
  radiatorNote: string;
  occupants: number;
  acAvailable: boolean;
  unheatedRooms: string;

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
  cityDeadlineNotice: CityDeadlineNotice;
  replacementPreference: ReplacementPreference;
  coalProvider: string;

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
  houseKind: "detached",
  insulation: "standard",
  windowFrame: "doublePanePvc",
  heatedAreaM2: 130,
  radiatorType: "standard",
  radiatorNote: "",
  occupants: 3,
  acAvailable: false,
  unheatedRooms: "None",

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
  cityDeadlineNotice: "none",
  replacementPreference: "undecided",
  coalProvider: "",

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
  "grandmaKrysia" | "grandpaJanek" | "mrsTeresa" | "mrMarek";

export interface HouseholdCasePreset {
  id: HouseholdCaseId;
  data: HouseholdCaseInputs;
}

export const HOUSEHOLD_CASE_PRESETS: HouseholdCasePreset[] = [
  {
    id: "grandmaKrysia",
    data: {
      houseKind: "detached",
      insulation: "none",
      windowFrame: "woodenOld",
      heatedAreaM2: 125,
      radiatorType: "standard",
      radiatorNote: "",
      occupants: 3,
      acAvailable: false,
      unheatedRooms: "",

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
      cityDeadlineNotice: "pressOrMediaOnly",
      replacementPreference: "gas",
      coalProvider: "",

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
    id: "grandpaJanek",
    data: {
      houseKind: "detached",
      insulation: "none",
      windowFrame: "woodenOld",
      heatedAreaM2: 130,
      radiatorType: "standard",
      radiatorNote: "",
      occupants: 2,
      acAvailable: false,
      unheatedRooms: "",

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
      cityDeadlineNotice: "none",
      replacementPreference: "gas",
      coalProvider: "",

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
    id: "mrsTeresa",
    data: {
      houseKind: "detached",
      insulation: "none",
      windowFrame: "woodenOld",
      heatedAreaM2: 130,
      radiatorType: "standard",
      radiatorNote: "",
      occupants: 1,
      acAvailable: false,
      unheatedRooms: "",

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
      cityDeadlineNotice: "none",
      replacementPreference: "pelletOrHeatPump",
      coalProvider: "",

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
    id: "mrMarek",
    data: {
      houseKind: "detached",
      insulation: "standard",
      windowFrame: "doublePanePvc",
      heatedAreaM2: 150,
      radiatorType: "standard",
      radiatorNote: "",
      occupants: 4,
      acAvailable: false,
      unheatedRooms: "",

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
      cityDeadlineNotice: "none",
      replacementPreference: "pelletOrHeatPump",
      coalProvider: "",

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
