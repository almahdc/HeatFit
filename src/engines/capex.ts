/**
 * capex.ts — what a replacement heating system costs to buy and install,
 * split into hardware and installation, for the three options
 * `alternativeHeating.ts` already prices to run.
 *
 * Deliberately scoped to equipment cost alone: no grants, no loan repayment,
 * no netting against the running-cost savings those files compute. Those are
 * the next step; this one only answers "what's the sticker price".
 *
 * Source is `constants.pl.ts`, not `sheet.constants.ts`. The sheet DOES carry
 * a capex table (transcribed as `SHEET_CAPEX`; an earlier version of this
 * comment wrongly said it did not, having only seen the scenario columns,
 * which are zeroed for coal because those options are "capex in the past").
 * It is not used here, and the two disagree — the sheet puts air-to-air at
 * 19 000 zł against 12 600 mid below. Both are defensible and neither is
 * quietly reconciled. These are independently sourced Polish market prices, held
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
 *
 * PV is deliberately NOT part of this breakdown — see `calculateSolarAddOn`
 * at the bottom. A household that already has panels is describing a sunk
 * cost that has nothing to do with replacing the heating system, so it does
 * not belong in "what this replacement costs". A household with no panels
 * yet gets a separate, clearly optional add-on line instead of it being
 * folded into this total silently.
 */

import * as C from "../data/constants.pl";
import * as S from "../data/sheet.constants";
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

export interface SolarAddOn {
  /** New spend to fit an array, since this is only ever offered when there isn't one yet. */
  capexPln: number;
  /** The sheet's flat production assumption for a fitted array, kWh/y. */
  productionKwhPerYear: number;
}

/**
 * What adding solar WOULD cost, for a household that does not have it yet.
 *
 * Deliberately has no household parameter: this only makes sense to call at
 * all when `hasPvPanels` is false, and the UI is what decides that — a
 * household already describing panels should never see this, since for them
 * there is nothing new to add.
 */
export function calculateSolarAddOn(): SolarAddOn {
  return {
    capexPln: C.PV_CAPEX_PLN.value,
    productionKwhPerYear: S.SHEET_PV.productionKwhPerYear,
  };
}

/** The official Polish "green devices and materials" database — Lista ZUM. */
export const ZUM_DATABASE_URL =
  "https://lista-zum.ios.edu.pl/bepub/ben001.aspx";
