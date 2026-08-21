/**
 * subsidy.ts — which grants apply, how much, and what cannot be stacked.
 *
 * Design rule: THIS FILE CONTAINS NO ZŁOTY AMOUNT IN ITS LOGIC.
 *
 * Every figure lives in a ProgrammeSet, which is data. Amounts are contested
 * (public sources disagree by an order of magnitude) and the programme changed
 * on 20.07.2026. So the amounts must be editable at runtime — including live on
 * stage, mid-demo, when someone says "that number is wrong."
 *
 * The engine's job is the part that does not change: eligibility gates and the
 * combination rules.
 *
 * --- On the tax relief ------------------------------------------------------
 *
 * Ulga termomodernizacyjna is not a grant and must not be modelled as one.
 * Three things about it are easy to get wrong, and an earlier version of this
 * file got all three:
 *
 *   1. IT IS A DEDUCTION, NOT CASH. You subtract the spend from taxable income.
 *      The cash you see back is the deduction multiplied by your marginal tax
 *      rate. Treating the 53 000 zł cap as a cash cap overstates the benefit by
 *      roughly eight times.
 *
 *   2. YOU MAY ONLY DEDUCT MONEY YOU ACTUALLY PAID. Grant money is not yours,
 *      so the deduction base is cost MINUS grants. The earlier version computed
 *      relief on the gross cost, which reported 5 040 zł of relief on a heat
 *      pump the household had paid nothing towards.
 *
 *   3. THE CAP IS PER TAXPAYER. Two owners filing separately have two caps.
 *
 * That is why relief is resolved in a second pass below, after the cash grants
 * are known. Order is load-bearing here.
 */

import { Range, exact, range, scale } from "./range";

export type DeviceType = "heatPump" | "pelletBoiler" | "insulation" | "pv";

export type IncomeLevel = "basic" | "raised" | "highest";

export interface Programme {
  id: string;
  /** Polish name, for people who will go and look it up. */
  nameP1: string;
  /** Plain-English label. Never show only the Polish name to a demo audience. */
  label: string;
  /** What this programme can be claimed against. */
  appliesTo: DeviceType[];
  /**
   * Maximum grant by income level, in złoty. Editable.
   * Omit a level to mean "not available at that level".
   * For a tax relief this is the cap on the DEDUCTION BASE, not on the cash.
   */
  maxByLevel: Partial<Record<IncomeLevel, number>>;
  /**
   * Share of eligible cost the programme pays, by income level.
   * The share is the highest-leverage number in this file: it moves the monthly
   * answer more than the cap does, because the cap only binds on large jobs.
   */
  shareByLevel: Partial<Record<IncomeLevel, number>>;
  /**
   * Programmes that cannot be claimed alongside this one for the SAME device.
   * Polish subsidies do not stack on a single device — getting this wrong is
   * how homeowners end up repaying a grant with interest.
   */
  excludesForSameDevice: string[];
  /** Gates that must all be satisfied for this programme to pay out. */
  requires: EligibilityGate[];
  /**
   * True for tax relief, which reduces taxable income rather than paying cash.
   * Relief programmes are resolved after grants and never compete with them.
   */
  isTaxRelief?: boolean;
  /**
   * Tax relief only: the cap applies per taxpayer, so two owners get two caps.
   * Grants are per building and ignore this.
   */
  capIsPerTaxpayer?: boolean;
  /**
   * Has a human read the programme document and confirmed these figures?
   * The UI must show an unmissable warning while this is false. There is a
   * test asserting every programme carries the flag.
   */
  verified: boolean;
  source: string;
  readOn: string;
}

export type EligibilityGate =
  | "ownedThreeYears"
  | "deviceOnZumList"
  | "energyAuditDone"
  | "incomeEvidenced"
  | "replacingKopciuch"
  | "newBuild";

export interface Applicant {
  incomeLevel: IncomeLevel;
  gatesSatisfied: EligibilityGate[];
  /**
   * How many owners will claim the relief on their own tax return.
   * Defaults to 1, which is the conservative answer.
   */
  taxpayerCount?: number;
  /**
   * Marginal income tax rate, e.g. 0.12 for the 12% band, 0.32 for 32%,
   * 0.19 for the flat rate. Zero means the relief is worth nothing to them,
   * which is a real and common outcome worth showing.
   */
  marginalTaxRate?: number;
}

