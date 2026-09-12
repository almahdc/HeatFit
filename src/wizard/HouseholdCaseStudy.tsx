import { useState, useEffect } from "react";
import {
  Building,
  Calendar,
  Check,
  Clock,
  Columns3,
  DoorOpen,
  FileText,
  Flame,
  Gauge,
  Home,
  Layers,
  Leaf,
  ListChecks,
  Mountain,
  Network,
  Package,
  Receipt,
  Scale,
  Shield,
  Snowflake,
  Sun,
  Tag,
  TreePine,
  Truck,
  User,
  Users,
  Warehouse,
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
  WhyNote,
  type IconCardOption,
} from "./FormPrimitives";
import {
  BoilerClass,
  CoalType,
  computeHeatedAreaM2,
  ElectricityTariffCase,
  HOUSEHOLD_CASE_PRESETS,
  HouseholdCaseId,
  HouseholdCaseInputs,
  HouseKind,
  InsulationLevel,
  RadiatorKind,
  ReplacementPreference,
  UnheatedPortion,
  WaterHeatingCase,
  WindowFrame,
} from "./householdCases";
import { useT } from "../i18n";
import type { Dictionary } from "../i18n";

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

/**
 * Cards for one option group.
 *
 * The order and the icons live here, because they are layout; every word on
 * the card comes from the dictionary, keyed by the same union member the
 * data model uses. A new option is a compile error in every language file
 * until it is translated.
 */
function cards<T extends string>(
  group: Record<T, { label: string; sublabel?: string }>,
  icons: Record<T, LucideIcon>,
  order: T[],
): IconCardOption<T>[] {
  return order.map((value) => ({
    value,
    label: group[value].label,
    sublabel: group[value].sublabel,
    icon: icons[value],
  }));
}

const HOUSE_KIND_ICONS: Record<HouseKind, LucideIcon> = {
  detached: Home,
  semiDetached: Building,
};

const INSULATION_ICONS: Record<InsulationLevel, LucideIcon> = {
  none: Shield,
  standard: Shield,
  veryGood: Shield,
};

const WINDOW_ICONS: Record<WindowFrame, LucideIcon> = {
  woodenOld: Columns3,
  doublePanePvc: Columns3,
  triplePanePvc: Columns3,
};

const RADIATOR_ICONS: Record<RadiatorKind, LucideIcon> = {
  standard: Flame,
  floorHeating: Gauge,
  mixed: Gauge,
};

const UNHEATED_PORTION_ICONS: Record<UnheatedPortion, LucideIcon> = {
  wholeFloor: Layers,
  someRooms: DoorOpen,
  basementOrGarage: Warehouse,
};

const COAL_TYPE_ICONS: Record<CoalType, LucideIcon> = {
  orzech: Mountain,
  groszek: Mountain,
  kostka: Mountain,
  mul: Mountain,
  other: Mountain,
};

const BOILER_CLASS_ICONS: Record<BoilerClass, LucideIcon> = {
  bezklasowy: Gauge,
  class3: Gauge,
  class4: Gauge,
  class5: Gauge,
  // Distinct from the numbered classes on purpose: it is a different
  // standard, not a fifth rung on the same ladder.
  ecodesign: Leaf,
};

const REPLACEMENT_ICONS: Record<ReplacementPreference, LucideIcon> = {
  gas: Flame,
  pelletBoiler: Package,
  heatPump: Snowflake,
  pelletOrHeatPump: ListChecks,
  undecided: Clock,
};

const TARIFF_ICONS: Record<ElectricityTariffCase, LucideIcon> = {
  G11: Zap,
  G12: Zap,
};

const WATER_HEATING_ICONS: Record<WaterHeatingCase, LucideIcon> = {
  electricBoilerNew: Flame,
  electricSummerCoalWinter: Flame,
  coalCentralAllYear: Flame,
  electricNightTariff: Flame,
};

const houseKindOptions = (t: Dictionary) =>
  cards(t.options.houseKind, HOUSE_KIND_ICONS, ["detached", "semiDetached"]);

const insulationOptions = (t: Dictionary) =>
  cards(t.options.insulation, INSULATION_ICONS, [
    "none",
    "standard",
    "veryGood",
  ]);

