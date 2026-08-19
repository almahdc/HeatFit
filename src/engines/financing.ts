/**
 * financing.ts — what the homeowner actually pays each month.
 *
 * Two things make this more than an annuity formula:
 *
 * 1. WHICH ROUTE. The Czyste Powietrze bank route — where the grant is paid
 *    directly onto the loan capital — is suspended as of 19.08.2026. The routes
 *    that are open are more expensive and pay the grant to the homeowner after
 *    settlement. Modelling the suspended route as if it were available would
 *    understate every monthly figure by a meaningful margin.
 *
 * 2. WHEN THE GRANT LANDS. On the bank route the grant reduces the principal,
 *    so the payment steps down partway through. On the standard route the
 *    homeowner borrows the full amount and is reimbursed later. Same grant,
 *    different monthly number. This is the kind of thing an honest tool shows
 *    and a marketing calculator flattens.
 */

import { Range, add, exact, range, scale, subtract } from "./range";

export interface FinancingRoute {
  id: string;
  label: string;
  /** Whether a homeowner can actually use this today. */
  status: "open" | "suspended";
  /** Nominal annual interest rate, e.g. 0.0843 for 8.43%. */
  annualRate: number;
  /** Arrangement fee as a share of principal. */
  arrangementFee: number;
  maxTermMonths: number;
  maxPrincipal: number;
  /**
   * true  — grant is paid onto the loan capital, payment steps down (bank route)
   * false — homeowner borrows the full cost and is reimbursed later
   */
  grantPaysDownCapital: boolean;
  source: string;
  readOn: string;
  note?: string;
}

export const ROUTES: Record<string, FinancingRoute> = {
  bankRoute: {
    id: "bankRoute",
    label: "Clean Air bank loan (grant pays down the loan)",
    status: "suspended",
    annualRate: 0.0676, // WIBOR 6M 3.77% + 2.99pp margin, as at 06.02.2026
    arrangementFee: 0.02,
    maxTermMonths: 144,
    maxPrincipal: 150000,
    grantPaysDownCapital: true,
    source:
      "BOŚ Bank, Kredyt Czyste Powietrze. Representative example: 6.76% nominal, 7.64% APR. " +
      "Page carries an NFOŚiGW notice that applications are temporarily suspended pending reform.",
    readOn: "2026-08-19",
    note: "Best terms available, but not obtainable today. Model it as a lever, not a default.",
  },
  pozyczkaZielona: {
    id: "pozyczkaZielona",
    label: "Green Loan (available now)",
    status: "open",
    annualRate: 0.0843,
    arrangementFee: 0, // 0% under the promotion running to 30.09.2026
    maxTermMonths: 120,
    maxPrincipal: 150000,
    grantPaysDownCapital: false,
    source:
      "BOŚ Bank, Pożyczka Zielona. Representative example: 8.43% nominal, 8.76% APR on 60 000 zł. " +
      "Promotion 03.06.2026-30.09.2026, 0% arrangement fee, requires the signed WFOŚiGW agreement.",
    readOn: "2026-08-19",
    note: "PROMOTION EXPIRES 30.09.2026. Recheck before the November pitch.",
  },
  cash: {
    id: "cash",
    label: "Pay from savings",
    status: "open",
    annualRate: 0,
    arrangementFee: 0,
    maxTermMonths: 0,
    maxPrincipal: Number.POSITIVE_INFINITY,
    grantPaysDownCapital: false,
    source: "n/a",
    readOn: "2026-08-19",
  },
};

// --- annuity ----------------------------------------------------------------

/**
 * Standard annuity payment. Equal instalments over the term.
 *   P x r / (1 - (1+r)^-n)
 */
export function monthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  if (principal <= 0) return 0;
  if (termMonths <= 0) throw new Error("monthlyPayment: term must be positive");
  if (annualRate === 0) return principal / termMonths;

  const r = annualRate / 12;
  return (principal * r) / (1 - Math.pow(1 + r, -termMonths));
}

/** Outstanding capital after a number of payments. Needed for the step-down. */
export function balanceAfter(
  principal: number,
  annualRate: number,
  termMonths: number,
  paymentsMade: number
): number {
  if (annualRate === 0) {
    return Math.max(0, principal * (1 - paymentsMade / termMonths));
  }
  const r = annualRate / 12;
  const pmt = monthlyPayment(principal, annualRate, termMonths);
  const grown = principal * Math.pow(1 + r, paymentsMade);
  const paid = pmt * ((Math.pow(1 + r, paymentsMade) - 1) / r);
  return Math.max(0, grown - paid);
}

// --- the plan ---------------------------------------------------------------

export interface FinancingInput {
  /** Turnkey cost of the option, before any grant. */
  capitalCost: Range;
  /** Grant that reduces what must be repaid. From subsidy.ts. */
  upfrontGrant: Range;
  /** Tax relief. Arrives later, never reduces the loan. */
  taxRelief: Range;
  route: FinancingRoute;
  termMonths: number;
  /** Months before the grant is credited. Bank route only. */
  grantArrivesAfterMonths?: number;
}