// --- the programme set ------------------------------------------------------
// Placeholder amounts. Every one is expected to be wrong until the NFOŚiGW
// programme document is read. That is fine — see the file header — but the
// `verified` flag must stay false until it has been, and the UI must say so.

export const DEFAULT_PROGRAMMES: Programme[] = [
  {
    id: "czystePowietrze",
    nameP1: "Czyste Powietrze",
    label: "Clean Air — the main national grant",
    appliesTo: ["heatPump", "pelletBoiler", "insulation"],
    maxByLevel: { basic: 68040, raised: 119070, highest: 119070 },
    // A previous version had this at 1.0 for every level, which made a 42 000 zł
    // heat pump free for an average household and every option look like a
    // giveaway. The programme pays a share that rises with need; the values
    // below are the conventional 40/70/100 shape and are NOT verified.
    shareByLevel: { basic: 0.4, raised: 0.7, highest: 1.0 },
    excludesForSameDevice: ["mojeCiepło", "ciepłeMieszkanie"],
    requires: [
      "ownedThreeYears",
      "deviceOnZumList",
      "energyAuditDone",
      "replacingKopciuch",
    ],
    verified: false,
    source: "BOŚ Bank, Kredyt Czyste Powietrze page — shares UNVERIFIED",
    readOn: "2026-08-19",
  },
  {
    id: "mojeCiepło",
    nameP1: "Moje Ciepło",
    label: "My Heat — new-build homes only",
    appliesTo: ["heatPump"],
    maxByLevel: { basic: 21000, raised: 21000, highest: 21000 },
    shareByLevel: { basic: 0.3, raised: 0.3, highest: 0.3 },
    excludesForSameDevice: ["czystePowietrze"],
    requires: ["newBuild", "deviceOnZumList"],
    verified: false,
    source: "Polish market reporting 2026 — UNVERIFIED",
    readOn: "2026-08-19",
  },
  {
    id: "ciepłeMieszkanie",
    nameP1: "Ciepłe Mieszkanie",
    label: "Warm Flat — flats in multi-family buildings",
    appliesTo: ["heatPump", "pelletBoiler"],
    maxByLevel: { basic: 21000, raised: 27000, highest: 37000 },
    shareByLevel: { basic: 0.3, raised: 0.6, highest: 0.9 },
    excludesForSameDevice: ["czystePowietrze"],
    requires: ["replacingKopciuch", "deviceOnZumList"],
    verified: false,
    source:
      "Polish market reporting 2026 — UNVERIFIED. Amounts are set per gmina.",
    readOn: "2026-08-19",
  },
  {
    id: "ulgaTermomodernizacyjna",
    nameP1: "Ulga termomodernizacyjna",
    label: "Thermal-modernisation tax relief",
    appliesTo: ["heatPump", "pelletBoiler", "insulation", "pv"],
    // 53 000 zł is the cap on what you may DEDUCT, per taxpayer. It is not a
    // cash amount and it is not divided by anything.
    maxByLevel: { basic: 53000, raised: 53000, highest: 53000 },
    // 100% of qualifying own spend is deductible, up to the cap. The cash value
    // comes from the applicant's marginal rate, not from this number.
    shareByLevel: { basic: 1.0, raised: 1.0, highest: 1.0 },
    excludesForSameDevice: [], // stacks with everything
    requires: [],
    isTaxRelief: true,
    capIsPerTaxpayer: true,
    verified: false,
    source:
      "Polish tax code, art. 26h PIT — cash value depends on the taxpayer's band",
    readOn: "2026-08-19",
  },
];

/** Used when the applicant does not state a rate. The lowest PIT band. */
export const DEFAULT_MARGINAL_TAX_RATE = 0.12;

// --- results ----------------------------------------------------------------

