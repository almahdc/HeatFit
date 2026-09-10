/**
 * taxRelief.ts : the thermal modernisation relief (ulga termomodernizacyjna).
 *
 * Art. 26h of the Polish PIT act. The last piece of help in the chain, and the
 * one most often quoted wrongly, because it is a DEDUCTION FROM INCOME and not
 * a payment, a credit, or a discount at the till:
 *
 *     deduction base  ->  what you may subtract from taxable income
 *     cash back       ->  deduction base x your marginal tax rate
 *
 * At the 12% rate, a 20 000 zł deduction returns 2 400 zł, not 20 000 zł. The
 * result below keeps the two apart deliberately, because a household that
 * reads the deduction base as money in hand overstates their help by roughly
 * eight times.
 *
 * --- What is actually deductible -------------------------------------------
 *
 * Art. 26h ust. 5 pkt 1 excludes anything financed from NFOŚiGW / WFOŚiGW
 * money or otherwise returned to the taxpayer. A Czyste Powietrze grant is
 * exactly that, so the deduction is claimed on what the household paid out of
 * pocket: gross capex MINUS the grant. Claiming it on the gross figure is the
 * single most common way this relief gets overstated, and it is the mistake a
 * tax office actually catches.
 *
 * --- The cap ----------------------------------------------------------------
 *
 * 53 000 zł PER TAXPAYER, across all thermal modernisation work on all of
 * their buildings, not per project and not per year. Co-owning spouses each
 * hold their own 53 000 zł, so a couple has 106 000 zł of room between them.
 *
 * --- What this deliberately does NOT model ---------------------------------
 *
 * The relief only returns tax the household actually paid. Someone whose
 * taxable income is below the deduction cannot use all of it in one year;
 * the unused part carries forward, but only for six years, after which it is
 * lost. We do not ask what anyone earns, so this assumes the deduction can be
 * absorbed, and the UI says so rather than quietly implying a cheque.
 */

/** The per-taxpayer ceiling on the deduction base, art. 26h ust. 2. */
export const TAX_RELIEF_CAP_PLN = 53000;

/** Years the unused part of the deduction may be carried forward. */
export const TAX_RELIEF_CARRY_FORWARD_YEARS = 6;

/**
 * The PIT rates a household can be on. `none` covers anyone who pays no
 * income tax at all, for whom the relief is worth exactly nothing: it is a
 * deduction against tax due, so with no tax due there is nothing to deduct.
 */
export type TaxRate = "pit12" | "pit32" | "flat19" | "none";

export const TAX_RATES: TaxRate[] = ["pit12", "pit32", "flat19", "none"];

export const TAX_RATE_VALUE: Record<TaxRate, number> = {
  pit12: 0.12,
  pit32: 0.32,
  flat19: 0.19,
  none: 0,
};

/**
 * The least generous of the two scale rates, so a household that has not
 * touched the control is never shown more than they would get.
 */
export const DEFAULT_TAX_RATE: TaxRate = "pit12";

export interface TaxReliefResult {
  /** Out-of-pocket cost the claim is made against: gross minus grant. */
  eligibleCostPln: number;
  /** Ceiling that applied, 53 000 zł times the number of taxpayers claiming. */
  capPln: number;
  /** What may actually be subtracted from taxable income: min(cap, eligible). */
  deductionBasePln: number;
  rate: TaxRate;
  /** The deduction base times the rate: the money that comes back. */
  cashBackPln: number;
  /** True when the cap bit rather than the cost, so more spend returns nothing. */
  cappedOut: boolean;
  /** Net cost once the relief has been received in full. */
  finalNetCostPln: number;
}

/**
 * What the relief is worth on one project.
 *
 * `netCapexPln` is the figure AFTER the Czyste Powietrze grant: see the note
 * above on why the gross figure is the wrong input. Negative or zero costs
 * return a zero result rather than inventing a refund.
 */
export function calculateTaxRelief({
  netCapexPln,
  rate = DEFAULT_TAX_RATE,
  taxpayerCount = 1,
}: {
  netCapexPln: number;
  rate?: TaxRate;
  taxpayerCount?: number;
}): TaxReliefResult {
  const eligibleCostPln = Math.max(0, netCapexPln);
  const capPln = TAX_RELIEF_CAP_PLN * Math.max(1, Math.floor(taxpayerCount));
  const deductionBasePln = Math.min(capPln, eligibleCostPln);
  const cashBackPln = deductionBasePln * TAX_RATE_VALUE[rate];

  return {
    eligibleCostPln,
    capPln,
    deductionBasePln,
    rate,
    cashBackPln,
    cappedOut: capPln < eligibleCostPln,
    finalNetCostPln: eligibleCostPln - cashBackPln,
  };
}
