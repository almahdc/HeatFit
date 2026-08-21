/**
 * verdict.ts — the sentence the homeowner actually acts on.
 *
 * Rules are evaluated in order and the first match wins. The order matters:
 * "too close to call" comes first, because a ranking produced from overlapping
 * bands is worse than no ranking at all.
 *
 * This module deliberately can return "we cannot tell you yet". A verdict
 * engine that always names a winner is a sales tool.
 */

import { Range, tooCloseToCall } from "./range";
import * as C from "../data/constants.pl";

export type VerdictKind =
  | "insulateFirst"
  | "tooCloseToCall"
  | "wait"
  | "pellet"
  | "heatPump"
  | "heatPumpPlusPv";

export interface ScenarioSummary {
  id: "coal" | "pellet" | "heatPump" | "heatPumpPlusPv";
  label: string;
  /** Loan repayment plus running cost, while the loan runs. */
  duringLoan: Range;
  /** Running cost alone, once the loan is repaid. */
  afterLoan: Range;
}

export interface Verdict {
  kind: VerdictKind;
  /** One sentence, plain language, shown as the headline. */
  headline: string;
  /** Why, in numbers the person can check. */
  because: string;
  /** What would change the answer. Never leave someone with a bare "no". */
  wouldChangeIt: string[];
}

export interface VerdictInput {
  scenarios: ScenarioSummary[];
  /** Useful heat demand per square metre per year. */
  demandPerM2: Range;
  /** Months until the boiler must legally be replaced, if known. */
  monthsUntilDeadline?: number;
}

/** Nearest 10 zł. These bands are hundreds of złoty wide; printing a single
 *  złoty of precision on top of that claims accuracy we do not have. */
function zlRounded(n: number): string {
  return String(Math.round(n / 10) * 10);
}

function width(r: Range): number {
  return r.high - r.low;
}

/** Lowercase a label for mid-sentence use, without touching acronyms like PV. */
function lower(label: string): string {
  return label === label.toUpperCase() ? label : label.toLowerCase();
}

/**
 * Names the source of the fog on the wider of the two bands. This is the part
 * that makes "too close to call" useful rather than defeatist: the household
 * learns which uncertainty is theirs to close and which is nobody's.
 */
function vagueness(wider: ScenarioSummary): string {
  switch (wider.id) {
    case "pellet":
      return (
        "The pellet range is the wide one, because nobody can quote you a pellet price " +
        "for the years you would be burning it. That range does not narrow with better information."
      );
    case "heatPump":
    case "heatPumpPlusPv":
      return (
        "The heat pump range is the wide one, because we are estimating how efficiently " +
        "it would run on your radiators. That range narrows as soon as we see them."
      );
    default:
      return "The wider range does not narrow with better information.";
  }
}

/**
 * Difference against what they pay today, in the words they would use.
 *
 * Computed from the ROUNDED values, not the raw mids, so a household that
 * subtracts the two printed numbers by hand gets our answer exactly. A delta
 * they cannot reproduce is worse than no delta.
 *
 * Deliberately a single number with no band. The uncertainty lives in the two
 * absolute ranges this is derived from; restating it here would compound two
 * bands that share most of their inputs, and overstate what we do not know.
 */
function vsToday(option: number, today: number): string {
  const d = Math.round(option) - Math.round(today);
  if (Math.abs(d) < 20) return "about what you pay today";
  return d > 0
    ? `${Math.abs(d)} zł a month more than today`
    : `${Math.abs(d)} zł a month less than today`;
}

/**
 * Hints for the tie case. Driven by the SAME `wider` scenario that vagueness()
 * describes, so the paragraph and the list can never contradict each other.
 * Ordered most-actionable first: the thing that closes the gap, then the thing
 * that does not.
 */
