import { useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { EnergyAssessmentForm } from "./wizard/EnergyAssessmentForm";
import { AssessmentState } from "./wizard/assessmentTypes";
import { HouseholdCaseInputs } from "./wizard/householdCases";
import { BaselineSummary } from "./wizard/BaselineSummary";
import { calculateUserBaseline } from "./engines/baseline";
import { StyleTile } from "./StyleTile";

type Phase = "form" | "financials";

export default function App() {
  // Route check: show style tile if requested
  const showStyleTile =
    new URLSearchParams(window.location.search).get("mode") === "style-tile";
  if (showStyleTile) {
    return <StyleTile />;
  }

  const [phase, setPhase] = useState<Phase>("form");
  const [assessment, setAssessment] = useState<AssessmentState | null>(null);
  const [household, setHousehold] = useState<HouseholdCaseInputs | null>(null);

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto w-full lg:w-1/2 lg:min-w-[600px] xl:max-w-[820px] px-4 pt-8">
        <p className="text-lg font-bold text-ink">
          What's your home actually costing you?
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          Answer a few questions about your home and current heating, then see
          the numbers behind switching.
        </p>
      </div>

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
 * U-values, appliance loads) is finalised — see estimateEnergyProfile.
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
  return (
    <div className="mx-auto w-full lg:w-1/2 lg:min-w-[600px] xl:max-w-[820px] px-4 py-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to your answers
      </button>

      {/*
        The baseline leads. Every number that follows it is a change measured
        against this one, so it has to be on screen first.

        The household state is already the merged result of a persona plus any
        edits, so it is passed wholesale as the override set with no persona id.
      */}
      <BaselineSummary baseline={calculateUserBaseline("", household)} />

      <section className="mt-6 rounded-[20px] border border-line bg-white p-6 shadow-block">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-chip text-ink-soft">
          <Sparkles className="h-5 w-5" aria-hidden />
        </div>
        <h2 className="text-[23px] font-bold tracking-tight text-ink">
          The rest is coming soon
        </h2>
        <p className="mt-2 text-base text-ink-soft">
          What a replacement costs, which subsidies you qualify for, and what
          the monthly figure looks like on a loan will appear here next. For
          now, here is what was collected:
        </p>

        <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <Fact
            label="Postal code"
            value={assessment.location.postalCode || "—"}
          />
        </dl>

        <h3 className="mt-8 text-xs font-semibold uppercase tracking-wider text-ink-soft/70">
          Home & comfort
        </h3>
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <Fact label="House type" value={household.houseKind} />
          <Fact label="Insulation" value={household.insulation} />
          <Fact label="Window frames" value={household.windowFrame} />
          <Fact label="Heated area" value={`${household.heatedAreaM2} m²`} />
          <Fact label="Radiators" value={household.radiatorType} />
          <Fact label="Occupants" value={String(household.occupants)} />
          <Fact
            label="AC available"
            value={household.acAvailable ? "Yes" : "No"}
          />
          <Fact label="Unheated rooms" value={household.unheatedRooms || "—"} />
        </dl>

        <h3 className="mt-8 text-xs font-semibold uppercase tracking-wider text-ink-soft/70">
          Current heating & fuel
        </h3>
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <Fact label="Coal type" value={household.coalType} />
          <Fact
            label="Also burns wood"
            value={household.usesWoodToo ? "Yes" : "No"}
          />
          <Fact
            label="Coal bought"
            value={`${household.coalTonnesPerSeason} t/season @ ${household.coalPricePerTonnePln} zł/t`}
          />
          <Fact
            label="Boiler"
            value={`${household.boilerClass}, ${household.boilerYear || "—"}`}
          />
          <Fact label="Feed type" value={household.feedType} />
          <Fact
            label="Free/discounted coal"
            value={
              household.freeCoalReceived
                ? `Yes (${household.freeCoalTonnes} t)`
                : "No"
            }
          />
          <Fact
            label="City deadline notice"
            value={household.cityDeadlineNotice}
          />
          <Fact
            label="Replacement preference"
            value={household.replacementPreference}
          />
          <Fact label="Coal provider" value={household.coalProvider || "—"} />
        </dl>

        <h3 className="mt-8 text-xs font-semibold uppercase tracking-wider text-ink-soft/70">
          Electricity & water
        </h3>
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <Fact
            label="Electricity"
            value={`${household.electricityTariff}, ${household.electricityBillPlnPerMonth} zł/mo`}
          />
          <Fact label="Water heating" value={household.waterHeating} />
          <Fact
            label="Showers/baths per week, per person"
            value={String(household.showersBathsPerWeek)}
          />
          <Fact
            label="Gas connection"
            value={household.gasConnectionAvailable ? "Yes" : "No"}
          />
          <Fact
            label="PV / battery / storage"
            value={
              [
                household.hasPvPanels && "PV",
                household.hasBattery && "Battery",
                household.hasHeatStorage && "Heat storage",
              ]
                .filter(Boolean)
                .join(", ") || "None"
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
