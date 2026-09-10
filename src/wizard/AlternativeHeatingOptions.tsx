import { useState } from "react";
import {
  Banknote,
  CalendarDays,
  Coins,
  Droplets,
  ExternalLink,
  Gift,
  HandCoins,
  HardHat,
  Package,
  Plug,
  Receipt,
  ShieldCheck,
  Sun,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Wallet,
  Waves,
  Wind,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Block, FieldLabel, IconCardGroup, ToggleCard } from "./FormPrimitives";
import {
  ALTERNATIVE_HEATING_OPTIONS,
  calculateAlternativeHeatingCost,
  type AlternativeHeatingId,
} from "../engines/alternativeHeating";
import {
  calculateCapexBreakdown,
  calculateSolarAddOn,
  ZUM_DATABASE_URL,
} from "../engines/capex";
import {
  calculateGrant,
  INCOME_TIER_LABEL,
  type IncomeTier,
} from "../engines/grants";
import {
  calculateLoan,
  trueMonthlyCost,
  LOAN_OPTIONS,
  DEFAULT_LOAN_TERMS,
} from "../engines/loan";
import * as S from "../data/sheet.constants";
import type { Baseline } from "../engines/baseline";
import type { ElectricityTariffCase } from "./householdCases";

// useGrouping because pl-PL otherwise leaves four-digit numbers
// ungrouped, which put "9600 zł" next to "33 000 zł" in the same grant block.
const zl = (n: number) =>
  `${Math.round(n)
    .toLocaleString("pl-PL", { useGrouping: true })
    .replace(/\xa0/g, " ")} zł`;

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

const TIER_ICON: Record<IncomeTier, LucideIcon> = {
  basic: Banknote,
  increased: Coins,
  highest: HandCoins,
};

/**
 * The sheet's own income thresholds, said in the household's terms. Increased
 * and highest are per-person figures; basic is a ceiling on the whole
 * household, which is why it reads differently from the other two.
 */