export interface ProgrammeResult {
  programme: Programme;
  /** Cash value of this programme for this device, in złoty. */
  amount: Range;
  applied: boolean;
  /** Present when applied is false. Shown to the user verbatim. */
  reason?: string;
  /** Gates the applicant has not satisfied. */
  missingGates: EligibilityGate[];
  /**
   * Tax relief only: how much may be subtracted from taxable income.
   * Always much larger than `amount`, and the two must never be confused.
   */
  deductionBase?: Range;
}

export interface SubsidyOutcome {
  /** Grants that reduce the amount to finance. */
  upfrontGrant: Range;
  /** Tax relief cash value. Arrives later, shown as a separate line. */
  taxRelief: Range;
  /** What the household actually pays towards this device, after grants. */
  ownSpend: Range;
  /** Total that may be deducted from taxable income, across relief programmes. */
  deductionBase: Range;
  /** True while any applied programme is still unverified. UI must surface it. */
  hasUnverifiedAmounts: boolean;
  /** Every programme considered, applied or not, with the reason. */
  detail: ProgrammeResult[];
}

// --- the engine -------------------------------------------------------------

function missingGates(p: Programme, a: Applicant): EligibilityGate[] {
  return p.requires.filter((g) => !a.gatesSatisfied.includes(g));
}

/** Cash value of a grant: a share of eligible cost, capped. */
function grantValue(
  p: Programme,
  level: IncomeLevel,
  eligibleCost: number,
): number {
  const cap = p.maxByLevel[level];
  const share = p.shareByLevel[level];
  if (cap === undefined || share === undefined) return 0;
  return Math.min(cap, eligibleCost * share);
}

/**
 * Work out what a household actually gets for one device.
 *
 * Two passes, and the order is not cosmetic:
 *
 *   Pass 1 — cash grants. Gates, then exclusions resolved by keeping the
 *            larger award.
 *   Pass 2 — tax relief, computed on cost MINUS the grants from pass 1,
 *            because you cannot deduct money somebody else paid.
 *
 * Nothing is silently dropped — every programme comes back in `detail` with a
 * reason a person can read.
 */
