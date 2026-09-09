import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BatteryCharging,
  Droplets,
  Euro,
  Flame,
  Fuel,
  Info,
  MapPin,
  Mountain,
  Sun,
  Tag,
  TreePine,
  Wind,
  Zap,
} from "lucide-react";
import {
  Block,
  FieldLabel,
  IconCardGroup,
  InfoBox,
  StepProgress,
  TextInputWithIcon,
  ToggleCard,
  type IconCardOption,
} from "./FormPrimitives";
import {
  AssessmentState,
  CoolingType,
  ElectricityTariff,
  HeatingSystemInputs,
  SpaceHeaterFuel,
  WaterHeaterType,
  initialAssessmentState,
} from "./assessmentTypes";
import { HouseholdCaseStudy } from "./HouseholdCaseStudy";
import { HouseholdCaseInputs, initialHouseholdCase } from "./householdCases";

const STEP_LABELS = ["Location", "Your home", "Current heating"];

const FUEL_OPTIONS: IconCardOption<SpaceHeaterFuel>[] = [
  { value: "gas", label: "Gas", icon: Flame },
  { value: "oil", label: "Oil", icon: Fuel },
  { value: "coal", label: "Coal", icon: Mountain },
  { value: "wood", label: "Wood", icon: TreePine },
];

const WATER_HEATER_OPTIONS: IconCardOption<WaterHeaterType>[] = [
  { value: "electricTank", label: "Electric tank", icon: Droplets },
  { value: "instantGas", label: "Instant gas heater", icon: Droplets },
  {
    value: "combinedWithHeater",
    label: "Combined with space heater",
    icon: Droplets,
  },
  { value: "solar", label: "Solar water heater", icon: Droplets },
];

const COOLING_OPTIONS: IconCardOption<CoolingType>[] = [
  { value: "none", label: "None", icon: Wind },
  { value: "splitAc", label: "Split AC units", icon: Wind },
  { value: "centralAc", label: "Central air conditioning", icon: Wind },
  { value: "fansOnly", label: "Fans only", icon: Wind },
];

const ELECTRICITY_TARIFF_OPTIONS: IconCardOption<ElectricityTariff>[] = [
  { value: "singleRate", label: "Single-rate", icon: Zap },
  {
    value: "timeOfUse",
    label: "Time-of-use",
    sublabel: "Day / night",
    icon: Zap,
  },
];

function updateHeating<K extends keyof HeatingSystemInputs>(
  state: AssessmentState,
  key: K,
  value: HeatingSystemInputs[K],
): AssessmentState {
  return { ...state, heating: { ...state.heating, [key]: value } };
}

