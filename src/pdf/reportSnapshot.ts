/**
 * reportSnapshot.ts: freezes one moment of the financials screen (baseline +
 * whichever replacement, solar, income tier, loan term and tax rate the
 * household currently has selected) into a single plain-data object.
 *
 * This is the ONE thing both the on-screen numbers (AlternativeHeatingOptions)
 * and the PDF report (generateReportPdf) are built from, so the two can never
 * quietly disagree: every figure here is produced by calling the same engines
 * `AlternativeHeatingOptions.tsx` calls, with the same arguments.
 *
 * Deliberately has no React and no i18n: a Dictionary is only needed at the
 * point text is rendered, not at the point numbers are computed.
 */

import {
  ALTERNATIVE_HEATING_IDS,
  calculateAlternativeHeatingCost,
  type AlternativeHeatingCost,
  type AlternativeHeatingId,
} from "../engines/alternativeHeating";
import {
  calculateCapexBreakdown,
  calculateSolarAddOn,
  type CapexBand,
  type CapexBreakdown,
  type SolarAddOn,
} from "../engines/capex";
import {
  calculateGrant,
  type GrantResult,
  type IncomeTier,
} from "../engines/grants";
import {
  calculateTaxRelief,
  type TaxRate,
  type TaxReliefResult,
} from "../engines/taxRelief";
import {
  calculateLoan,
  trueMonthlyCost,
  loanTermsForYears,
  type LoanResult,
  type TrueMonthlyCost,
} from "../engines/loan";
import type { Baseline } from "../engines/baseline";
import { getPolishRegion } from "../utils/postalCode";
import type {
  ElectricityTariffCase,
  HouseholdCaseInputs,
} from "../wizard/householdCases";

/**
 * The same live selections AlternativeHeatingOptions.tsx is controlled by
 * (see its props in wizard/AlternativeHeatingOptions.tsx). `loanYears` stays
 * a string here too - the IconCardGroup control it comes from only deals in
 * strings - and is resolved to actual loan terms the same way that
 * component resolves it: via `loanTermsForYears`.
 */
export interface ReportSelection {
  heatingId: AlternativeHeatingId;
  addSolar: boolean;
  /** Only meaningful, and only offered on screen, when the household is not
   *  already on a dynamic tariff - see AlternativeHeatingOptions.tsx. */
  switchToDynamicTariff: boolean;
  tier: IncomeTier;
  loanYears: string;
  taxRate: TaxRate;
}

export interface ReportSnapshot {
  generatedAt: Date;
  postalCode: string;
  region: string | null;
  household: HouseholdCaseInputs;
  baseline: Baseline;
  electricityTariff: ElectricityTariffCase;
  selection: ReportSelection;
  /** True when household PV + a solar add-on together mean the numbers below assume panels. */
  effectiveHasPv: boolean;
  /** The option with the biggest running-cost saving, same rule the "Biggest saving" badge uses. */
  bestHeatingId: AlternativeHeatingId;
  runningCost: {
    /** What is actually reflected in capex/grant/loan below: effectiveHasPv applied. */
    selected: AlternativeHeatingCost;
    /** The same option, forced without any PV. */
    withoutPv: AlternativeHeatingCost;
    /** The same option, forced with PV. */
    withPv: AlternativeHeatingCost;
  };
  capex: {
    heating: CapexBreakdown;
    solarAddOn: SolarAddOn | null;
    total: CapexBand;
  };
  grant: GrantResult;
  loan: LoanResult;
  taxRelief: TaxReliefResult;
  trueCost: TrueMonthlyCost;
}

function findBestHeatingId(
  baseline: Baseline,
  electricityTariff: ElectricityTariffCase,
  effectiveHasPv: boolean,
): AlternativeHeatingId {
  return ALTERNATIVE_HEATING_IDS.reduce(
    (best, id) => {
      const savings = calculateAlternativeHeatingCost(
        id,
        baseline,
        electricityTariff,
        undefined,
        effectiveHasPv,
      ).savingsPlnPerYear;
      return savings > best.savings ? { id, savings } : best;
    },
    { id: ALTERNATIVE_HEATING_IDS[0]!, savings: -Infinity },
  ).id;
}

export function buildReportSnapshot({
  postalCode,
  household,
  baseline,
  electricityTariff,
  selection,
}: {
  postalCode: string;
  household: HouseholdCaseInputs;
  baseline: Baseline;
  electricityTariff: ElectricityTariffCase;
  selection: ReportSelection;
}): ReportSnapshot {
  const effectiveHasPv = household.hasPvPanels || selection.addSolar;
  const effectiveElectricityTariff: ElectricityTariffCase =
    selection.switchToDynamicTariff ? "G12" : electricityTariff;

  const selected = calculateAlternativeHeatingCost(
    selection.heatingId,
    baseline,
    effectiveElectricityTariff,
    undefined,
    effectiveHasPv,
    selection.switchToDynamicTariff,
  );
  const withoutPv = calculateAlternativeHeatingCost(
    selection.heatingId,
    baseline,
    effectiveElectricityTariff,
    undefined,
    false,
    selection.switchToDynamicTariff,
  );
  const withPv = calculateAlternativeHeatingCost(
    selection.heatingId,
    baseline,
    effectiveElectricityTariff,
    undefined,
    true,
    selection.switchToDynamicTariff,
  );

  const heatingCapex = calculateCapexBreakdown(selection.heatingId);
  const solarAddOn = selection.addSolar ? calculateSolarAddOn() : null;
  const total: CapexBand = solarAddOn
    ? {
        lowPln: heatingCapex.totalGross.lowPln + solarAddOn.capexPln,
        midPln: heatingCapex.totalGross.midPln + solarAddOn.capexPln,
        highPln: heatingCapex.totalGross.highPln + solarAddOn.capexPln,
      }
    : heatingCapex.totalGross;

  const grant = calculateGrant({
    optionId: selection.heatingId,
    heatingCapexPln: heatingCapex.totalGross.midPln,
    solarCapexPln: solarAddOn ? solarAddOn.capexPln : 0,
    tier: selection.tier,
    spaceHeatPerM2: baseline.energy.spaceHeatPerM2,
  });

  const terms = loanTermsForYears(selection.loanYears);
  const loan = calculateLoan({
    grossCapexPln: total.midPln,
    grantPln: grant.totalGrantPln,
    terms,
  });

  const taxRelief = calculateTaxRelief({
    netCapexPln: loan.netCapexPln,
    rate: selection.taxRate,
  });

  const trueCost = trueMonthlyCost(selected.totalPlnPerMonth, loan);

  return {
    generatedAt: new Date(),
    postalCode,
    region: getPolishRegion(postalCode),
    household,
    baseline,
    electricityTariff,
    selection,
    effectiveHasPv,
    bestHeatingId: findBestHeatingId(
      baseline,
      effectiveElectricityTariff,
      effectiveHasPv,
    ),
    runningCost: { selected, withoutPv, withPv },
    capex: { heating: heatingCapex, solarAddOn, total },
    grant,
    loan,
    taxRelief,
    trueCost,
  };
}
