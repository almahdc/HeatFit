// Shape of everything the multi-step energy assessment form collects.
//
// Grouped by the four background calculations each field ultimately feeds —
// heating demand, hot water demand, base electricity, and cooling demand —
// so the engine that replaces `estimateEnergyProfile` below can be written
// against this file without renegotiating the form's shape.

export type HomeType =
  "house" | "apartmentBuilding" | "warehouse" | "commercial";

export type HouseKind = "detached" | "semiDetached";

export type InsulationLevel = "none" | "standard" | "veryGood";

export type WindowFrame = "woodenOld" | "doublePanePvc" | "triplePanePvc";

export type RadiatorType = "standard" | "floorHeating" | "mixed";

export type SpaceHeaterFuel = "gas" | "oil" | "coal" | "wood";

export type WaterHeaterType =
  "electricTank" | "instantGas" | "combinedWithHeater" | "solar";

export type CoolingType = "none" | "splitAc" | "centralAc" | "fansOnly";

export type ElectricityTariff = "singleRate" | "timeOfUse";

export interface LocationInputs {
  postalCode: string;
}

export interface HomeInputs {
  homeType: HomeType;
  houseKind: HouseKind;
  heatedAreaM2: number;
  insulation: InsulationLevel;
  windowFrame: WindowFrame;
  occupants: number;
  radiatorType: RadiatorType;
}

export interface HeatingSystemInputs {
  spaceHeaterFuel: SpaceHeaterFuel;
  fuelPricePerSeason: number | "";
  waterHeaterType: WaterHeaterType;
  cooling: CoolingType;
  electricityTariff: ElectricityTariff;
  electricityPricePerKwh: number | "";
  hasPvPanels: boolean;
  hasBattery: boolean;
  hasHeatStorage: boolean;
}

export interface AssessmentState {
  location: LocationInputs;
  home: HomeInputs;
  heating: HeatingSystemInputs;
}

export const initialAssessmentState: AssessmentState = {
  location: {
    postalCode: "",
  },
  home: {
    homeType: "house",
    houseKind: "detached",
    heatedAreaM2: 140,
    insulation: "standard",
    windowFrame: "doublePanePvc",
    occupants: 3,
    radiatorType: "standard",
  },
  heating: {
    spaceHeaterFuel: "gas",
    fuelPricePerSeason: "",
    waterHeaterType: "electricTank",
    cooling: "none",
    electricityTariff: "singleRate",
    electricityPricePerKwh: "",
    hasPvPanels: false,
    hasBattery: false,
    hasHeatStorage: false,
  },
};

/**
 * The four figures the rest of the calculator is priced from.
 *
 * Left null until the real coefficients (climate zone by postal code,
 * insulation/window U-values, appliance loads, …) are finalised — a wizard
 * this size should not ship guessed numbers dressed up as an estimate.
 */
export interface EnergyProfileEstimate {
  heatingDemandKwh: number | null;
  hotWaterDemandKwh: number | null;
  baseElectricityKwh: number | null;
  coolingDemandKwh: number | null;
}

export function estimateEnergyProfile(
  _state: AssessmentState,
): EnergyProfileEstimate {
  return {
    heatingDemandKwh: null,
    hotWaterDemandKwh: null,
    baseElectricityKwh: null,
    coolingDemandKwh: null,
  };
}
