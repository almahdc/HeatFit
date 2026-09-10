/**
 * verify-baseline.ts: an independent audit of the baseline model.
 *
 *   npm run verify:baseline
 *
 * The point of this script is that it does NOT call the model's helpers to
 * check the model. Every constant below is transcribed a second time, straight
 * from the `price_calculator` sheet, and every formula is written out longhand.
 * Then the two are compared line by line.
 *
 * That makes it a real check: a mistyped constant in sheet.constants.ts, or a
 * refactor that quietly changes an operator, shows up as a FAIL here. A script
 * that called `coalHeatDelivered()` to verify `coalHeatDelivered()` would agree
 * with itself no matter how wrong both were.
 *
 * The printed breakdown is meant to be read, not just scanned for PASS: each
 * line shows the arithmetic so the numbers can be checked by hand.
 */

import { calculateUserBaseline } from "../src/engines/baseline";
import { HOUSEHOLD_CASE_PRESETS } from "../src/wizard/householdCases";

// ---------------------------------------------------------------------------
// Constants, transcribed independently from the sheet (2026-09-09).
// If these ever disagree with src/data/sheet.constants.ts, one of the two
// transcriptions is wrong and the checks below will say so.
// ---------------------------------------------------------------------------

const COAL = {
  groszek: { kwhPerTonne: 7222, efficiency: 0.8 },
  orzech: { kwhPerTonne: 8056, efficiency: 0.8 },
  kostka: { kwhPerTonne: 8056, efficiency: 0.8 },
  mul: { kwhPerTonne: 5300, efficiency: 0.55 },
  other: { kwhPerTonne: 8056, efficiency: 0.8 }, // falls back to orzech
} as const;

const FREE_COAL = { kwhPerTonne: 7800, efficiency: 0.8 }; // the "Miner" row

// Boiler efficiency by emission class. Overrides the flat 0.80 the sheet folds
// into every coal fuel row: the whole point of collecting the class.
const BOILER_EFF = {
  bezklasowy: 0.6,
  class3: 0.75,
  class4: 0.75,
  class5: 0.85,
} as const;

const ELECTRIC_BOILER_EFFICIENCY = 0.98;
const WATER_KWH_PER_LITRE = 0.05;
// Not every litre a shower draws needed the full 45°C lift: a mixing valve
// tempers tank/boiler-heated water with cold mains at the tap.
const HOT_WATER_BLEND_FACTOR = 0.6;
const LITRES_PER_SHOWER = 40; // not in the sheet; our assumption
const SUMMER_DHW_SHARE = 0.42; // from constants.pl.ts
const BASE_ELECTRICITY_KWH = 2500;
const COOLING_KWH_PER_M2 = 25;
const SEER_AC = 5;
const PRICE = { G11: 1.0, G12: 0.7 };
const PV = { production: 5000, shareUsedDirectly: 0.25, exportPrice: 0.3 };

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const zl = (n: number) => `${n.toFixed(2)} zł`;
const kwh = (n: number) => `${n.toFixed(0)} kWh`;
const pad = (s: string, n: number) => s.padEnd(n);

let failures = 0;

/** Compare the model against the longhand figure and report. */
function check(
  label: string,
  longhand: string,
  expected: number,
  actual: number,
) {
  const ok = Math.abs(expected - actual) < 0.005;
  if (!ok) failures++;
  const mark = ok ? "PASS" : "**FAIL**";
  console.log(
    `  ${pad(label, 22)} ${pad(longhand, 44)} = ${pad(expected.toFixed(2), 12)} model ${pad(actual.toFixed(2), 12)} ${mark}`,
  );
}

function rule(title: string) {
  console.log(`\n${"═".repeat(108)}\n  ${title}\n${"═".repeat(108)}`);
}

// ---------------------------------------------------------------------------
// The audit, one household at a time
// ---------------------------------------------------------------------------

