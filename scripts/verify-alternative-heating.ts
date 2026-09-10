/**
 * verify-alternative-heating.ts: an independent audit of Block 2 / Block 3.
 *
 *   npm run verify:alternatives
 *
 * Same discipline as verify-baseline.ts: every constant here is transcribed a
 * second time from the sheet's FUEL rows, and every formula is written out
 * longhand, then compared against the engine's own output line by line. A
 * script that called `calculateAlternativeHeatingCost()` to check
 * `calculateAlternativeHeatingCost()` would agree with itself no matter how
 * wrong both were.
 */

import {
  calculateBaseline,
  calculateUserBaseline,
} from "../src/engines/baseline";
import {
  calculateAlternativeHeatingCost,
  calculateAllAlternativeHeatingCosts,
} from "../src/engines/alternativeHeating";
import {
  calculateCapexBreakdown,
  calculateSolarAddOn,
} from "../src/engines/capex";
import { HOUSEHOLD_CASE_PRESETS } from "../src/wizard/householdCases";

// Transcribed independently from the sheet's FUEL rows (2026-09-09).
const AIR_TO_AIR_COP = 4.0;
const AIR_TO_WATER_COP = 3.0;
const PELLET = { kwhPerTonne: 4800, efficiency: 0.85, plnPerTonne: 1450 };
const PRICE = { G11: 1.0, G12: 0.7 };
const PV = { production: 5000, shareUsedDirectly: 0.25, exportPrice: 0.3 };
const PV_CAPEX_PLN = 30000;

const zl = (n: number) => `${n.toFixed(2)} zł`;
const pad = (s: string, n: number) => s.padEnd(n);

let failures = 0;

function check(label: string, expected: number, actual: number) {
  const ok = Math.abs(expected - actual) < 0.005;
  if (!ok) failures++;
  console.log(
    `    ${pad(label, 24)} longhand ${pad(expected.toFixed(2), 12)} model ${pad(actual.toFixed(2), 12)} ${ok ? "PASS" : "**FAIL**"}`,
  );
}

function rule(title: string) {
  console.log(`\n${"═".repeat(96)}\n  ${title}\n${"═".repeat(96)}`);
}

function audit(presetId: string) {
  const preset = HOUSEHOLD_CASE_PRESETS.find((p) => p.id === presetId)!;
  const baseline = calculateUserBaseline(presetId);
  const results = calculateAllAlternativeHeatingCosts(
    baseline,
    preset.data.electricityTariff,
  );
  const price = PRICE[preset.data.electricityTariff];
  const usefulHeat = baseline.energy.spaceHeatKwh;

  rule(
    `${preset.name}: useful heat to replace: ${usefulHeat.toFixed(0)} kWh/y, baseline ${zl(baseline.cost.totalPlnPerYear)}/y`,
  );

  for (const result of results) {
    console.log(`\n  ${result.name}`);
    let fuel: number;
    let spaceHeatingCost: number;
    if (result.id === "pellet") {
      fuel = usefulHeat / (PELLET.kwhPerTonne * PELLET.efficiency);
      spaceHeatingCost = fuel * PELLET.plnPerTonne;
    } else {
      const cop =
        result.id === "airToAirHp" ? AIR_TO_AIR_COP : AIR_TO_WATER_COP;
      fuel = usefulHeat / cop;
      spaceHeatingCost = fuel * price;
    }
    check(
      result.id === "pellet" ? "pellet tonnes" : "electricity kWh",
      fuel,
      result.fuelPerYear,
    );
    check(
      "space heating cost",
      spaceHeatingCost,
      result.spaceHeatingPlnPerYear,
    );

    const total =
      spaceHeatingCost +
      baseline.cost.waterHeatingPlnPerYear +
      baseline.cost.electricityAndCoolingPlnPerYear;
    check("total per year", total, result.totalPlnPerYear);
    check("total per month", total / 12, result.totalPlnPerMonth);

    const savings = baseline.cost.totalPlnPerYear - total;
    check("savings per year", savings, result.savingsPlnPerYear);

    const verb = savings >= 0 ? "saves" : "costs";
    console.log(
      `    >>> ${result.name} ${verb} ${zl(Math.abs(savings / 12))}/month vs coal (${zl(Math.abs(savings))}/year)`,
    );
  }
}

console.log(
  "\nALTERNATIVE HEATING VERIFICATION: model vs. an independent longhand recomputation",
);
console.log(
  "Constants re-transcribed from the sheet's FUEL rows inside this script.",
);

for (const id of ["grandmaKrysia", "grandpaJanek", "mrsTeresa", "mrMarek"]) {
  audit(id);
}

// ---------------------------------------------------------------------------
// PV: synthetic, since none of the four personas has panels. Same household
// as Mrs. Teresa, once without PV and once with, so the only thing that can
// move between the two runs is PV itself.
// ---------------------------------------------------------------------------

