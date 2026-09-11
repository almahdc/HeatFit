/**
 * p0.test.ts: the acceptance criteria from tickets T4 and T5.
 *
 * T1 and T3 covered the subsidy and sensitivity engines, both of which were
 * superseded by grants.ts / taxRelief.ts and removed, so their criteria went
 * with them. T2's criterion ("no literal gatesSatisfied array in App.tsx")
 * was a source check rather than a behaviour, and was never asserted here.
 */

import { describe, expect, it } from "vitest";
import { exact, range } from "../engines/range";
import {
  ROUTES,
  financingPlan,
  impliedIncome,
  payoffSchedule,
} from "../engines/financing";

// --- T4 ---------------------------------------------------------------------

describe("T4 · loan-free year is derived, never hardcoded", () => {
  const plan = financingPlan({
    capitalCost: range(28000, 42000, 60000),
    upfrontGrant: exact(16800),
    taxRelief: exact(3024),
    route: ROUTES.pozyczkaZielona!,
    termMonths: 96,
  });
  const running = range(180, 220, 280);

  it("moves the loan-free year when the term changes", () => {
    const eight = payoffSchedule(plan, running, {
      termMonths: 96,
      startYear: 2026,
      startMonth: 1,
    });
    const ten = payoffSchedule(plan, running, {
      termMonths: 120,
      startYear: 2026,
      startMonth: 1,
    });
    expect(eight.loanFreeYear).toBe(2034);
    expect(ten.loanFreeYear).toBe(2036);
  });

  it("handles a mid-year start without inventing a free year", () => {
    const s = payoffSchedule(plan, running, {
      termMonths: 96,
      startYear: 2026,
      startMonth: 8,
    });
    // Starting in August, 96 payments run into 2034, so 2034 is not free.
    const y2034 = s.years.find((y) => y.year === 2034)!;
    expect(y2034.repayment).toBeGreaterThan(0);
    expect(s.loanFreeYear).toBe(2035);
  });

  it("marks the final loan year and, on the bank route, the step-down", () => {
    const bank = financingPlan({
      capitalCost: range(28000, 42000, 60000),
      upfrontGrant: exact(16800),
      taxRelief: exact(0),
      route: ROUTES.bankRoute!,
      termMonths: 96,
      grantArrivesAfterMonths: 12,
    });
    const s = payoffSchedule(bank, running, {
      termMonths: 96,
      startYear: 2026,
      startMonth: 1,
      grantArrivesAfterMonths: 12,
    });
    expect(s.stepDownYear).toBe(2027);
    expect(s.years.filter((y) => y.isFinalLoanYear)).toHaveLength(1);
  });

  it("reports the running cost as the monthly figure once free", () => {
    const s = payoffSchedule(plan, running, {
      termMonths: 96,
      startYear: 2026,
      startMonth: 1,
    });
    expect(s.monthlyOnceFree).toBeCloseTo(running.mid, 6);
  });
});

// --- T5 ---------------------------------------------------------------------

// --- T5 ---------------------------------------------------------------------

describe("T5 · income is an output, never an input", () => {
  const plan = financingPlan({
    capitalCost: range(28000, 42000, 60000),
    upfrontGrant: exact(16800),
    taxRelief: exact(0),
    route: ROUTES.pozyczkaZielona!,
    termMonths: 96,
  });

  it("tests affordability at a stressed rate, above the advertised one", () => {
    const guide = impliedIncome(plan, 96);
    expect(guide.stressedInstalment).toBeGreaterThan(
      plan.monthlyBeforeGrant.mid,
    );
  });

  it("implies a higher income for a bigger loan", () => {
    const big = financingPlan({
      capitalCost: exact(120000),
      upfrontGrant: exact(0),
      taxRelief: exact(0),
      route: ROUTES.pozyczkaZielona!,
      termMonths: 96,
    });
    expect(impliedIncome(big, 96).impliedNetIncome).toBeGreaterThan(
      impliedIncome(plan, 96).impliedNetIncome,
    );
  });

  it("prices what the fuel saving alone could borrow", () => {
    const guide = impliedIncome(plan, 96, 300);
    expect(guide.loanServiceableBySaving).toBeGreaterThan(20000);
    expect(impliedIncome(plan, 96, 0).loanServiceableBySaving).toBe(0);
  });

  it("returns zeroes rather than nonsense when nothing is borrowed", () => {
    const cash = financingPlan({
      capitalCost: exact(42000),
      upfrontGrant: exact(16800),
      taxRelief: exact(0),
      route: ROUTES.cash!,
      termMonths: 0,
    });
    expect(impliedIncome(cash, 0).impliedNetIncome).toBe(0);
  });
});

// --- guard ------------------------------------------------------------------
