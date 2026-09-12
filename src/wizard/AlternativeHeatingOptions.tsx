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
  ReceiptText,
  Percent,
  BadgeCheck,
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
import {
  Block,
  FieldLabel,
  IconCardGroup,
  ToggleCard,
  TrustBadge,
} from "./FormPrimitives";
import {
  ALTERNATIVE_HEATING_IDS,
  calculateAlternativeHeatingCost,
  type AlternativeHeatingAssumption,
  type AlternativeHeatingId,
} from "../engines/alternativeHeating";
import {
  calculateCapexBreakdown,
  calculateSolarAddOn,
  ZUM_DATABASE_URL,
} from "../engines/capex";
import {
  calculateGrant,
  type GrantWarning,
  type IncomeTier,
} from "../engines/grants";
import {
  calculateTaxRelief,
  TAX_RATES,
  TAX_RATE_VALUE,
  TAX_RELIEF_CAP_PLN,
  TAX_RELIEF_CARRY_FORWARD_YEARS,
  type TaxRate,
} from "../engines/taxRelief";
import {
  calculateLoan,
  trueMonthlyCost,
  loanTermsForYears,
  LOAN_OPTIONS,
} from "../engines/loan";
import * as S from "../data/sheet.constants";
import type { Baseline } from "../engines/baseline";
import { isSilesianPostalCode } from "../engines/regulatoryDeadlines";
import type { ElectricityTariffCase } from "./householdCases";
import { useT } from "../i18n";
import type { Dictionary } from "../i18n";

// useGrouping because pl-PL otherwise leaves four-digit numbers
// ungrouped, which put "9600 zł" next to "33 000 zł" in the same grant block.
const zl = (n: number) =>
  `${Math.round(n)
    .toLocaleString("pl-PL", { useGrouping: true })
    .replace(/\xa0/g, " ")} zł`;

const zlRange = (low: number, high: number) => `${zl(low)}–${zl(high)}`;

const kwh = (n: number) =>
  Math.round(n).toLocaleString("pl-PL").replace(/\xa0/g, " ");

const plnPerKwh = (n: number) =>
  `${n.toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).replace(/\xa0/g, " ")} zł`;

const OPTION_ICON: Record<AlternativeHeatingId, LucideIcon> = {
  airToAirHp: Wind,
  airToWaterHp: Waves,
  pellet: Package,
};

