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
 *
 * --- On counting the grant exactly once -------------------------------------
 *
 * A grant reaches the homeowner by one of two paths, never both:
 *
 *   grantAppliedToCapital — it went to the bank and shrank the balance. The
 *     homeowner never touched it. It already shows up as smaller instalments,
 *     so it must NOT be subtracted again from net cost.
 *
 *   grantReimbursed — it landed in the homeowner's account after settlement.
 *     Instalments were unaffected, so this IS subtracted from net cost.
 *
 * An earlier version subtracted the grant from net cost on both paths. On the
 * bank route a 42 000 zł grant came back as minus 39 389 zł of net cost — the
 * tool claimed a heat pump pays you to install it — and interest carried the
 * mirror-image error and went negative. The two fields below exist so this
 * cannot recur: every złoty of grant is assigned to exactly one of them, and a
 * test asserts they sum back to the grant.
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
  termMonths: number,
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
  paymentsMade: number,
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
  /** Every złoty of instalment the homeowner hands over across the term. */
  paidByHomeowner: Range;
  /**
   * Grant that went straight to the bank and shrank the balance. Already
   * reflected in the instalments — never subtract this from net cost again.
   */
  grantAppliedToCapital: Range;
  /**
   * Grant that reached the homeowner as cash. Instalments were unaffected,
   * so this DOES come off net cost.
   */
  grantReimbursed: Range;
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
      `${route.label} is not available today — applications are suspended. Shown for comparison only.`,
    );
  }
  if (route.note?.includes("EXPIRES")) {
    warnings.push(route.note);
  }
  if (termMonths > route.maxTermMonths && route.maxTermMonths > 0) {
    warnings.push(
      `Term of ${termMonths} months exceeds this route's maximum of ${route.maxTermMonths}.`,
    );
  }

  // Cash purchase: no loan, no interest. The grant always arrives as cash here,
  // because there is no capital for it to pay down.
  if (route.id === "cash" || route.maxTermMonths === 0) {
    const net = subtract(
      subtract(input.capitalCost, input.upfrontGrant),
      input.taxRelief,
    );
    return {
      route,
      amountBorrowed: exact(0),
      arrangementFee: exact(0),
      monthlyBeforeGrant: exact(0),
      monthlyAfterGrant: exact(0),
      monthlyAfterLoan: exact(0),
      paidByHomeowner: input.capitalCost,
      grantAppliedToCapital: exact(0),
      grantReimbursed: input.upfrontGrant,
      totalInterest: exact(0),
      netCapitalCost: net,
      warnings,
    };
  }

  // Both routes borrow the full turnkey cost. What differs is where the grant
  // goes afterwards, which is handled below — not here.
  const borrowed = input.capitalCost;

  if (borrowed.high > route.maxPrincipal) {
    warnings.push(
      `Cost may exceed this route's ceiling of ${route.maxPrincipal.toLocaleString("pl-PL")} zł.`,
    );
  }

  // The arrangement fee is NOT financed. Verified against the BOŚ published
  // example: amortising the principal alone at 6.76% over 84 months reproduces
  // their stated total interest of 12 097,99 zł to the grosz. Rolling the fee
  // into the loan does not. The fee is paid up front and shows up in net cost.
  const fee = scale(borrowed, route.arrangementFee);

  const before = bandMap(borrowed, (p) =>
    monthlyPayment(p, route.annualRate, termMonths),
  );

  const monthsIn = route.grantPaysDownCapital
    ? Math.min(input.grantArrivesAfterMonths ?? 12, termMonths)
    : termMonths;
  const monthsAfter = termMonths - monthsIn;

  let after = before;
  let appliedToCapital = exact(0);
  let reimbursed = input.upfrontGrant;

  if (route.grantPaysDownCapital && monthsAfter > 0) {
    // Pair each corner so the band stays honest: the cheapest outcome is the
    // smallest balance meeting the largest grant, and the dearest is the
    // largest balance meeting the smallest grant.
    const corners: { bal: number; grant: number }[] = [
      {
        bal: balanceAfter(borrowed.low, route.annualRate, termMonths, monthsIn),
        grant: input.upfrontGrant.high,
      },
      {
        bal: balanceAfter(borrowed.mid, route.annualRate, termMonths, monthsIn),
        grant: input.upfrontGrant.mid,
      },
      {
        bal: balanceAfter(
          borrowed.high,
          route.annualRate,
          termMonths,
          monthsIn,
        ),
        grant: input.upfrontGrant.low,
      },
    ];

    // A grant larger than the outstanding balance clears the loan and the
    // remainder is paid out to the homeowner. Dropping that surplus would
    // silently understate the benefit on a small job with a large grant.
    const settled = corners.map(({ bal, grant }) => {
      const applied = Math.min(bal, grant);
      return { newBalance: bal - applied, applied, surplus: grant - applied };
    });

    const lo = settled[0]!;
    const mid = settled[1]!;
    const hi = settled[2]!;

    after = range(
      monthlyPayment(lo.newBalance, route.annualRate, monthsAfter),
      monthlyPayment(mid.newBalance, route.annualRate, monthsAfter),
      monthlyPayment(hi.newBalance, route.annualRate, monthsAfter),
    );

    appliedToCapital = range(
      Math.min(lo.applied, hi.applied),
      mid.applied,
      Math.max(lo.applied, hi.applied),
    );
    reimbursed = range(
      Math.min(lo.surplus, hi.surplus),
      mid.surplus,
      Math.max(lo.surplus, hi.surplus),
    );
  }

  const paidByHomeowner = add(
    scale(before, monthsIn),
    monthsAfter > 0 ? scale(after, monthsAfter) : exact(0),
  );

  // Interest is everything the bank received above the capital it lent. Grant
  // paid onto the capital is money the bank received, so it sits on the same
  // side as the instalments.
  const interest = subtract(add(paidByHomeowner, appliedToCapital), borrowed);

  // Net cost is what leaves the homeowner's pocket, less what comes back to it.
  // Only the reimbursed slice of the grant ever reaches their pocket.
  const net = subtract(
    subtract(add(paidByHomeowner, fee), reimbursed),
    input.taxRelief,
  );

  return {
    route,
    amountBorrowed: borrowed,
    arrangementFee: fee,
    monthlyBeforeGrant: before,
    monthlyAfterGrant: after,
    monthlyAfterLoan: exact(0),
    paidByHomeowner,
    grantAppliedToCapital: appliedToCapital,
    grantReimbursed: reimbursed,
    totalInterest: interest,
    netCapitalCost: net,
    warnings,
  };
}

/**
 * The headline the homeowner reads: loan repayment plus running cost.
 * Two numbers, both visible — during the loan, and after it is repaid.
 *
 * Note on the open routes: the homeowner pays the full instalment for the whole
 * term and receives the grant as cash partway through. This function shows that
 * literally. If they use the grant to overpay the loan — which most people
 * would — the real monthly figure steps down. That is a product decision, not a
 * modelling one, and it is deliberately not assumed here.
 */
export function headlineMonthly(
  plan: FinancingPlan,
  runningMonthly: Range,
): { duringLoan: Range; afterLoan: Range } {
  return {
    duringLoan: add(plan.monthlyAfterGrant, runningMonthly),
    afterLoan: runningMonthly,
  };
}
