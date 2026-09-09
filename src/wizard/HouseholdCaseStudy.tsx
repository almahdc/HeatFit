import { useState } from "react";
import {
  BatteryCharging,
  Building,
  Calendar,
  Clock,
  Columns3,
  FileText,
  Flame,
  Gauge,
  Hand,
  Home,
  ListChecks,
  Mail,
  Megaphone,
  Mountain,
  Newspaper,
  Package,
  Receipt,
  Scale,
  Settings,
  Shield,
  Snowflake,
  Sun,
  Tag,
  TreePine,
  Truck,
  User,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  Block,
  FieldLabel,
  IconCardGroup,
  IconSlider,
  IconStepper,
  TextAreaWithIcon,
  TextInputWithIcon,
  ToggleCard,
  type IconCardOption,
} from "./FormPrimitives";
import {
  BoilerClass,
  CityDeadlineNotice,
  CoalType,
  ElectricityTariffCase,
  FeedType,
  HOUSEHOLD_CASE_PRESETS,
  HouseholdCaseInputs,
  HouseKind,
  InsulationLevel,
  RadiatorKind,
  ReplacementPreference,
  WaterHeatingCase,
  WindowFrame,
} from "./householdCases";

type Props = {
  value: HouseholdCaseInputs;
  onChange: (v: HouseholdCaseInputs) => void;
};

function update<K extends keyof HouseholdCaseInputs>(
  state: HouseholdCaseInputs,
  key: K,
  value: HouseholdCaseInputs[K],
): HouseholdCaseInputs {
  return { ...state, [key]: value };
}

const PRESET_OPTIONS: IconCardOption<string>[] = HOUSEHOLD_CASE_PRESETS.map(
  (p) => ({
    value: p.id,
    label: p.name,
    sublabel: p.tagline,
    icon: User as LucideIcon,
  }),
);