const windowOptions = (t: Dictionary) =>
  cards(t.options.windowFrame, WINDOW_ICONS, [
    "woodenOld",
    "doublePanePvc",
    "triplePanePvc",
  ]);

const radiatorOptions = (t: Dictionary) =>
  cards(t.options.radiatorType, RADIATOR_ICONS, [
    "standard",
    "floorHeating",
    "mixed",
  ]);

const unheatedPortionOptions = (t: Dictionary) =>
  cards(t.options.unheatedPortion, UNHEATED_PORTION_ICONS, [
    "wholeFloor",
    "someRooms",
    "basementOrGarage",
  ]);

const coalTypeOptions = (t: Dictionary) =>
  cards(t.options.coalType, COAL_TYPE_ICONS, [
    "orzech",
    "groszek",
    "kostka",
    "mul",
    "other",
  ]);

const boilerClassOptions = (t: Dictionary) =>
  // "ecodesign" removed from the UI for now: kept in BoilerClass and its
  // downstream engines (regulatoryDeadlines.ts's ecodesignCaveat included),
  // just not offered as a choice here.
  cards(t.options.boilerClass, BOILER_CLASS_ICONS, [
    "bezklasowy",
    "class3",
    "class4",
    "class5",
  ]);

const replacementOptions = (t: Dictionary) =>
  cards(t.options.replacementPreference, REPLACEMENT_ICONS, [
    "gas",
    "pelletBoiler",
    "heatPump",
    "pelletOrHeatPump",
    "undecided",
  ]);

const tariffOptions = (t: Dictionary) =>
  cards(t.options.electricityTariff, TARIFF_ICONS, ["G11", "G12"]);

const waterHeatingOptions = (t: Dictionary) =>
  cards(t.options.waterHeating, WATER_HEATING_ICONS, [
    "electricBoilerNew",
    "electricSummerCoalWinter",
    "coalCentralAllYear",
    "electricNightTariff",
  ]);