function auditPv() {
  rule("PV: synthetic household (Mrs. Teresa's numbers, PV toggled)");

  const inputs = {
    heatedAreaM2: 130,
    occupants: 1,
    showersBathsPerWeek: 4,
    acAvailable: false,
    coalType: "kostka" as const,
    boilerClass: "class3" as const,
    coalTonnesPerSeason: 4.5,
    coalPricePerTonnePln: 1400,
    electricityTariff: "G11" as const,
    electricityBillPlnPerMonth: 150,
    waterHeating: "coalCentralAllYear" as const,
  };

  const baselineNoPv = calculateBaseline(inputs);
  const baselineWithPv = calculateBaseline({ ...inputs, hasPvPanels: true });

  const usefulHeat = baselineWithPv.energy.spaceHeatKwh;
  const price = PRICE.G11;
  const kwh = usefulHeat / AIR_TO_AIR_COP;
  const flatCost = kwh * price;

  // Longhand: price the household's existing meter reading with and without
  // the heat pump's new draw, PV self-consumption and export applied to the
  // WHOLE pool both times: the same electricityCost() formula baseline.ts
  // uses, re-typed here rather than called.
  function longhandElectricityCost(consumptionKwh: number): number {
    const selfConsumed = consumptionKwh * PV.shareUsedDirectly;
    const imported = (consumptionKwh - selfConsumed) * price;
    const exported = (PV.production - selfConsumed) * PV.exportPrice;
    return imported - exported;
  }

  const existingKwh =
    baselineWithPv.electricity.measuredKwh ??
    baselineWithPv.electricity.modelledKwh;

  // The PV production constant CANCELS OUT of the marginal-cost subtraction
  // below (it appears identically on both sides), so that check alone cannot
  // catch a fault in it. Check it directly here first, against the
  // baseline's own absolute (non-marginal) PV-netted electricity cost, which
  // has no such cancellation.
  check(
    "baseline electricity cost, PV-netted (sanity check on PV.production itself)",
    longhandElectricityCost(existingKwh),
    baselineWithPv.cost.electricityPlnPerYear,
  );

  const marginalCost =
    longhandElectricityCost(existingKwh + kwh) -
    longhandElectricityCost(existingKwh);

  console.log(`\n  Air-to-air heat pump, no PV`);
  const resultNoPv = calculateAlternativeHeatingCost(
    "airToAirHp",
    baselineNoPv,
    "G11",
    undefined,
    false,
  );
  check("space heating cost", kwh * price, resultNoPv.spaceHeatingPlnPerYear);
  check("PV saving", 0, resultNoPv.pvSavingsOnSpaceHeatingPlnPerYear);

  console.log(`\n  Air-to-air heat pump, with PV`);
  const resultWithPv = calculateAlternativeHeatingCost(
    "airToAirHp",
    baselineWithPv,
    "G11",
    undefined,
    true,
  );
  check(
    "space heating cost (marginal)",
    marginalCost,
    resultWithPv.spaceHeatingPlnPerYear,
  );
  check(
    "PV saving",
    flatCost - marginalCost,
    resultWithPv.pvSavingsOnSpaceHeatingPlnPerYear,
  );
  console.log(
    `    >>> PV cuts the heat pump's own electricity cost from ${zl(flatCost)} to ${zl(marginalCost)}/year`,
  );

  console.log(`\n  Pellet boiler, with PV: should be untouched`);
  const pelletWithPv = calculateAlternativeHeatingCost(
    "pellet",
    baselineWithPv,
    "G11",
    undefined,
    true,
  );
  check("PV saving", 0, pelletWithPv.pvSavingsOnSpaceHeatingPlnPerYear);

  // --- Solar add-on -----------------------------------------------------------
  // Solar is deliberately NOT part of calculateCapexBreakdown at all: a
  // household with existing panels has nothing new to cost out, and one
  // without them gets a separate, opt-in add-on rather than a silently
  // inflated heating total. See capex.ts's own header comment.
  rule("Solar add-on (only offered when the household has no PV yet)");

  const heatingCapex = calculateCapexBreakdown("airToAirHp");
  const solar = calculateSolarAddOn();

  check(
    "calculateCapexBreakdown ignores PV entirely",
    heatingCapex.hardware.midPln + heatingCapex.installation.midPln,
    heatingCapex.totalGross.midPln,
  );
  check("solar add-on capex", PV_CAPEX_PLN, solar.capexPln);
  check("solar add-on production", PV.production, solar.productionKwhPerYear);
  console.log(
    `    >>> Heating alone ${zl(heatingCapex.totalGross.midPln)}; adding solar would be +${zl(solar.capexPln)} more`,
  );
}

auditPv();

rule(failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`);
console.log("");
process.exit(failures === 0 ? 0 : 1);