export function subsidiesFor(
  device: DeviceType,
  eligibleCost: number,
  applicant: Applicant,
  programmes: Programme[] = DEFAULT_PROGRAMMES,
): SubsidyOutcome {
  if (eligibleCost < 0)
    throw new Error("subsidiesFor: eligible cost cannot be negative");

  const applicable = programmes.filter((p) => p.appliesTo.includes(device));
  const grants = applicable.filter((p) => !p.isTaxRelief);
  const reliefs = applicable.filter((p) => p.isTaxRelief);

  const results: ProgrammeResult[] = [];
  const winners = new Set<string>();

  // --- pass 1: cash grants --------------------------------------------------

  const grantCandidates = grants.map((p) => ({
    programme: p,
    value: grantValue(p, applicant.incomeLevel, eligibleCost),
    missing: missingGates(p, applicant),
  }));

  for (const c of [...grantCandidates]
    .filter((c) => c.missing.length === 0 && c.value > 0)
    .sort((a, b) => b.value - a.value)) {
    const blockedBy = c.programme.excludesForSameDevice.find((id) =>
      winners.has(id),
    );
    if (blockedBy) continue;
    winners.add(c.programme.id);
  }

  for (const c of grantCandidates) {
    const p = c.programme;

    if (c.missing.length > 0) {
      results.push({
        programme: p,
        amount: exact(0),
        applied: false,
        missingGates: c.missing,
        reason: `Not available yet: ${c.missing.join(", ")}`,
      });
      continue;
    }
    if (c.value === 0) {
      results.push({
        programme: p,
        amount: exact(0),
        applied: false,
        missingGates: [],
        reason: `Not available at your income level`,
      });
      continue;
    }
    if (!winners.has(p.id)) {
      const clash = p.excludesForSameDevice.find((id) => winners.has(id));
      const other = programmes.find((x) => x.id === clash);
      results.push({
        programme: p,
        amount: exact(0),
        applied: false,
        missingGates: [],
        reason: other
          ? `You cannot claim ${p.label} and ${other.label} for the same device — we kept the larger one`
          : `Excluded by another programme`,
      });
      continue;
    }
    results.push({
      programme: p,
      amount: exact(c.value),
      applied: true,
      missingGates: [],
    });
  }

  const grantTotal = results
    .filter((r) => r.applied)
    .reduce((acc, r) => acc + r.amount.mid, 0);

  // --- pass 2: tax relief, on what the household actually paid ---------------

  const ownSpend = Math.max(0, eligibleCost - grantTotal);
  const taxpayers = Math.max(1, Math.floor(applicant.taxpayerCount ?? 1));
  const rate = applicant.marginalTaxRate ?? DEFAULT_MARGINAL_TAX_RATE;

  let deductionTotal = 0;
  let reliefTotal = 0;

  for (const p of reliefs) {
    const missing = missingGates(p, applicant);
    const capPerTaxpayer = p.maxByLevel[applicant.incomeLevel];
    const share = p.shareByLevel[applicant.incomeLevel];

    if (missing.length > 0) {
      results.push({
        programme: p,
        amount: exact(0),
        applied: false,
        missingGates: missing,
        reason: `Not available yet: ${missing.join(", ")}`,
      });
      continue;
    }
    if (capPerTaxpayer === undefined || share === undefined) {
      results.push({
        programme: p,
        amount: exact(0),
        applied: false,
        missingGates: [],
        reason: `Not available at your income level`,
      });
      continue;
    }

    const cap = p.capIsPerTaxpayer
      ? capPerTaxpayer * taxpayers
      : capPerTaxpayer;
    const base = Math.min(cap, ownSpend * share);
    const cash = base * rate;

    if (ownSpend === 0) {
      results.push({
        programme: p,
        amount: exact(0),
        applied: false,
        deductionBase: exact(0),
        missingGates: [],
        reason:
          "The grant covers the whole cost, so there is nothing of your own money left to deduct",
      });
      continue;
    }
    if (rate === 0) {
      results.push({
        programme: p,
        amount: exact(0),
        applied: false,
        deductionBase: exact(base),
        missingGates: [],
        reason:
          "You pay no income tax against which to deduct, so this relief returns nothing",
      });
      continue;
    }

    deductionTotal += base;
    reliefTotal += cash;
    results.push({
      programme: p,
      amount: exact(cash),
      applied: true,
      deductionBase: exact(base),
      missingGates: [],
    });
  }

  const hasUnverifiedAmounts = results.some(
    (r) => r.applied && !r.programme.verified,
  );

  return {
    // Grant caps are stated amounts, so there is little uncertainty in the cap
    // itself. The uncertainty is whether the eligible cost reaches it, which is
    // why a modest band travels forward rather than an exact figure.
    upfrontGrant: scale(range(0.95, 1, 1), grantTotal),
    taxRelief: scale(range(0.9, 1, 1.1), reliefTotal),
    ownSpend: scale(range(1, 1, 1.05), ownSpend),
    deductionBase: exact(deductionTotal),
    hasUnverifiedAmounts,
    detail: results,
  };
}

// --- T1: whole-project view -------------------------------------------------

/**
 * A real job is a heat pump AND panels AND sometimes insulation.
 *
 * Calling subsidiesFor() once per device and adding the answers up lets the
 * same cap be claimed several times over: three devices against a 68 040 zł
 * Clean Air cap would report up to 204 120 zł from a programme that pays it
 * once. So the cap is applied once, at project level, and then shared out.
 *
 * The share-out order is deliberate. Devices are served in descending award
 * size, so a limited grant lands on the heat pump before it lands on the
 * panels. That is how a household actually spends it, and it keeps the largest
 * and hardest-to-finance item covered.
 *
 * Tax relief is resolved once at the end over the project's whole own spend,
 * because the deduction cap is per taxpayer per year — not per device.
 */

export interface ProjectItem {
  device: DeviceType;
  cost: number;
}

export interface ProjectItemAward {
  device: DeviceType;
  cost: number;
  /** Grant this device receives after the project cap has been shared out. */
  grant: Range;
  /** What the household pays towards this device. */
  ownSpend: Range;
  /** Per-programme reasoning, so the UI can still say why something was refused. */
  detail: ProgrammeResult[];
  /** Grant this device lost to the project cap. Zero when nothing bit. */
  reducedByCap: number;
}

