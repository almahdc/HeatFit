import { describe, expect, it } from "vitest";
import { isValidPolishPostcode, lookupPostcode, maskPostcodeInput } from "../data/postcodes.pl";

describe("postcode masking", () => {
  it("inserts the dash after two digits as you type", () => {
    expect(maskPostcodeInput("4")).toBe("4");
    expect(maskPostcodeInput("40")).toBe("40");
    expect(maskPostcodeInput("400")).toBe("40-0");
    expect(maskPostcodeInput("40001")).toBe("40-001");
  });

  it("strips non-digits and caps at five digits", () => {
    expect(maskPostcodeInput("40-001extra")).toBe("40-001");
    expect(maskPostcodeInput("ab40cd001")).toBe("40-001");
  });
});

describe("postcode lookup", () => {
  it("accepts a well-formed postcode", () => {
    expect(isValidPolishPostcode("40-001")).toBe(true);
    expect(isValidPolishPostcode("400-01")).toBe(false);
    expect(isValidPolishPostcode("4001")).toBe(false);
  });

  it("flags a Katowice postcode as Silesian", () => {
    expect(lookupPostcode("40-001")).toEqual({ valid: true, inSilesia: true, prefix: "40" });
  });

  it("flags an out-of-region postcode without crashing", () => {
    expect(lookupPostcode("00-001").inSilesia).toBe(false);
  });

  it("returns invalid rather than guessing on garbage input", () => {
    expect(lookupPostcode("not a postcode").valid).toBe(false);
  });
});
