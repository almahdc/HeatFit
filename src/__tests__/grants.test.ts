import { describe, expect, it } from "vitest";
import {
  calculateGrant,
  incomeTierFor,
  scopeBandFor,
  GRANT_LINE_FOR_OPTION,
} from "../engines/grants";
import * as S from "../data/sheet.constants";
import { ALTERNATIVE_HEATING_IDS } from "../engines/alternativeHeating";

/** Comfortably inside the 80-140 band, where a heat-source-only job is fine. */
const OK_DEMAND = 120;

describe("scope gate", () => {
  it("bands on the sheet's own thresholds", () => {
    expect(scopeBandFor(79).projectType).toBe(1);
    expect(scopeBandFor(80).projectType).toBe(2);
    expect(scopeBandFor(139).projectType).toBe(2);
    expect(scopeBandFor(140).projectType).toBe(3);
    expect(scopeBandFor(400).projectType).toBe(3);
  });

  it("offers no unconditional heat-source-only grant above 140 kWh/m²/y", () => {
    // The single most consequential rule in the programme. `heating` is the
    // grant claimable without any further work, and it must stay null here:
    // a tool that quietly claimed it eligible would send a household to be
    // refused.
    const out = calculateGrant({
      optionId: "airToWaterHp",
      heatingCapexPln: 40000,
      tier: "highest",
      spaceHeatPerM2: 180,
    });
    expect(out.heatSourceEligible).toBe(false);
    expect(out.heating).toBeNull();
    expect(
      out.warnings.some((w) => w.code === "heatSourceNotEligibleAlone"),
    ).toBe(true);
  });

  it("still prices what insulating would unlock, and counts it in the total", () => {
    // By product decision this estimate DOES flow into totalGrantPln (see the
    // file header): a household planning the project gets one number, not a
    // dead zero and a separate footnote. heatSourceEligible is what callers
    // must check to know the number depends on insulation happening.
    const out = calculateGrant({
      optionId: "airToWaterHp",
      heatingCapexPln: 40000,
      tier: "highest",
      spaceHeatPerM2: 180,
    });
    expect(out.heatingIfInsulated).not.toBeNull();
    expect(out.heatingIfInsulated!.amountPln).toBeGreaterThan(0);
    expect(out.totalGrantPln).toBe(out.heatingIfInsulated!.amountPln);
  });

  it("clamps the highest tier down below 140, where it does not exist", () => {
    const out = calculateGrant({
      optionId: "airToWaterHp",
      heatingCapexPln: 40000,
      tier: "highest",
      spaceHeatPerM2: OK_DEMAND,
    });
    expect(out.requestedTier).toBe("highest");
    expect(out.tier).toBe("increased");
    expect(out.warnings.some((w) => w.code === "highestTierUnavailable")).toBe(
      true,
    );
  });

  it("leaves the highest tier alone above 140, where it is the only band offering it", () => {
    // Above 140 the tier survives, but the heat source is not fundable anyway,
    // so this checks the clamp specifically and not the payout.
    const out = calculateGrant({
      optionId: "airToWaterHp",
      heatingCapexPln: 40000,
      tier: "highest",
      spaceHeatPerM2: 180,
    });
    expect(out.tier).toBe("highest");
  });
});

describe("grant amount", () => {
  it("is the smaller of the cap and the rate, and says which one bit", () => {
    // Cheap job: 40% of 10 000 = 4 000, under air-to-air's 4 480 basic cap.
    const cheap = calculateGrant({
      optionId: "airToAirHp",
      heatingCapexPln: 10000,
      tier: "basic",
      spaceHeatPerM2: OK_DEMAND,
    });
    expect(cheap.heating!.amountPln).toBeCloseTo(4000, 6);
    expect(cheap.heating!.cappedOut).toBe(false);

    // Dear job: 40% of 40 000 = 16 000, well over the same 4 480 cap.
    const dear = calculateGrant({
      optionId: "airToAirHp",
      heatingCapexPln: 40000,
      tier: "basic",
      spaceHeatPerM2: OK_DEMAND,
    });
    expect(dear.heating!.amountPln).toBe(4480);
    expect(dear.heating!.cappedOut).toBe(true);
  });

  it("never pays out more than the job costs, at any tier or price", () => {
    for (const id of ALTERNATIVE_HEATING_IDS) {
      for (const tier of S.INCOME_TIERS) {
        for (const cost of [1000, 12600, 40000, 200000]) {
          const out = calculateGrant({
            optionId: id,
            heatingCapexPln: cost,
            tier,
            spaceHeatPerM2: OK_DEMAND,
          });
          expect(out.totalGrantPln).toBeLessThanOrEqual(cost);
        }
      }
    }
  });

  it("cites the subsidies tab line it claimed against", () => {
    for (const id of ALTERNATIVE_HEATING_IDS) {
      const out = calculateGrant({
        optionId: id,
        heatingCapexPln: 30000,
        tier: "basic",
        spaceHeatPerM2: OK_DEMAND,
      });
      expect(out.heating!.sheetLineId).toBe(GRANT_LINE_FOR_OPTION[id]);
      expect(S.SHEET_GRANT_LINES[out.heating!.sheetLineId]).toBeDefined();
    }
  });

  it("rises with the tier", () => {
    const at = (tier: S.IncomeTier) =>
      calculateGrant({
        optionId: "pellet",
        heatingCapexPln: 30000,
        tier,
        spaceHeatPerM2: OK_DEMAND,
      }).totalGrantPln;
    expect(at("basic")).toBeLessThan(at("increased"));
  });
});

