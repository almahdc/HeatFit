import { describe, expect, it } from "vitest";
import {
  formatPolishPostalCode,
  getPolishRegion,
  getPostalCodeWarning,
  isPolishPostalCode,
} from "../utils/postalCode";

describe("postal code masking", () => {
  it("inserts the dash after two digits as you type", () => {
    expect(formatPolishPostalCode("4")).toBe("4");
    expect(formatPolishPostalCode("40")).toBe("40");
    expect(formatPolishPostalCode("400")).toBe("40-0");
    expect(formatPolishPostalCode("40001")).toBe("40-001");
  });

  it("strips non-digits and caps at five digits", () => {
    expect(formatPolishPostalCode("40-001extra")).toBe("40-001");
    expect(formatPolishPostalCode("ab40cd001")).toBe("40-001");
  });
});

describe("postal code validation", () => {
  it("accepts a well-formed postcode", () => {
    expect(isPolishPostalCode("40-001")).toBe(true);
    expect(isPolishPostalCode("400-01")).toBe(false);
    expect(isPolishPostalCode("4001")).toBe(false);
    expect(isPolishPostalCode("not a postcode")).toBe(false);
  });

  it("covers the full 00-99 prefix range, not just one region", () => {
    expect(isPolishPostalCode("00-001")).toBe(true);
    expect(isPolishPostalCode("99-999")).toBe(true);
  });
});

describe("region lookup", () => {
  it("resolves a prefix to its voivodeship", () => {
    expect(getPolishRegion("40-001")).toBe("Śląskie"); // Katowice
    expect(getPolishRegion("00-001")).toBe("Mazowieckie"); // Warsaw
    expect(getPolishRegion("31-000")).toBe("Małopolskie"); // Kraków
    expect(getPolishRegion("80-001")).toBe("Pomorskie"); // Gdańsk
    expect(getPolishRegion("90-001")).toBe("Łódzkie"); // Łódź
  });

  it("returns null rather than guessing on garbage input", () => {
    expect(getPolishRegion("not a postcode")).toBeNull();
  });
});

describe("postal code warning", () => {
  it("stays quiet for an empty field", () => {
    expect(getPostalCodeWarning("")).toBeNull();
  });

  it("warns on a malformed postcode", () => {
    expect(getPostalCodeWarning("abc")).not.toBeNull();
  });

  it("stays quiet for any valid Polish postcode, nationwide", () => {
    expect(getPostalCodeWarning("00-001")).toBeNull();
    expect(getPostalCodeWarning("40-001")).toBeNull();
    expect(getPostalCodeWarning("90-001")).toBeNull();
  });
});
