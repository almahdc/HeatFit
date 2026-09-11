import { describe, expect, it } from "vitest";
import {
  ROUTES,
  balanceAfter,
  financingPlan,
  headlineMonthly,
  monthlyPayment,
} from "../engines/financing";
import { exact, range } from "../engines/range";

describe("financing", () => {
  it("reproduces the published BOŚ example's total interest to the grosz", () => {
    // BOŚ representative example: 46 900 zł, 6.76% nominal, 84 instalments,
    // stated total interest 12 097,99 zł, arrangement fee 938 zł separately.
    // Amortising the principal ALONE reproduces their interest figure exactly.
    // Rolling the 2% fee into the loan does not: which is how we know the fee
    // is paid up front rather than financed.
    const pmt = monthlyPayment(46900, 0.0676, 84);
    expect(pmt * 84 - 46900).toBeCloseTo(12097.99, 1);
  });

  it("keeps the arrangement fee out of the borrowed amount", () => {
    const plan = financingPlan({
      capitalCost: exact(46900),
      upfrontGrant: exact(0),
      taxRelief: exact(0),
      route: ROUTES.bankRoute!,
      termMonths: 84,
      grantArrivesAfterMonths: 84,
    });
    expect(plan.amountBorrowed.mid).toBe(46900);
    expect(plan.arrangementFee.mid).toBeCloseTo(938, 0);
  });

  it("amortises to zero at the end of the term", () => {
    expect(balanceAfter(50000, 0.0843, 96, 96)).toBeCloseTo(0, 4);
  });

  it("prices the open route above the suspended one", () => {
    const input = {
      capitalCost: range(38000, 42000, 60000),
      upfrontGrant: exact(30000),
      taxRelief: exact(3000),
      termMonths: 96,
    };
    const open = financingPlan({ ...input, route: ROUTES.pozyczkaZielona! });
    const suspended = financingPlan({ ...input, route: ROUTES.bankRoute! });
    expect(open.monthlyAfterGrant.mid).toBeGreaterThan(
      suspended.monthlyAfterGrant.mid,
    );
  });

  it("warns loudly that the bank route cannot be used today", () => {
    const plan = financingPlan({
      capitalCost: exact(42000),
      upfrontGrant: exact(30000),
      taxRelief: exact(0),
      route: ROUTES.bankRoute!,
      termMonths: 96,
    });
    expect(plan.warnings.join(" ")).toContain("not available today");
  });

  it("warns that the Green Loan promotion expires", () => {
    const plan = financingPlan({
      capitalCost: exact(42000),
      upfrontGrant: exact(30000),
      taxRelief: exact(0),
      route: ROUTES.pozyczkaZielona!,
      termMonths: 96,
    });
    expect(plan.warnings.join(" ")).toContain("EXPIRES");
  });

  it("steps the payment down on the bank route once the grant lands", () => {
    const plan = financingPlan({
      capitalCost: exact(42000),
      upfrontGrant: exact(30000),
      taxRelief: exact(0),
      route: ROUTES.bankRoute!,
      termMonths: 96,
      grantArrivesAfterMonths: 12,
    });
    expect(plan.monthlyAfterGrant.mid).toBeLessThan(
      plan.monthlyBeforeGrant.mid,
    );
  });

  it("does not step the payment down on a route where the grant is reimbursed later", () => {
    const plan = financingPlan({
      capitalCost: exact(42000),
      upfrontGrant: exact(30000),
      taxRelief: exact(0),
      route: ROUTES.pozyczkaZielona!,
      termMonths: 96,
    });
    expect(plan.monthlyAfterGrant.mid).toBeCloseTo(
      plan.monthlyBeforeGrant.mid,
      6,
    );
  });

  it("charges no interest when paying from savings", () => {
    const plan = financingPlan({
      capitalCost: exact(42000),
      upfrontGrant: exact(30000),
      taxRelief: exact(3000),
      route: ROUTES.cash!,
      termMonths: 0,
    });
    expect(plan.totalInterest.mid).toBe(0);
    expect(plan.netCapitalCost.mid).toBeCloseTo(9000, 6);
  });

  it("gives two headline numbers, during the loan and after it ends", () => {
    const plan = financingPlan({
      capitalCost: exact(42000),
      upfrontGrant: exact(30000),
      taxRelief: exact(0),
      route: ROUTES.pozyczkaZielona!,
      termMonths: 96,
    });
    const h = headlineMonthly(plan, exact(495));
    expect(h.duringLoan.mid).toBeGreaterThan(h.afterLoan.mid);
    expect(h.afterLoan.mid).toBe(495);
  });

  it("flags a job that exceeds the route ceiling instead of silently lending more", () => {
    const plan = financingPlan({
      capitalCost: exact(200000),
      upfrontGrant: exact(0),
      taxRelief: exact(0),
      route: ROUTES.pozyczkaZielona!,
      termMonths: 96,
    });
    expect(plan.warnings.join(" ")).toContain("ceiling");
  });
});
