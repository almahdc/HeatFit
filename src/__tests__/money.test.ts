/**
 * money.test.ts — regression tests for the two accounting bugs.
 *
 * Both bugs were invisible in the UI, because the wizard only renders the
 * monthly figure. They would have surfaced the first time anyone showed total
 * cost on a slide. These tests are the reason they cannot come back.
 */

import { describe, expect, it } from "vitest";
import { range, exact } from "./range";
import { ROUTES, financingPlan } from "./financing";
import { subsidiesFor, Applicant, DEFAULT_PROGRAMMES } from "./subsidy";

const READY: Applicant = {
  incomeLevel: "basic",
  gatesSatisfied: [
    "ownedThreeYears",
    "deviceOnZumList",
    "energyAuditDone",
    "replacingKopciuch",
    "incomeEvidenced",
  ],
  taxpayerCount: 2,
  marginalTaxRate: 0.12,
};

const capital = range(28000, 42000, 60000);

describe("financing: the grant is counted exactly once", () => {
  it("splits the grant into capital-applied and reimbursed, and they sum back", () => {
    for (const id of ["bankRoute", "pozyczkaZielona", "cash"]) {
      const grant = exact(20000);
      const plan = financingPlan({
        capitalCost: capital,
        upfrontGrant: grant,
        taxRelief: exact(0),
        route: ROUTES[id]!,
        termMonths: ROUTES[id]!.maxTermMonths === 0 ? 0 : 96,
        grantArrivesAfterMonths: 12,
      });
      const total =
        plan.grantAppliedToCapital.mid + plan.grantReimbursed.mid;
      expect(total).toBeCloseTo(grant.mid, 6);
    }
  });

  it("never reports negative interest", () => {
    const plan = financingPlan({
      capitalCost: capital,
      upfrontGrant: exact(42000),
      taxRelief: exact(5040),
      route: ROUTES.bankRoute!,
      termMonths: 96,
      grantArrivesAfterMonths: 12,
    });
    expect(plan.totalInterest.mid).toBeGreaterThan(0);
  });

  it("never reports a negative net cost when the grant is smaller than the cost", () => {
    const plan = financingPlan({
      capitalCost: capital,
      upfrontGrant: exact(30000),
      taxRelief: exact(1000),
      route: ROUTES.bankRoute!,
      termMonths: 96,
      grantArrivesAfterMonths: 12,
    });
    expect(plan.netCapitalCost.mid).toBeGreaterThan(0);
  });

  it("net cost equals instalments plus fee, less reimbursed grant and relief", () => {
    const plan = financingPlan({
      capitalCost: capital,
      upfrontGrant: exact(20000),
      taxRelief: exact(2000),
      route: ROUTES.pozyczkaZielona!,
      termMonths: 96,
    });
    const expected =
      plan.paidByHomeowner.mid + plan.arrangementFee.mid - 20000 - 2000;
    expect(plan.netCapitalCost.mid).toBeCloseTo(expected, 6);
  });

  it("pays out the surplus when the grant exceeds the outstanding balance", () => {
    const plan = financingPlan({
      capitalCost: exact(20000),
      upfrontGrant: exact(50000),
      taxRelief: exact(0),
      route: ROUTES.bankRoute!,
      termMonths: 96,
      grantArrivesAfterMonths: 12,
    });
    expect(plan.grantReimbursed.mid).toBeGreaterThan(0);
    expect(plan.monthlyAfterGrant.mid).toBe(0);
  });
});

describe("subsidy: tax relief is a deduction on your own money", () => {
  it("returns no relief when the grant covers the whole cost", () => {
    const generous = DEFAULT_PROGRAMMES.map((p) =>
      p.id === "czystePowietrze"
        ? { ...p, shareByLevel: { basic: 1.0, raised: 1.0, highest: 1.0 } }
        : p,
    );
    const out = subsidiesFor("heatPump", 42000, READY, generous);
    expect(out.upfrontGrant.mid).toBeCloseTo(42000, 6);
    expect(out.ownSpend.mid).toBeCloseTo(0, 6);
    expect(out.taxRelief.mid).toBe(0);
  });

  it("computes relief on cost minus grant, not on gross cost", () => {
    const out = subsidiesFor("heatPump", 85000, READY);
    const ownSpend = 85000 - out.upfrontGrant.mid;
    expect(out.deductionBase.mid).toBeCloseTo(Math.min(106000, ownSpend), 6);
    expect(out.taxRelief.mid).toBeCloseTo(out.deductionBase.mid * 0.12, 6);
  });

  it("keeps the deduction base and the cash value distinct", () => {
    const out = subsidiesFor("heatPump", 85000, READY);
    expect(out.deductionBase.mid).toBeGreaterThan(out.taxRelief.mid * 5);
  });

  it("caps the deduction per taxpayer, so two owners get twice the room", () => {
    const one = subsidiesFor("insulation", 200000, {
      ...READY,
      taxpayerCount: 1,
    });
    const two = subsidiesFor("insulation", 200000, {
      ...READY,
      taxpayerCount: 2,
    });
    expect(one.deductionBase.mid).toBeCloseTo(53000, 6);
    expect(two.deductionBase.mid).toBeCloseTo(106000, 6);
  });

  it("returns nothing when the household pays no income tax", () => {
    const out = subsidiesFor("heatPump", 85000, {
      ...READY,
      marginalTaxRate: 0,
    });
    expect(out.taxRelief.mid).toBe(0);
  });

  it("does not make a heat pump free for an average household", () => {
    const out = subsidiesFor("heatPump", 42000, READY);
    expect(out.ownSpend.mid).toBeGreaterThan(0);
  });
});

describe("subsidy: unverified amounts are surfaced, never hidden", () => {
  it("flags the outcome while any applied programme is unverified", () => {
    const out = subsidiesFor("heatPump", 42000, READY);
    expect(out.hasUnverifiedAmounts).toBe(true);
  });

  it("every programme declares a verified flag and a source", () => {
    for (const p of DEFAULT_PROGRAMMES) {
      expect(typeof p.verified).toBe("boolean");
      expect(p.source.length).toBeGreaterThan(0);
      expect(p.readOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
