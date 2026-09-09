import { useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { EnergyAssessmentForm } from "./wizard/EnergyAssessmentForm";
import { AssessmentState } from "./wizard/assessmentTypes";
import { HouseholdCaseInputs } from "./wizard/householdCases";
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

      <section className="rounded-[20px] border border-line bg-white p-6 shadow-block">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent text-white">
          <Sparkles className="h-5 w-5" aria-hidden />
        </div>
        <h2 className="text-[23px] font-bold tracking-tight text-ink">
          Financials are coming next
        </h2>
        <p className="mt-2 text-base text-ink-soft">
          Capex, running costs, and financing options will appear here once the
          underlying energy model is wired up. For now, here is what was
          collected:
        </p>

        <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <Fact
            label="Postal code"
            value={assessment.location.postalCode || "—"}
          />
          <Fact label="Home type" value={assessment.home.homeType} />
          <Fact label="House kind" value={assessment.home.houseKind} />
          <Fact
            label="Heated area"
            value={`${assessment.home.heatedAreaM2} m²`}
          />
          <Fact label="Insulation" value={assessment.home.insulation} />
          <Fact label="Window frames" value={assessment.home.windowFrame} />
          <Fact label="Occupants" value={String(assessment.home.occupants)} />
          <Fact label="Radiators" value={assessment.home.radiatorType} />
          <Fact
            label="Heating fuel"
            value={assessment.heating.spaceHeaterFuel}
          />
          <Fact
            label="Water heater"
            value={assessment.heating.waterHeaterType}
          />
          <Fact label="Cooling" value={assessment.heating.cooling} />
          <Fact
            label="Electricity tariff"
            value={assessment.heating.electricityTariff}
          />
          <Fact
            label="PV / battery / storage"
            value={
              [
                assessment.heating.hasPvPanels && "PV",
                assessment.heating.hasBattery && "Battery",
                assessment.heating.hasHeatStorage && "Heat storage",
              ]
                .filter(Boolean)
                .join(", ") || "None"
            }
          />
        </dl>

        <h3 className="mt-8 text-xs font-semibold uppercase tracking-wider text-ink-soft/70">
          Household case study
        </h3>
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <Fact label="Coal type" value={household.coalType} />
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
            label="Electricity"
            value={`${household.electricityTariff}, ${household.electricityBillPlnPerMonth} zł/mo`}
          />
          <Fact label="Water heating" value={household.waterHeating} />
          <Fact
            label="Showers/baths per week"
            value={String(household.showersBathsPerWeek)}
          />
          <Fact
            label="AC available"
            value={household.acAvailable ? "Yes" : "No"}
          />
          <Fact
            label="Gas connection"
            value={household.gasConnectionAvailable ? "Yes" : "No"}
          />
          <Fact
            label="Replacement preference"
            value={household.replacementPreference}
          />
          <Fact label="Coal provider" value={household.coalProvider || "—"} />
          <Fact label="Unheated rooms" value={household.unheatedRooms || "—"} />
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
