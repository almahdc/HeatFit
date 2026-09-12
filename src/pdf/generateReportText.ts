/**
 * generateReportText.ts: the same ReportSnapshot as generateReportPdf.ts,
 * rendered as plain text instead of a PDF page.
 *
 * Exists so the full report can travel as the BODY of the Formspree email to
 * heatfit.hello@gmail.com (see EarlyAccessBlock.tsx), rather than as a file
 * attachment: file uploads are a paid Formspree feature, and a submission
 * carrying one is rejected outright on a plan without it, which was failing
 * the household's contact request along with the attachment. Plain text in a
 * form field has no such limit and always reaches the inbox.
 *
 * Deliberately no jsPDF, no fonts, no layout math: this only ever needs to be
 * read once by someone on the HeatFit team, not printed or kept, so it does
 * not need the PDF's typography or pagination - just the same numbers, in
 * the same order, labelled the same way.
 */

import { assumptionText } from "../wizard/BaselineSummary";
import { CONTACT_EMAIL } from "../constants";
import {
  TAX_RELIEF_CAP_PLN,
  TAX_RELIEF_CARRY_FORWARD_YEARS,
} from "../engines/taxRelief";
import { ZUM_DATABASE_URL } from "../engines/capex";
import { zl, formatReportDate } from "./format";
import type { Dictionary, Language } from "../i18n";
import type { ReportSnapshot } from "./reportSnapshot";