const HOUSE_KIND_OPTIONS: IconCardOption<HouseKind>[] = [
  { value: "detached", label: "Detached", icon: Home },
  { value: "semiDetached", label: "Semi-detached / terraced", icon: Building },
  { value: "apartment", label: "Apartment", icon: Building },
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

const RADIATOR_OPTIONS: IconCardOption<RadiatorKind>[] = [
  { value: "standard", label: "Radiators", icon: Flame },
  { value: "floorHeating", label: "Floor heating", icon: Gauge },
  { value: "mixed", label: "Mixed", icon: Gauge },
];

const COAL_TYPE_OPTIONS: IconCardOption<CoalType>[] = [
  { value: "orzech", label: "Orzech", icon: Mountain },
  { value: "groszek", label: "Groszek", icon: Mountain },
  { value: "kostka", label: "Kostka", icon: Mountain },
  { value: "mul", label: "Muł", icon: Mountain },
  { value: "other", label: "Other", icon: Mountain },
];

const BOILER_CLASS_OPTIONS: IconCardOption<BoilerClass>[] = [
  {
    value: "bezklasowy",
    label: "Off-class",
    sublabel: "Bezklasowy",
    icon: Gauge,
  },
  { value: "class3", label: "Class 3", icon: Gauge },
  { value: "class4", label: "Class 4", icon: Gauge },
  { value: "class5", label: "Class 5", icon: Gauge },
];

const FEED_TYPE_OPTIONS: IconCardOption<FeedType>[] = [
  {
    value: "manual",
    label: "Manual",
    sublabel: "By hand, with a shovel",
    icon: Hand,
  },
  {
    value: "automatic",
    label: "Automatic",
    sublabel: "Feeder",
    icon: Settings,
  },
];

const CITY_DEADLINE_OPTIONS: IconCardOption<CityDeadlineNotice>[] = [
  { value: "none", label: "No contact", icon: Megaphone },
  { value: "pressOrMediaOnly", label: "Press / media only", icon: Newspaper },
  { value: "officialLetter", label: "Official letter", icon: Mail },
];

const REPLACEMENT_OPTIONS: IconCardOption<ReplacementPreference>[] = [
  { value: "gas", label: "Gas", icon: Flame },
  { value: "pelletBoiler", label: "Pellet boiler", icon: Package },
  { value: "heatPump", label: "Heat pump", icon: Snowflake },
  { value: "pelletOrHeatPump", label: "Pellet or heat pump", icon: ListChecks },
  { value: "undecided", label: "Undecided", icon: Clock },
];

const ELECTRICITY_TARIFF_OPTIONS: IconCardOption<ElectricityTariffCase>[] = [
  { value: "G11", label: "G11", sublabel: "Flat, all day", icon: Zap },
  { value: "G12", label: "G12", sublabel: "Cheaper nights", icon: Zap },
];

const WATER_HEATING_OPTIONS: IconCardOption<WaterHeatingCase>[] = [
  { value: "electricBoilerNew", label: "New electric boiler", icon: Flame },
  {
    value: "electricSummerCoalWinter",
    label: "Electric summer, coal winter",
    icon: Flame,
  },
  { value: "coalCentralAllYear", label: "Coal boiler, all year", icon: Flame },
  {
    value: "electricNightTariff",
    label: "Electric, night tariff",
    icon: Flame,
  },
];

/** The 4 persona buttons that quick-fill the whole household case. */
export function PersonaPicker({ value, onChange }: Props) {
  const [selectedPresetId, setSelectedPresetId] = useState("");

  const loadPreset = (id: string) => {
    const preset = HOUSEHOLD_CASE_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setSelectedPresetId(id);
    onChange(preset.data);
  };

  return (
    <Block
      title="Load a household case study"
      subtitle="Quick-fill every step below from a real interview, or fill it in by hand."
    >
      <div>
        <FieldLabel icon={Users}>Household case study</FieldLabel>
        <IconCardGroup
          columns={4}
          value={selectedPresetId}
          onChange={loadPreset}
          options={PRESET_OPTIONS}
        />
      </div>
    </Block>
  );
}

/** Step 2, Block 2 — house type, insulation, windows, area, radiators, AC. */
export function HomeComfortSection({ value, onChange }: Props) {
  return (
    <Block title="Home & comfort">
      <div>
        <FieldLabel icon={Home}>House type</FieldLabel>
        <IconCardGroup
          columns={3}
          value={value.houseKind}
          onChange={(v) => onChange(update(value, "houseKind", v))}
          options={HOUSE_KIND_OPTIONS}
        />
      </div>

      <div>
        <FieldLabel icon={Shield}>Level of insulation</FieldLabel>
        <IconCardGroup
          columns={3}
          value={value.insulation}
          onChange={(v) => onChange(update(value, "insulation", v))}
          options={INSULATION_OPTIONS}
        />
      </div>

      <div>
        <FieldLabel icon={Columns3}>Condition of window frames</FieldLabel>
        <IconCardGroup
          columns={3}
          value={value.windowFrame}
          onChange={(v) => onChange(update(value, "windowFrame", v))}
          options={WINDOW_OPTIONS}
        />
      </div>

      <div>
        <FieldLabel>Heated area</FieldLabel>
        <IconSlider
          icon={Scale}
          min={50}
          max={300}
          step={5}
          unit="m²"
          value={value.heatedAreaM2}
          onChange={(v) => onChange(update(value, "heatedAreaM2", v))}
        />
      </div>

      <div>
        <FieldLabel icon={Flame}>Radiators / underfloor</FieldLabel>
        <IconCardGroup
          columns={3}
          value={value.radiatorType}
          onChange={(v) => onChange(update(value, "radiatorType", v))}
          options={RADIATOR_OPTIONS}
        />
      </div>

      <div>
        <FieldLabel icon={FileText}>Radiator note</FieldLabel>
        <TextInputWithIcon
          icon={FileText}
          placeholder="e.g., old cast-iron, extremely hot to touch"
          value={value.radiatorNote}
          onChange={(v) => onChange(update(value, "radiatorNote", v))}
        />
      </div>

      <div>
        <FieldLabel icon={Users}>People in house</FieldLabel>
        <IconStepper
          icon={Users}
          min={1}
          max={10}
          unit="people"
          value={value.occupants}
          onChange={(v) => onChange(update(value, "occupants", v))}
        />
      </div>

      <ToggleCard
        icon={Snowflake}
        label="Air conditioning"
        sublabel="Working AC unit available"
        checked={value.acAvailable}
        onChange={(v) => onChange(update(value, "acAvailable", v))}
      />

      <div>
        <FieldLabel icon={FileText}>Unheated rooms</FieldLabel>
        <TextAreaWithIcon
          icon={FileText}
          placeholder="e.g., none — whole house heated"
          value={value.unheatedRooms}
          onChange={(v) => onChange(update(value, "unheatedRooms", v))}
        />
      </div>
    </Block>
  );
}

/** Step 3 — coal, boiler, replacement preference, coal provider. */
export function CurrentHeatingSection({ value, onChange }: Props) {
  return (
    <Block
      title="Current heating"
      subtitle="Tell us about the coal boiler and how it's fed today."
    >
      <div>
        <FieldLabel icon={Mountain}>Type of coal</FieldLabel>
        <IconCardGroup
          columns={4}
          value={value.coalType}
          onChange={(v) => onChange(update(value, "coalType", v))}
          options={COAL_TYPE_OPTIONS}
        />
      </div>

      <ToggleCard
        icon={TreePine}
        label="Also burns wood"
        sublabel="Wood or offcuts alongside the coal"
        checked={value.usesWoodToo}
        onChange={(v) => onChange(update(value, "usesWoodToo", v))}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <FieldLabel icon={Scale}>Average amount per season</FieldLabel>
          <TextInputWithIcon
            icon={Scale}
            inputMode="decimal"
            placeholder="e.g., 5"
            suffix="t / season"
            value={String(value.coalTonnesPerSeason)}
            onChange={(v) =>
              onChange(
                update(
                  value,
                  "coalTonnesPerSeason",
                  v === "" ? 0 : Number(v.replace(/[^0-9.]/g, "")),
                ),
              )
            }
          />
        </div>
        <div>
          <FieldLabel icon={Tag}>Price per tonne</FieldLabel>
          <TextInputWithIcon
            icon={Tag}
            inputMode="decimal"
            placeholder="e.g., 1300"
            suffix="zł / t"
            value={String(value.coalPricePerTonnePln)}
            onChange={(v) =>
              onChange(
                update(
                  value,
                  "coalPricePerTonnePln",
                  v === "" ? 0 : Number(v.replace(/[^0-9.]/g, "")),
                ),
              )
            }
          />
        </div>
      </div>

      <div>
        <FieldLabel icon={FileText}>Price note</FieldLabel>
        <TextInputWithIcon
          icon={FileText}
          placeholder="e.g., includes transport, ex-works price..."
          value={value.coalPriceNote}
          onChange={(v) => onChange(update(value, "coalPriceNote", v))}
        />
      </div>

      <ToggleCard
        icon={Truck}
        label="Free or discounted coal"
        sublabel="Received coal outside a normal purchase"
        checked={value.freeCoalReceived}
        onChange={(v) => onChange(update(value, "freeCoalReceived", v))}
      />

      {value.freeCoalReceived && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel icon={Scale}>Free coal amount</FieldLabel>
            <TextInputWithIcon
              icon={Scale}
              inputMode="decimal"
              placeholder="e.g., 1"
              suffix="t"
              value={String(value.freeCoalTonnes)}
              onChange={(v) =>
                onChange(
                  update(
                    value,
                    "freeCoalTonnes",
                    v === "" ? "" : Number(v.replace(/[^0-9.]/g, "")),
                  ),
                )
              }
            />
          </div>
          <div>
            <FieldLabel icon={FileText}>Free coal note</FieldLabel>
            <TextInputWithIcon
              icon={FileText}
              placeholder="e.g., from a relative's farm"
              value={value.freeCoalNote}
              onChange={(v) => onChange(update(value, "freeCoalNote", v))}
            />
          </div>
        </div>
      )}

      <div>
        <FieldLabel icon={Calendar}>
          Boiler installation year <span className="text-accent">*</span>
        </FieldLabel>
        <TextInputWithIcon
          icon={Calendar}
          inputMode="numeric"
          placeholder="e.g., 2013"
          value={String(value.boilerYear)}
          onChange={(v) =>
            onChange(
              update(
                value,
                "boilerYear",
                v === "" ? "" : Number(v.replace(/[^0-9]/g, "")),
              ),
            )
          }
        />
      </div>

      <div>
        <FieldLabel icon={Gauge}>Boiler class</FieldLabel>
        <IconCardGroup
          columns={4}
          value={value.boilerClass}
          onChange={(v) => onChange(update(value, "boilerClass", v))}
          options={BOILER_CLASS_OPTIONS}
        />
      </div>

      <div>
        <FieldLabel icon={Hand}>Feed type</FieldLabel>
        <IconCardGroup
          value={value.feedType}
          onChange={(v) => onChange(update(value, "feedType", v))}
          options={FEED_TYPE_OPTIONS}
        />
      </div>

      <div>
        <FieldLabel icon={Megaphone}>Deadline info from city</FieldLabel>
        <IconCardGroup
          columns={3}
          value={value.cityDeadlineNotice}
          onChange={(v) => onChange(update(value, "cityDeadlineNotice", v))}
          options={CITY_DEADLINE_OPTIONS}
        />
      </div>

      <div>
        <FieldLabel icon={ListChecks}>
          If your boiler had to be replaced tomorrow, what would you put in?
        </FieldLabel>
        <IconCardGroup
          columns={3}
          value={value.replacementPreference}
          onChange={(v) => onChange(update(value, "replacementPreference", v))}
          options={REPLACEMENT_OPTIONS}
        />
      </div>

      <div>
        <FieldLabel icon={Truck}>
          Coal provider <span className="text-accent">*</span>
        </FieldLabel>
        <TextAreaWithIcon
          icon={Truck}
          placeholder="Merchant name, website, delivery notes..."
          value={value.coalProvider}
          onChange={(v) => onChange(update(value, "coalProvider", v))}
        />
      </div>
    </Block>
  );
}