/**
 * Heat pump with and without panels are tied on monthly cost.
 *
 * This is not a tie between two heating systems. It is one heating system and
 * an optional roof. So the verdict settles heating and reframes solar as a
 * second, separate decision — which is what a neighbour would actually say.
 *
 * The honesty constraint here is severe, because the PV saving is the least
 * trustworthy number this model produces:
 *
 *   NET BILLING. Poland replaced net metering in 2022. Exported kWh are
 *     deposited at market price and drawn back at retail, so an exported unit
 *     is worth far less than one you never bought. runningCost.ts models PV as
 *     a flat kWh offset at retail and says in its own comment that this is
 *     optimistic. Until pv.ts exists, the saving quoted here is a ceiling.
 *
 *   SEASONAL MISMATCH. Polish PV yields a few percent of its annual output in
 *     December and January — exactly when a heat pump draws hardest. Without a
 *     battery, panels do not cover winter heating. Any claim of independence
 *     from the grid would be false.
 *
 * So: state the after-loan gap, then immediately state that it is a ceiling and
 * why. A number offered without its ceiling is a sales number.
 */
function pvAddOnVerdict(
  hp: ScenarioSummary,
  hpPv: ScenarioSummary,
  coal: ScenarioSummary,
): Verdict {
  const afterGap =
    Math.round(hp.afterLoan.mid) - Math.round(hpPv.afterLoan.mid);

  return {
    kind: "tooCloseToCall",
    headline:
      "The heat pump is the answer. Panels are a separate decision.",
    because:
      `With or without panels you pay about the same each month while the loan runs, ` +
      `${Math.round(hp.duringLoan.mid)} zł against ${Math.round(hpPv.duringLoan.mid)} zł, ` +
      `because the panels are inside the same loan. ` +
      (afterGap >= 20
        ? `Once it is repaid the panels could save around ${afterGap} zł a month. ` +
          `Treat that as the best case, not the expected one: since 2022 Poland pays you ` +
          `market price for what you export and charges you retail for what you take back, ` +
          `and we do not model that yet. Panels also produce almost nothing in December and ` +
          `January, which is when the heat pump works hardest.`
        : `Once it is repaid the difference is too small for us to call. ` +
          `We would not add panels on these numbers alone.`),
    wouldChangeIt: [
      "Deciding the heat pump first, the panels can be added later, on their own budget",
      "A battery, which is what actually turns panels into winter heating",
      "Your real electricity bill, which tells us how much of the year you are at home",
    ],
  };
}

function hintsForTie(wider: ScenarioSummary): string[] {
  const quote = "A firm quote from an installer, which replaces our cost estimate";
  const radiators =
    "Photographs of your radiators, which decide how efficiently a heat pump can run here";
  const pelletPrice =
    "A fixed-price pellet contract, the only thing that narrows the pellet range";

  return wider.id === "pellet"
    ? [pelletPrice, quote, radiators]
    : [radiators, quote, pelletPrice];
}

function byId(s: ScenarioSummary[], id: ScenarioSummary["id"]) {
  const found = s.find((x) => x.id === id);
  if (!found) throw new Error(`verdict: missing scenario ${id}`);
  return found;
}

