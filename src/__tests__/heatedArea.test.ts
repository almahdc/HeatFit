import { describe, expect, it } from "vitest";
import { computeHeatedAreaM2 } from "../wizard/householdCases";

describe("computeHeatedAreaM2", () => {
  it("returns the total area unchanged when the whole house is heated", () => {
    expect(computeHeatedAreaM2(150, true, null)).toBe(150);
    // A stray selection from before toggling back to "yes" must not leak in.
    expect(computeHeatedAreaM2(150, true, "someRooms")).toBe(150);
  });

  it("applies the fixed reduction for a whole unheated floor", () => {
    expect(computeHeatedAreaM2(150, false, "wholeFloor")).toBe(75);
  });

  it("applies the fixed reduction for some unheated rooms", () => {
    expect(computeHeatedAreaM2(130, false, "someRooms")).toBe(111);
  });

  it("applies the fixed reduction for an unheated basement or garage", () => {
    expect(computeHeatedAreaM2(150, false, "basementOrGarage")).toBe(135);
  });

  it("falls back to the total area when not heated but nothing was picked yet", () => {
    expect(computeHeatedAreaM2(150, false, null)).toBe(150);
  });
});
