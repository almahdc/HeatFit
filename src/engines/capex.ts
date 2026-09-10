/**
 * capex.ts — what a replacement costs to buy and install, split into
 * hardware and installation, for the three options `alternativeHeating.ts`
 * already prices to run.
 *
 * Deliberately scoped to equipment cost alone: no grants, no loan repayment,
 * no netting against the running-cost savings those files compute. Those are
 * the next step; this one only answers "what's the sticker price".
 *
 * Source is `constants.pl.ts`, not `sheet.constants.ts` — the sheet's own
 * SCENARIOS tab carries capex as a placeholder column of zeros (coal options
 * are marked "capex in the past"), so there is nothing in the sheet to
 * reproduce here. These are independently sourced Polish market prices, held
 * as low/mid/high bands rather than sheet point values, because capex is
 * genuinely far less certain than a fuel's calorific value: turnkey heat
 * pump quotes vary by more than 2x depending on radiators, sizing and
 * installer. The UI shows the mid figure but should not hide that range.
 *
 * Two of the three totals (`HEAT_PUMP_INSTALLED_COST` for air-to-water,
 * `PELLET_BOILER_INSTALLED_COST`) are already-sourced turnkey bands; this
 * module only adds the hardware/installation SPLIT on top of them, via a
 * separately-sourced installation-share assumption, so the split can be
 * uncertain without disturbing the total. Air-to-water and air-to-air are
 * different jobs (hydronic plumbing vs. a multisplit with no radiator work)
 * priced from different sources — see `AIR_TO_AIR_HP_HARDWARE_COST`'s own
 * comment in constants.pl.ts.
 */

import * as C from "../data/constants.pl";
import type { AlternativeHeatingId } from "./alternativeHeating";

export interface CapexBand {
  lowPln: number;
  midPln: number;
  highPln: number;
}

export interface CapexBreakdown {
  id: AlternativeHeatingId;
  /** Equipment only. */
  hardware: CapexBand;
  /** Labour only. */
  installation: CapexBand;
  /** hardware + installation, band for band — always exact, never rounded independently. */
  totalGross: CapexBand;
  /** Where these numbers come from, for a "why this figure" disclosure in the UI. */
  source: string;
  certainty: "low" | "medium" | "high";
}

function splitByShare(total: C.SourcedBand, installShare: number): CapexBand {
  return {
    lowPln: total.low * installShare,
    midPln: total.mid * installShare,
    highPln: total.high * installShare,
  };
}

function complementByShare(
  total: C.SourcedBand,
  installShare: number,
): CapexBand {
  const hardwareShare = 1 - installShare;
  return {
    lowPln: total.low * hardwareShare,
    midPln: total.mid * hardwareShare,
    highPln: total.high * hardwareShare,
  };
}

function bandOf(source: C.SourcedBand): CapexBand {
  return { lowPln: source.low, midPln: source.mid, highPln: source.high };
}

function sum(a: CapexBand, b: CapexBand): CapexBand {
  return {
    lowPln: a.lowPln + b.lowPln,
    midPln: a.midPln + b.midPln,
    highPln: a.highPln + b.highPln,
  };
}

/** Capex breakdown for one replacement option. Point-in-time market pricing, not tied to a specific household. */
export function calculateCapexBreakdown(
  id: AlternativeHeatingId,
): CapexBreakdown {
  switch (id) {
    case "airToAirHp": {
      const hardware = bandOf(C.AIR_TO_AIR_HP_HARDWARE_COST);
      const installation = bandOf(C.AIR_TO_AIR_HP_INSTALLATION_COST);
      return {
        id,
        hardware,
        installation,
        totalGross: sum(hardware, installation),
        source: `${C.AIR_TO_AIR_HP_HARDWARE_COST.source}; ${C.AIR_TO_AIR_HP_INSTALLATION_COST.source}`,
        certainty: "low",
      };
    }
    case "airToWaterHp": {
      const share = C.HEAT_PUMP_INSTALL_SHARE_OF_TOTAL.value;
      const installation = splitByShare(C.HEAT_PUMP_INSTALLED_COST, share);
      const hardware = complementByShare(C.HEAT_PUMP_INSTALLED_COST, share);
      return {
        id,
        hardware,
        installation,
        totalGross: bandOf(C.HEAT_PUMP_INSTALLED_COST),
        source: `${C.HEAT_PUMP_INSTALLED_COST.source}. Installation share: ${C.HEAT_PUMP_INSTALL_SHARE_OF_TOTAL.source}`,
        certainty: "low",
      };
    }
    case "pellet": {
      const share = C.PELLET_BOILER_INSTALL_SHARE_OF_TOTAL.value;
      const installation = splitByShare(C.PELLET_BOILER_INSTALLED_COST, share);
      const hardware = complementByShare(C.PELLET_BOILER_INSTALLED_COST, share);
      return {
        id,
        hardware,
        installation,
        totalGross: bandOf(C.PELLET_BOILER_INSTALLED_COST),
        source: `${C.PELLET_BOILER_INSTALLED_COST.source}. Installation share: ${C.PELLET_BOILER_INSTALL_SHARE_OF_TOTAL.source}`,
        certainty: "low",
      };
    }
  }
}

/** The official Polish "green devices and materials" database — Lista ZUM. */
export const ZUM_DATABASE_URL =
  "https://lista-zum.ios.edu.pl/bepub/ben001.aspx";