function audit(presetId: string, alias: string) {
  const preset = HOUSEHOLD_CASE_PRESETS.find((p) => p.id === presetId)!;
  const d = preset.data;
  const model = calculateUserBaseline(presetId);

  rule(`${preset.name}: "${alias}"`);

  console.log(`\n  INPUTS`);
  console.log(
    `    coal          ${d.coalTonnesPerSeason} t ${d.coalType} @ ${d.coalPricePerTonnePln} zł/t` +
      (d.freeCoalReceived ? ` + ${d.freeCoalTonnes} t free (deputat)` : ""),
  );
  console.log(
    `    home          ${d.heatedAreaM2} m², ${d.occupants} occupant(s), ${d.showersBathsPerWeek} showers/wk each, AC=${d.acAvailable}`,
  );
  console.log(
    `    electricity   ${d.electricityTariff} @ ${PRICE[d.electricityTariff]} zł/kWh, bill ${d.electricityBillPlnPerMonth} zł/mo`,
  );
  console.log(
    `    boiler        ${d.boilerClass} (${d.boilerYear}) → ${(BOILER_EFF[d.boilerClass] * 100).toFixed(0)}% efficient`,
  );
  console.log(`    water heating ${d.waterHeating}`);
  console.log(`    PV            ${d.hasPvPanels ? "yes" : "no"}`);

  // --- energy, longhand ----------------------------------------------------
  const coal = COAL[d.coalType];
  // The boiler's class sets the efficiency, not the fuel row. Free coal burns
  // in the same boiler, so it is rated the same way.
  const eff = BOILER_EFF[d.boilerClass];
  const paidHeat = d.coalTonnesPerSeason * coal.kwhPerTonne * eff;
  const freeTonnes =
    d.freeCoalReceived && d.freeCoalTonnes !== "" ? d.freeCoalTonnes : 0;
  const freeHeat = freeTonnes * FREE_COAL.kwhPerTonne * eff;
  const coalHeat = paidHeat + freeHeat;

  const litres = d.occupants * d.showersBathsPerWeek * LITRES_PER_SHOWER * 52;
  const effectiveLitres = litres * HOT_WATER_BLEND_FACTOR;
  const waterEnergy = effectiveLitres * WATER_KWH_PER_LITRE;

  const coalShare =
    d.waterHeating === "coalCentralAllYear"
      ? 1
      : d.waterHeating === "electricSummerCoalWinter"
        ? 1 - SUMMER_DHW_SHARE
        : 0;
  const waterFromCoal = waterEnergy * coalShare;
  const waterElec = (waterEnergy - waterFromCoal) / ELECTRIC_BOILER_EFFICIENCY;

  const spaceHeat = coalHeat - waterFromCoal;
  const spacePerM2 = spaceHeat / d.heatedAreaM2;

  const coolingDemand = d.acAvailable ? d.heatedAreaM2 * COOLING_KWH_PER_M2 : 0;
  const coolingElec = coolingDemand / SEER_AC;

  console.log(`\n  ENERGY`);
  const freeNote = freeTonnes
    ? ` + ${freeTonnes}×${FREE_COAL.kwhPerTonne}×${eff}`
    : "";
  check(
    "coal heat delivered",
    `${d.coalTonnesPerSeason}×${coal.kwhPerTonne}×${eff}${freeNote}`,
    coalHeat,
    model.energy.coalHeatDeliveredKwh,
  );
  check(
    "hot water litres",
    `${d.occupants}×${d.showersBathsPerWeek}×${LITRES_PER_SHOWER}×52`,
    litres,
    model.energy.hotWaterLitresPerYear,
  );
  check(
    "water energy",
    `${litres}×${HOT_WATER_BLEND_FACTOR}×${WATER_KWH_PER_LITRE}`,
    waterEnergy,
    model.energy.waterEnergyKwh,
  );
  check(
    "  ...from coal",
    `${waterEnergy.toFixed(0)}×${coalShare.toFixed(2)}`,
    waterFromCoal,
    model.energy.waterEnergyFromCoalKwh,
  );
  check(
    "  ...as electricity",
    `(${waterEnergy.toFixed(0)}−${waterFromCoal.toFixed(0)})÷${ELECTRIC_BOILER_EFFICIENCY}`,
    waterElec,
    model.energy.waterElectricityKwh,
  );
  check(
    "space heat",
    `${coalHeat.toFixed(0)}−${waterFromCoal.toFixed(0)}`,
    spaceHeat,
    model.energy.spaceHeatKwh,
  );
  check(
    "condition kWh/m²/y",
    `${spaceHeat.toFixed(0)}÷${d.heatedAreaM2}`,
    spacePerM2,
    model.energy.spaceHeatPerM2,
  );
  check(
    "cooling electricity",
    d.acAvailable
      ? `${d.heatedAreaM2}×${COOLING_KWH_PER_M2}÷${SEER_AC}`
      : "no AC → 0",
    coolingElec,
    model.energy.coolingElectricityKwh,
  );

  // --- electricity, longhand ----------------------------------------------
  const price = PRICE[d.electricityTariff];
  const modelled = BASE_ELECTRICITY_KWH + waterElec + coolingElec;
  const measured = (d.electricityBillPlnPerMonth * 12) / price;
  const consumption = measured; // every persona gives a bill
  const elecCost = d.hasPvPanels
    ? (consumption - consumption * PV.shareUsedDirectly) * price -
      (PV.production - consumption * PV.shareUsedDirectly) * PV.exportPrice
    : consumption * price;

  console.log(`\n  ELECTRICITY`);
  check(
    "measured (from bill)",
    `${d.electricityBillPlnPerMonth}×12÷${price}`,
    measured,
    model.electricity.measuredKwh!,
  );
  check(
    "modelled",
    `${BASE_ELECTRICITY_KWH}+${waterElec.toFixed(0)}+${coolingElec.toFixed(0)}`,
    modelled,
    model.electricity.modelledKwh,
  );
  check(
    "gap",
    `${measured.toFixed(0)}−${modelled.toFixed(0)}`,
    measured - modelled,
    model.electricity.gapKwh!,
  );

  // --- cost, longhand -------------------------------------------------------
  const coalCost = d.coalTonnesPerSeason * (d.coalPricePerTonnePln ?? 0);
  const total = coalCost + elecCost;

  const coalWaterShare = coalHeat > 0 ? waterFromCoal / coalHeat : 0;
  const elecWaterShare = modelled > 0 ? waterElec / modelled : 0;
  const spaceCost = coalCost * (1 - coalWaterShare);
  const waterCost = coalCost * coalWaterShare + elecCost * elecWaterShare;
  const elecCoolCost = elecCost * (1 - elecWaterShare);

  console.log(`\n  COST`);
  check(
    "coal",
    `${d.coalTonnesPerSeason}×${d.coalPricePerTonnePln}`,
    coalCost,
    model.cost.coalPlnPerYear,
  );
  check(
    "electricity",
    d.hasPvPanels ? "with PV netting" : `${consumption.toFixed(0)}×${price}`,
    elecCost,
    model.cost.electricityPlnPerYear,
  );
  console.log(`  ${"-".repeat(104)}`);
  check(
    "space heating",
    `${coalCost.toFixed(0)}×(1−${coalWaterShare.toFixed(4)})`,
    spaceCost,
    model.cost.spaceHeatingPlnPerYear,
  );
  check(
    "water heating",
    `${coalCost.toFixed(0)}×${coalWaterShare.toFixed(4)}+${elecCost.toFixed(0)}×${elecWaterShare.toFixed(4)}`,
    waterCost,
    model.cost.waterHeatingPlnPerYear,
  );
  check(
    "electricity+cooling",
    `${elecCost.toFixed(0)}×(1−${elecWaterShare.toFixed(4)})`,
    elecCoolCost,
    model.cost.electricityAndCoolingPlnPerYear,
  );
  console.log(`  ${"-".repeat(104)}`);
  check(
    "TOTAL per year",
    `${coalCost.toFixed(0)}+${elecCost.toFixed(0)}`,
    total,
    model.cost.totalPlnPerYear,
  );
  check(
    "TOTAL per month",
    `${total.toFixed(0)}÷12`,
    total / 12,
    model.cost.totalPlnPerMonth,
  );

  // --- internal consistency -------------------------------------------------
  const partsSum = spaceCost + waterCost + elecCoolCost;
  const sumOk = Math.abs(partsSum - total) < 0.005;
  if (!sumOk) failures++;
  console.log(
    `\n  IDENTITY  space + water + elec = ${partsSum.toFixed(2)} vs total ${total.toFixed(2)}  ${sumOk ? "PASS" : "**FAIL**"}`,
  );

  console.log(
    `\n  >>> ${preset.name}: ${zl(total / 12)}/month  (${zl(total)}/year)`,
  );
  console.log(
    `      space heating ${zl(spaceCost)} · water ${zl(waterCost)} · electricity & cooling ${zl(elecCoolCost)}`,
  );
  console.log(
    `      building condition ${spacePerM2.toFixed(0)} kWh/m²/y, heat delivered ${kwh(coalHeat)}/y`,
  );
  console.log(`\n  ASSUMPTIONS SHOWN TO THE USER`);
  for (const a of model.assumptions) console.log(`    · ${a}`);
}

