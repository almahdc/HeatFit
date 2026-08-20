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
    return {
      kind: "tooCloseToCall",
      headline: `${cheapest.label} and ${runnerUp.label} are too close for us to call apart.`,
      because: `Both land somewhere between ${Math.round(
        Math.min(cheapest.duringLoan.low, runnerUp.duringLoan.low),
      )} and ${Math.round(
        Math.max(cheapest.duringLoan.high, runnerUp.duringLoan.high),
      )} zł a month. The gap between them is smaller than what we do not know.`,
      wouldChangeIt: [
        "A firm quote from an installer, which replaces our cost estimate",
        "A fixed-price pellet contract, which is the main reason the range is this wide",
        "Photographs of your radiators, which decide how efficiently a heat pump can run here",
      ],
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
      `About ${Math.round(winner.duringLoan.mid)} zł a month while the loan runs, then ` +
      `${Math.round(winner.afterLoan.mid)} zł a month once it is paid off. ` +
      `You pay ${Math.round(coal.afterLoan.mid)} zł a month for coal today.`,
    wouldChangeIt: [
      "A different loan term moves the monthly figure without changing the total much",
      "Adding solar panels, if the roof suits it",
    ],
  };
}