export function EnergyAssessmentForm({
  onComplete,
  initialState = initialAssessmentState,
  initialHousehold = initialHouseholdCase,
  initialStep = 0,
}: {
  onComplete: (state: AssessmentState, household: HouseholdCaseInputs) => void;
  initialState?: AssessmentState;
  initialHousehold?: HouseholdCaseInputs;
  initialStep?: number;
}) {
  const [step, setStep] = useState(initialStep);
  const [state, setState] = useState<AssessmentState>(initialState);
  const [household, setHousehold] =
    useState<HouseholdCaseInputs>(initialHousehold);

  const isLastStep = step === STEP_LABELS.length - 1;

  const goNext = () => {
    if (isLastStep) {
      onComplete(state, household);
    } else {
      setStep((s) => s + 1);
    }
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="mx-auto w-full lg:w-1/2 lg:min-w-[600px] xl:max-w-[820px] px-4 py-8">
      <StepProgress steps={STEP_LABELS} current={step} />

      <div className="flex flex-col gap-6">
        {step === 0 && (
          <Block
            title="Location"
            subtitle="Your location determines climate zones and local anti-smog ordinances."
          >
            <div>
              <FieldLabel icon={MapPin}>Postal Code</FieldLabel>
              <TextInputWithIcon
                icon={MapPin}
                inputMode="text"
                placeholder="e.g., 10115"
                value={state.location.postalCode}
                onChange={(v) =>
                  setState((s) => ({ ...s, location: { postalCode: v } }))
                }
              />
            </div>
            <InfoBox icon={Info}>
              We use your postal code to match your climate zone and check
              whether local anti-smog rules restrict which heating systems are
              allowed in your area.
            </InfoBox>
          </Block>
        )}

        {step === 1 && (
          <HouseholdCaseStudy value={household} onChange={setHousehold} />
        )}

        {step === 2 && (
          <Block
            title="Current heating"
            subtitle="Tell us about your current energy setup."
          >
            <div>
              <FieldLabel icon={Flame}>Space heater fuel</FieldLabel>
              <IconCardGroup
                columns={4}
                value={state.heating.spaceHeaterFuel}
                onChange={(v) =>
                  setState((s) => updateHeating(s, "spaceHeaterFuel", v))
                }
                options={FUEL_OPTIONS}
              />
            </div>

            <div>
              <FieldLabel icon={Tag}>Average fuel price per season</FieldLabel>
              <TextInputWithIcon
                icon={Tag}
                inputMode="decimal"
                placeholder="e.g., 1200"
                suffix="/ season"
                value={String(state.heating.fuelPricePerSeason)}
                onChange={(v) =>
                  setState((s) =>
                    updateHeating(
                      s,
                      "fuelPricePerSeason",
                      v === "" ? "" : Number(v.replace(/[^0-9.]/g, "")),
                    ),
                  )
                }
              />
            </div>

            <div>
              <FieldLabel icon={Droplets}>Water heater</FieldLabel>
              <IconCardGroup
                columns={4}
                value={state.heating.waterHeaterType}
                onChange={(v) =>
                  setState((s) => updateHeating(s, "waterHeaterType", v))
                }
                options={WATER_HEATER_OPTIONS}
              />
            </div>

            <div>
              <FieldLabel icon={Wind}>Cooling</FieldLabel>
              <IconCardGroup
                columns={4}
                value={state.heating.cooling}
                onChange={(v) =>
                  setState((s) => updateHeating(s, "cooling", v))
                }
                options={COOLING_OPTIONS}
              />
            </div>

            <div>
              <FieldLabel icon={Zap}>Electricity tariff</FieldLabel>
              <IconCardGroup
                value={state.heating.electricityTariff}
                onChange={(v) =>
                  setState((s) => updateHeating(s, "electricityTariff", v))
                }
                options={ELECTRICITY_TARIFF_OPTIONS}
              />
            </div>

            <div>
              <FieldLabel icon={Euro}>Electricity price</FieldLabel>
              <TextInputWithIcon
                icon={Euro}
                inputMode="decimal"
                placeholder="e.g., 0.75"
                suffix="/ kWh"
                value={String(state.heating.electricityPricePerKwh)}
                onChange={(v) =>
                  setState((s) =>
                    updateHeating(
                      s,
                      "electricityPricePerKwh",
                      v === "" ? "" : Number(v.replace(/[^0-9.]/g, "")),
                    ),
                  )
                }
              />
            </div>

            <div>
              <FieldLabel>PV & storage setup</FieldLabel>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <ToggleCard
                  icon={Sun}
                  label="PV panels"
                  sublabel="Solar electricity"
                  checked={state.heating.hasPvPanels}
                  onChange={(v) =>
                    setState((s) => updateHeating(s, "hasPvPanels", v))
                  }
                />
                <ToggleCard
                  icon={BatteryCharging}
                  label="Battery"
                  sublabel="Stores solar power"
                  checked={state.heating.hasBattery}
                  onChange={(v) =>
                    setState((s) => updateHeating(s, "hasBattery", v))
                  }
                />
                <ToggleCard
                  icon={Zap}
                  label="Heat storage"
                  sublabel="Buffer / thermal tank"
                  checked={state.heating.hasHeatStorage}
                  onChange={(v) =>
                    setState((s) => updateHeating(s, "hasHeatStorage", v))
                  }
                />
              </div>
            </div>
          </Block>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0}
          className="flex items-center gap-2 rounded-xl border border-line bg-white px-5 py-3 text-[14.5px] font-semibold text-ink-soft transition-colors hover:bg-chip disabled:cursor-not-allowed disabled:opacity-0"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </button>
        <button
          type="button"
          onClick={goNext}
          className="flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-[14.5px] font-semibold text-white shadow-cta transition-colors hover:bg-accent-600 active:scale-[0.98]"
        >
          {isLastStep ? "Continue to Financials" : "Continue"}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

export default EnergyAssessmentForm;