describe("the sheet's cap columns are internally consistent", () => {
  const IN_USE = Object.values(GRANT_LINE_FOR_OPTION);

  it("holds basic and increased at exactly the highest cap times the funding rate", () => {
    // If this ever fails, the sheet's subsidies tab has been edited in a way
    // that breaks the structure grants.ts assumes, and the transcription in
    // sheet.constants.ts needs re-reading rather than patching.
    for (const id of IN_USE) {
      const line = S.SHEET_GRANT_LINES[id]!;
      expect(line.capByTier.basic).toBeCloseTo(
        line.capByTier.highest * S.SHEET_FUNDING_RATE.basic,
        6,
      );
      expect(line.capByTier.increased).toBeCloseTo(
        line.capByTier.highest * S.SHEET_FUNDING_RATE.increased,
        6,
      );
    }
  });

  it("records H2's 50 zł rounding, the one line that breaks the pattern", () => {
    // H2 is the older standard-class air/water line, which HeatFit does not
    // claim against. Its increased cap is 22 000 where the pattern gives
    // 22 050. Pinned rather than corrected: the sheet is the source, and a
    // silent fix here would hide a real disagreement if H2 is ever adopted.
    const h2 = S.SHEET_GRANT_LINES.H2!;
    expect(IN_USE).not.toContain("H2");
    expect(h2.capByTier.increased).toBe(22000);
    expect(h2.capByTier.highest * S.SHEET_FUNDING_RATE.increased).toBe(22050);
  });
});

describe("solar line", () => {
  it("is absent unless solar is actually being added", () => {
    const out = calculateGrant({
      optionId: "airToAirHp",
      heatingCapexPln: 19000,
      tier: "basic",
      spaceHeatPerM2: OK_DEMAND,
    });
    expect(out.solar).toBeNull();
  });

  it("pays the sheet's PV rate and warns that the programme is paused", () => {
    const out = calculateGrant({
      optionId: "airToAirHp",
      heatingCapexPln: 19000,
      solarCapexPln: 30000,
      tier: "basic",
      spaceHeatPerM2: OK_DEMAND,
    });
    expect(out.solar!.amountPln).toBeCloseTo(
      30000 * S.SHEET_PV_GRANT_RATE.basic,
      6,
    );
    expect(out.warnings.some((w) => w.code === "solarPvPaused")).toBe(true);
  });

  it("survives the heat source being ineligible: it is a different programme", () => {
    const out = calculateGrant({
      optionId: "airToAirHp",
      heatingCapexPln: 19000,
      solarCapexPln: 30000,
      tier: "basic",
      spaceHeatPerM2: 180,
    });
    expect(out.heating).toBeNull();
    expect(out.solar!.amountPln).toBeGreaterThan(0);
  });
});

describe("incomeTierFor", () => {
  it("reads the sheet's thresholds, highest first so the poorest are not misfiled", () => {
    // Four-person household, 1 300 zł each per month: exactly the highest ceiling.
    expect(incomeTierFor(1300 * 4, 4)).toBe("highest");
    expect(incomeTierFor(2250 * 4, 4)).toBe("increased");
    // 11 000 across four is 2 750 each, over the increased ceiling, but the
    // household total is still under the 11 250 basic ceiling.
    expect(incomeTierFor(11000, 4)).toBe("basic");
    expect(incomeTierFor(20000, 4)).toBeNull();
  });

  it("uses the more generous single-person thresholds when someone lives alone", () => {
    // The same 2 600 zł lands in different tiers: split between two people it
    // is 1 300 each and qualifies for the highest level; earned by one person
    // it is over the 1 800 single-person ceiling and drops to increased.
    expect(incomeTierFor(2600, 2)).toBe("highest");
    expect(incomeTierFor(2600, 1)).toBe("increased");
  });
});