export function generateReportText(
  t: Dictionary,
  lang: Language,
  snapshot: ReportSnapshot,
): string {
  const R = t.report;
  const A = t.alternatives;
  const h = snapshot.household;
  const optionName = A.options[snapshot.selection.heatingId].name;
  const bestOptionName = A.options[snapshot.bestHeatingId].name;
  const optionWithSolarLabel =
    optionName + (snapshot.selection.addSolar ? " + PV" : "");
  const savingMonthly = snapshot.runningCost.selected.savingsPlnPerMonth;
  const savingYearly = snapshot.runningCost.selected.savingsPlnPerYear;
  const isSaving = savingYearly >= 0;

  const lines: string[] = [];
  const heading = (text: string) => {
    lines.push("", `${text}`, "-".repeat(text.length));
  };
  const fact = (label: string, value: string) =>
    lines.push(`- ${label}: ${value}`);

  const preparedFor = snapshot.region
    ? R.preparedForWithRegion(snapshot.postalCode || "—", snapshot.region)
    : R.preparedFor(snapshot.postalCode || "—");

  lines.push(
    R.docTitle,
    `${preparedFor} · ${R.generatedOn(formatReportDate(snapshot.generatedAt, lang))}`,
  );

  // --- executive summary ------------------------------------------------
  heading(R.sections.executiveSummary);
  lines.push(
    R.verdict.currentSpend(
      zl(snapshot.baseline.cost.totalPlnPerMonth),
      zl(snapshot.baseline.cost.totalPlnPerYear),
    ),
    isSaving
      ? R.verdict.saving(
          optionName,
          zl(Math.abs(savingMonthly)),
          zl(Math.abs(savingYearly)),
        )
      : R.verdict.costing(
          optionName,
          zl(Math.abs(savingMonthly)),
          zl(Math.abs(savingYearly)),
        ),
    R.verdict.netCostLine(zl(snapshot.taxRelief.finalNetCostPln)),
    R.verdict.trueCostLine(
      zl(snapshot.trueCost.truePlnPerMonth),
      snapshot.loan.years,
    ),
  );
  if (snapshot.bestHeatingId !== snapshot.selection.heatingId) {
    lines.push(R.verdict.bestOption(bestOptionName));
  }

  // --- your details -------------------------------------------------------
  heading(R.sections.yourDetails);

  lines.push(R.details.location);
  fact(R.details.postalCode, snapshot.postalCode || "—");
  fact(R.details.region, snapshot.region ?? "—");

  lines.push("", R.details.building);
  fact(t.summary.houseType, t.options.houseKind[h.houseKind].label);
  fact(t.summary.insulation, t.options.insulation[h.insulation].label);
  fact(t.summary.windowFrames, t.options.windowFrame[h.windowFrame].label);
  fact(t.summary.totalArea, t.summary.totalAreaValue(h.totalAreaM2));
  fact(
    h.wholeHouseHeated ? t.summary.heatedArea : t.summary.estimatedHeatedArea,
    t.summary.heatedAreaValue(h.heatedAreaM2),
  );
  fact(t.summary.radiators, t.options.radiatorType[h.radiatorType].label);
  fact(t.summary.occupants, String(h.occupants));
  fact(t.summary.acAvailable, h.acAvailable ? t.summary.yes : t.summary.no);

  lines.push("", R.details.currentHeating);
  fact(t.summary.coalType, t.options.coalType[h.coalType].label);
  fact(
    t.summary.boiler,
    t.summary.boilerValue(
      t.options.boilerClass[h.boilerClass].label,
      h.boilerYear,
    ),
  );
  fact(
    t.summary.coalBought,
    t.summary.coalBoughtValue(h.coalTonnesPerSeason, h.coalPricePerTonnePln),
  );
  fact(t.summary.alsoBurnsWood, h.usesWoodToo ? t.summary.yes : t.summary.no);
  fact(
    t.summary.freeCoal,
    h.freeCoalReceived
      ? t.summary.freeCoalValue(h.freeCoalTonnes)
      : t.summary.no,
  );
  fact(
    t.summary.replacementPreference,
    t.options.replacementPreference[h.replacementPreference].label,
  );
  fact(
    t.summary.gasConnection,
    h.gasConnectionAvailable ? t.summary.yes : t.summary.no,
  );
  fact(
    t.summary.districtHeating,
    h.districtHeatingAvailable ? t.summary.yes : t.summary.no,
  );

  lines.push("", R.details.electricityWater);
  fact(
    t.summary.electricity,
    t.summary.electricityValue(
      t.options.electricityTariff[h.electricityTariff].label,
      h.electricityBillPlnPerMonth,
    ),
  );
  fact(t.summary.waterHeating, t.options.waterHeating[h.waterHeating].label);
  fact(t.summary.showers, String(h.showersBathsPerWeek));
  fact(
    t.summary.pvBatteryStorage,
    [
      h.hasPvPanels && t.summary.pv,
      h.hasBattery && t.summary.battery,
      h.hasHeatStorage && t.summary.heatStorage,
    ]
      .filter(Boolean)
      .join(", ") || t.summary.none,
  );

  lines.push("", R.details.yourSelections);
  fact(R.details.selectedOption, optionName);
  fact(
    R.details.addSolar,
    snapshot.selection.addSolar ? t.summary.yes : t.summary.no,
  );
  fact(R.details.incomeLevel, A.grants.tiers[snapshot.selection.tier]);
  fact(R.details.loanTerm, A.trueCost.years(snapshot.loan.years));
  fact(
    R.details.taxRateUsed,
    A.taxRelief.rates[snapshot.selection.taxRate].label,
  );

  // --- running cost comparison --------------------------------------------
  heading(R.sections.runningCosts);
  const RT = R.runningCostsTable;
  lines.push(R.financials.optionLabel(optionWithSolarLabel), "");
  const costLine = (
    label: string,
    baselineValuePln: number,
    withoutPv: number,
    withPv: number,
  ) =>
    lines.push(
      `${label} — ${RT.columnBaseline}: ${zl(baselineValuePln)} · ${RT.columnWithoutPv}: ${zl(withoutPv)} · ${RT.columnWithPv}: ${zl(withPv)}`,
    );
  costLine(
    RT.rowSpaceHeating,
    snapshot.baseline.cost.spaceHeatingPlnPerYear,
    snapshot.runningCost.withoutPv.spaceHeatingPlnPerYear,
    snapshot.runningCost.withPv.spaceHeatingPlnPerYear,
  );
  costLine(
    RT.rowWaterHeating,
    snapshot.baseline.cost.waterHeatingPlnPerYear,
    snapshot.runningCost.withoutPv.waterHeatingPlnPerYear,
    snapshot.runningCost.withPv.waterHeatingPlnPerYear,
  );
  costLine(
    RT.rowElectricityAndCooling,
    snapshot.baseline.cost.electricityAndCoolingPlnPerYear,
    snapshot.runningCost.withoutPv.electricityAndCoolingPlnPerYear,
    snapshot.runningCost.withPv.electricityAndCoolingPlnPerYear,
  );
  costLine(
    RT.rowTotalPerYear,
    snapshot.baseline.cost.totalPlnPerYear,
    snapshot.runningCost.withoutPv.totalPlnPerYear,
    snapshot.runningCost.withPv.totalPlnPerYear,
  );
  costLine(
    RT.rowTotalPerMonth,
    snapshot.baseline.cost.totalPlnPerMonth,
    snapshot.runningCost.withoutPv.totalPlnPerMonth,
    snapshot.runningCost.withPv.totalPlnPerMonth,
  );
  lines.push(
    `${RT.rowSavingsPerYear} — ${RT.columnWithoutPv}: ${zl(snapshot.runningCost.withoutPv.savingsPlnPerYear)} · ${RT.columnWithPv}: ${zl(snapshot.runningCost.withPv.savingsPlnPerYear)}`,
    "",
    RT.note,
  );

  // --- financial breakdown -------------------------------------------------
  heading(R.sections.financialBreakdown);
  const F = R.financials;
  lines.push(R.financials.optionLabel(optionWithSolarLabel));
  fact(F.grossCapex, zl(snapshot.capex.total.midPln));
  fact(F.grant, `– ${zl(snapshot.grant.totalGrantPln)}`);
  fact(F.netCapex, zl(snapshot.loan.netCapexPln));
  fact(F.taxRelief, `– ${zl(snapshot.taxRelief.cashBackPln)}`);
  fact(F.finalNetCost, zl(snapshot.taxRelief.finalNetCostPln));
  fact(
    F.loanAmount(
      snapshot.loan.years,
      Math.round(snapshot.loan.annualInterest * 100),
    ),
    zl(snapshot.loan.netCapexPln),
  );
  fact(F.monthlyLoanRepayment, zl(snapshot.trueCost.capexPlnPerMonth));
  fact(F.runningCostPerMonth, zl(snapshot.trueCost.runningPlnPerMonth));
  fact(F.trueMonthlyCost, zl(snapshot.trueCost.truePlnPerMonth));
  fact(F.afterLoanMonthlyCost, zl(snapshot.trueCost.afterLoanPlnPerMonth));

  // --- assumptions & sources -----------------------------------------------
  heading(R.sections.assumptions);
  lines.push(R.assumptions.intro, "", R.assumptions.yourAnswers);
  if (snapshot.baseline.assumptions.length > 0) {
    for (const a of snapshot.baseline.assumptions) {
      lines.push(`- ${assumptionText(t, a)}`);
    }
  } else {
    lines.push(`- ${R.assumptions.noAssumptions}`);
  }
  lines.push("", R.assumptions.referenceData);
  lines.push(
    `- ${R.assumptions.baselineModel}`,
    `- ${R.assumptions.capexSource(snapshot.capex.heating.source)}`,
    `- ${R.assumptions.grantProgramme}`,
    `- ${R.assumptions.zum(ZUM_DATABASE_URL)}`,
    `- ${R.assumptions.taxReliefRule(zl(TAX_RELIEF_CAP_PLN), TAX_RELIEF_CARRY_FORWARD_YEARS)}`,
    `- ${R.assumptions.loanTerms}`,
  );

  lines.push("", "---", R.confidential, R.contactFooter(CONTACT_EMAIL));

  return lines.join("\n");
}
