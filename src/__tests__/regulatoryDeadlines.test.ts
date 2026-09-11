import { describe, expect, it } from "vitest";
import {
  getRegulatoryCountdown,
  getSilesianBoilerDeadline,
  isSilesianPostalCode,
  monthsAndDaysUntil,
} from "../engines/regulatoryDeadlines";

const KATOWICE_POSTAL_CODE = "40-001"; // Śląskie
const WARSAW_POSTAL_CODE = "00-001"; // Mazowieckie

describe("isSilesianPostalCode", () => {
  it("recognises a Katowice-range code as Silesian", () => {
    expect(isSilesianPostalCode(KATOWICE_POSTAL_CODE)).toBe(true);
  });

  it("rejects a code from another voivodeship", () => {
    expect(isSilesianPostalCode(WARSAW_POSTAL_CODE)).toBe(false);
  });

  it("rejects a malformed code rather than guessing", () => {
    expect(isSilesianPostalCode("not a postal code")).toBe(false);
  });
});

describe("getSilesianBoilerDeadline: tier selection", () => {
  const now = new Date("2026-09-11");

  it("puts a boiler over 10 years old at the resolution date in the oldest tier", () => {
    // 2017 - 2006 = 11 years old when the resolution took effect.
    const out = getSilesianBoilerDeadline("bezklasowy", 2006, now);
    expect(out).toEqual({
      tier: "over10Years",
      deadline: "2022-01-01",
      status: "passed",
      ecodesignCaveat: false,
    });
  });

  it("treats an unknown boiler year the same as the oldest tier", () => {
    const out = getSilesianBoilerDeadline("bezklasowy", "", now);
    expect(out?.tier).toBe("over10Years");
    expect(out?.deadline).toBe("2022-01-01");
  });

  it("puts a 5-10 year old boiler in the middle tier, inclusive at both ends", () => {
    // 2017 - 2012 = 5 years old.
    expect(getSilesianBoilerDeadline("bezklasowy", 2012, now)?.tier).toBe(
      "fiveToTenYears",
    );
    // 2017 - 2007 = 10 years old.
    expect(getSilesianBoilerDeadline("bezklasowy", 2007, now)?.tier).toBe(
      "fiveToTenYears",
    );
  });

  it("puts a boiler under 5 years old at the resolution date in the newest age tier", () => {
    // 2017 - 2013 = 4 years old.
    const out = getSilesianBoilerDeadline("bezklasowy", 2013, now);
    expect(out).toEqual({
      tier: "under5Years",
      deadline: "2026-01-01",
      status: "passed",
      ecodesignCaveat: false,
    });
  });

  it("overrides age with class for a boiler already meeting Class 3 or 4", () => {
    // Old enough to otherwise land in the oldest tier, but Class 3/4 wins.
    const class3 = getSilesianBoilerDeadline("class3", 1990, now);
    expect(class3).toEqual({
      tier: "class3Or4",
      deadline: "2028-01-01",
      status: "upcoming",
      ecodesignCaveat: false,
    });

    const class4 = getSilesianBoilerDeadline("class4", 1990, now);
    expect(class4?.tier).toBe("class3Or4");
  });

  it("owes nothing under this resolution once a boiler already meets Class 5", () => {
    expect(getSilesianBoilerDeadline("class5", 1990, now)).toBeNull();
  });
});

describe("getSilesianBoilerDeadline: Ecodesign certification is not Class 5", () => {
  const now = new Date("2026-09-11");

  it("buckets an Ecodesign-only boiler by age, exactly like an unclassed one", () => {
    const ecodesign = getSilesianBoilerDeadline("ecodesign", 2006, now);
    const bezklasowy = getSilesianBoilerDeadline("bezklasowy", 2006, now);
    expect(ecodesign?.tier).toBe(bezklasowy?.tier);
    expect(ecodesign?.deadline).toBe(bezklasowy?.deadline);
    expect(ecodesign?.status).toBe(bezklasowy?.status);
  });

  it("flags the result with ecodesignCaveat instead of silently trusting it as Class 5", () => {
    const out = getSilesianBoilerDeadline("ecodesign", 2006, now);
    expect(out?.ecodesignCaveat).toBe(true);
  });

  it("does not flag a confirmed class as uncertain", () => {
    expect(
      getSilesianBoilerDeadline("bezklasowy", 2006, now)?.ecodesignCaveat,
    ).toBe(false);
    expect(
      getSilesianBoilerDeadline("class3", 2006, now)?.ecodesignCaveat,
    ).toBe(false);
  });

  it("still owes nothing further once a boiler is confirmed Class 5, Ecodesign or not", () => {
    // Class 5 is the actual rating this resolution requires: once confirmed,
    // Ecodesign certification (or its absence) is beside the point.
    expect(getSilesianBoilerDeadline("class5", 2006, now)).toBeNull();
  });

  it("carries the caveat through an upcoming tier too, not just a passed one", () => {
    // A hypothetical Ecodesign boiler young enough that its age tier has not
    // come due yet: still flagged, so callers do not have to special-case
    // status to find out whether the class is confirmed.
    const beforeDeadline = new Date("2025-06-01");
    const out = getSilesianBoilerDeadline("ecodesign", 2013, beforeDeadline);
    expect(out?.status).toBe("upcoming");
    expect(out?.ecodesignCaveat).toBe(true);
  });
});

describe("getSilesianBoilerDeadline: status derives from the clock, not a stored flag", () => {
  it("reads the Class 3/4 tier as passed once its own 2028 deadline is behind us", () => {
    const afterDeadline = new Date("2028-06-01");
    const out = getSilesianBoilerDeadline("class4", 2015, afterDeadline);
    expect(out?.status).toBe("passed");
  });

  it("reads the Class 3/4 tier as upcoming before 2028", () => {
    const beforeDeadline = new Date("2027-06-01");
    const out = getSilesianBoilerDeadline("class4", 2015, beforeDeadline);
    expect(out?.status).toBe("upcoming");
  });
});

describe("getRegulatoryCountdown", () => {
  const now = new Date("2026-09-11");

  it("shows nothing outside Silesia even for an old, off-class boiler", () => {
    expect(
      getRegulatoryCountdown(WARSAW_POSTAL_CODE, "bezklasowy", 2006, now),
    ).toBeNull();
  });

  it("shows the matching tier for a Silesian household", () => {
    const out = getRegulatoryCountdown(
      KATOWICE_POSTAL_CODE,
      "bezklasowy",
      2006,
      now,
    );
    expect(out?.tier).toBe("over10Years");
  });

  it("shows nothing for a Silesian household already on Class 5", () => {
    expect(
      getRegulatoryCountdown(KATOWICE_POSTAL_CODE, "class5", 2020, now),
    ).toBeNull();
  });
});

describe("monthsAndDaysUntil", () => {
  it("splits a span that crosses a year boundary into months and days", () => {
    const out = monthsAndDaysUntil(
      new Date("2026-09-11"),
      new Date("2028-01-01"),
    );
    expect(out).toEqual({ months: 15, days: 21 });
  });

  it("returns zero for a deadline that has already arrived", () => {
    const out = monthsAndDaysUntil(
      new Date("2026-09-11"),
      new Date("2026-09-11"),
    );
    expect(out).toEqual({ months: 0, days: 0 });
  });
});
