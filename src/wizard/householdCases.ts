// Real interview-derived household profiles.
//
// These exist so the form below can be quick-filled with a known-good
// dataset while testing or demoing, rather than retyping each interview by
// hand. The fields here are deliberately Poland/coal-specific — a different,
// narrower domain than the generic AssessmentState used by the rest of the
// wizard — so this stays its own module rather than folding into
// assessmentTypes.ts.

export type CoalType = "orzech" | "groszek" | "kostka" | "mul" | "other";
export type BoilerClass = "bezklasowy" | "class3" | "class4" | "class5";
export type FeedType = "manual" | "automatic";
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
  feedType: FeedType;
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
  feedType: "manual",
  cityDeadlineNotice: "none",
  replacementPreference: "undecided",
  coalProvider: "",

  electricityTariff: "G11",
  electricityBillPlnPerMonth: 200,
  electricityBillNote: "",
  waterHeating: "electricBoilerNew",
  showersBathsPerWeek: 7,
  gasConnectionAvailable: false,
  hasPvPanels: false,
  hasBattery: false,
  hasHeatStorage: false,
  additionalNotes: "",
};

export interface HouseholdCasePreset {
  id: string;
  name: string;
  tagline: string;
  description: string;
  data: HouseholdCaseInputs;
}

export const HOUSEHOLD_CASE_PRESETS: HouseholdCasePreset[] = [
  {
    id: "grandmaKrysia",
    name: "Grandma Krysia",
    tagline: "Why touch it? Why change it?",
    description:
      "Uses an old off-class manual coal boiler and relies on local media updates.",
    data: {
      houseKind: "detached",
      insulation: "none",
      windowFrame: "woodenOld",
      heatedAreaM2: 125,
      radiatorType: "standard",
      radiatorNote: "",
      occupants: 5,
      acAvailable: false,
      unheatedRooms: "None — whole house heated",

      coalType: "orzech",
      usesWoodToo: false,
      coalTonnesPerSeason: 5,
      coalPricePerTonnePln: 1300,
      coalPriceNote: "300 zł/t is transport — 1,000 zł/t ex-works",
      freeCoalReceived: false,
      freeCoalTonnes: "",
      freeCoalNote: "Not asked",
      boilerYear: 2011,
      boilerClass: "bezklasowy",
      feedType: "manual",
      cityDeadlineNotice: "pressOrMediaOnly",
      replacementPreference: "gas",
      coalProvider: "PGG (pgg.pl), delivered via regional KDW depot",

      electricityTariff: "G11",
      electricityBillPlnPerMonth: 400,
      electricityBillNote: "Prognoza, flat, 6-month settlement",
      waterHeating: "electricBoilerNew",
      showersBathsPerWeek: 7,
      gasConnectionAvailable: true,
      hasPvPanels: false,
      hasBattery: false,
      hasHeatStorage: false,
      additionalNotes:
        "90% finances, 10% doesn't see why switching to clean energy is needed.",
    },
  },
  {
    id: "grandpaJanek",
    name: "Grandpa Janek",
    tagline: "Everything at the last minute",
    description:
      "Has a gas connection at the fence and an aging Class 4 boiler from 2017.",
    data: {
      houseKind: "detached",
      insulation: "none",
      windowFrame: "woodenOld",
      heatedAreaM2: 130,
      radiatorType: "standard",
      radiatorNote: "Small standard panels",
      occupants: 2,
      acAvailable: false,
      unheatedRooms: "Guest room (~20 m²)",

      coalType: "groszek",
      usesWoodToo: false,
      coalTonnesPerSeason: 4.8,
      coalPricePerTonnePln: 1250,
      coalPriceNote: "Mixed grades (groszek / mieszanka)",
      freeCoalReceived: true,
      freeCoalTonnes: 1,
      freeCoalNote: "From a relative's farm",
      boilerYear: 2017,
      boilerClass: "class4",
      feedType: "manual",
      cityDeadlineNotice: "none",
      replacementPreference: "gas",
      coalProvider: "Private agricultural depot",

      electricityTariff: "G11",
      electricityBillPlnPerMonth: 190,
      electricityBillNote: "",
      waterHeating: "electricSummerCoalWinter",
      showersBathsPerWeek: 4,
      gasConnectionAvailable: true,
      hasPvPanels: false,
      hasBattery: false,
      hasHeatStorage: false,
      additionalNotes: "",
    },
  },
  {
    id: "mrsTeresa",
    name: "Mrs. Teresa",
    tagline: "In the big house",
    description:
      "Living alone in a large legacy home with massive radiators and unheated upper rooms.",
    data: {
      houseKind: "detached",
      insulation: "none",
      windowFrame: "woodenOld",
      heatedAreaM2: 130,
      radiatorType: "standard",
      radiatorNote: "Old, massive cast-iron radiators — extremely hot to touch",
      occupants: 1,
      acAvailable: false,
      unheatedRooms:
        "Upper-floor bedrooms / storage rooms (~50 m²) left completely unheated",

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
      feedType: "manual",
      cityDeadlineNotice: "none",
      replacementPreference: "pelletOrHeatPump",
      coalProvider: "Local fuel merchant with private transport",

      electricityTariff: "G11",
      electricityBillPlnPerMonth: 150,
      electricityBillNote: "",
      waterHeating: "coalCentralAllYear",
      showersBathsPerWeek: 4,
      gasConnectionAvailable: false,
      hasPvPanels: false,
      hasBattery: false,
      hasHeatStorage: false,
      additionalNotes: "",
    },
  },
  {
    id: "mrMarek",
    name: "Mr. Marek",
    tagline: "On the night tariff",
    description:
      "A pragmatic optimizer using the G12 night tariff, Orzech coal, and night-active water heating.",
    data: {
      houseKind: "detached",
      insulation: "standard",
      windowFrame: "doublePanePvc",
      heatedAreaM2: 150,
      radiatorType: "standard",
      radiatorNote: "Old, large cast-iron radiators — extremely hot to touch",
      occupants: 4,
      acAvailable: false,
      unheatedRooms: "Uninsulated attic space (~15 m²)",

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
      feedType: "manual",
      cityDeadlineNotice: "none",
      replacementPreference: "pelletOrHeatPump",
      coalProvider: "Local private fuel depot (skład opału)",

      electricityTariff: "G12",
      electricityBillPlnPerMonth: 380,
      electricityBillNote: "",
      waterHeating: "electricNightTariff",
      showersBathsPerWeek: 4,
      gasConnectionAvailable: false,
      hasPvPanels: false,
      hasBattery: false,
      hasHeatStorage: false,
      additionalNotes: "",
    },
  },
];