/** The 4 persona buttons that quick-fill the whole household case. */
export function PersonaPicker({ value, onChange }: Props) {
  const t = useT();
  const [selectedPresetId, setSelectedPresetId] =
    useState<HouseholdCaseId>("warmthGuardian");

  // The free-text fields (radiatorNote and so on) are display
  // prose, not data, so they live in the dictionary rather than on the preset
  // itself: merging them in here is what makes a loaded persona read in
  // whichever language is active. Loading again later (or switching language
  // and reloading the same persona) always reapplies this language's text; it
  // is only the fields the household has since typed over that this leaves
  // alone, because loading does not run again on its own.
  const loadPreset = (id: HouseholdCaseId) => {
    const preset = HOUSEHOLD_CASE_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setSelectedPresetId(id);
    onChange({ ...preset.data, ...t.personas.cases[id].seed });
  };

  useEffect(() => {
    const defaultPreset = HOUSEHOLD_CASE_PRESETS.find(
      (p) => p.id === "warmthGuardian",
    );
    if (defaultPreset) {
      onChange({
        ...defaultPreset.data,
        // Answered back on the welcome & location step, before this one ever
        // mounts: a persona default here would silently overwrite whatever
        // the household just told us about their city's deadline.
        cityDeadlineNotice: value.cityDeadlineNotice,
        ...t.personas.cases.warmthGuardian.seed,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Load the default persona on mount, in whichever language is active then.

  return (
    <Block title={t.personas.title} subtitle={t.personas.subtitle}>
      <div>
        <FieldLabel icon={Users}>{t.personas.fieldLabel}</FieldLabel>
        <div
          className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4"
          role="radiogroup"
        >
          {HOUSEHOLD_CASE_PRESETS.map((preset) => {
            const selected = selectedPresetId === preset.id;
            const persona = t.personas.cases[preset.id];
            return (
              <button
                key={preset.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => loadPreset(preset.id)}
                className={`relative flex flex-col items-start gap-1.5 rounded-[14px] border bg-white p-3.5 text-left transition-all duration-150 active:scale-[0.97] ${
                  selected
                    ? "border-accent/60 bg-accent-tint shadow-card-selected"
                    : "border-line shadow-card hover:border-ink-soft/30"
                }`}
              >
                {selected && (
                  <span className="absolute right-2.5 top-2.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-accent">
                    <Check
                      className="h-[11px] w-[11px] text-white"
                      strokeWidth={3}
                      aria-hidden
                    />
                  </span>
                )}
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${
                    selected ? "bg-accent text-white" : "bg-chip text-ink-soft"
                  }`}
                >
                  <User className="h-[18px] w-[18px]" aria-hidden />
                </div>
                <p className="text-[15px] font-semibold text-ink">
                  {persona.name}
                </p>
                <p className="text-[13px] text-ink-soft/80">
                  {persona.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </Block>
  );
}

/** Step 2, Block 2: house type, insulation, windows, area, radiators, AC. */
export function HomeComfortSection({ value, onChange }: Props) {
  const t = useT();
  return (
    <Block title={t.home.title}>
      <div>
        <FieldLabel icon={Home}>{t.home.houseKind}</FieldLabel>
        <IconCardGroup
          columns={3}
          value={value.houseKind}
          onChange={(v) => onChange(update(value, "houseKind", v))}
          options={houseKindOptions(t)}
        />
      </div>

      <div>
        <FieldLabel icon={Shield}>{t.home.insulation}</FieldLabel>
        <IconCardGroup
          columns={3}
          value={value.insulation}
          onChange={(v) => onChange(update(value, "insulation", v))}
          options={insulationOptions(t)}
        />
        <WhyNote summary={t.home.insulationWhySummary}>
          {t.home.insulationWhyBody}
        </WhyNote>
      </div>

      <div>
        <FieldLabel icon={Columns3}>{t.home.windowFrame}</FieldLabel>
        <IconCardGroup
          columns={3}
          value={value.windowFrame}
          onChange={(v) => onChange(update(value, "windowFrame", v))}
          options={windowOptions(t)}
        />
      </div>

      <div>
        <FieldLabel>{t.home.totalArea}</FieldLabel>
        <IconSlider
          icon={Scale}
          min={50}
          max={300}
          step={5}
          unit={t.home.totalAreaUnit}
          value={value.totalAreaM2}
          onChange={(v) => {
            const heatedAreaM2 = computeHeatedAreaM2(
              v,
              value.wholeHouseHeated,
              value.unheatedPortion,
            );
            onChange({ ...value, totalAreaM2: v, heatedAreaM2 });
          }}
        />
      </div>

      <ToggleCard
        icon={Home}
        label={t.home.wholeHouseHeatedLabel}
        sublabel={t.home.wholeHouseHeatedSublabel}
        checked={value.wholeHouseHeated}
        onChange={(checked) => {
          // Toggling off always lands on "one whole floor": a concrete,
          // recalculated estimate beats leaving the household staring at
          // an unchanged number until they pick an option themselves.
          const unheatedPortion: UnheatedPortion | null = checked
            ? null
            : "wholeFloor";
          const heatedAreaM2 = computeHeatedAreaM2(
            value.totalAreaM2,
            checked,
            unheatedPortion,
          );
          onChange({
            ...value,
            wholeHouseHeated: checked,
            unheatedPortion,
            heatedAreaM2,
          });
        }}
      />

      {!value.wholeHouseHeated && (
        <div>
          <FieldLabel icon={Layers}>{t.home.unheatedPortion}</FieldLabel>
          <IconCardGroup
            columns={3}
            value={value.unheatedPortion ?? "wholeFloor"}
            onChange={(v) => {
              const heatedAreaM2 = computeHeatedAreaM2(
                value.totalAreaM2,
                false,
                v,
              );
              onChange({ ...value, unheatedPortion: v, heatedAreaM2 });
            }}
            options={unheatedPortionOptions(t)}
          />
        </div>
      )}

      <div>
        <FieldLabel icon={Scale}>
          {value.wholeHouseHeated
            ? t.home.heatedArea
            : t.home.estimatedHeatedArea}
        </FieldLabel>
        {value.wholeHouseHeated ? (
          <p className="rounded-[14px] border border-line bg-[#fbfaf8] px-4 py-3 text-[15px] font-semibold text-ink">
            {t.home.heatedAreaValue(value.heatedAreaM2)}
          </p>
        ) : (
          <>
            <TextInputWithIcon
              icon={Scale}
              inputMode="numeric"
              suffix={t.home.totalAreaUnit}
              value={String(value.heatedAreaM2)}
              onChange={(v) =>
                onChange(
                  update(
                    value,
                    "heatedAreaM2",
                    v === "" ? 0 : Number(v.replace(/[^0-9]/g, "")),
                  ),
                )
              }
            />
            <p className="mt-1.5 text-[12.5px] text-ink-soft">
              {t.home.estimatedHeatedAreaEditableNote}
            </p>
          </>
        )}
      </div>

      <div>
        <FieldLabel icon={Flame}>{t.home.radiatorType}</FieldLabel>
        <IconCardGroup
          columns={3}
          value={value.radiatorType}
          onChange={(v) => onChange(update(value, "radiatorType", v))}
          options={radiatorOptions(t)}
        />
      </div>

      <div>
        <FieldLabel icon={FileText}>{t.home.radiatorNote}</FieldLabel>
        <TextInputWithIcon
          icon={FileText}
          placeholder={t.home.radiatorNotePlaceholder}
          value={value.radiatorNote}
          onChange={(v) => onChange(update(value, "radiatorNote", v))}
        />
      </div>

      <div>
        <FieldLabel icon={Users}>{t.home.occupants}</FieldLabel>
        <IconStepper
          icon={Users}
          min={1}
          max={10}
          unit={t.home.occupantsUnit}
          value={value.occupants}
          onChange={(v) => onChange(update(value, "occupants", v))}
        />
      </div>

      <ToggleCard
        icon={Snowflake}
        label={t.home.acLabel}
        sublabel={t.home.acSublabel}
        checked={value.acAvailable}
        onChange={(v) => onChange(update(value, "acAvailable", v))}
      />
    </Block>
  );
}

/** Step 3: coal, boiler, replacement preference, coal provider. */
export function CurrentHeatingSection({ value, onChange }: Props) {
  const t = useT();
  return (
    <Block title={t.heating.title} subtitle={t.heating.subtitle}>
      <div>
        <FieldLabel icon={Mountain}>{t.heating.coalType}</FieldLabel>
        <IconCardGroup
          columns={4}
          value={value.coalType}
          onChange={(v) => onChange(update(value, "coalType", v))}
          options={coalTypeOptions(t)}
        />
      </div>

      <ToggleCard
        icon={TreePine}
        label={t.heating.usesWoodLabel}
        sublabel={t.heating.usesWoodSublabel}
        checked={value.usesWoodToo}
        onChange={(v) => onChange(update(value, "usesWoodToo", v))}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <FieldLabel icon={Scale}>{t.heating.tonnesPerSeason}</FieldLabel>
          <TextInputWithIcon
            icon={Scale}
            inputMode="decimal"
            placeholder={t.heating.tonnesPerSeasonPlaceholder}
            suffix={t.heating.tonnesPerSeasonSuffix}
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
          <FieldLabel icon={Tag}>{t.heating.pricePerTonne}</FieldLabel>
          <TextInputWithIcon
            icon={Tag}
            inputMode="decimal"
            placeholder={t.heating.pricePerTonnePlaceholder}
            suffix={t.heating.pricePerTonneSuffix}
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
        <FieldLabel icon={FileText}>{t.heating.priceNote}</FieldLabel>
        <TextInputWithIcon
          icon={FileText}
          placeholder={t.heating.priceNotePlaceholder}
          value={value.coalPriceNote}
          onChange={(v) => onChange(update(value, "coalPriceNote", v))}
        />
      </div>

      <ToggleCard
        icon={Truck}
        label={t.heating.freeCoalLabel}
        sublabel={t.heating.freeCoalSublabel}
        checked={value.freeCoalReceived}
        onChange={(v) => onChange(update(value, "freeCoalReceived", v))}
      />

      {value.freeCoalReceived && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel icon={Scale}>{t.heating.freeCoalAmount}</FieldLabel>
            <TextInputWithIcon
              icon={Scale}
              inputMode="decimal"
              placeholder={t.heating.freeCoalAmountPlaceholder}
              suffix={t.heating.freeCoalAmountSuffix}
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
            <FieldLabel icon={FileText}>{t.heating.freeCoalNote}</FieldLabel>
            <TextInputWithIcon
              icon={FileText}
              placeholder={t.heating.freeCoalNotePlaceholder}
              value={value.freeCoalNote}
              onChange={(v) => onChange(update(value, "freeCoalNote", v))}
            />
          </div>
        </div>
      )}

      <div>
        <FieldLabel icon={Calendar}>
          {t.heating.boilerYear} <span className="text-accent">*</span>
        </FieldLabel>
        <TextInputWithIcon
          icon={Calendar}
          inputMode="numeric"
          placeholder={t.heating.boilerYearPlaceholder}
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
        <FieldLabel icon={Gauge}>{t.heating.boilerClass}</FieldLabel>
        <IconCardGroup
          columns={5}
          value={value.boilerClass}
          onChange={(v) => onChange(update(value, "boilerClass", v))}
          options={boilerClassOptions(t)}
        />
      </div>

      <ToggleCard
        icon={Flame}
        label={t.heating.gasLabel}
        sublabel={t.heating.gasSublabel}
        checked={value.gasConnectionAvailable}
        onChange={(v) => onChange(update(value, "gasConnectionAvailable", v))}
      />

      <ToggleCard
        icon={Network}
        label={t.heating.districtHeatingLabel}
        sublabel={t.heating.districtHeatingSublabel}
        checked={value.districtHeatingAvailable}
        onChange={(v) => onChange(update(value, "districtHeatingAvailable", v))}
      />

      <div>
        <FieldLabel icon={ListChecks}>
          {t.heating.replacementPreference}
        </FieldLabel>
        <IconCardGroup
          columns={3}
          value={value.replacementPreference}
          onChange={(v) => onChange(update(value, "replacementPreference", v))}
          options={replacementOptions(t)}
        />
      </div>
    </Block>
  );
}

/** Step 4: electricity, water heating, PV/battery/storage, notes. */
export function ElectricityWaterSection({ value, onChange }: Props) {
  const t = useT();
  return (
    <Block title={t.electricity.title} subtitle={t.electricity.subtitle}>
      <div>
        <FieldLabel icon={Zap}>{t.electricity.tariff}</FieldLabel>
        <IconCardGroup
          value={value.electricityTariff}
          onChange={(v) => onChange(update(value, "electricityTariff", v))}
          options={tariffOptions(t)}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <FieldLabel icon={Receipt}>{t.electricity.bill}</FieldLabel>
          <TextInputWithIcon
            icon={Receipt}
            inputMode="decimal"
            placeholder={t.electricity.billPlaceholder}
            suffix={t.electricity.billSuffix}
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
          <FieldLabel icon={FileText}>{t.electricity.billNote}</FieldLabel>
          <TextInputWithIcon
            icon={FileText}
            placeholder={t.electricity.billNotePlaceholder}
            value={value.electricityBillNote}
            onChange={(v) => onChange(update(value, "electricityBillNote", v))}
          />
        </div>
      </div>

      <div>
        <FieldLabel icon={Flame}>{t.electricity.waterHeater}</FieldLabel>
        <IconCardGroup
          columns={4}
          value={value.waterHeating}
          onChange={(v) => onChange(update(value, "waterHeating", v))}
          options={waterHeatingOptions(t)}
        />
      </div>

      <div>
        <FieldLabel icon={Flame}>{t.electricity.showers}</FieldLabel>
        <IconStepper
          icon={Flame}
          min={0}
          max={21}
          unit={t.electricity.showersUnit}
          value={value.showersBathsPerWeek}
          onChange={(v) => onChange(update(value, "showersBathsPerWeek", v))}
        />
      </div>

      <div>
        <FieldLabel>{t.electricity.pvSetup}</FieldLabel>
        {/*
          Battery and heat storage are collected on HouseholdCaseInputs and
          still shown on the financials summary once set, but hidden here for
          now: coming back to this UI later. Do not delete hasBattery /
          hasHeatStorage from the data model for this.
        */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ToggleCard
            icon={Sun}
            label={t.electricity.pvLabel}
            sublabel={t.electricity.pvSublabel}
            checked={value.hasPvPanels}
            onChange={(v) => onChange(update(value, "hasPvPanels", v))}
          />
        </div>
      </div>

      <div>
        <FieldLabel icon={FileText}>{t.electricity.additionalNotes}</FieldLabel>
        <TextAreaWithIcon
          icon={FileText}
          rows={3}
          placeholder={t.electricity.additionalNotesPlaceholder}
          value={value.additionalNotes}
          onChange={(v) => onChange(update(value, "additionalNotes", v))}
        />
      </div>
    </Block>
  );
}
