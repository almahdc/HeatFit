// Real interview-derived household profiles.
//
// These exist so the form below can be quick-filled with a known-good
// dataset while testing or demoing, rather than retyping each interview by
// hand. The fields here are deliberately Poland/coal-specific — a different,
// narrower domain than the generic AssessmentState used by the rest of the
// wizard — so this stays its own module rather than folding into
// assessmentTypes.ts.

export type CoalType = "orzech" | "groszekMieszanka" | "kostka" | "other";
export type BoilerClass = "bezklasowy" | "class3" | "class4" | "class5";
export type FeedType = "manual" | "automatic";
export type CityDeadlineNotice = "none" | "pressOrMediaOnly" | "officialLetter";
export type RadiatorKind = "standard" | "floorHeating" | "mixed";
export type ElectricityTariffCase = "G11" | "G12";
export type WaterHeatingCase =
  | "electricBoilerNew"
  | "electricSummerCoalWinter"
  | "coalCentralAllYear"
  | "electricNightTariff";
export type ReplacementPreference =
  "gas" | "pelletBoiler" | "heatPump" | "pelletOrHeatPump" | "undecided";

export interface HouseholdCaseInputs {
  coalType: CoalType;
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
  heatedAreaM2: number;
  radiatorType: RadiatorKind;
  radiatorNote: string;
  occupants: number;
  electricityTariff: ElectricityTariffCase;
  electricityBillPlnPerMonth: number;
  electricityBillNote: string;
  waterHeating: WaterHeatingCase;
  showersBathsPerWeek: number;
  acAvailable: boolean;
  gasConnectionAvailable: boolean;
  replacementPreference: ReplacementPreference;
  coalProvider: string;
  unheatedRooms: string;
  additionalNotes: string;
}

export const initialHouseholdCase: HouseholdCaseInputs = {
  coalType: "orzech",
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
  heatedAreaM2: 130,
  radiatorType: "standard",
  radiatorNote: "",
  occupants: 3,
  electricityTariff: "G11",
  electricityBillPlnPerMonth: 200,
  electricityBillNote: "",
  waterHeating: "electricBoilerNew",
  showersBathsPerWeek: 7,
  acAvailable: false,
  gasConnectionAvailable: false,
  replacementPreference: "undecided",
  coalProvider: "",
  unheatedRooms: "None",
  additionalNotes: "",
};

export interface HouseholdCasePreset {
  id: string;
  name: string;
  tagline: string;
  data: HouseholdCaseInputs;
}

export const HOUSEHOLD_CASE_PRESETS: HouseholdCasePreset[] = [
  {
    id: "grandmaKrysia",
    name: "Grandma Krysia",
    tagline: "Why touch it? Why change it?",
    data: {
      coalType: "orzech",
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
      heatedAreaM2: 125,
      radiatorType: "standard",
      radiatorNote: "",
      occupants: 5,
      electricityTariff: "G11",
      electricityBillPlnPerMonth: 400,
      electricityBillNote: "Prognoza, flat, 6-month settlement",
      waterHeating: "electricBoilerNew",
      showersBathsPerWeek: 7,
      acAvailable: false,
      gasConnectionAvailable: true,
      replacementPreference: "gas",
      coalProvider: "PGG (pgg.pl), delivered via regional KDW depot",
      unheatedRooms: "None — whole house heated",
      additionalNotes:
        "90% finances, 10% doesn't see why switching to clean energy is needed.",
    },
  },
  {
    id: "grandpaJanek",
    name: "Grandpa Janek",
    tagline: "Everything at the last minute",
    data: {
      coalType: "groszekMieszanka",
      coalTonnesPerSeason: 4.8,
      coalPricePerTonnePln: 1250,
      coalPriceNote: "",
      freeCoalReceived: true,
      freeCoalTonnes: 1,
      freeCoalNote: "From a relative's farm",
      boilerYear: 2017,
      boilerClass: "class4",
      feedType: "manual",
      cityDeadlineNotice: "none",
      heatedAreaM2: 130,
      radiatorType: "standard",
      radiatorNote: "Small standard panels",
      occupants: 2,
      electricityTariff: "G11",
      electricityBillPlnPerMonth: 190,
      electricityBillNote: "",
      waterHeating: "electricSummerCoalWinter",
      showersBathsPerWeek: 4,
      acAvailable: false,
      gasConnectionAvailable: true,
      replacementPreference: "gas",
      coalProvider: "Private agricultural depot",
      unheatedRooms: "Guest room (~20 m²)",
      additionalNotes: "",
    },
  },
  {
    id: "mrsTeresa",
    name: "Mrs. Teresa",
    tagline: "In the big house",
    data: {
      coalType: "kostka",
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
      heatedAreaM2: 130,
      radiatorType: "standard",
      radiatorNote: "Old, massive cast-iron radiators — extremely hot to touch",
      occupants: 1,
      electricityTariff: "G11",
      electricityBillPlnPerMonth: 150,
      electricityBillNote: "",
      waterHeating: "coalCentralAllYear",
      showersBathsPerWeek: 4,
      acAvailable: false,
      gasConnectionAvailable: false,
      replacementPreference: "pelletOrHeatPump",
      coalProvider: "Local fuel merchant with private transport",
      unheatedRooms:
        "Upper-floor bedrooms / storage rooms (~50 m²) left completely unheated",
      additionalNotes: "",
    },
  },
  {
    id: "mrMarek",
    name: "Mr. Marek",
    tagline: "On the night tariff",
    data: {
      coalType: "orzech",
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
      heatedAreaM2: 150,
      radiatorType: "standard",
      radiatorNote: "Old, large cast-iron radiators — extremely hot to touch",
      occupants: 4,
      electricityTariff: "G12",
      electricityBillPlnPerMonth: 380,
      electricityBillNote: "",
      waterHeating: "electricNightTariff",
      showersBathsPerWeek: 4,
      acAvailable: false,
      gasConnectionAvailable: false,
      replacementPreference: "pelletOrHeatPump",
      coalProvider: "Local private fuel depot (skład opału)",
      unheatedRooms: "Uninsulated attic space (~15 m²)",
      additionalNotes: "",
    },
  },
];
