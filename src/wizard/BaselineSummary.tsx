import { useState } from "react";
import {
  Check,
  Droplets,
  Flame,
  Gauge,
  Pencil,
  Plug,
  RotateCcw,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import type {
  Baseline,
  BaselineAssumption,
  BaselineCostOverrides,
  EditableBaselineCostField,
} from "../engines/baseline";
import type { BoilerClass, InsulationLevel } from "./householdCases";
import { CollapsibleBreakdown, StepEyebrow, WhyNote } from "./FormPrimitives";
import { useT } from "../i18n";
import type { Dictionary } from "../i18n";
import { DEFAULT_CONDITION_KWH_PER_M2 } from "../data/sheet.constants";

/** Beyond this, the gap is worth naming rather than folded into "in line". */
const CONDITION_COMPARISON_THRESHOLD_PCT = 10;

const zl = (n: number) =>
  `${Math.round(n).toLocaleString("pl-PL").replace(/ /g, " ")} zł`;

const num = (n: number) =>
  Math.round(n).toLocaleString("pl-PL").replace(/ /g, " ");

/** Coal tonnage keeps a decimal (3.5 t), unlike the whole-number kWh figures. */
const tonnes = (n: number) =>
  n.toLocaleString("pl-PL", { maximumFractionDigits: 2 });

/** Electricity prices are sub-złoty per kWh, so `zl`'s whole-number rounding
 *  would flatten 0.70 and 1.00 to the same "1 zł". */
const plnPerKwh = (n: number) =>
  `${n
    .toLocaleString("pl-PL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    .replace(/\xa0/g, " ")} zł`;

/** A typed descriptor from baseline.ts, said in the language on screen. */
export function assumptionText(t: Dictionary, a: BaselineAssumption): string {
  switch (a.code) {
    case "coalGradeAssumed":
      return t.assumptions.coalGradeAssumed(a.fuel);
    case "boilerEfficiencyKnown":
      return t.assumptions.boilerEfficiencyKnown(
        t.options.boilerClassInline[a.boilerClass],
        a.efficiencyPct,
      );
    case "boilerEfficiencyUnknown":
      return t.assumptions.boilerEfficiencyUnknown(a.efficiencyPct);
    case "coalPriceAssumed":
      return t.assumptions.coalPriceAssumed(a.pricePerTonnePln);
    case "hotWaterPerShower":
      return t.assumptions.hotWaterPerShower(a.litres, a.heatedSharePct);
    case "summerElectricWater":
      return t.assumptions.summerElectricWater(a.sharePct);
    case "electricWaterHeaterEfficiency":
      return t.assumptions.electricWaterHeaterEfficiency(a.efficiencyPct);
    case "electricityUseModelled":
      return t.assumptions.electricityUseModelled(a.kwhPerYear);
    case "electricityPriceAssumedFlat":
      return t.assumptions.electricityPriceAssumedFlat(
        plnPerKwh(a.pricePerKwh),
      );
    case "electricityPriceAssumedDynamic":
      return t.assumptions.electricityPriceAssumedDynamic(
        plnPerKwh(a.pricePerKwh),
      );
  }
}

/**
 * The baseline block: what this household is paying today, on coal.
 *
 * Deliberately the first thing shown on the financials screen. Everything that
 * comes later (capex, subsidy, financing) is a change measured against this
 * number, so it has to be on screen and believable before any of it lands.
 *
 * The three lines below are editable: `baseline.cost` here is already the
 * household's own correction applied on top of the model (see
 * applyCostOverrides in engines/baseline.ts), and `overrides` is only read
 * to know which lines to mark "edited" and which show a reset control - the
 * displayed values themselves always come from `baseline`, never recomputed
 * here, so this component never disagrees with what capex/grants/financing
 * downstream are actually using.
 */
export function BaselineSummary({
  baseline,
  overrides,
  onOverrideChange,
  insulation,
  boilerClass,
  boilerYear,
}: {
  baseline: Baseline;
  overrides: BaselineCostOverrides;
  onOverrideChange: (
    field: EditableBaselineCostField,
    value: number | null,
  ) => void;
  /** For the "why these could be off" note: not part of the baseline model itself. */
  insulation: InsulationLevel;
  boilerClass: BoilerClass;
  boilerYear: number | "";
}) {
  const t = useT();
  const { cost, energy } = baseline;

  const [editingField, setEditingField] =
    useState<EditableBaselineCostField | null>(null);
  const [draft, setDraft] = useState("");

  const lines: {
    field: EditableBaselineCostField;
    icon: LucideIcon;
    label: string;
    sub: string;
    value: number;
  }[] = [
    {
      field: "spaceHeatingPlnPerYear",
      icon: Flame,
      label: t.baseline.spaceHeating,
      sub: t.baseline.spaceHeatingSub,
      value: cost.spaceHeatingPlnPerYear,
    },
    {
      field: "waterHeatingPlnPerYear",
      icon: Droplets,
      label: t.baseline.waterHeating,
      sub: t.baseline.waterHeatingSub,
      value: cost.waterHeatingPlnPerYear,
    },
    {
      field: "electricityAndCoolingPlnPerYear",
      icon: Plug,
      label: t.baseline.electricityAndCooling,
      sub: t.baseline.electricityAndCoolingSub,
      value: cost.electricityAndCoolingPlnPerYear,
    },
  ];

  const hasOverrides = Object.keys(overrides).length > 0;

  // "Why these could be off": the coal/boiler/insulation facts a household
  // can sanity-check against their own experience, not part of the baseline
  // model's own output.
  const boilerAgeYears =
    typeof boilerYear === "number"
      ? new Date().getFullYear() - boilerYear
      : null;
  const boilerAgeSuffix =
    boilerAgeYears !== null
      ? t.baseline.coalAccuracyBoilerAge(boilerYear as number, boilerAgeYears)
      : "";
  const insulationLabel = t.options.insulation[insulation].label;
  const insulationSentence =
    insulation === "none"
      ? t.baseline.coalAccuracyInsulationNone(insulationLabel)
      : insulation === "veryGood"
        ? t.baseline.coalAccuracyInsulationVeryGood(insulationLabel)
        : t.baseline.coalAccuracyInsulationStandard(insulationLabel);

  // Validation: is the coal-derived building condition figure plausible?
  // DEFAULT_CONDITION_KWH_PER_M2 is the sheet's own worked-example house, a
  // neutral reference sitting mid-band on the Czyste Powietrze scope gate
  // (80-140) - not this household's number, just something to sanity-check
  // it against.
  const conditionPctDiff =
    ((energy.spaceHeatPerM2 - DEFAULT_CONDITION_KWH_PER_M2) /
      DEFAULT_CONDITION_KWH_PER_M2) *
    100;
  const conditionComparison =
    conditionPctDiff > CONDITION_COMPARISON_THRESHOLD_PCT
      ? t.baseline.coalAccuracyComparisonHigh(Math.round(conditionPctDiff))
      : conditionPctDiff < -CONDITION_COMPARISON_THRESHOLD_PCT
        ? t.baseline.coalAccuracyComparisonLow(
            Math.round(Math.abs(conditionPctDiff)),
          )
        : t.baseline.coalAccuracyComparisonClose();
  const coalAccuracyIntro = t.baseline.coalAccuracyIntro(
    num(DEFAULT_CONDITION_KWH_PER_M2),
    energy.spaceHeatPerM2.toFixed(0),
    conditionComparison,
  );

  const startEdit = (
    field: EditableBaselineCostField,
    currentValue: number,
  ) => {
    setEditingField(field);
    setDraft(String(Math.round(currentValue)));
  };

  const cancelEdit = () => setEditingField(null);

  const commitEdit = () => {
    if (!editingField) return;
    const n = Number(draft);
    if (draft.trim() !== "" && Number.isFinite(n) && n >= 0) {
      onOverrideChange(editingField, Math.round(n));
    }
    setEditingField(null);
  };

  const resetField = (field: EditableBaselineCostField) => {
    if (editingField === field) setEditingField(null);
    onOverrideChange(field, null);
  };

  return (
    <section className="rounded-[20px] border border-line bg-white p-6 shadow-block">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent text-white">
        <Wallet className="h-5 w-5" aria-hidden />
      </div>
      <StepEyebrow>{t.roadmap.baseline}</StepEyebrow>
      <h2 className="text-[23px] font-bold tracking-tight text-ink">
        {t.baseline.title}
      </h2>
      <p className="mt-2 text-base text-ink-soft">{t.baseline.subtitle}</p>

      {/* The headline. A household thinks in months, so lead with the month. */}
      <div className="mt-6 rounded-[16px] border border-accent-tint2 bg-accent-tint p-5">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-accent-600">
          {t.baseline.totalOutflow}
        </p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[34px] font-bold leading-none tracking-tight text-accent-600">
            {zl(cost.totalPlnPerMonth)}
          </span>
          <span className="text-[15px] font-medium text-accent-600/80">
            {t.baseline.perMonth}
          </span>
        </div>
        <p className="mt-1.5 text-[14px] text-accent-600/80">
          {t.baseline.perYearTotal(zl(cost.totalPlnPerYear))}
        </p>
      </div>

      {hasOverrides && (
        <div className="mt-3 flex items-start justify-between gap-3 rounded-[12px] border border-line bg-[#fbfaf8] px-3.5 py-2.5">
          <p className="text-[12.5px] leading-snug text-ink-soft">
            {t.baseline.overriddenNote}
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingField(null);
              (Object.keys(overrides) as EditableBaselineCostField[]).forEach(
                (field) => onOverrideChange(field, null),
              );
            }}
            className="shrink-0 whitespace-nowrap text-[12.5px] font-semibold text-accent-600 underline decoration-accent-tint2 underline-offset-2 hover:decoration-accent-600"
          >
            {t.baseline.resetAll}
          </button>
        </div>
      )}

      {/* The same total, split by what it was spent on - each line editable,
          since this is the one section of the tool a household can judge on
          sight and may know is wrong for their own life. Tucked behind a
          disclosure so the headline number above stays the one thing a
          household sees without having to act. */}
      <CollapsibleBreakdown label={t.baseline.breakdownLabel} className="mt-5">
        <dl className="divide-y divide-line">
          {lines.map(({ field, icon: Icon, label, sub, value }) => {
            const isOverridden = overrides[field] !== undefined;
            const isEditing = editingField === field;
            return (
              <div
                key={field}
                className="flex items-center justify-between gap-4 py-3.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-chip text-ink-soft">
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[15px] font-semibold text-ink">
                      {label}
                    </dt>
                    <p className="text-[13px] text-ink-soft">
                      {sub}
                      {isOverridden && !isEditing && (
                        <span className="ml-1.5 font-medium text-accent-600">
                          · {t.baseline.editedTag}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="w-24 rounded-lg border border-accent/60 bg-white px-2 py-1.5 text-right text-[15px] font-bold text-ink outline-none ring-1 ring-accent/30"
                    />
                    <button
                      type="button"
                      onClick={commitEdit}
                      aria-label={t.baseline.saveEdit}
                      className="rounded-full p-1.5 text-savings-700 transition-colors hover:bg-savings-tint"
                    >
                      <Check className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      aria-label={t.baseline.cancelEdit}
                      className="rounded-full p-1.5 text-ink-soft transition-colors hover:bg-chip"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                ) : (
                  <dd className="flex shrink-0 items-center gap-0.5 text-right">
                    <div>
                      <span className="text-[16px] font-bold tabular-nums text-ink">
                        {zl(value)}
                      </span>
                      <span className="block text-[12px] text-ink-soft">
                        {t.baseline.perYear}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEdit(field, value)}
                      aria-label={t.baseline.editValue}
                      className="ml-1 rounded-full p-1.5 text-ink-soft/60 transition-colors hover:bg-chip hover:text-ink-soft"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    {isOverridden && (
                      <button
                        type="button"
                        onClick={() => resetField(field)}
                        aria-label={t.baseline.resetValue}
                        className="rounded-full p-1.5 text-ink-soft/60 transition-colors hover:bg-chip hover:text-ink-soft"
                      >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    )}
                  </dd>
                )}
              </div>
            );
          })}
        </dl>
      </CollapsibleBreakdown>

      {/* Highlighted rather than another plain dl row: these two numbers
          decide grant eligibility later (see WhyNote below), so they need
          to register now even to someone skimming. */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Fact
          icon={Flame}
          label={t.baseline.heatDelivered}
          value={t.baseline.kwhPerYear(num(energy.coalHeatDeliveredKwh))}
        />
        <Fact
          icon={Gauge}
          label={t.baseline.buildingCondition}
          value={t.baseline.kwhPerM2PerYear(energy.spaceHeatPerM2.toFixed(0))}
        />
      </div>

      <WhyNote summary={t.baseline.whyCoalAccuracySummary}>
        <p>{coalAccuracyIntro}</p>
        <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-4">
          <li>
            {t.baseline.coalAccuracyBoiler(
              energy.boilerEfficiencyPct,
              t.options.boilerClassInline[boilerClass],
              boilerAgeSuffix,
            )}
          </li>
          <li>
            {t.baseline.coalAccuracyCoal(
              tonnes(energy.coalTonnesPerSeason),
              num(energy.coalKwhPerTonne),
              energy.coalFuel.toLowerCase(),
              energy.boilerEfficiencyPct,
              num(energy.coalHeatDeliveredKwh),
            )}
          </li>
          <li>{insulationSentence}</li>
        </ul>
      </WhyNote>

      <WhyNote summary={t.baseline.whyConditionSummary}>
        {t.baseline.whyConditionBody}
      </WhyNote>

      {baseline.assumptions.length > 0 && (
        <details className="mt-5 rounded-[14px] border border-line bg-[#fbfaf8] p-4">
          <summary className="cursor-pointer text-[13px] font-semibold text-ink-soft">
            {t.baseline.assumptionsSummary(baseline.assumptions.length)}
          </summary>
          <p className="mt-3 text-[13px] text-ink-soft">
            {t.baseline.assumptionsIntro}
          </p>
          <ul className="mt-3 flex list-disc flex-col gap-2 pl-4 text-[13px] text-ink-soft">
            {baseline.assumptions.map((a) => (
              <li key={a.code}>{assumptionText(t, a)}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-accent-tint2 bg-accent-tint/40 px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white text-accent-600">
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-accent-600/70">
          {label}
        </dt>
        <dd className="text-[17px] font-bold leading-tight text-ink">
          {value}
        </dd>
      </div>
    </div>
  );
}
