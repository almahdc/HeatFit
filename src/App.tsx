import { useState } from "react";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { EnergyAssessmentForm } from "./wizard/EnergyAssessmentForm";
import { AssessmentState } from "./wizard/assessmentTypes";
import { HouseholdCaseInputs } from "./wizard/householdCases";
import { BaselineSummary } from "./wizard/BaselineSummary";
import { AlternativeHeatingOptions } from "./wizard/AlternativeHeatingOptions";
import { RegulatoryCountdownCard } from "./wizard/RegulatoryCountdownCard";
import { EarlyAccessBlock } from "./wizard/EarlyAccessBlock";
import { StepEyebrow } from "./wizard/FormPrimitives";
import {
  applyCostOverrides,
  calculateUserBaseline,
  type BaselineCostOverrides,
  type EditableBaselineCostField,
} from "./engines/baseline";
import type { AlternativeHeatingId } from "./engines/alternativeHeating";
import type { IncomeTier } from "./engines/grants";
import { DEFAULT_TAX_RATE, type TaxRate } from "./engines/taxRelief";
import { DEFAULT_LOAN_TERMS } from "./engines/loan";
import { buildReportSnapshot } from "./pdf/reportSnapshot";
import { DownloadReportButton } from "./pdf/DownloadReportButton";
import { StyleTile } from "./StyleTile";
import { useScrollToTopOnChange } from "./hooks/useScrollToTopOnChange";
import { I18nProvider, LanguageToggle, useT } from "./i18n";

type Phase = "form" | "financials";

export default function App() {
  // Route check: show style tile if requested
  const showStyleTile =
    new URLSearchParams(window.location.search).get("mode") === "style-tile";
  if (showStyleTile) {
    return <StyleTile />;
  }

  return (
    <I18nProvider>
      <Calculator />
    </I18nProvider>
  );
}

function Calculator() {
  const [phase, setPhase] = useState<Phase>("form");
  const [assessment, setAssessment] = useState<AssessmentState | null>(null);
  const [household, setHousehold] = useState<HouseholdCaseInputs | null>(null);

  useScrollToTopOnChange(phase);

  return (
    <main className="min-h-screen bg-paper">
      {phase === "form" && (
        <EnergyAssessmentForm
          initialState={assessment ?? undefined}
          initialHousehold={household ?? undefined}
          initialStep={assessment ? 3 : 0}
          onComplete={(state, householdData) => {
            setAssessment(state);
            setHousehold(householdData);
            setPhase("financials");
          }}
        />
      )}

      {phase === "financials" && assessment && household && (
        <FinancialsPlaceholder
          assessment={assessment}
          household={household}
          onBack={() => setPhase("form")}
        />
      )}
    </main>
  );
}

/**
 * Stands in for the capex / running-cost / financing view until the energy
 * model behind it (climate zone by postal code, insulation and window
 * U-values, appliance loads) is finalised: see estimateEnergyProfile.
 */
function FinancialsPlaceholder({
  assessment,
  household,
  onBack,
}: {
  assessment: AssessmentState;
  household: HouseholdCaseInputs;
  onBack: () => void;
}) {
  const t = useT();
  const s = t.summary;

  // The financials screen's own live selections: which replacement, solar
  // add-on, income tier, loan term and tax rate the household currently has
  // picked. Owned here rather than inside AlternativeHeatingOptions so the
  // PDF report (see EarlyAccessBlock's reportSnapshot prop below) can be
  // built from exactly what is on screen, not a second, independent guess.
  const [selectedHeating, setSelectedHeating] =
    useState<AlternativeHeatingId>("airToAirHp");
  const [addSolar, setAddSolar] = useState(false);
  const [switchToDynamicTariff, setSwitchToDynamicTariff] = useState(false);
  const [tier, setTier] = useState<IncomeTier>("basic");
  const [loanYears, setLoanYears] = useState<string>(
    String(DEFAULT_LOAN_TERMS.years),
  );
  const [taxRate, setTaxRate] = useState<TaxRate>(DEFAULT_TAX_RATE);

  // Household-entered corrections on top of the baseline's modelled space
  // heating / water heating / electricity & cooling costs (see
  // BaselineSummary's per-line edit controls and applyCostOverrides in
  // engines/baseline.ts). Owned here, alongside the other financials-screen
  // state above, so every downstream figure - savings, capex comparisons,
  // the PDF report - is built from the household's own corrected baseline
  // rather than a second copy that only BaselineSummary sees.
  const [costOverrides, setCostOverrides] = useState<BaselineCostOverrides>({});
  const handleCostOverrideChange = (
    field: EditableBaselineCostField,
    value: number | null,
  ) => {
    setCostOverrides((prev) => {
      if (value === null) {
        const { [field]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [field]: value };
    });
  };

  return (
    <div className="mx-auto w-full lg:w-1/2 lg:min-w-[600px] xl:max-w-[820px] px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t.nav.backToAnswers}
        </button>
        <LanguageToggle />
      </div>

      {/*
        The baseline leads. Every number that follows it is a change measured
        against this one, so it has to be on screen first.

        The household state is already the merged result of a persona plus any
        edits, so it is passed wholesale as the override set with no persona id.
      */}
      {(() => {
        const modelledBaseline = calculateUserBaseline("", household);
        const baseline = applyCostOverrides(modelledBaseline, costOverrides);
        const reportSnapshot = buildReportSnapshot({
          postalCode: assessment.location.postalCode,
          household,
          baseline,
          electricityTariff: household.electricityTariff,
          selection: {
            heatingId: selectedHeating,
            addSolar,
            switchToDynamicTariff,
            tier,
            loanYears,
            taxRate,
          },
        });
        return (
          <div className="flex flex-col gap-6">
            <BaselineSummary
              baseline={baseline}
              overrides={costOverrides}
              onOverrideChange={handleCostOverrideChange}
              insulation={household.insulation}
              boilerClass={household.boilerClass}
              boilerYear={household.boilerYear}
            />
            <RegulatoryCountdownCard
              postalCode={assessment.location.postalCode}
              boilerClass={household.boilerClass}
              boilerYear={household.boilerYear}
            />
            <AlternativeHeatingOptions
              baseline={baseline}
              electricityTariff={household.electricityTariff}
              hasPvPanels={household.hasPvPanels}
              postalCode={assessment.location.postalCode}
              districtHeatingAvailable={household.districtHeatingAvailable}
              selected={selectedHeating}
              onSelectedChange={setSelectedHeating}
              addSolar={addSolar}
              onAddSolarChange={setAddSolar}
              switchToDynamicTariff={switchToDynamicTariff}
              onSwitchToDynamicTariffChange={setSwitchToDynamicTariff}
              tier={tier}
              onTierChange={setTier}
              loanYears={loanYears}
              onLoanYearsChange={setLoanYears}
              taxRate={taxRate}
              onTaxRateChange={setTaxRate}
            />

            <EarlyAccessBlock reportSnapshot={reportSnapshot} />

            <section className="rounded-[20px] border border-line bg-white p-6 shadow-block">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-chip text-ink-soft">
                <ClipboardList className="h-5 w-5" aria-hidden />
              </div>
              <StepEyebrow>{t.roadmap.yourAnswers}</StepEyebrow>
              <h2 className="text-[23px] font-bold tracking-tight text-ink">
                {s.title}
              </h2>
              <p className="mt-2 text-base text-ink-soft">{s.subtitle}</p>

              <div className="mt-4">
                <DownloadReportButton reportSnapshot={reportSnapshot} />
              </div>
            </section>
          </div>
        );
      })()}
    </div>
  );
}