export function verdict(input: VerdictInput): Verdict {
  const { scenarios, demandPerM2 } = input;

  const coal = byId(scenarios, "coal");
  const pellet = byId(scenarios, "pellet");
  const hp = byId(scenarios, "heatPump");
  const hpPv = byId(scenarios, "heatPumpPlusPv");

  // 1. A leaky house makes the heat-source question premature.
  if (demandPerM2.mid > C.INSULATE_FIRST_THRESHOLD.value) {
    return {
      kind: "insulateFirst",
      headline: "Insulate before you choose a heat source.",
      because:
        `Your house uses about ${Math.round(demandPerM2.mid)} kWh per square metre a year. ` +
        `Above ${C.INSULATE_FIRST_THRESHOLD.value} you would be buying a machine bigger than ` +
        `you need, and paying for that size every month for fifteen years.`,
      wouldChangeIt: [
        "Insulating the roof and walls first, then running this again",
        "The grant covers insulation too, so it does not have to be a separate cost",
      ],
    };
  }

  // 2. Overlapping bands: no ranking.
  const contenders = [pellet, hp, hpPv];
  const cheapest = [...contenders].sort(
    (a, b) => a.duringLoan.mid - b.duringLoan.mid,
  )[0]!;
  const runnerUp = [...contenders]
    .filter((s) => s.id !== cheapest.id)
    .sort((a, b) => a.duringLoan.mid - b.duringLoan.mid)[0]!;

  if (tooCloseToCall(cheapest.duringLoan, runnerUp.duringLoan)) {
    // Special case: the two tied options are the same machine. A tie between
    // "heat pump" and "heat pump plus PV" is not a choice between two heating
    // systems — same unit, same install, same radiators, only panels differ.
    // Refusing to rank them leaves the household believing the heating decision
    // is unresolved when it is not. Settle heating, hand them solar separately.
    const ids = [cheapest.id, runnerUp.id];
    if (ids.includes("heatPump") && ids.includes("heatPumpPlusPv")) {
      return pvAddOnVerdict(hp, hpPv, coal);
    }

    // Do NOT union the two bands into one range. min(low)..max(high) across two
    // scenarios spans far more than either option actually does, and reads as
    // "we know nothing". State each band, then name which one is the vague one
    // and why — that is the sentence the household can act on.
    const wider =
      width(cheapest.duringLoan) >= width(runnerUp.duringLoan)
        ? cheapest
        : runnerUp;

    return {
      kind: "tooCloseToCall",
      headline: `${cheapest.label} and ${runnerUp.label} are too close for us to call apart.`,
      because:
        `${cheapest.label} lands between ${zlRounded(cheapest.duringLoan.low)} and ` +
        `${zlRounded(cheapest.duringLoan.high)} zł a month, ${lower(runnerUp.label)} between ` +
        `${zlRounded(runnerUp.duringLoan.low)} and ${zlRounded(runnerUp.duringLoan.high)} zł. ` +
        `They overlap too much to rank. ${vagueness(wider)} ` +
        `Both figures are the loan repayment plus the heating bill, after grants; ` +
        `tax relief is not in them, because it comes back through your tax return years later.`,
      wouldChangeIt: hintsForTie(wider),
    };
  }

  // 3. Nothing beats coal, and there is time.
  const nothingBeatsCoal = contenders.every(
    (s) => s.afterLoan.mid >= coal.afterLoan.mid,
  );
  if (nothingBeatsCoal && (input.monthsUntilDeadline ?? 0) > 12) {
    return {
      kind: "wait",
      headline: "Nothing here pays for itself yet.",
      because:
        "Every option costs more to run than the coal you burn today, even after the loan " +
        "ends. Replacing now would mean paying more, not less.",
      wouldChangeIt: [
        "Larger radiators, which let a heat pump run cooler and cheaper",
        "Moving to a night-and-weekend tariff",
        "Insulation, which shrinks every bill at once",
      ],
    };
  }

  // 4. A winner, named by what it costs after the loan is repaid.
  const winner = [...contenders].sort(
    (a, b) => a.afterLoan.mid - b.afterLoan.mid,
  )[0]!;
  const kind: VerdictKind =
    winner.id === "pellet"
      ? "pellet"
      : winner.id === "heatPumpPlusPv"
        ? "heatPumpPlusPv"
        : "heatPump";

  return {
    kind,
    headline: `${winner.label} is the cheapest option over its lifetime.`,
    because:
      `${capitalise(vsToday(winner.duringLoan.mid, coal.afterLoan.mid))} while the loan runs, ` +
      `then ${vsToday(winner.afterLoan.mid, coal.afterLoan.mid)} once it is paid off. ` +
      `That is ${Math.round(winner.duringLoan.mid)} zł, then ` +
      `${Math.round(winner.afterLoan.mid)} zł a month, against the ` +
      `${Math.round(coal.afterLoan.mid)} zł you pay for coal today.`,
    wouldChangeIt: [
      "A different loan term moves the monthly figure without changing the total much",
      "Adding solar panels, if the roof suits it",
    ],
  };
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
