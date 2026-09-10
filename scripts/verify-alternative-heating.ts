/**
 * verify-alternative-heating.ts — an independent audit of Block 2 / Block 3.
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

import { calculateUserBaseline } from "../src/engines/baseline";
import { calculateAllAlternativeHeatingCosts } from "../src/engines/alternativeHeating";
import { HOUSEHOLD_CASE_PRESETS } from "../src/wizard/householdCases";

// Transcribed independently from the sheet's FUEL rows (2026-09-09).
const AIR_TO_AIR_COP = 4.0;
const AIR_TO_WATER_COP = 3.0;
const PELLET = { kwhPerTonne: 4800, efficiency: 0.85, plnPerTonne: 1450 };
const PRICE = { G11: 1.0, G12: 0.7 };

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
    `${preset.name} — useful heat to replace: ${usefulHeat.toFixed(0)} kWh/y, baseline ${zl(baseline.cost.totalPlnPerYear)}/y`,
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
  "\nALTERNATIVE HEATING VERIFICATION — model vs. an independent longhand recomputation",
);
console.log(
  "Constants re-transcribed from the sheet's FUEL rows inside this script.",
);

for (const id of ["grandmaKrysia", "grandpaJanek", "mrsTeresa", "mrMarek"]) {
  audit(id);
}

rule(failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`);
console.log("");
process.exit(failures === 0 ? 0 : 1);