export interface ProjectSubsidyOutcome {
  items: ProjectItemAward[];
  totalCost: number;
  upfrontGrant: Range;
  taxRelief: Range;
  ownSpend: Range;
  deductionBase: Range;
  hasUnverifiedAmounts: boolean;
  /** Present only when a cap actually bit. Shown to the user verbatim. */
  capNote?: string;
}

export function projectSubsidies(
  items: ProjectItem[],
  applicant: Applicant,
  programmes: Programme[] = DEFAULT_PROGRAMMES,
): ProjectSubsidyOutcome {
  const totalCost = items.reduce((a, i) => a + i.cost, 0);

  const perDevice = items.map((i) => ({
    item: i,
    outcome: subsidiesFor(i.device, i.cost, applicant, programmes),
  }));

  const capUsed = new Map<string, number>();
  const awards: ProjectItemAward[] = [];

  const ordered = [...perDevice].sort(
    (a, b) => b.outcome.upfrontGrant.mid - a.outcome.upfrontGrant.mid,
  );

  let grantTotal = 0;

  for (const { item, outcome } of ordered) {
    let granted = 0;
    let lost = 0;

    for (const d of outcome.detail) {
      if (!d.applied || d.programme.isTaxRelief) continue;
      const cap = d.programme.maxByLevel[applicant.incomeLevel];
      const used = capUsed.get(d.programme.id) ?? 0;
      const headroom =
        cap === undefined ? d.amount.mid : Math.max(0, cap - used);
      const allowed = Math.min(d.amount.mid, headroom);
      capUsed.set(d.programme.id, used + allowed);
      granted += allowed;
      lost += d.amount.mid - allowed;
    }

    grantTotal += granted;
    awards.push({
      device: item.device,
      cost: item.cost,
      grant: scale(range(0.95, 1, 1), granted),
      ownSpend: scale(range(1, 1, 1.05), Math.max(0, item.cost - granted)),
      detail: outcome.detail,
      reducedByCap: lost,
    });
  }

  const ownSpendTotal = Math.max(0, totalCost - grantTotal);

  // Relief once, over the whole project.
  const taxpayers = Math.max(1, Math.floor(applicant.taxpayerCount ?? 1));
  const rate = applicant.marginalTaxRate ?? DEFAULT_MARGINAL_TAX_RATE;
  const reliefProgramme = programmes.find(
    (p) => p.isTaxRelief && items.some((i) => p.appliesTo.includes(i.device)),
  );

  let deductionBase = 0;
  if (reliefProgramme) {
    const capPer = reliefProgramme.maxByLevel[applicant.incomeLevel] ?? 0;
    const cap = reliefProgramme.capIsPerTaxpayer ? capPer * taxpayers : capPer;
    deductionBase = Math.min(cap, ownSpendTotal);
  }
  const reliefCash = deductionBase * rate;

  const lostTotal = awards.reduce((a, x) => a + x.reducedByCap, 0);
  const capNote =
    lostTotal > 0
      ? `The grant is capped across the whole project, not per item, so ${Math.round(
          lostTotal,
        ).toLocaleString("pl-PL")} zł of it cannot be claimed.`
      : undefined;

  return {
    items: awards,
    totalCost,
    upfrontGrant: scale(range(0.95, 1, 1), grantTotal),
    taxRelief: scale(range(0.9, 1, 1.1), reliefCash),
    ownSpend: scale(range(1, 1, 1.05), ownSpendTotal),
    deductionBase: exact(deductionBase),
    hasUnverifiedAmounts: perDevice.some((p) => p.outcome.hasUnverifiedAmounts),
    capNote,
  };
}

/**
 * A copy of the default programmes with Clean Air's cost share overridden.
 * Used by the sensitivity engine to answer "what if you landed in a different
 * income tier", which is the one grant variable a household cannot change but
 * badly needs to see.
 */
export function cleanAirShareOverride(share: number): Programme[] {
  return DEFAULT_PROGRAMMES.map((p) =>
    p.id === "czystePowietrze"
      ? {
          ...p,
          shareByLevel: { basic: share, raised: share, highest: share },
        }
      : p,
  );
}
