/**
 * subsidy.ts — which grants apply, how much, and what cannot be stacked.
 *
 * Design rule: THIS FILE CONTAINS NO ZŁOTY AMOUNT.
 *
 * Every figure lives in a ProgrammeSet, which is data. Amounts are contested
 * (public sources disagree by an order of magnitude) and the programme changed
 * on 20.07.2026. So the amounts must be editable at runtime — including live on
 * stage, mid-demo, when someone says "that number is wrong."
 *
 * The engine's job is the part that does not change: eligibility gates and the
 * combination rules.
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
   */
  maxByLevel: Partial<Record<IncomeLevel, number>>;
  /** Cap as a share of eligible cost, e.g. 0.3 for 30%. */
  shareOfCost: number;
  /**
   * Programmes that cannot be claimed alongside this one for the SAME device.
   * Polish subsidies do not stack on a single device — getting this wrong is
   * how homeowners end up repaying a grant with interest.
   */
  excludesForSameDevice: string[];
  /** Gates that must all be satisfied for this programme to pay out. */
  requires: EligibilityGate[];
  /** True for tax relief, which reduces tax rather than paying cash up front. */
  isTaxRelief?: boolean;
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
}

// --- the programme set ------------------------------------------------------
// Placeholder amounts. Every one is expected to be wrong until the NFOŚiGW
// programme document is read. That is fine — see the file header.

export const DEFAULT_PROGRAMMES: Programme[] = [
  {
    id: "czystePowietrze",
    nameP1: "Czyste Powietrze",
    label: "Clean Air — the main national grant",
    appliesTo: ["heatPump", "pelletBoiler", "insulation"],
    maxByLevel: { basic: 68040, raised: 119070, highest: 119070 },
    shareOfCost: 1.0,
    excludesForSameDevice: ["mojeCiepło", "ciepłeMieszkanie"],
    requires: [
      "ownedThreeYears",
      "deviceOnZumList",
      "energyAuditDone",
      "replacingKopciuch",
    ],
    source: "BOŚ Bank, Kredyt Czyste Powietrze page",
    readOn: "2026-08-19",
  },
  {
    id: "mojeCiepło",
    nameP1: "Moje Ciepło",
    label: "My Heat — new-build homes only",
    appliesTo: ["heatPump"],
    maxByLevel: { basic: 21000, raised: 21000, highest: 21000 },
    shareOfCost: 0.3,
    excludesForSameDevice: ["czystePowietrze"],
    requires: ["newBuild", "deviceOnZumList"],
    source: "Polish market reporting 2026 — UNVERIFIED",
    readOn: "2026-08-19",
  },
  {
    id: "ciepłeMieszkanie",
    nameP1: "Ciepłe Mieszkanie",
    label: "Warm Flat — flats in multi-family buildings",
    appliesTo: ["heatPump", "pelletBoiler"],
    maxByLevel: { basic: 21000, raised: 27000, highest: 37000 },
    shareOfCost: 0.65,
    excludesForSameDevice: ["czystePowietrze"],
    requires: ["replacingKopciuch", "deviceOnZumList"],
    source: "Polish market reporting 2026 — UNVERIFIED",
    readOn: "2026-08-19",
  },
  {
    id: "ulgaTermomodernizacyjna",
    nameP1: "Ulga termomodernizacyjna",
    label: "Thermal-modernisation tax relief",
    appliesTo: ["heatPump", "pelletBoiler", "insulation", "pv"],
    maxByLevel: { basic: 53000, raised: 53000, highest: 53000 },
    shareOfCost: 0.12, // effective cash value: deduction x marginal rate
    excludesForSameDevice: [], // stacks with everything
    requires: [],
    isTaxRelief: true,
    source: "Polish tax code — effective rate depends on the taxpayer's band",
    readOn: "2026-08-19",
  },
];

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
}

export interface SubsidyOutcome {
  /** Grants that reduce the amount to finance. */
  upfrontGrant: Range;
  /** Tax relief, which arrives later and is shown as a separate line. */
  taxRelief: Range;
  /** Every programme considered, applied or not, with the reason. */
  detail: ProgrammeResult[];
}

// --- the engine -------------------------------------------------------------

function missingGates(p: Programme, a: Applicant): EligibilityGate[] {
  return p.requires.filter((g) => !a.gatesSatisfied.includes(g));
}

function valueOf(
  p: Programme,
  level: IncomeLevel,
  eligibleCost: number,
): number {
  const cap = p.maxByLevel[level];
  if (cap === undefined) return 0;
  return Math.min(cap, eligibleCost * p.shareOfCost);
}

/**
 * Work out what a household actually gets for one device.
 *
 * Order matters. Eligibility gates are checked first, then exclusions are
 * resolved by keeping the larger award. Nothing is silently dropped — every
 * programme comes back in `detail` with a reason a person can read.
 */
export function subsidiesFor(
  device: DeviceType,
  eligibleCost: number,
  applicant: Applicant,
  programmes: Programme[] = DEFAULT_PROGRAMMES,
): SubsidyOutcome {
  if (eligibleCost < 0)
    throw new Error("subsidiesFor: eligible cost cannot be negative");

  const candidates = programmes
    .filter((p) => p.appliesTo.includes(device))
    .map((p) => ({
      programme: p,
      value: valueOf(p, applicant.incomeLevel, eligibleCost),
      missing: missingGates(p, applicant),
    }));

  const results: ProgrammeResult[] = [];
  const winners = new Set<string>();

  // Resolve exclusions among the eligible ones, largest award wins.
  const eligible = candidates
    .filter((c) => c.missing.length === 0 && c.value > 0)
    .sort((a, b) => b.value - a.value);

  for (const c of eligible) {
    const blockedBy = c.programme.excludesForSameDevice.find((id) =>
      winners.has(id),
    );
    if (blockedBy) continue;
    winners.add(c.programme.id);
  }

  for (const c of candidates) {
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

  const applied = results.filter((r) => r.applied);
  const sum = (rs: ProgrammeResult[]) =>
    rs.reduce((acc, r) => acc + r.amount.mid, 0);

  const upfront = sum(applied.filter((r) => !r.programme.isTaxRelief));
  const relief = sum(applied.filter((r) => r.programme.isTaxRelief));

  return {
    // Grant caps are stated amounts, so there is little uncertainty in the cap
    // itself. The uncertainty is whether the eligible cost reaches it, which is
    // why a modest band travels forward rather than an exact figure.
    upfrontGrant: scale(range(0.95, 1, 1), upfront),
    taxRelief: scale(range(0.9, 1, 1.1), relief),
    detail: results,
  };
}