/** Step 4 — electricity, water heating, PV/battery/storage, notes. */
export function ElectricityWaterSection({ value, onChange }: Props) {
  return (
    <Block
      title="Electricity & water"
      subtitle="Tell us about electricity use and how hot water is made."
    >
      <div>
        <FieldLabel icon={Zap}>Electricity tariff</FieldLabel>
        <IconCardGroup
          value={value.electricityTariff}
          onChange={(v) => onChange(update(value, "electricityTariff", v))}
          options={ELECTRICITY_TARIFF_OPTIONS}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <FieldLabel icon={Receipt}>Electricity bill</FieldLabel>
          <TextInputWithIcon
            icon={Receipt}
            inputMode="decimal"
            placeholder="e.g., 200"
            suffix="zł / month"
            value={String(value.electricityBillPlnPerMonth)}
            onChange={(v) =>
              onChange(
                update(
                  value,
                  "electricityBillPlnPerMonth",
                  v === "" ? 0 : Number(v.replace(/[^0-9.]/g, "")),
                ),
              )
            }
          />
        </div>
        <div>
          <FieldLabel icon={FileText}>Bill note</FieldLabel>
          <TextInputWithIcon
            icon={FileText}
            placeholder="e.g., prognoza, flat, 6-month settlement"
            value={value.electricityBillNote}
            onChange={(v) => onChange(update(value, "electricityBillNote", v))}
          />
        </div>
      </div>

      <ToggleCard
        icon={Flame}
        label="Gas connection available"
        sublabel="A gas line already reaches the property"
        checked={value.gasConnectionAvailable}
        onChange={(v) => onChange(update(value, "gasConnectionAvailable", v))}
      />

      <div>
        <FieldLabel icon={Flame}>Water heater</FieldLabel>
        <IconCardGroup
          columns={4}
          value={value.waterHeating}
          onChange={(v) => onChange(update(value, "waterHeating", v))}
          options={WATER_HEATING_OPTIONS}
        />
      </div>

      <div>
        <FieldLabel icon={Flame}>
          Showers / baths per week, per person
        </FieldLabel>
        <IconStepper
          icon={Flame}
          min={0}
          max={21}
          unit="per week, per person"
          value={value.showersBathsPerWeek}
          onChange={(v) => onChange(update(value, "showersBathsPerWeek", v))}
        />
      </div>

      <div>
        <FieldLabel>PV & storage setup</FieldLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ToggleCard
            icon={Sun}
            label="PV panels"
            sublabel="Solar electricity"
            checked={value.hasPvPanels}
            onChange={(v) => onChange(update(value, "hasPvPanels", v))}
          />
          <ToggleCard
            icon={BatteryCharging}
            label="Battery"
            sublabel="Stores solar power"
            checked={value.hasBattery}
            onChange={(v) => onChange(update(value, "hasBattery", v))}
          />
          <ToggleCard
            icon={Zap}
            label="Heat storage"
            sublabel="Buffer / thermal tank"
            checked={value.hasHeatStorage}
            onChange={(v) => onChange(update(value, "hasHeatStorage", v))}
          />
        </div>
      </div>

      <div>
        <FieldLabel icon={FileText}>Additional notes</FieldLabel>
        <TextAreaWithIcon
          icon={FileText}
          rows={3}
          placeholder="Anything else worth knowing about the household..."
          value={value.additionalNotes}
          onChange={(v) => onChange(update(value, "additionalNotes", v))}
        />
      </div>
    </Block>
  );
}
