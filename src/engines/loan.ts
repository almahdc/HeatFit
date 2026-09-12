/**
 * loan.ts : net capex, spread over a loan, added to the running cost.
 *
 * The last step of the chain the sheet's `final` tab reports as three columns:
 *
 *     Running /m  +  Capex /m  =  True /m
 *
 * `Running /m` comes from `alternativeHeating.ts`, `Capex /m` from here, and
 * the sum is the only figure in this product a household actually recognises:
 * what the whole thing costs them each month while they are paying it off.
 *
 * --- Why this does not use financing.ts -------------------------------------
 *
 * `financing.ts` is the older, still-dormant Range-based engine. It models a
 * real annuity, named bank products, and a grant that pays down capital
 * partway through the term. It is a better model of an actual loan and it is
 * NOT what the sheet does.
 *
 * The sheet's `monthly capex (with interest)` cell is:
 *
 *     (net + net x interest) / (years x 12)
 *
 * That is SIMPLE interest charged once over the whole term, not compounded per
 * year and not amortised. Over five years at 7% it charges 7% in total, where
 * a real 7% loan would charge closer to 19%. Over fifteen years at 10% the gap
 * is far wider: 10% total against roughly 93% for a true annuity.
 *
 * This file implements the sheet's formula, because reproducing the sheet is
 * what makes these numbers checkable against it : the same rule `baseline.ts`
 * follows. But it also computes the annuity alongside, on every result, so the
 * gap is measured rather than assumed away, and `REPAYMENT_METHOD` switches
 * which one the UI shows in one line. See docs/grants-and-financing-model.md;
 * this is the open question that most deserves a decision.
 */

import * as S from "../data/sheet.constants";
import { monthlyPayment } from "./financing";

export type RepaymentMethod = "sheetSimpleInterest" | "annuity";

/**
 * Which method the product shows. `sheetSimpleInterest` reproduces the sheet's
 * `final` tab exactly; `annuity` is what a bank would actually charge.
 *
 * Set to `annuity` by product decision: the sheet's formula understates the
 * 15-year term by 76% against a real loan (see docs/grants-and-financing-model.md),
 * which is the "marketing calculator" failure mode this product is otherwise
 * written against. Figures now no longer tie to the sheet's `final` tab for
 * the 10- and 15-year terms; that is the accepted trade-off.
 */
export const REPAYMENT_METHOD: RepaymentMethod = "annuity";

export interface LoanTerms {
  years: number;
  annualInterest: number;
}

export interface LoanResult {
  years: number;
  annualInterest: number;
  grossCapexPln: number;
  grantPln: number;
  /** What is left to find after the grant. Never negative: a grant is capped at cost. */
  netCapexPln: number;

  /** The figure the UI shows, by whichever REPAYMENT_METHOD is active. */
  monthlyRepaymentPln: number;
  method: RepaymentMethod;

  /** The sheet's own formula, always computed. */
  sheetMonthlyPln: number;
  /** A true amortising loan on the same terms, always computed. */
  annuityMonthlyPln: number;

  totalRepaidPln: number;
  totalInterestPln: number;
}

/** The sheet's formula, verbatim: interest charged once across the whole term. */
export function sheetMonthlyCapex(
  netCapexPln: number,
  { years, annualInterest }: LoanTerms,
): number {
  if (netCapexPln <= 0) return 0;
  return (netCapexPln + netCapexPln * annualInterest) / (years * 12);
}

export function calculateLoan({
  grossCapexPln,
  grantPln,
  terms,
  method = REPAYMENT_METHOD,
}: {
  grossCapexPln: number;
  grantPln: number;
  terms: LoanTerms;
  method?: RepaymentMethod;
}): LoanResult {
  const netCapexPln = grossCapexPln - grantPln;
  const months = terms.years * 12;

  const sheet = sheetMonthlyCapex(netCapexPln, terms);
  const annuity =
    netCapexPln <= 0
      ? 0
      : monthlyPayment(netCapexPln, terms.annualInterest, months);

  const monthlyRepaymentPln = method === "annuity" ? annuity : sheet;
  const totalRepaidPln = monthlyRepaymentPln * months;

  return {
    years: terms.years,
    annualInterest: terms.annualInterest,
    grossCapexPln,
    grantPln,
    netCapexPln,
    monthlyRepaymentPln,
    method,
    sheetMonthlyPln: sheet,
    annuityMonthlyPln: annuity,
    totalRepaidPln,
    totalInterestPln: totalRepaidPln - netCapexPln,
  };
}

export interface TrueMonthlyCost {
  /** Energy, after PV, per month : unchanged once the loan ends. */
  runningPlnPerMonth: number;
  /** Loan repayment per month, zero once the term is over. */
  capexPlnPerMonth: number;
  /** The two added together. The `final` tab's third column. */
  truePlnPerMonth: number;
  /** What it drops to the month the loan is repaid. */
  afterLoanPlnPerMonth: number;
}

export function trueMonthlyCost(
  runningPlnPerMonth: number,
  loan: LoanResult,
): TrueMonthlyCost {
  return {
    runningPlnPerMonth,
    capexPlnPerMonth: loan.monthlyRepaymentPln,
    truePlnPerMonth: runningPlnPerMonth + loan.monthlyRepaymentPln,
    afterLoanPlnPerMonth: runningPlnPerMonth,
  };
}

/** The sheet's three terms, longest first. */
export const LOAN_OPTIONS: LoanTerms[] = S.SHEET_LOAN_OPTIONS;

export const DEFAULT_LOAN_TERMS: LoanTerms = S.SHEET_LOAN_OPTIONS.find(
  (o) => o.years === S.SHEET_DEFAULT_LOAN_YEARS,
)!;

/**
 * The term matching a loan-term control's string value (IconCardGroup only
 * deals in strings), or the default when nothing matches - same fallback the
 * UI itself uses before anything has been touched.
 */
export function loanTermsForYears(loanYearsValue: string): LoanTerms {
  return (
    LOAN_OPTIONS.find((o) => String(o.years) === loanYearsValue) ??
    DEFAULT_LOAN_TERMS
  );
}
