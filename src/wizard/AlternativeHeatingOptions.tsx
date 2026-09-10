import { useState } from "react";
import {
  Droplets,
  ExternalLink,
  HardHat,
  Package,
  Plug,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Waves,
  Wind,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Block, FieldLabel, IconCardGroup } from "./FormPrimitives";
import {
  ALTERNATIVE_HEATING_OPTIONS,
  calculateAlternativeHeatingCost,
  type AlternativeHeatingId,
} from "../engines/alternativeHeating";
import { calculateCapexBreakdown, ZUM_DATABASE_URL } from "../engines/capex";
import type { Baseline } from "../engines/baseline";
import type { ElectricityTariffCase } from "./householdCases";

const zl = (n: number) =>
  `${Math.round(n).toLocaleString("pl-PL").replace(/\xa0/g, " ")} zł`;

const zlRange = (low: number, high: number) => `${zl(low)}–${zl(high)}`;

const OPTION_ICON: Record<AlternativeHeatingId, LucideIcon> = {
  airToAirHp: Wind,
  airToWaterHp: Waves,
  pellet: Package,
};

/** Short enough for a picker card, unlike the full efficiencyLabel sentence. */
const OPTION_SHORT_LABEL: Record<AlternativeHeatingId, string> = {
  airToAirHp: "About 4x on electricity",
  airToWaterHp: "About 3x on electricity",
  pellet: "85% efficient",
};

const FUEL_UNIT_LABEL: Record<"kWh" | "t", string> = {
  kWh: "kWh of electricity",
  t: "tonnes of pellets",
};

/**
 * Block 2 (running cost) and Block 3 (savings vs coal) for one replacement
 * option at a time. Deliberately one at a time: three running-cost estimates
 * on screen together read as a menu to compare against each other, when the
 * only comparison meant to be trustworthy right now is each option against
 * the baseline. Picking one and reading its own story stays legible; showing
 * all three does not, especially before PV, capex and financing are layered
 * on and can change the ranking.
 */
