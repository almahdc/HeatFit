import { describe, expect, it } from "vitest";
import {
  calculateTaxRelief,
  TAX_RELIEF_CAP_PLN,
  TAX_RATE_VALUE,
} from "../engines/taxRelief";

describe("thermal modernisation relief", () => {
  it("returns the rate on the money actually spent, not the money deducted", () => {
    const out = calculateTaxRelief({ netCapexPln: 20000, rate: "pit12" });
    expect(out.deductionBasePln).toBe(20000);
    expect(out.cashBackPln).toBeCloseTo(2400, 6);
  });

  it("keeps the deduction base and the cash back distinct", () => {
    const out = calculateTaxRelief({ netCapexPln: 20000, rate: "pit12" });
    // The classic overstatement: reading the base as money in hand.
    expect(out.deductionBasePln).toBeGreaterThan(out.cashBackPln * 5);
  });

  it("pays the higher bracket more for the same spend", () => {
    const low = calculateTaxRelief({ netCapexPln: 30000, rate: "pit12" });
    const high = calculateTaxRelief({ netCapexPln: 30000, rate: "pit32" });
    expect(high.cashBackPln).toBeGreaterThan(low.cashBackPln);
    expect(high.cashBackPln).toBeCloseTo(30000 * 0.32, 6);
    expect(low.deductionBasePln).toBe(high.deductionBasePln);
  });

  it("is worth nothing to a household that pays no income tax", () => {
    const out = calculateTaxRelief({ netCapexPln: 30000, rate: "none" });
    expect(out.cashBackPln).toBe(0);
    expect(out.finalNetCostPln).toBe(30000);
  });

  it("caps the deduction at 53 000 zł per taxpayer", () => {
    const one = calculateTaxRelief({ netCapexPln: 200000, rate: "pit12" });
    expect(one.deductionBasePln).toBe(TAX_RELIEF_CAP_PLN);
    expect(one.cappedOut).toBe(true);

    const two = calculateTaxRelief({
      netCapexPln: 200000,
      rate: "pit12",
      taxpayerCount: 2,
    });
    expect(two.deductionBasePln).toBe(TAX_RELIEF_CAP_PLN * 2);
  });

  it("does not report a cap that never bit", () => {
    const out = calculateTaxRelief({ netCapexPln: 12000, rate: "pit12" });
    expect(out.cappedOut).toBe(false);
    expect(out.deductionBasePln).toBe(12000);
  });

  it("claims against the post-grant cost the caller passes in", () => {
    // 40 000 gross, 25 000 granted: only the 15 000 out of pocket is claimable,
    // per art. 26h ust. 5 pkt 1.
    const out = calculateTaxRelief({ netCapexPln: 40000 - 25000 });
    expect(out.eligibleCostPln).toBe(15000);
    expect(out.cashBackPln).toBeCloseTo(15000 * 0.12, 6);
  });

  it("invents no refund when the grant covered everything", () => {
    const out = calculateTaxRelief({ netCapexPln: 0 });
    expect(out.deductionBasePln).toBe(0);
    expect(out.cashBackPln).toBe(0);
    expect(out.finalNetCostPln).toBe(0);
  });

  it("never returns a negative cost from a negative input", () => {
    const out = calculateTaxRelief({ netCapexPln: -5000 });
    expect(out.eligibleCostPln).toBe(0);
    expect(out.finalNetCostPln).toBe(0);
  });

  it("leaves the household paying something on a real project", () => {
    const out = calculateTaxRelief({ netCapexPln: 12600, rate: "pit32" });
    expect(out.finalNetCostPln).toBeGreaterThan(0);
    expect(out.finalNetCostPln).toBeCloseTo(12600 * (1 - 0.32), 6);
  });

  it("prices every rate at its statutory value", () => {
    expect(TAX_RATE_VALUE.pit12).toBe(0.12);
    expect(TAX_RATE_VALUE.pit32).toBe(0.32);
    expect(TAX_RATE_VALUE.flat19).toBe(0.19);
    expect(TAX_RATE_VALUE.none).toBe(0);
  });
});
