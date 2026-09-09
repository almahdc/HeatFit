import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BatteryCharging,
  Building,
  Building2,
  Columns3,
  Droplets,
  Euro,
  Flame,
  Fuel,
  Grid2x2,
  Home,
  Info,
  MapPin,
  Maximize,
  Mountain,
  Shield,
  Store,
  Sun,
  Tag,
  TreePine,
  Users,
  Warehouse,
  Wind,
  Zap,
} from "lucide-react";
import {
  Block,
  FieldLabel,
  IconCardGroup,
  IconSlider,
  IconStepper,
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
  HomeInputs,
  HomeType,
  HouseKind,
  InsulationLevel,
  RadiatorType,
  SpaceHeaterFuel,
  WaterHeaterType,
  WindowFrame,
  initialAssessmentState,
} from "./assessmentTypes";

const STEP_LABELS = ["Location", "Your home", "Current heating"];

const HOME_TYPE_OPTIONS: IconCardOption<HomeType>[] = [
  {
    value: "house",
    label: "House",
    badge: "The greatest potential for savings",
    icon: Home,
  },
  {
    value: "apartmentBuilding",
    label: "Apartment building",
    badge: "Good for shared systems",
    icon: Building2,
  },
  {
    value: "warehouse",
    label: "Warehouse",
    badge: "Best for large volumes",
    icon: Warehouse,
  },
  {
    value: "commercial",
    label: "Store / commercial",
    badge: "Ideal for business hours",
    icon: Store,
  },
];

const HOUSE_KIND_OPTIONS: IconCardOption<HouseKind>[] = [
  { value: "detached", label: "Detached", icon: Home },
  { value: "semiDetached", label: "Semi-detached / terraced", icon: Building },
];

const INSULATION_OPTIONS: IconCardOption<InsulationLevel>[] = [
  { value: "none", label: "No insulation", icon: Shield },
  {
    value: "standard",
    label: "10 cm Styrofoam",
    sublabel: "Standard",
    icon: Shield,
  },
  {
    value: "veryGood",
    label: "15–20 cm Styrofoam",
    sublabel: "Very good",
    icon: Shield,
  },
];

const WINDOW_OPTIONS: IconCardOption<WindowFrame>[] = [
  { value: "woodenOld", label: "Wooden", sublabel: "Old", icon: Columns3 },
  { value: "doublePanePvc", label: "Double-pane PVC", icon: Columns3 },
  {
    value: "triplePanePvc",
    label: "3-pane PVC",
    sublabel: "New",
    icon: Columns3,
  },
];

const RADIATOR_OPTIONS: IconCardOption<RadiatorType>[] = [
  { value: "standard", label: "Standard radiators", icon: Flame },
  { value: "floorHeating", label: "Floor heating", icon: Grid2x2 },
  { value: "mixed", label: "Mixed", icon: Grid2x2 },
];

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

function updateHome<K extends keyof HomeInputs>(
  state: AssessmentState,
  key: K,
  value: HomeInputs[K],
): AssessmentState {
  return { ...state, home: { ...state.home, [key]: value } };
}

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
  initialStep = 0,
}: {
  onComplete: (state: AssessmentState) => void;
  initialState?: AssessmentState;
  initialStep?: number;
}) {
  const [step, setStep] = useState(initialStep);
  const [state, setState] = useState<AssessmentState>(initialState);

  const isLastStep = step === STEP_LABELS.length - 1;

  const goNext = () => {
    if (isLastStep) {
      onComplete(state);
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
          <Block
            title="Your home"
            subtitle="Select the option that is the closest and adjust if needed."
          >
            <div>
              <FieldLabel>Home type</FieldLabel>
              <IconCardGroup
                columns={4}
                value={state.home.homeType}
                onChange={(v) => setState((s) => updateHome(s, "homeType", v))}
                options={HOME_TYPE_OPTIONS}
              />
            </div>

            <div>
              <FieldLabel icon={Home}>What kind of house</FieldLabel>
              <IconCardGroup
                value={state.home.houseKind}
                onChange={(v) => setState((s) => updateHome(s, "houseKind", v))}
                options={HOUSE_KIND_OPTIONS}
              />
            </div>

            <div>
              <FieldLabel icon={Maximize}>Heated area</FieldLabel>
              <IconSlider
                icon={Maximize}
                min={50}
                max={300}
                step={5}
                unit="m²"
                value={state.home.heatedAreaM2}
                onChange={(v) =>
                  setState((s) => updateHome(s, "heatedAreaM2", v))
                }
              />
            </div>

            <div>
              <FieldLabel icon={Shield}>Level of insulation</FieldLabel>
              <IconCardGroup
                columns={3}
                value={state.home.insulation}
                onChange={(v) =>
                  setState((s) => updateHome(s, "insulation", v))
                }
                options={INSULATION_OPTIONS}
              />
            </div>

            <div>
              <FieldLabel icon={Columns3}>
                Condition of window frames
              </FieldLabel>
              <IconCardGroup
                columns={3}
                value={state.home.windowFrame}
                onChange={(v) =>
                  setState((s) => updateHome(s, "windowFrame", v))
                }
                options={WINDOW_OPTIONS}
              />
            </div>

            <div>
              <FieldLabel icon={Users}>Number of people</FieldLabel>
              <IconStepper
                icon={Users}
                min={1}
                max={10}
                unit="people in the household"
                value={state.home.occupants}
                onChange={(v) => setState((s) => updateHome(s, "occupants", v))}
              />
            </div>

            <div>
              <FieldLabel icon={Flame}>Type of radiators</FieldLabel>
              <IconCardGroup
                columns={3}
                value={state.home.radiatorType}
                onChange={(v) =>
                  setState((s) => updateHome(s, "radiatorType", v))
                }
                options={RADIATOR_OPTIONS}
              />
            </div>
          </Block>
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
