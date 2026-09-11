/**
 * money.test.ts: regression test for the grant double-counting bug.
 *
 * The bug was invisible in the UI, because the wizard only renders the
 * monthly figure. It would have surfaced the first time anyone showed total
 * cost on a slide. This test is the reason it cannot come back.
 */

import { describe, expect, it } from "vitest";
import { range, exact } from "../engines/range";
import { ROUTES, financingPlan } from "../engines/financing";

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
      const total = plan.grantAppliedToCapital.mid + plan.grantReimbursed.mid;
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
