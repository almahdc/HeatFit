import { describe, expect, it } from "vitest";
import {
  calculateLoan,
  sheetMonthlyCapex,
  trueMonthlyCost,
  LOAN_OPTIONS,
  DEFAULT_LOAN_TERMS,
} from "../engines/loan";
import * as S from "../data/sheet.constants";

describe("sheetMonthlyCapex", () => {
  it("reproduces the sheet's own worked figure to the grosz", () => {
    // price_calculator row 371 (gas194): net capex 44 400 zł over the default
    // 5-year / 7% row, and the sheet's `monthly capex (with interest)` cell
    // reads 791.80. This is the anchor that proves the formula was transcribed
    // and not reinvented.
    expect(
      sheetMonthlyCapex(44400, { years: 5, annualInterest: 0.07 }),
    ).toBeCloseTo(791.8, 6);
  });

  it("charges the interest once over the whole term, not per year", () => {
    // The defining property of the sheet's formula, and the reason it differs
    // so sharply from a real loan. 100 000 at 10% pays 110 000 in total whether
    // the term is 5 years or 15.
    const short = sheetMonthlyCapex(100000, { years: 5, annualInterest: 0.1 });
    const long = sheetMonthlyCapex(100000, { years: 15, annualInterest: 0.1 });
    expect(short * 5 * 12).toBeCloseTo(110000, 6);
    expect(long * 15 * 12).toBeCloseTo(110000, 6);
  });

  it("is zero when there is nothing left to borrow", () => {
    expect(sheetMonthlyCapex(0, DEFAULT_LOAN_TERMS)).toBe(0);
  });
});

describe("calculateLoan", () => {
  it("nets the grant off the gross before financing anything", () => {
    const loan = calculateLoan({
      grossCapexPln: 40000,
      grantPln: 24640,
      terms: DEFAULT_LOAN_TERMS,
    });
    expect(loan.netCapexPln).toBe(15360);
  });

  it("defaults to the term the sheet's live formula points at", () => {
    expect(DEFAULT_LOAN_TERMS.years).toBe(S.SHEET_DEFAULT_LOAN_YEARS);
    expect(DEFAULT_LOAN_TERMS.annualInterest).toBe(0.07);
  });

  it("offers exactly the sheet's three terms", () => {
    expect(LOAN_OPTIONS.map((o) => o.years)).toEqual([15, 10, 5]);
  });

  it("lowers the monthly figure as the term lengthens", () => {
    const monthly = LOAN_OPTIONS.map(
      (terms) =>
        calculateLoan({ grossCapexPln: 40000, grantPln: 10000, terms })
          .monthlyRepaymentPln,
    );
    // LOAN_OPTIONS is longest-first, so this should be ascending.
    expect(monthly[0]).toBeLessThan(monthly[1]!);
    expect(monthly[1]).toBeLessThan(monthly[2]!);
  });

  it("always computes the annuity alongside, and it is never cheaper", () => {
    // The gap between these two is the open question in the model. Whatever it
    // is, a real amortising loan cannot cost less than interest charged once.
    for (const terms of LOAN_OPTIONS) {
      const loan = calculateLoan({
        grossCapexPln: 40000,
        grantPln: 10000,
        terms,
      });
      expect(loan.annuityMonthlyPln).toBeGreaterThan(loan.sheetMonthlyPln);
    }
  });

  it("widens the gap to the annuity as the term lengthens", () => {
    // Charging interest once hurts least on a short loan and most on a long
    // one, which is exactly backwards from how a real loan behaves.
    const ratio = (terms: (typeof LOAN_OPTIONS)[number]) => {
      const loan = calculateLoan({
        grossCapexPln: 40000,
        grantPln: 0,
        terms,
      });
      return loan.annuityMonthlyPln / loan.sheetMonthlyPln;
    };
    expect(ratio(LOAN_OPTIONS[0]!)).toBeGreaterThan(ratio(LOAN_OPTIONS[2]!));
  });

  it("borrows and repays nothing when the grant covers the job", () => {
    const loan = calculateLoan({
      grossCapexPln: 20000,
      grantPln: 20000,
      terms: DEFAULT_LOAN_TERMS,
    });
    expect(loan.netCapexPln).toBe(0);
    expect(loan.monthlyRepaymentPln).toBe(0);
    expect(loan.annuityMonthlyPln).toBe(0);
    expect(loan.totalInterestPln).toBe(0);
  });

  it("switches method without touching either underlying figure", () => {
    const base = {
      grossCapexPln: 40000,
      grantPln: 10000,
      terms: DEFAULT_LOAN_TERMS,
    };
    const sheet = calculateLoan({ ...base, method: "sheetSimpleInterest" });
    const annuity = calculateLoan({ ...base, method: "annuity" });
    expect(sheet.monthlyRepaymentPln).toBe(sheet.sheetMonthlyPln);
    expect(annuity.monthlyRepaymentPln).toBe(annuity.annuityMonthlyPln);
    expect(sheet.sheetMonthlyPln).toBe(annuity.sheetMonthlyPln);
  });
});

describe("trueMonthlyCost", () => {
  it("is running cost plus repayment, and drops back to running cost after", () => {
    const loan = calculateLoan({
      grossCapexPln: 40000,
      grantPln: 24640,
      terms: DEFAULT_LOAN_TERMS,
    });
    const out = trueMonthlyCost(865, loan);
    expect(out.truePlnPerMonth).toBeCloseTo(865 + loan.monthlyRepaymentPln, 6);
    expect(out.afterLoanPlnPerMonth).toBe(865);
  });
});
