import { useState } from "react";
import { AlertCircle, ArrowLeft, ClipboardList } from "lucide-react";
import { getPostalCodeWarning } from "./utils/postalCode";
import { EnergyAssessmentForm } from "./wizard/EnergyAssessmentForm";
import { AssessmentState } from "./wizard/assessmentTypes";
import { HouseholdCaseInputs } from "./wizard/householdCases";
import { BaselineSummary } from "./wizard/BaselineSummary";
import { AlternativeHeatingOptions } from "./wizard/AlternativeHeatingOptions";
import { calculateUserBaseline } from "./engines/baseline";
import { StyleTile } from "./StyleTile";
import { useScrollToTopOnChange } from "./hooks/useScrollToTopOnChange";

const LABEL_MAPS: Record<string, Record<string, string>> = {
  houseKind: {
    detached: "Detached",
    semiDetached: "Semi-detached / terraced",
    apartment: "Apartment",
  },
  insulation: {
    none: "No insulation",
    standard: "10 cm Styrofoam (Standard)",
    veryGood: "15–20 cm Styrofoam (Very good)",
  },
  windowFrame: {
    woodenOld: "Wooden (Old)",
    doublePanePvc: "Double-pane PVC",
    triplePanePvc: "3-pane PVC (New)",
  },
  radiatorType: {
    standard: "Radiators",
    floorHeating: "Floor heating",
    mixed: "Mixed",
  },
  coalType: {
    orzech: "Orzech",
    groszek: "Groszek",
    kostka: "Kostka",
    mul: "Muł",
    other: "Other",
  },
  boilerClass: {
    bezklasowy: "Off-class (Bezklasowy)",
    class3: "Class 3",
    class4: "Class 4",
    class5: "Class 5",
  },
  cityDeadlineNotice: {
    none: "No contact",
    pressOrMediaOnly: "Press / media only",
    officialLetter: "Official letter",
  },
  replacementPreference: {
    gas: "Gas",
    pelletBoiler: "Pellet boiler",
    heatPump: "Heat pump",
    pelletOrHeatPump: "Pellet or heat pump",
    undecided: "Undecided",
  },
  electricityTariff: {
    G11: "G11 (Flat, all day)",
    G12: "G12 (Cheaper nights)",
  },
  waterHeating: {
    electricBoilerNew: "New electric boiler",
    electricSummerCoalWinter: "Electric summer, coal winter",
    coalCentralAllYear: "Coal boiler, all year",
    electricNightTariff: "Electric, night tariff",
  },
  unheatedRooms: {
    none: "None",
    oneRoom: "1 room",
    twoRooms: "2 rooms",
    threeOrMore: "3 or more",
  },
};

const formatValue = (key: string, value: string): string => {
  const labels = LABEL_MAPS[key];
  if (labels && labels[value]) return labels[value]!;
  return value;
};

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

            <section className="rounded-[20px] border border-line bg-white p-6 shadow-block">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-chip text-ink-soft">
                <ClipboardList className="h-5 w-5" aria-hidden />
              </div>
              <h2 className="text-[23px] font-bold tracking-tight text-ink">
                The answers behind these numbers
              </h2>
              <p className="mt-2 text-base text-ink-soft">
                Every figure above is built from what you told us. Here it is
                back, so you can check anything that looks wrong.
              </p>

              {getPostalCodeWarning(assessment.location.postalCode) && (
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-yellow-50 p-3 border border-yellow-200">
                  <AlertCircle
                    className="h-4 w-4 mt-0.5 text-yellow-600 flex-shrink-0"
                    aria-hidden
                  />
                  <p className="text-sm text-yellow-700">
                    {getPostalCodeWarning(assessment.location.postalCode)}
                  </p>
                </div>
              )}

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
                <Fact
                  label="House type"
                  value={formatValue("houseKind", household.houseKind)}
                />
                <Fact
                  label="Insulation"
                  value={formatValue("insulation", household.insulation)}
                />
                <Fact
                  label="Window frames"
                  value={formatValue("windowFrame", household.windowFrame)}
                />
                <Fact
                  label="Heated area"
                  value={`${household.heatedAreaM2} m²`}
                />
                <Fact
                  label="Radiators"
                  value={formatValue("radiatorType", household.radiatorType)}
                />
                <Fact label="Occupants" value={String(household.occupants)} />
                <Fact
                  label="AC available"
                  value={household.acAvailable ? "Yes" : "No"}
                />
                <Fact
                  label="Unheated rooms"
                  value={
                    household.unheatedRooms
                      ? formatValue("unheatedRooms", household.unheatedRooms)
                      : "—"
                  }
                />
              </dl>

              <h3 className="mt-8 text-xs font-semibold uppercase tracking-wider text-ink-soft/70">
                Current heating & fuel
              </h3>
              <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <Fact
                  label="Coal type"
                  value={formatValue("coalType", household.coalType)}
                />
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
                  value={`${formatValue("boilerClass", household.boilerClass)}${household.boilerYear ? ", " + household.boilerYear : ""}`}
                />
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
                  value={formatValue(
                    "cityDeadlineNotice",
                    household.cityDeadlineNotice,
                  )}
                />
                <Fact
                  label="Replacement preference"
                  value={formatValue(
                    "replacementPreference",
                    household.replacementPreference,
                  )}
                />
                <Fact
                  label="Coal provider"
                  value={household.coalProvider || "—"}
                />
              </dl>

              <h3 className="mt-8 text-xs font-semibold uppercase tracking-wider text-ink-soft/70">
                Electricity & water
              </h3>
              <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <Fact
                  label="Electricity"
                  value={`${formatValue("electricityTariff", household.electricityTariff)}, ${household.electricityBillPlnPerMonth} zł/mo`}
                />
                <Fact
                  label="Water heating"
                  value={formatValue("waterHeating", household.waterHeating)}
                />
                <Fact
                  label="Showers/baths per week, per person"
                  value={String(household.showersBathsPerWeek)}
                />
                <Fact
                  label="Gas connection"
                  value={household.gasConnectionAvailable ? "Yes" : "No"}
                />
                {/*
            Battery and heat storage are still on HouseholdCaseInputs (the
            wizard just does not collect them right now), so if either is ever
            true — a persona edited by hand, say — it still shows up here
            rather than silently vanishing.
          */}
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
