/**
 * screening.ts — household facts that are not about heat demand at all, but
 * gate or route every downstream path (gas, pellet, heat pump, solar,
 * insulation) before any kWh math runs.
 *
 * Runs once, ahead of the coal baseline. Never touches Range or energy units —
 * this is eligibility logic, not physics.
 */

export type BuildingType = "detached" | "semiDetached" | "terraced" | "flat";
export type Ownership = "ownedOutright" | "mortgaged" | "renting";
export type OutdoorSpace = "garden" | "balconyOnly" | "none";
export type RoofAccess = "ownRoof" | "sharedRoof" | "flatRoof" | "none";
export type FuelAccess = "truckAccess" | "dryStorage";

export interface HouseholdScreen {
  buildingType: BuildingType;
  ownership: Ownership;
  outdoorSpace: OutdoorSpace;
  roofAccess: RoofAccess;
  fuelAccess: FuelAccess[];
}

export type PathId = "gas" | "pellet" | "heatPump" | "solar" | "insulation";

export interface PathEligibility {
  path: PathId;
  eligible: boolean;
  reason?: string;
}

export interface ScreeningResult {
  canProceed: boolean;
  stopReason?: string;
  paths: PathEligibility[];
}

function eligible(path: PathId): PathEligibility {
  return { path, eligible: true };
}
function blocked(path: PathId, reason: string): PathEligibility {
  return { path, eligible: false, reason };
}

export function screenHousehold(h: HouseholdScreen): ScreeningResult {
  if (h.ownership === "renting") {
    return {
      canProceed: false,
      stopReason:
        "This tool is for the person who decides on the heating system. " +
        "As a tenant, that decision sits with your landlord, worth sharing this with them.",
      paths: [],
    };
  }

  const paths: PathEligibility[] = [];

  paths.push(eligible("gas"));

  if (
    h.fuelAccess.includes("truckAccess") &&
    h.fuelAccess.includes("dryStorage")
  ) {
    paths.push(eligible("pellet"));
  } else if (!h.fuelAccess.includes("truckAccess")) {
    paths.push(blocked("pellet", "A delivery truck cannot reach the house."));
  } else {
    paths.push(blocked("pellet", "There is nowhere dry to store pellets."));
  }

  if (h.outdoorSpace === "none") {
    paths.push(
      blocked(
        "heatPump",
        "There is no outdoor space for the unit, not a garden, not even a balcony.",
      ),
    );
  } else if (h.buildingType === "flat" && h.outdoorSpace === "balconyOnly") {
    paths.push(
      blocked(
        "heatPump",
        "A balcony may work for a small unit, but a flat needs sign-off from the building, worth checking before going further.",
      ),
    );
  } else {
    paths.push(eligible("heatPump"));
  }

  if (h.roofAccess === "none") {
    paths.push(blocked("solar", "There is no roof access for panels."));
  } else if (h.roofAccess === "sharedRoof") {
    paths.push(
      blocked(
        "solar",
        "The roof is shared, this needs agreement from the other owners first.",
      ),
    );
  } else {
    paths.push(eligible("solar"));
  }

  if (h.buildingType === "flat") {
    paths.push(
      blocked(
        "insulation",
        "In a flat, wall and roof insulation is usually a building-wide decision, not yours alone.",
      ),
    );
  } else {
    paths.push(eligible("insulation"));
  }

  const anyLiveOption = paths.some((p) => p.eligible && p.path !== "gas");
  if (!anyLiveOption) {
    return {
      canProceed: false,
      stopReason:
        "Based on what you've told us, none of the alternatives to your current heating look " +
        "possible for this property yet. Worth revisiting if that changes.",
      paths,
    };
  }

  return { canProceed: true, paths };
}

export function needsFlatGrantRoute(h: HouseholdScreen): boolean {
  return h.buildingType === "flat";
}