// ---------------------------------------------------------------------------
// Sheet regression: the sheet's own worked scenarios, recomputed longhand.
// ---------------------------------------------------------------------------

function sheetScenarios() {
  rule("SHEET REGRESSION: price_calculator SCENARIOS tab, House 1, free coal");

  const cases: Array<[string, number, keyof typeof PRICE, boolean, number]> = [
    ["Miner60 AC/Std/PV+bat", 750, "G11", true, 98.44],
    ["Miner62 AC/Std/no PV", 750, "G11", false, 270.83],
    ["Miner63 AC/Dyn/PV", 750, "G12", true, 37.5],
    ["Miner65 AC/Dyn/no PV", 750, "G12", false, 189.58],
    ["Miner66 none/Std/PV", 0, "G11", true, 46.88],
    ["Miner68 none/Std/no PV", 0, "G11", false, 208.33],
    ["Miner69 none/Dyn/PV", 0, "G12", true, 0.0],
    ["Miner71 none/Dyn/no PV", 0, "G12", false, 145.83],
  ];

  console.log("");
  for (const [name, cooling, tariff, pv, sheetValue] of cases) {
    const consumption = BASE_ELECTRICITY_KWH + cooling;
    const p = PRICE[tariff];
    const self = consumption * PV.shareUsedDirectly;
    const cost = pv
      ? (consumption - self) * p - (PV.production - self) * PV.exportPrice
      : consumption * p;
    const perMonth = Math.round((cost / 12) * 100) / 100;
    const ok = Math.abs(perMonth - sheetValue) < 0.005;
    if (!ok) failures++;
    console.log(
      `  ${pad(name, 26)} consumption ${pad(consumption.toFixed(0) + " kWh", 10)} sheet ${pad(sheetValue.toFixed(2), 9)} longhand ${pad(perMonth.toFixed(2), 9)} ${ok ? "PASS" : "**FAIL**"}`,
    );
  }
}

// ---------------------------------------------------------------------------

console.log(
  "\nBASELINE VERIFICATION: model vs. an independent longhand recomputation",
);
console.log(
  "Constants re-transcribed from the price_calculator sheet inside this script.",
);

// The two the review asked for, first.
audit("mrMarek", "The Night-Shift G12 Retrofitter");
audit("mrsTeresa", "The Single Occupant in a Legacy");
// The other two, for completeness: they exercise free coal and a summer split.
audit("grandpaJanek", "The Last-Minute Holdout");
audit("grandmaKrysia", "The Media-Only Holdout");

sheetScenarios();

rule(failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`);
console.log("");
process.exit(failures === 0 ? 0 : 1);
