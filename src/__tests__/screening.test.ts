import { describe, expect, it } from "vitest";
import { HouseholdScreen, needsFlatGrantRoute, screenHousehold } from "../engines/screening";

const BASE: HouseholdScreen = {
  buildingType: "detached",
  ownership: "ownedOutright",
  outdoorSpace: "garden",
  roofAccess: "ownRoof",
  fuelAccess: ["truckAccess", "dryStorage"],
};

describe("screening", () => {
  it("stops a renter before any path is evaluated", () => {
    const r = screenHousehold({ ...BASE, ownership: "renting" });
    expect(r.canProceed).toBe(false);
    expect(r.paths).toHaveLength(0);
    expect(r.stopReason).toContain("landlord");
  });

  it("opens every path for a well-placed detached house", () => {
    const r = screenHousehold(BASE);
    expect(r.canProceed).toBe(true);
    expect(r.paths.every((p) => p.eligible)).toBe(true);
  });

  it("blocks heat pump when there is no outdoor space at all", () => {
    const r = screenHousehold({ ...BASE, outdoorSpace: "none" });
    expect(r.paths.find((p) => p.path === "heatPump")?.eligible).toBe(false);
  });

  it("flags a balcony-only flat as needing sign-off, not a flat no", () => {
    const r = screenHousehold({ ...BASE, buildingType: "flat", outdoorSpace: "balconyOnly" });
    const hp = r.paths.find((p) => p.path === "heatPump");
    expect(hp?.eligible).toBe(false);
    expect(hp?.reason).toContain("sign-off");
  });

  it("blocks pellet without truck access even if storage exists", () => {
    const r = screenHousehold({ ...BASE, fuelAccess: ["dryStorage"] });
    const pellet = r.paths.find((p) => p.path === "pellet");
    expect(pellet?.eligible).toBe(false);
    expect(pellet?.reason).toContain("truck");
  });

  it("blocks solar on a shared roof, distinct from no roof at all", () => {
    const shared = screenHousehold({ ...BASE, roofAccess: "sharedRoof" });
    const none = screenHousehold({ ...BASE, roofAccess: "none" });
    expect(shared.paths.find((p) => p.path === "solar")?.reason).toContain("agreement");
    expect(none.paths.find((p) => p.path === "solar")?.reason).not.toContain("agreement");
  });

  it("blocks insulation as a solo decision for a flat", () => {
    const r = screenHousehold({ ...BASE, buildingType: "flat", outdoorSpace: "garden" });
    expect(r.paths.find((p) => p.path === "insulation")?.eligible).toBe(false);
  });

  it("stops the flow only when nothing beyond staying on gas is possible", () => {
    const r = screenHousehold({
      buildingType: "flat",
      ownership: "ownedOutright",
      outdoorSpace: "none",
      roofAccess: "none",
      fuelAccess: [],
    });
    expect(r.canProceed).toBe(false);
    expect(r.stopReason).toContain("alternatives");
  });

  it("routes flats to the flat-specific grant table", () => {
    expect(needsFlatGrantRoute({ ...BASE, buildingType: "flat" })).toBe(true);
    expect(needsFlatGrantRoute(BASE)).toBe(false);
  });
});