const TAX_RATE_ICON: Record<TaxRate, LucideIcon> = {
  pit12: Percent,
  pit32: Percent,
  flat19: Percent,
  none: Percent,
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
function tierSublabel(t: Dictionary, tier: IncomeTier): string {
  const g = t.alternatives.grants;
  if (tier === "basic") {
    return g.tierSublabelBasic(
      zl(S.SHEET_INCOME_TIERS.basicMaxHouseholdPlnPerMonth),
    );
  }
  const band =
    tier === "increased"
      ? S.SHEET_INCOME_TIERS.increasedMaxPerPersonPlnPerMonth
      : S.SHEET_INCOME_TIERS.highestMaxPerPersonPlnPerMonth;
  return g.tierSublabelPerPerson(zl(band.multi), zl(band.single));
}

/** A typed descriptor from grants.ts, said in the language on screen. */
function grantWarningText(t: Dictionary, w: GrantWarning): string {
  switch (w.code) {
    case "highestTierUnavailable":
      return t.grantWarnings.highestTierUnavailable(w.spaceHeatPerM2);
    case "heatSourceNotEligibleAlone":
      return t.grantWarnings.heatSourceNotEligibleAlone(
        w.spaceHeatPerM2,
        t.grantWarnings.requiredEndState[w.projectType],
      );
    case "solarPvPaused":
      return t.grantWarnings.solarPvPaused(zl(w.capPln));
  }
}

/** A typed descriptor from alternativeHeating.ts, said in the language on screen. */
function alternativeAssumptionText(
  t: Dictionary,
  a: AlternativeHeatingAssumption,
): string {
  const aa = t.alternativeAssumptions;
  switch (a.code) {
    case "usefulHeatCarriedOver":
      return aa.usefulHeatCarriedOver(kwh(a.kwhPerYear));
    case "pelletEfficiencyAndPrice":
      return aa.pelletEfficiencyAndPrice(
        a.efficiencyPct,
        zl(a.pricePerTonnePln),
      );
    case "heatPumpCop":
      return aa.heatPumpCop(
        t.alternatives.options[a.id].name,
        a.cop,
        plnPerKwh(a.pricePerKwh),
        t.options.electricityTariff[a.tariff].label,
      );
    case "pvMarginalPricing":
      return aa.pvMarginalPricing(a.selfConsumedSharePct);
    case "carriedOverFromBaseline":
      return aa.carriedOverFromBaseline;
  }
}

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
  postalCode,
  districtHeatingAvailable,
  selected,
  onSelectedChange,
  addSolar,
  onAddSolarChange,
  tier,
  onTierChange,
  loanYears,
  onLoanYearsChange,
  taxRate,
  onTaxRateChange,
}: {
  baseline: Baseline;
  electricityTariff: ElectricityTariffCase;
  /**
   * Read straight from the household's own data (Step 4's PV toggle).
   *
   * True means solar is already part of today's setup : it is already
   * netted into every number below silently, and there is nothing left to
   * decide about it here, so nothing about it is called out on screen.
   * False means the household could add it alongside this replacement : that
   * is a real, unmade decision, so Block 4 offers it as a distinct add-on.
   */
  hasPvPanels: boolean;
  /** Location & current-heating answers, read only for the pellet + district
   *  heating warning below - see the note where it's rendered. */
  postalCode: string;
  districtHeatingAvailable: boolean;
  /**
   * The five selections below used to be local state. They are lifted to the
   * parent (App.tsx) and passed down as controlled props so the PDF report
   * (see ../pdf/generateReportPdf.ts), built from the financials screen's
   * current selections, can read exactly what is on screen rather than a
   * second, independently-defaulted guess.
   */
  selected: AlternativeHeatingId;
  onSelectedChange: (id: AlternativeHeatingId) => void;
  /** Only offered, and only meaningful, when the household has no PV yet :
   *  see the toggle itself below. Persists across switching between options,
   *  since "would you add solar" is a question about the project, not about
   *  any one option. */
  addSolar: boolean;
  onAddSolarChange: (value: boolean) => void;
  /** Never collected by the wizard, and deliberately not asked for as a złoty
   *  figure : the household picks the band their income falls in. Basic is
   *  the default because it is the least generous, so nothing is ever
   *  overstated by a household that has not touched this. */
  tier: IncomeTier;
  onTierChange: (tier: IncomeTier) => void;
  loanYears: string;
  onLoanYearsChange: (years: string) => void;
  /** Like the grant tier above, this starts at the least generous of the two
   *  scale rates, so nothing is overstated for a household that never
   *  touches it. We do not ask what anyone earns; the bracket is all this
   *  needs. */
  taxRate: TaxRate;
  onTaxRateChange: (rate: TaxRate) => void;
}) {
  const t = useT();

  // True PV already existing counts on its own; toggling the add-on counts
  // the same way running-cost-wise : a panel is a panel, whichever screen it
  // was decided on. Every number below reacts to this one value.
  const effectiveHasPv = hasPvPanels || addSolar;

  // The option that saves the household the most per year against coal,
  // recomputed live as PV is toggled : the ranking is allowed to change.
  // Running-cost savings only (not capex/grant/loan), same basis the
  // savings box below reads from, so the badge and the number agree.
  const bestOptionId = ALTERNATIVE_HEATING_IDS.reduce(
    (best, id) => {
      const savings = calculateAlternativeHeatingCost(
        id,
        baseline,
        electricityTariff,
        undefined,
        effectiveHasPv,
      ).savingsPlnPerYear;
      return savings > best.savings ? { id, savings } : best;
    },
    { id: ALTERNATIVE_HEATING_IDS[0], savings: -Infinity },
  ).id;

  const cardOptions = ALTERNATIVE_HEATING_IDS.map((id) => ({
    value: id,
    label: t.alternatives.options[id].name,
    sublabel: t.alternatives.options[id].shortLabel,
    icon: OPTION_ICON[id],
    ...(id === bestOptionId
      ? {
          badge: t.alternatives.compare.bestValueBadge,
          badgeClassName: "bg-savings text-savings-700",
          highlightClassName: "ring-2 ring-savings ring-offset-1",
          selectedIconClassName: "bg-savings text-savings-700",
          selectedCheckClassName: "bg-savings",
          selectedCheckIconClassName: "text-savings-700",
        }
      : {}),
  }));

  const result = calculateAlternativeHeatingCost(
    selected,
    baseline,
    electricityTariff,
    undefined,
    effectiveHasPv,
  );
  const option = t.alternatives.options[selected];
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

  // Silesia's anti-smog resolution bans solid-fuel heating - a pellet boiler
  // included - wherever district heating already reaches the property (§8
  // reads "instalacje na paliwo stałe" broadly, not just the coal boiler
  // being replaced). Outside Silesia we cannot say a gmina has the same rule,
  // only that some do, so the warning below hedges instead of asserting it.
  const showDistrictHeatingPelletWarning =
    selected === "pellet" && districtHeatingAvailable;
  const districtHeatingPelletWarningIsSilesia =
    isSilesianPostalCode(postalCode);

  // The grant is claimed against the gross figure Block 4 is showing, so
  // "gross minus grant is net" holds for a household reading down the page.
  const grant = calculateGrant({
    optionId: selected,
    heatingCapexPln: heatingCapex.totalGross.midPln,
    solarCapexPln: addSolar ? solarAddOn.capexPln : 0,
    tier,
    spaceHeatPerM2: baseline.energy.spaceHeatPerM2,
  });
  const terms = loanTermsForYears(loanYears);
  const loan = calculateLoan({
    grossCapexPln: capexTotal.midPln,
    grantPln: grant.totalGrantPln,
    terms,
  });
  const taxRelief = calculateTaxRelief({
    netCapexPln: loan.netCapexPln,
    rate: taxRate,
  });
  const trueCost = trueMonthlyCost(result.totalPlnPerMonth, loan);
  const baselineMonthly = baseline.cost.totalPlnPerYear / 12;
  const trueSaving = baselineMonthly - trueCost.truePlnPerMonth;

  const c = t.alternatives.compare;
  const TR = t.alternatives.taxRelief;

  return (
    <>
      <Block eyebrow={t.roadmap.compare} title={c.title} subtitle={c.subtitle}>
        <div>
          <FieldLabel>{c.fieldLabel}</FieldLabel>
          <IconCardGroup
            columns={3}
            value={selected}
            onChange={onSelectedChange}
            options={cardOptions}
          />
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <TrustBadge
              icon={BadgeCheck}
              label={t.alternatives.trust.czystePowietrze.label}
              detail={t.alternatives.trust.czystePowietrze.detail}
            />
            <TrustBadge
              icon={ShieldCheck}
              label={t.alternatives.trust.zum.label}
              detail={t.alternatives.trust.zum.detail}
            />
          </div>
        </div>

        <p className="text-[14.5px] text-ink-soft">{option.description}</p>

        {showDistrictHeatingPelletWarning && (
          <div className="flex items-start gap-2.5 rounded-[12px] border border-yellow-200 bg-yellow-50 px-3.5 py-2.5">
            <TriangleAlert
              className="mt-0.5 h-4 w-4 shrink-0 text-yellow-700"
              aria-hidden
            />
            <p className="text-[13px] leading-snug text-yellow-800">
              {districtHeatingPelletWarningIsSilesia
                ? c.districtHeatingPelletWarningSilesia
                : c.districtHeatingPelletWarningOther}
            </p>
          </div>
        )}

        {/*
          Only offered when the household has no PV yet : a household that
          already has it has nothing to toggle. Everything below reacts live:
          this is a real input into the numbers, not a separate preview.
        */}
        {!hasPvPanels && (
          <ToggleCard
            icon={Sun}
            label={c.addSolarLabel}
            checked={addSolar}
            onChange={onAddSolarChange}
          />
        )}

        {/* Block 2: running cost on the household's own numbers. */}
        <div className="rounded-[16px] border border-savings bg-savings-tint p-5">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-savings-700/80">
            {c.newOutflow(option.name)}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[28px] font-bold leading-none tracking-tight text-savings-700">
              {zl(result.totalPlnPerMonth)}
            </span>
            <span className="text-[15px] font-medium text-savings-700/80">
              {c.perMonth}
            </span>
          </div>
          <p className="mt-1.5 text-[13.5px] text-savings-700/80">
            {c.perYearAndEfficiency(
              zl(result.totalPlnPerYear),
              option.efficiencyLabel,
            )}
          </p>
        </div>

        <dl className="divide-y divide-line border-y border-line">
          <Line
            icon={Icon}
            label={c.spaceHeating}
            sub={c.fuelPerYear(
              result.fuelPerYear < 10
                ? result.fuelPerYear.toFixed(1)
                : kwh(result.fuelPerYear),
              result.fuelUnit === "kWh" ? c.fuelUnitKwh : c.fuelUnitTonnes,
            )}
            value={result.spaceHeatingPlnPerYear}
            unit={t.baseline.perYear}
          />
          <Line
            icon={Droplets}
            label={c.waterHeating}
            sub={c.unchanged}
            value={result.waterHeatingPlnPerYear}
            unit={t.baseline.perYear}
          />
          <Line
            icon={Plug}
            label={c.electricityAndCooling}
            sub={c.unchanged}
            value={result.electricityAndCoolingPlnPerYear}
            unit={t.baseline.perYear}
          />
        </dl>

        {result.assumptions.length > 0 && (
          <details className="rounded-[14px] border border-line bg-[#fbfaf8] p-4">
            <summary className="cursor-pointer text-[13px] font-semibold text-ink-soft">
              {c.assumptionsSummary(result.assumptions.length)}
            </summary>
            <p className="mt-3 text-[13px] text-ink-soft">
              {c.assumptionsIntro}
            </p>
            <ul className="mt-3 flex list-disc flex-col gap-2 pl-4 text-[13px] text-ink-soft">
              {result.assumptions.map((a, i) => (
                <li key={i}>{alternativeAssumptionText(t, a)}</li>
              ))}
            </ul>
          </details>
        )}
      </Block>

      {/* Block 3: the plain delta against the baseline. */}
      <Block
        eyebrow={t.roadmap.savings}
        title={t.alternatives.savings.title}
        subtitle={t.alternatives.savings.subtitle(option.name, addSolar)}
      >
        <div
          className={`flex items-start gap-4 rounded-[16px] border p-5 ${
            saving
              ? "border-savings bg-savings-tint"
              : "border-line bg-[#fbfaf8]"
          }`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${
              saving ? "bg-savings text-savings-700" : "bg-chip text-ink-soft"
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
                saving ? "text-savings-700" : "text-ink"
              }`}
            >
              {t.alternatives.savings.headline(
                saving
                  ? t.alternatives.savings.saves
                  : t.alternatives.savings.costs,
                zl(Math.abs(result.savingsPlnPerMonth)),
                !saving,
              )}
            </p>
            <p
              className={`mt-1 text-[14px] ${saving ? "text-savings-700/80" : "text-ink-soft"}`}
            >
              {t.alternatives.savings.detail(
                saving
                  ? t.alternatives.savings.saves
                  : t.alternatives.savings.costs,
                zl(Math.abs(result.savingsPlnPerYear)),
                !saving,
                zl(baseline.cost.totalPlnPerYear),
              )}
            </p>
          </div>
        </div>

        {!saving && (
          <p className="text-[13px] text-ink-soft">
            {t.alternatives.savings.caveat}
          </p>
        )}
      </Block>

      {/* Block 4: equipment cost : the sticker price, before any grant or loan. */}
      <Block
        eyebrow={t.roadmap.capex}
        title={t.alternatives.capex.title}
        subtitle={t.alternatives.capex.subtitle(
          option.name.toLowerCase(),
          addSolar,
        )}
      >
        <dl className="divide-y divide-line border-y border-line">
          <Line
            icon={Wrench}
            label={t.alternatives.capex.hardware}
            sub={t.alternatives.capex.typically(
              zlRange(
                heatingCapex.hardware.lowPln,
                heatingCapex.hardware.highPln,
              ),
            )}
            value={heatingCapex.hardware.midPln}
            unit={t.alternatives.capex.unitEquipment}
          />
          <Line
            icon={HardHat}
            label={t.alternatives.capex.installation}
            sub={t.alternatives.capex.typically(
              zlRange(
                heatingCapex.installation.lowPln,
                heatingCapex.installation.highPln,
              ),
            )}
            value={heatingCapex.installation.midPln}
            unit={t.alternatives.capex.unitLabour}
          />
          {addSolar && (
            <Line
              icon={Sun}
              label={t.alternatives.capex.solarLabel}
              sub={t.alternatives.capex.solarSub(
                kwh(solarAddOn.productionKwhPerYear),
              )}
              value={solarAddOn.capexPln}
              unit={t.alternatives.capex.unitAdded}
            />
          )}
        </dl>

        <div className="rounded-[16px] border border-accent-tint2 bg-accent-tint p-5">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-accent-600/80">
            {addSolar
              ? t.alternatives.capex.totalGrossWithSolar
              : t.alternatives.capex.totalGross}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[28px] font-bold leading-none tracking-tight text-accent-600">
              {zl(capexTotal.midPln)}
            </span>
            <span className="text-[15px] font-medium text-accent-600/80">
              {t.alternatives.capex.turnkey}
            </span>
          </div>
          <p className="mt-1.5 text-[13.5px] text-accent-600/80">
            {t.alternatives.capex.spread(
              zlRange(capexTotal.lowPln, capexTotal.highPln),
            )}
          </p>
        </div>

        <div className="flex gap-3 rounded-[14px] border border-accent-tint2 bg-accent-tint p-4 text-sm text-accent-600">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p>{t.alternatives.capex.zumNote}</p>
            <a
              href={ZUM_DATABASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-accent-600 underline decoration-accent-tint2 underline-offset-2 hover:decoration-accent-600"
            >
              {t.alternatives.capex.zumLink}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        </div>
      </Block>

      {/* Block 5: the grant, and what is genuinely left to find after it. */}
      <Block
        eyebrow={t.roadmap.grants}
        title={t.alternatives.grants.title}
        subtitle={t.alternatives.grants.subtitle}
      >
        <div>
          <FieldLabel>{t.alternatives.grants.incomeLevel}</FieldLabel>
          <IconCardGroup
            columns={3}
            value={tier}
            onChange={onTierChange}
            options={S.INCOME_TIERS.map((tierId) => ({
              value: tierId,
              label: t.alternatives.grants.tiers[tierId],
              sublabel: tierSublabel(t, tierId),
              icon: TIER_ICON[tierId],
            }))}
          />
        </div>

        {grant.warnings.map((warning) => (
          <div
            key={warning.code}
            className="flex gap-3 rounded-[14px] border border-line bg-[#fbfaf8] p-4 text-[13.5px] text-ink-soft"
          >
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>{grantWarningText(t, warning)}</p>
          </div>
        ))}

        {(grant.heating || grant.solar) && (
          <dl className="divide-y divide-line border-y border-line">
            {grant.heating && (
              <Line
                icon={Gift}
                label={t.alternatives.grants.grantTowards(
                  option.name.toLowerCase(),
                )}
                sub={
                  grant.heating.cappedOut
                    ? t.alternatives.grants.cappedAt(
                        zl(grant.heating.capPln),
                        grant.heating.sheetLineId,
                      )
                    : t.alternatives.grants.rateOf(
                        Math.round(grant.heating.rate * 100),
                        zl(grant.heating.eligibleCostPln),
                        grant.heating.sheetLineId,
                      )
                }
                value={grant.heating.amountPln}
                unit={t.alternatives.grants.offThePrice}
              />
            )}
            {grant.solar && (
              <Line
                icon={Sun}
                label={t.alternatives.grants.grantTowardsSolar}
                sub={t.alternatives.grants.solarRateOf(
                  Math.round(grant.solar.rate * 100),
                  zl(grant.solar.eligibleCostPln),
                )}
                value={grant.solar.amountPln}
                unit={t.alternatives.grants.offThePrice}
              />
            )}
          </dl>
        )}

        <div className="rounded-[16px] border border-accent-tint2 bg-accent-tint p-5">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-accent-600/80">
            {t.alternatives.grants.netCapex}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[28px] font-bold leading-none tracking-tight text-accent-600">
              {zl(loan.netCapexPln)}
            </span>
            <span className="text-[15px] font-medium text-accent-600/80">
              {t.alternatives.grants.leftToPay}
            </span>
          </div>
          <p className="mt-1.5 text-[13.5px] text-accent-600/80">
            {t.alternatives.grants.netCapexDetail(
              zl(loan.grossCapexPln),
              zl(grant.totalGrantPln),
            )}
          </p>
        </div>

        {/*
          The thermal modernisation relief, claimed on what is left AFTER the
          grant: art. 26h ust. 5 pkt 1 excludes anything the programme already
          paid for. It comes back through a tax return rather than up front,
          so it lowers the final cost without lowering what step 6 finances.
        */}
        <div>
          <FieldLabel>{TR.fieldLabel}</FieldLabel>
          <IconCardGroup
            columns={4}
            value={taxRate}
            onChange={onTaxRateChange}
            options={TAX_RATES.map((rate) => ({
              value: rate,
              label: TR.rates[rate].label,
              sublabel: TR.rates[rate].sublabel,
              icon: TAX_RATE_ICON[rate],
            }))}
          />
        </div>

        {taxRelief.cashBackPln > 0 && (
          <dl className="divide-y divide-line border-y border-line">
            <Line
              icon={ReceiptText}
              label={TR.lineLabel}
              sub={
                taxRelief.cappedOut
                  ? TR.cappedSub(
                      zl(taxRelief.capPln),
                      Math.round(TAX_RATE_VALUE[taxRate] * 100),
                    )
                  : TR.lineSub(
                      Math.round(TAX_RATE_VALUE[taxRate] * 100),
                      zl(taxRelief.deductionBasePln),
                    )
              }
              value={taxRelief.cashBackPln}
              unit={TR.unit}
            />
          </dl>
        )}

        <div className="rounded-[16px] border border-savings bg-savings-tint p-5">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-savings-700">
            {TR.finalNetCost}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[28px] font-bold leading-none tracking-tight text-savings-700">
              {zl(taxRelief.finalNetCostPln)}
            </span>
          </div>
          <p className="mt-1.5 text-[13.5px] text-savings-700/80">
            {TR.finalNetCostDetail(
              zl(loan.netCapexPln),
              zl(taxRelief.cashBackPln),
            )}
          </p>
        </div>

        <p className="text-[13px] leading-relaxed text-ink-soft">{TR.note}</p>
        <p className="text-[12.5px] leading-relaxed text-ink-soft/80">
          {TR.capAndIncomeNote(
            zl(TAX_RELIEF_CAP_PLN),
            TAX_RELIEF_CARRY_FORWARD_YEARS,
          )}
        </p>
      </Block>

      {/* Block 6: running cost + repayment. The one figure a household feels. */}
      <Block
        eyebrow={t.roadmap.trueCost}
        title={t.alternatives.trueCost.title}
        subtitle={t.alternatives.trueCost.subtitle}
      >
        <div>
          <FieldLabel>{t.alternatives.trueCost.loanTerm}</FieldLabel>
          <IconCardGroup
            columns={3}
            value={loanYears}
            onChange={onLoanYearsChange}
            options={LOAN_OPTIONS.map((loanOption) => ({
              value: String(loanOption.years),
              label: t.alternatives.trueCost.years(loanOption.years),
              sublabel: t.alternatives.trueCost.interest(
                Math.round(loanOption.annualInterest * 100),
              ),
              icon: CalendarDays,
            }))}
          />
        </div>

        <dl className="divide-y divide-line border-y border-line">
          <Line
            icon={Wallet}
            label={t.alternatives.trueCost.runningCost}
            sub={t.alternatives.trueCost.runningCostSub(
              option.name.toLowerCase(),
              addSolar,
            )}
            value={trueCost.runningPlnPerMonth}
            unit={t.alternatives.trueCost.perMonth}
          />
          <Line
            icon={Receipt}
            label={t.alternatives.trueCost.loanRepayment}
            sub={t.alternatives.trueCost.loanRepaymentSub(
              zl(loan.netCapexPln),
              terms.years,
              Math.round(terms.annualInterest * 100),
            )}
            value={trueCost.capexPlnPerMonth}
            unit={t.alternatives.trueCost.perMonth}
          />
        </dl>

        <div className="rounded-[16px] border border-savings bg-savings-tint p-5">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-savings-700/80">
            {t.alternatives.trueCost.heading}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[28px] font-bold leading-none tracking-tight text-savings-700">
              {zl(trueCost.truePlnPerMonth)}
            </span>
            <span className="text-[15px] font-medium text-savings-700/80">
              {t.alternatives.trueCost.whileRepaying}
            </span>
          </div>
          <p className="mt-1.5 text-[13.5px] text-savings-700/80">
            {t.alternatives.trueCost.comparison(
              zl(Math.abs(trueSaving)),
              trueSaving >= 0,
              zl(baselineMonthly),
              zl(trueCost.afterLoanPlnPerMonth),
              terms.years,
            )}
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
  unit,
}: {
  icon: LucideIcon;
  label: string;
  sub: string;
  value: number;
  unit: string;
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
