import { useState } from "react";
import {
  Calendar,
  Clock,
  FileText,
  Flame,
  Gauge,
  Hand,
  ListChecks,
  Mail,
  Megaphone,
  Mountain,
  Newspaper,
  Package,
  Receipt,
  Scale,
  Settings,
  Snowflake,
  Tag,
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
  RadiatorKind,
  ReplacementPreference,
  WaterHeatingCase,
} from "./householdCases";

const PRESET_OPTIONS: IconCardOption<string>[] = HOUSEHOLD_CASE_PRESETS.map(
  (p) => ({
    value: p.id,
    label: p.name,
    sublabel: p.tagline,
    icon: User as LucideIcon,
  }),
);

const COAL_TYPE_OPTIONS: IconCardOption<CoalType>[] = [
  { value: "orzech", label: "Orzech", icon: Mountain },
  { value: "groszekMieszanka", label: "Groszek / Mieszanka", icon: Mountain },
  { value: "kostka", label: "Kostka", icon: Mountain },
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

const RADIATOR_OPTIONS: IconCardOption<RadiatorKind>[] = [
  { value: "standard", label: "Radiators", icon: Flame },
  { value: "floorHeating", label: "Floor heating", icon: Gauge },
  { value: "mixed", label: "Mixed", icon: Gauge },
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

const REPLACEMENT_OPTIONS: IconCardOption<ReplacementPreference>[] = [
  { value: "gas", label: "Gas", icon: Flame },
  { value: "pelletBoiler", label: "Pellet boiler", icon: Package },
  { value: "heatPump", label: "Heat pump", icon: Snowflake },
  { value: "pelletOrHeatPump", label: "Pellet or heat pump", icon: ListChecks },
  { value: "undecided", label: "Undecided", icon: Clock },
];

function update<K extends keyof HouseholdCaseInputs>(
  state: HouseholdCaseInputs,
  key: K,
  value: HouseholdCaseInputs[K],
): HouseholdCaseInputs {
  return { ...state, [key]: value };
}

export function HouseholdCaseStudy({
  value,
  onChange,
}: {
  value: HouseholdCaseInputs;
  onChange: (v: HouseholdCaseInputs) => void;
}) {
  const [selectedPresetId, setSelectedPresetId] = useState("");

  const loadPreset = (id: string) => {
    const preset = HOUSEHOLD_CASE_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setSelectedPresetId(id);
    onChange(preset.data);
  };

  return (
    <>
      <Block
        title="Your home"
        subtitle="Load a real interview case to quick-fill everything below, or fill it in by hand."
      >
        <div>
          <FieldLabel icon={Users}>Load a household case study</FieldLabel>
          <IconCardGroup
            columns={4}
            value={selectedPresetId}
            onChange={loadPreset}
            options={PRESET_OPTIONS}
          />
        </div>
      </Block>

      <Block title="Coal & boiler">
        <div>
          <FieldLabel icon={Mountain}>Type of coal</FieldLabel>
          <IconCardGroup
            columns={4}
            value={value.coalType}
            onChange={(v) => onChange(update(value, "coalType", v))}
            options={COAL_TYPE_OPTIONS}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel icon={Scale}>Tonnes per season</FieldLabel>
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel icon={Calendar}>Boiler year</FieldLabel>
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
      </Block>

      <Block title="Home & comfort">
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <div>
            <FieldLabel icon={Flame}>Showers / baths per week</FieldLabel>
            <IconStepper
              icon={Flame}
              min={0}
              max={21}
              unit="per week"
              value={value.showersBathsPerWeek}
              onChange={(v) =>
                onChange(update(value, "showersBathsPerWeek", v))
              }
            />
          </div>
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

      <Block title="Electricity & current heating">
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
              onChange={(v) =>
                onChange(update(value, "electricityBillNote", v))
              }
            />
          </div>
        </div>

        <div>
          <FieldLabel icon={Flame}>Water heating</FieldLabel>
          <IconCardGroup
            columns={4}
            value={value.waterHeating}
            onChange={(v) => onChange(update(value, "waterHeating", v))}
            options={WATER_HEATING_OPTIONS}
          />
        </div>

        <ToggleCard
          icon={Flame}
          label="Gas connection available"
          sublabel="A gas line already reaches the property"
          checked={value.gasConnectionAvailable}
          onChange={(v) => onChange(update(value, "gasConnectionAvailable", v))}
        />

        <div>
          <FieldLabel icon={ListChecks}>Replacement preference</FieldLabel>
          <IconCardGroup
            columns={3}
            value={value.replacementPreference}
            onChange={(v) =>
              onChange(update(value, "replacementPreference", v))
            }
            options={REPLACEMENT_OPTIONS}
          />
        </div>

        <div>
          <FieldLabel icon={Truck}>Coal provider</FieldLabel>
          <TextInputWithIcon
            icon={Truck}
            placeholder="e.g., PGG, private depot, local merchant..."
            value={value.coalProvider}
            onChange={(v) => onChange(update(value, "coalProvider", v))}
          />
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
    </>
  );
}

export default HouseholdCaseStudy;