export function AlternativeHeatingOptions({
  baseline,
  electricityTariff,
}: {
  baseline: Baseline;
  electricityTariff: ElectricityTariffCase;
}) {
  const [selected, setSelected] = useState<AlternativeHeatingId>("airToAirHp");

  const cardOptions = ALTERNATIVE_HEATING_OPTIONS.map((option) => ({
    value: option.id,
    label: option.name,
    sublabel: OPTION_SHORT_LABEL[option.id],
    icon: OPTION_ICON[option.id],
  }));

  const result = calculateAlternativeHeatingCost(
    selected,
    baseline,
    electricityTariff,
  );
  const capex = calculateCapexBreakdown(selected);
  const Icon = OPTION_ICON[selected];
  const saving = result.savingsPlnPerYear >= 0;

  return (
    <>
      <Block
        title="Compare a replacement"
        subtitle="Pick one option to see its running cost on today's numbers. Solar, financing, and grants come later — this is energy cost alone."
      >
        <div>
          <FieldLabel>Replacement option</FieldLabel>
          <IconCardGroup
            columns={3}
            value={selected}
            onChange={setSelected}
            options={cardOptions}
          />
        </div>

        <p className="text-[14.5px] text-ink-soft">{result.description}</p>

        {/* Block 2: running cost on the household's own numbers. */}
        <div className="rounded-[16px] border border-line bg-[#fbfaf8] p-5">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-soft">
            {result.name}: new yearly outflow
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[28px] font-bold leading-none tracking-tight text-ink">
              {zl(result.totalPlnPerMonth)}
            </span>
            <span className="text-[15px] font-medium text-ink-soft">
              per month
            </span>
          </div>
          <p className="mt-1.5 text-[13.5px] text-ink-soft">
            {zl(result.totalPlnPerYear)} per year · {result.efficiencyLabel}
          </p>
        </div>

        <dl className="divide-y divide-line border-y border-line">
          <Line
            icon={Icon}
            label="Space heating"
            sub={`${result.fuelPerYear < 10 ? result.fuelPerYear.toFixed(1) : Math.round(result.fuelPerYear).toLocaleString("pl-PL").replace(/\xa0/g, " ")} ${FUEL_UNIT_LABEL[result.fuelUnit]} a year`}
            value={result.spaceHeatingPlnPerYear}
          />
          <Line
            icon={Droplets}
            label="Water heating"
            sub="Unchanged from today"
            value={result.waterHeatingPlnPerYear}
          />
          <Line
            icon={Plug}
            label="Electricity & cooling"
            sub="Unchanged from today"
            value={result.electricityAndCoolingPlnPerYear}
          />
        </dl>
      </Block>

      {/* Block 3: the plain delta against the baseline. */}
      <Block
        title="Savings vs. coal"
        subtitle={`${result.name} compared directly against what you are paying now.`}
      >
        <div
          className={`flex items-start gap-4 rounded-[16px] border p-5 ${
            saving
              ? "border-accent-tint2 bg-accent-tint"
              : "border-line bg-[#fbfaf8]"
          }`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${
              saving ? "bg-accent text-white" : "bg-chip text-ink-soft"
            }`}
          >
            {saving ? (
              <TrendingDown className="h-5 w-5" aria-hidden />
            ) : (
              <TrendingUp className="h-5 w-5" aria-hidden />
            )}
          </div>
          <div>
            <p
              className={`text-[22px] font-bold leading-tight tracking-tight ${
                saving ? "text-accent-600" : "text-ink"
              }`}
            >
              {saving ? "Saves" : "Costs"}{" "}
              {zl(Math.abs(result.savingsPlnPerMonth))}/month
              {!saving && " more"}
            </p>
            <p
              className={`mt-1 text-[14px] ${saving ? "text-accent-600/80" : "text-ink-soft"}`}
            >
              {saving ? "Saves" : "Costs"}{" "}
              {zl(Math.abs(result.savingsPlnPerYear))} a year
              {!saving && " more"}, compared against{" "}
              {zl(baseline.cost.totalPlnPerYear)}/year on coal today.
            </p>
          </div>
        </div>

        {!saving && (
          <p className="text-[13px] text-ink-soft">
            Energy cost alone is only part of the picture. Coal has no
            installation cost left to pay off; a replacement's upfront price,
            any grant toward it, and financing can still change which option
            makes sense once those are added.
          </p>
        )}
      </Block>

      {/* Block 4: equipment cost — the sticker price, before any grant or loan. */}
      <Block
        title="What it costs to install"
        subtitle={`Hardware and installation for ${result.name.toLowerCase()}. Grants and loan repayment are the next step — this is the price before either.`}
      >
        <dl className="divide-y divide-line border-y border-line">
          <Line
            icon={Wrench}
            label="Hardware"
            sub={`Typically ${zlRange(capex.hardware.lowPln, capex.hardware.highPln)}`}
            value={capex.hardware.midPln}
            unit="equipment"
          />
          <Line
            icon={HardHat}
            label="Installation"
            sub={`Typically ${zlRange(capex.installation.lowPln, capex.installation.highPln)}`}
            value={capex.installation.midPln}
            unit="labour"
          />
        </dl>

        <div className="rounded-[16px] border border-line bg-[#fbfaf8] p-5">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-soft">
            Total gross capex
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[28px] font-bold leading-none tracking-tight text-ink">
              {zl(capex.totalGross.midPln)}
            </span>
            <span className="text-[15px] font-medium text-ink-soft">
              turnkey, incl. VAT
            </span>
          </div>
          <p className="mt-1.5 text-[13.5px] text-ink-soft">
            Typically{" "}
            {zlRange(capex.totalGross.lowPln, capex.totalGross.highPln)} —
            installer quotes vary this much by sizing, radiators, and region.
          </p>
        </div>

        <div className="flex gap-3 rounded-[14px] border border-accent-tint2 bg-accent-tint p-4 text-sm text-accent-600">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p>
              Note: Selected heat pumps and pellet boilers must be listed on the
              official ZUM database to qualify for Czyste Powietrze subsidies.
            </p>
            <a
              href={ZUM_DATABASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-accent-600 underline decoration-accent-tint2 underline-offset-2 hover:decoration-accent-600"
            >
              Check the official Lista ZUM
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        </div>
      </Block>
    </>
  );
}

function Line({
  icon: Icon,
  label,
  sub,
  value,
  unit = "per year",
}: {
  icon: LucideIcon;
  label: string;
  sub: string;
  value: number;
  unit?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-chip text-ink-soft">
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </span>
        <div className="min-w-0">
          <dt className="text-[15px] font-semibold text-ink">{label}</dt>
          <p className="text-[13px] text-ink-soft">{sub}</p>
        </div>
      </div>
      <dd className="shrink-0 text-right">
        <span className="text-[16px] font-bold tabular-nums text-ink">
          {zl(value)}
        </span>
        <span className="block text-[12px] text-ink-soft">{unit}</span>
      </dd>
    </div>
  );
}
