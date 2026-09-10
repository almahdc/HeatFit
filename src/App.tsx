import { useState } from "react";
import { AlertCircle, ArrowLeft, ClipboardList } from "lucide-react";
import { postalCodeIssue } from "./utils/postalCode";
import { EnergyAssessmentForm } from "./wizard/EnergyAssessmentForm";
import { AssessmentState } from "./wizard/assessmentTypes";
import { HouseholdCaseInputs } from "./wizard/householdCases";
import { BaselineSummary } from "./wizard/BaselineSummary";
import { AlternativeHeatingOptions } from "./wizard/AlternativeHeatingOptions";
import { EarlyAccessBlock } from "./wizard/EarlyAccessBlock";
import { calculateUserBaseline } from "./engines/baseline";
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
        const baseline = calculateUserBaseline("", household);
        return (
          <div className="flex flex-col gap-6">
            <BaselineSummary baseline={baseline} />
            <AlternativeHeatingOptions
              baseline={baseline}
              electricityTariff={household.electricityTariff}
              hasPvPanels={household.hasPvPanels}
            />

            <EarlyAccessBlock />

            <section className="rounded-[20px] border border-line bg-white p-6 shadow-block">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-chip text-ink-soft">
                <ClipboardList className="h-5 w-5" aria-hidden />
              </div>
              <h2 className="text-[23px] font-bold tracking-tight text-ink">
                {s.title}
              </h2>
              <p className="mt-2 text-base text-ink-soft">{s.subtitle}</p>

              {postalCodeIssue(assessment.location.postalCode) && (
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-yellow-50 p-3 border border-yellow-200">
                  <AlertCircle
                    className="h-4 w-4 mt-0.5 text-yellow-600 flex-shrink-0"
                    aria-hidden
                  />
                  <p className="text-sm text-yellow-700">
                    {t.postalCode.invalidFormat}
                  </p>
                </div>
              )}

              <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <Fact
                  label={s.postalCode}
                  value={assessment.location.postalCode || s.empty}
                />
              </dl>

              <h3 className="mt-8 text-xs font-semibold uppercase tracking-wider text-ink-soft/70">
                {s.homeSection}
              </h3>
              <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <Fact
                  label={s.houseType}
                  value={t.options.houseKind[household.houseKind].label}
                />
                <Fact
                  label={s.insulation}
                  value={t.options.insulation[household.insulation].label}
                />
                <Fact
                  label={s.windowFrames}
                  value={t.options.windowFrame[household.windowFrame].label}
                />
                <Fact
                  label={s.heatedArea}
                  value={s.heatedAreaValue(household.heatedAreaM2)}
                />
                <Fact
                  label={s.radiators}
                  value={t.options.radiatorType[household.radiatorType].label}
                />
                <Fact label={s.occupants} value={String(household.occupants)} />
                <Fact
                  label={s.acAvailable}
                  value={household.acAvailable ? s.yes : s.no}
                />
                <Fact
                  label={s.unheatedRooms}
                  value={household.unheatedRooms || s.empty}
                />
              </dl>

              <h3 className="mt-8 text-xs font-semibold uppercase tracking-wider text-ink-soft/70">
                {s.heatingSection}
              </h3>
              <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <Fact
                  label={s.coalType}
                  value={t.options.coalType[household.coalType].label}
                />
                <Fact
                  label={s.alsoBurnsWood}
                  value={household.usesWoodToo ? s.yes : s.no}
                />
                <Fact
                  label={s.coalBought}
                  value={s.coalBoughtValue(
                    household.coalTonnesPerSeason,
                    household.coalPricePerTonnePln,
                  )}
                />
                <Fact
                  label={s.boiler}
                  value={s.boilerValue(
                    t.options.boilerClass[household.boilerClass].label,
                    household.boilerYear,
                  )}
                />
                <Fact
                  label={s.freeCoal}
                  value={
                    household.freeCoalReceived
                      ? s.freeCoalValue(household.freeCoalTonnes)
                      : s.no
                  }
                />
                <Fact
                  label={s.cityDeadline}
                  value={
                    t.options.cityDeadlineNotice[household.cityDeadlineNotice]
                      .label
                  }
                />
                <Fact
                  label={s.replacementPreference}
                  value={
                    t.options.replacementPreference[
                      household.replacementPreference
                    ].label
                  }
                />
                <Fact
                  label={s.coalProvider}
                  value={household.coalProvider || s.empty}
                />
              </dl>

              <h3 className="mt-8 text-xs font-semibold uppercase tracking-wider text-ink-soft/70">
                {s.electricitySection}
              </h3>
              <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <Fact
                  label={s.electricity}
                  value={s.electricityValue(
                    t.options.electricityTariff[household.electricityTariff]
                      .label,
                    household.electricityBillPlnPerMonth,
                  )}
                />
                <Fact
                  label={s.waterHeating}
                  value={t.options.waterHeating[household.waterHeating].label}
                />
                <Fact
                  label={s.showers}
                  value={String(household.showersBathsPerWeek)}
                />
                <Fact
                  label={s.gasConnection}
                  value={household.gasConnectionAvailable ? s.yes : s.no}
                />
                {/*
            Battery and heat storage are still on HouseholdCaseInputs (the
            wizard just does not collect them right now), so if either is ever
            true: a persona edited by hand, say: it still shows up here
            rather than silently vanishing.
          */}
                <Fact
                  label={s.pvBatteryStorage}
                  value={
                    [
                      household.hasPvPanels && s.pv,
                      household.hasBattery && s.battery,
                      household.hasHeatStorage && s.heatStorage,
                    ]
                      .filter(Boolean)
                      .join(", ") || s.none
                  }
                />
              </dl>
              {household.additionalNotes && (
                <p className="mt-4 text-sm italic text-ink-soft">
                  “{household.additionalNotes}”
                </p>
              )}
            </section>
          </div>
        );
      })()}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-ink-soft/70">
        {label}
      </dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