export interface FinancingPlan {
  route: FinancingRoute;
  amountBorrowed: Range;
  arrangementFee: Range;
  /** Payment before the grant lands. On the open routes, the whole term. */
  monthlyBeforeGrant: Range;
  /** Payment after the grant is credited. Equals the above on open routes. */
  monthlyAfterGrant: Range;
  /** Zero once the loan is repaid — the "after the loan ends" number. */
  monthlyAfterLoan: Range;
  totalInterest: Range;
  /** Net out-of-pocket capital across the whole term, relief included. */
  netCapitalCost: Range;
  warnings: string[];
}

function bandMap(r: Range, f: (v: number) => number): Range {
  const vals = [f(r.low), f(r.mid), f(r.high)];
  return range(Math.min(...vals), vals[1]!, Math.max(...vals));
}

export function financingPlan(input: FinancingInput): FinancingPlan {
  const { route, termMonths } = input;
  const warnings: string[] = [];

  if (route.status === "suspended") {
    warnings.push(
      `${route.label} is not available today — applications are suspended. Shown for comparison only.`
    );
  }
  if (route.note?.includes("EXPIRES")) {
    warnings.push(route.note);
  }
  if (termMonths > route.maxTermMonths && route.maxTermMonths > 0) {
    warnings.push(
      `Term of ${termMonths} months exceeds this route's maximum of ${route.maxTermMonths}.`
    );
  }

  // Cash purchase: no loan, no interest.
  if (route.id === "cash" || route.maxTermMonths === 0) {
    const net = subtract(subtract(input.capitalCost, input.upfrontGrant), input.taxRelief);
    return {
      route,
      amountBorrowed: exact(0),
      arrangementFee: exact(0),
      monthlyBeforeGrant: exact(0),
      monthlyAfterGrant: exact(0),
      monthlyAfterLoan: exact(0),
      totalInterest: exact(0),
      netCapitalCost: net,
      warnings,
    };
  }

  // What gets borrowed depends on the route.
  const principal = route.grantPaysDownCapital
    ? input.capitalCost // grant arrives later and reduces the balance
    : input.capitalCost; // homeowner borrows the full cost either way

  if (principal.high > route.maxPrincipal) {
    warnings.push(
      `Cost may exceed this route's ceiling of ${route.maxPrincipal.toLocaleString("pl-PL")} zł.`
    );
  }

  // The arrangement fee is NOT financed. Verified against the BOŚ published
  // example: amortising the principal alone at 6.76% over 84 months reproduces
  // their stated total interest of 12 097,99 zł to the grosz. Rolling the fee
  // into the loan does not. The fee is paid up front and shows up in net cost.
  const fee = scale(principal, route.arrangementFee);
  const borrowed = principal;

  const before = bandMap(borrowed, (p) =>
    monthlyPayment(p, route.annualRate, termMonths)
  );

  let after = before;
  if (route.grantPaysDownCapital) {
    const monthsIn = input.grantArrivesAfterMonths ?? 12;
    const remaining = Math.max(1, termMonths - monthsIn);

    const lo = Math.max(
      0,
      balanceAfter(borrowed.low, route.annualRate, termMonths, monthsIn) -
        input.upfrontGrant.high
    );
    const mid = Math.max(
      0,
      balanceAfter(borrowed.mid, route.annualRate, termMonths, monthsIn) -
        input.upfrontGrant.mid
    );
    const hi = Math.max(
      0,
      balanceAfter(borrowed.high, route.annualRate, termMonths, monthsIn) -
        input.upfrontGrant.low
    );

    after = range(
      monthlyPayment(lo, route.annualRate, remaining),
      monthlyPayment(mid, route.annualRate, remaining),
      monthlyPayment(hi, route.annualRate, remaining)
    );
  }

  const totalPaid = add(
    scale(before, route.grantPaysDownCapital ? (input.grantArrivesAfterMonths ?? 12) : termMonths),
    route.grantPaysDownCapital
      ? scale(after, termMonths - (input.grantArrivesAfterMonths ?? 12))
      : exact(0)
  );

  const interest = subtract(totalPaid, borrowed);

  const net = subtract(
    subtract(add(totalPaid, fee), input.upfrontGrant),
    input.taxRelief
  );

  return {
    route,
    amountBorrowed: borrowed,
    arrangementFee: fee,
    monthlyBeforeGrant: before,
    monthlyAfterGrant: after,
    monthlyAfterLoan: exact(0),
    totalInterest: interest,
    netCapitalCost: net,
    warnings,
  };
}

/**
 * The headline the homeowner reads: loan repayment plus running cost.
 * Two numbers, both visible — during the loan, and after it is repaid.
 */
export function headlineMonthly(
  plan: FinancingPlan,
  runningMonthly: Range
): { duringLoan: Range; afterLoan: Range } {
  return {
    duringLoan: add(plan.monthlyAfterGrant, runningMonthly),
    afterLoan: runningMonthly,
  };
}