const TIER_SUBLABEL: Record<IncomeTier, string> = {
  basic: `Up to ${zl(S.SHEET_INCOME_TIERS.basicMaxHouseholdPlnPerMonth)}/month for the household`,
  increased: `Up to ${zl(S.SHEET_INCOME_TIERS.increasedMaxPerPersonPlnPerMonth.multi)}/month each (${zl(S.SHEET_INCOME_TIERS.increasedMaxPerPersonPlnPerMonth.single)} living alone)`,
  highest: `Up to ${zl(S.SHEET_INCOME_TIERS.highestMaxPerPersonPlnPerMonth.multi)}/month each (${zl(S.SHEET_INCOME_TIERS.highestMaxPerPersonPlnPerMonth.single)} living alone)`,
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
  hasPvPanels,
}: {
  baseline: Baseline;
  electricityTariff: ElectricityTariffCase;
  /**
   * Read straight from the household's own data (Step 4's PV toggle).
   *
   * True means solar is already part of today's setup — it is already
   * netted into every number below silently, and there is nothing left to
   * decide about it here, so nothing about it is called out on screen.
   * False means the household could add it alongside this replacement — that
   * is a real, unmade decision, so Block 4 offers it as a distinct add-on.
   */
  hasPvPanels: boolean;
}) {
  const [selected, setSelected] = useState<AlternativeHeatingId>("airToAirHp");
  // Only offered, and only meaningful, when the household has no PV yet —
  // see the toggle itself below. Persists across switching between options,
  // since "would you add solar" is a question about the project, not about
  // any one option.
  const [addSolar, setAddSolar] = useState(false);
  // Never collected by the wizard, and deliberately not asked for as a złoty
  // figure — the household picks the band their income falls in. Basic is the
  // default because it is the least generous, so nothing is ever overstated by
  // a household that has not touched this.
  const [tier, setTier] = useState<IncomeTier>("basic");
  const [loanYears, setLoanYears] = useState<string>(
    String(DEFAULT_LOAN_TERMS.years),
  );

  const cardOptions = ALTERNATIVE_HEATING_OPTIONS.map((option) => ({
    value: option.id,
    label: option.name,
    sublabel: OPTION_SHORT_LABEL[option.id],
    icon: OPTION_ICON[option.id],
  }));

  // True PV already existing counts on its own; toggling the add-on counts
  // the same way running-cost-wise — a panel is a panel, whichever screen it
  // was decided on. Every number below reacts to this one value.
  const effectiveHasPv = hasPvPanels || addSolar;

  const result = calculateAlternativeHeatingCost(
    selected,
    baseline,
    electricityTariff,
    undefined,
    effectiveHasPv,
  );
  const heatingCapex = calculateCapexBreakdown(selected);
  const solarAddOn = calculateSolarAddOn();
  const capexTotal = addSolar
    ? {
        lowPln: heatingCapex.totalGross.lowPln + solarAddOn.capexPln,
        midPln: heatingCapex.totalGross.midPln + solarAddOn.capexPln,
        highPln: heatingCapex.totalGross.highPln + solarAddOn.capexPln,
      }
    : heatingCapex.totalGross;
  const Icon = OPTION_ICON[selected];
  const saving = result.savingsPlnPerYear >= 0;

  // The grant is claimed against the gross figure Block 4 is showing, so
  // "gross minus grant is net" holds for a household reading down the page.
  const grant = calculateGrant({
    optionId: selected,
    heatingCapexPln: heatingCapex.totalGross.midPln,
    solarCapexPln: addSolar ? solarAddOn.capexPln : 0,
    tier,
    spaceHeatPerM2: baseline.energy.spaceHeatPerM2,
  });
  const terms =
    LOAN_OPTIONS.find((o) => String(o.years) === loanYears) ??
    DEFAULT_LOAN_TERMS;
  const loan = calculateLoan({
    grossCapexPln: capexTotal.midPln,
    grantPln: grant.totalGrantPln,
    terms,
  });
  const trueCost = trueMonthlyCost(result.totalPlnPerMonth, loan);
  const baselineMonthly = baseline.cost.totalPlnPerYear / 12;
  const trueSaving = baselineMonthly - trueCost.truePlnPerMonth;

  return (
    <>
      <Block
        title="Compare a replacement"
        subtitle="Pick one option to see its running cost on today's numbers. Solar, grants and financing come further down — this is energy cost alone."
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

        {/*
          Only offered when the household has no PV yet — a household that
          already has it has nothing to toggle. Everything below reacts live:
          this is a real input into the numbers, not a separate preview.
        */}
        {!hasPvPanels && (
          <ToggleCard
            icon={Sun}
            label="Add solar to this project"
            sublabel={`+${zl(solarAddOn.capexPln)} for a ${solarAddOn.productionKwhPerYear.toLocaleString("pl-PL").replace(/\xa0/g, " ")} kWh/year array`}
            checked={addSolar}
            onChange={setAddSolar}
          />
        )}

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
        subtitle={`${result.name}${addSolar ? " with solar" : ""} compared directly against what you are paying now.`}
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
        subtitle={`Hardware and installation for ${result.name.toLowerCase()}${addSolar ? ", plus solar" : ""}. This is the price before any grant or loan — both come next.`}
      >
        <dl className="divide-y divide-line border-y border-line">
          <Line
            icon={Wrench}
            label="Hardware"
            sub={`Typically ${zlRange(heatingCapex.hardware.lowPln, heatingCapex.hardware.highPln)}`}
            value={heatingCapex.hardware.midPln}
            unit="equipment"
          />
          <Line
            icon={HardHat}
            label="Installation"
            sub={`Typically ${zlRange(heatingCapex.installation.lowPln, heatingCapex.installation.highPln)}`}
            value={heatingCapex.installation.midPln}
            unit="labour"
          />
          {addSolar && (
            <Line
              icon={Sun}
              label="Solar panels (PV)"
              sub={`New, ${solarAddOn.productionKwhPerYear.toLocaleString("pl-PL").replace(/\xa0/g, " ")} kWh/year array`}
              value={solarAddOn.capexPln}
              unit="added"
            />
          )}
        </dl>

        <div className="rounded-[16px] border border-line bg-[#fbfaf8] p-5">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-soft">
            Total gross capex{addSolar && " (incl. solar)"}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[28px] font-bold leading-none tracking-tight text-ink">
              {zl(capexTotal.midPln)}
            </span>
            <span className="text-[15px] font-medium text-ink-soft">
              turnkey, incl. VAT
            </span>
          </div>
          <p className="mt-1.5 text-[13.5px] text-ink-soft">
            Typically {zlRange(capexTotal.lowPln, capexTotal.highPln)} —
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

      {/* Block 5: the grant, and what is genuinely left to find after it. */}
      <Block
        title="Grants (Czyste Powietrze)"
        subtitle="What the programme pays towards this, and what is left for you to find."
      >
        <div>
          <FieldLabel>Your income level</FieldLabel>
          <IconCardGroup
            columns={3}
            value={tier}
            onChange={setTier}
            options={S.INCOME_TIERS.map((t) => ({
              value: t,
              label: INCOME_TIER_LABEL[t],
              sublabel: TIER_SUBLABEL[t],
              icon: TIER_ICON[t],
            }))}
          />
        </div>

        {grant.warnings.map((warning) => (
          <div
            key={warning}
            className="flex gap-3 rounded-[14px] border border-line bg-[#fbfaf8] p-4 text-[13.5px] text-ink-soft"
          >
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>{warning}</p>
          </div>
        ))}

        {(grant.heating || grant.solar) && (
          <dl className="divide-y divide-line border-y border-line">
            {grant.heating && (
              <Line
                icon={Gift}
                label={`Grant toward ${result.name.toLowerCase()}`}
                sub={
                  grant.heating.cappedOut
                    ? `Capped at ${zl(grant.heating.capPln)} for this device (sheet line ${grant.heating.sheetLineId})`
                    : `${Math.round(grant.heating.rate * 100)}% of ${zl(grant.heating.eligibleCostPln)} (sheet line ${grant.heating.sheetLineId})`
                }
                value={grant.heating.amountPln}
                unit="off the price"
              />
            )}
            {grant.solar && (
              <Line
                icon={Sun}
                label="Grant toward solar"
                sub={`${Math.round(grant.solar.rate * 100)}% of ${zl(grant.solar.eligibleCostPln)}`}
                value={grant.solar.amountPln}
                unit="off the price"
              />
            )}
          </dl>
        )}

        <div className="rounded-[16px] border border-line bg-[#fbfaf8] p-5">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-soft">
            Net capex, after grants
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[28px] font-bold leading-none tracking-tight text-ink">
              {zl(loan.netCapexPln)}
            </span>
            <span className="text-[15px] font-medium text-ink-soft">
              left to pay
            </span>
          </div>
          <p className="mt-1.5 text-[13.5px] text-ink-soft">
            {zl(loan.grossCapexPln)} gross, less {zl(grant.totalGrantPln)} in
            grants.
          </p>
        </div>
      </Block>

      {/* Block 6: running cost + repayment. The one figure a household feels. */}
      <Block
        title="Your true monthly cost"
        subtitle="Running cost plus the repayment on what is left — the number you would actually feel each month."
      >
        <div>
          <FieldLabel>Loan term</FieldLabel>
          <IconCardGroup
            columns={3}
            value={loanYears}
            onChange={setLoanYears}
            options={LOAN_OPTIONS.map((option) => ({
              value: String(option.years),
              label: `${option.years} years`,
              sublabel: `${Math.round(option.annualInterest * 100)}% interest`,
              icon: CalendarDays,
            }))}
          />
        </div>

        <dl className="divide-y divide-line border-y border-line">
          <Line
            icon={Wallet}
            label="Running cost"
            sub={`Energy for ${result.name.toLowerCase()}${addSolar ? ", with solar" : ""}`}
            value={trueCost.runningPlnPerMonth}
            unit="per month"
          />
          <Line
            icon={Receipt}
            label="Loan repayment"
            sub={`${zl(loan.netCapexPln)} over ${terms.years} years at ${Math.round(terms.annualInterest * 100)}%`}
            value={trueCost.capexPlnPerMonth}
            unit="per month"
          />
        </dl>

        <div
          className={`rounded-[16px] border p-5 ${
            trueSaving >= 0
              ? "border-accent-tint2 bg-accent-tint"
              : "border-line bg-[#fbfaf8]"
          }`}
        >
          <p
            className={`text-[12px] font-semibold uppercase tracking-wider ${
              trueSaving >= 0 ? "text-accent-600/80" : "text-ink-soft"
            }`}
          >
            True monthly cost
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span
              className={`text-[28px] font-bold leading-none tracking-tight ${
                trueSaving >= 0 ? "text-accent-600" : "text-ink"
              }`}
            >
              {zl(trueCost.truePlnPerMonth)}
            </span>
            <span
              className={`text-[15px] font-medium ${
                trueSaving >= 0 ? "text-accent-600/80" : "text-ink-soft"
              }`}
            >
              per month while you repay
            </span>
          </div>
          <p
            className={`mt-1.5 text-[13.5px] ${
              trueSaving >= 0 ? "text-accent-600/80" : "text-ink-soft"
            }`}
          >
            {trueSaving >= 0 ? "Still " : ""}
            {zl(Math.abs(trueSaving))}/month{" "}
            {trueSaving >= 0 ? "cheaper than" : "more than"} the{" "}
            {zl(baselineMonthly)} you pay on coal today. Drops to{" "}
            {zl(trueCost.afterLoanPlnPerMonth)}/month once the loan is repaid in{" "}
            {terms.years} years.
          </p>
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
