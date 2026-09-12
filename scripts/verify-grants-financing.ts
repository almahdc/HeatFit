/**
 * verify-grants-financing.ts: an independent audit of Block 5 / Block 6.
 *
 *   npm run verify:financing
 *
 * Same discipline as verify-baseline.ts and verify-alternative-heating.ts:
 * every constant here is transcribed a SECOND time, by hand, from the sheet's
 * `subsidies` tab and the `price_calculator` GRANT / loan blocks, and every
 * formula is written out longhand before being compared against the engine.
 * A script that imported the engine's own constants to check the engine would
 * agree with itself no matter how wrong both were.
 *
 * The strongest check here is the last one: the sheet's own `final` tab row
 * for gas194 is reproduced end to end, so the loan formula is pinned against a
 * number the spreadsheet computed itself rather than one we chose.
 */

import {
  calculateGrant,
  incomeTierFor,
  scopeBandFor,
} from "../src/engines/grants";
import {
  calculateLoan,
  sheetMonthlyCapex,
  trueMonthlyCost,
  LOAN_OPTIONS,
  DEFAULT_LOAN_TERMS,
} from "../src/engines/loan";
import type { AlternativeHeatingId } from "../src/engines/alternativeHeating";

// --- transcribed by hand from the sheet, 2026-09-10 -------------------------

/** subsidies tab, "2 Heat source" rows: basic / increased / highest. */
const CAPS: Record<string, [number, number, number]> = {
  H3: [14080, 24640, 35200], // air/water HP, increased efficiency class
  H4: [4480, 7840, 11200], // air-to-air HP
  H7: [8200, 14350, 20500], // wood pellet boiler, higher standard
};
const LINE_FOR: Record<AlternativeHeatingId, string> = {
  airToWaterHp: "H3",
  airToAirHp: "H4",
  pellet: "H7",
};
/** subsidies tab rows 28-30. */
const RATE = { basic: 0.4, increased: 0.7, highest: 1.0 };
/** price_calculator GRANT block row 407. */
const PV_RATE = { basic: 0.12, increased: 0.2, highest: 0.32 };
/** price_calculator rows 411-413. */
const LOANS = [
  { years: 15, interest: 0.1 },
  { years: 10, interest: 0.09 },
  { years: 5, interest: 0.07 },
];
/** price_calculator rows 418-419, per month. */
const INCOME = {
  basicHouseholdMax: 11250,
  increasedPerPerson: { single: 3150, multi: 2250 },
  highestPerPerson: { single: 1800, multi: 1300 },
};

const TIERS = ["basic", "increased", "highest"] as const;
type Tier = (typeof TIERS)[number];

const zl = (n: number) => `${n.toFixed(2)} zł`;
const pad = (s: string, n: number) => s.padEnd(n);

let failures = 0;

function check(label: string, expected: number, actual: number) {
  const ok = Math.abs(expected - actual) < 0.005;
  if (!ok) failures++;
  console.log(
    `    ${pad(label, 46)} longhand ${pad(expected.toFixed(2), 12)} model ${pad(actual.toFixed(2), 12)} ${ok ? "PASS" : "**FAIL**"}`,
  );
}

function checkText(label: string, expected: string, actual: string) {
  const ok = expected === actual;
  if (!ok) failures++;
  console.log(
    `    ${pad(label, 46)} longhand ${pad(expected, 12)} model ${pad(actual, 12)} ${ok ? "PASS" : "**FAIL**"}`,
  );
}

function rule(title: string) {
  console.log(`\n${"═".repeat(112)}\n  ${title}\n${"═".repeat(112)}`);
}

console.log(
  "\nGRANTS & FINANCING VERIFICATION: model vs. an independent longhand recomputation",
);
console.log(
  "Caps, rates, loan terms and income thresholds re-transcribed inside this script.",
);

// --- the grant, every option x every tier x a range of job sizes ------------

rule("Grant = min(cap for the tier, cost x rate). Both limits, smaller wins.");

// 120 kWh/m²/y: inside the 80-140 band, where a heat-source-only job is
// eligible and the highest tier is not reachable.
const DEMAND = 120;

for (const optionId of Object.keys(LINE_FOR) as AlternativeHeatingId[]) {
  console.log(`\n  ${optionId} (sheet line ${LINE_FOR[optionId]})`);
  for (const tier of TIERS) {
    // The engine clamps "highest" down to "increased" below 140 kWh/m²/y,
    // so the longhand has to do the same to be comparing like with like.
    const effective: Tier = tier === "highest" ? "increased" : tier;
    const caps = CAPS[LINE_FOR[optionId]]!;
    const cap = caps[TIERS.indexOf(effective)]!;

    for (const cost of [8000, 19000, 40000]) {
      const longhand = Math.min(cap, cost * RATE[effective]);
      const model = calculateGrant({
        optionId,
        heatingCapexPln: cost,
        tier,
        spaceHeatPerM2: DEMAND,
      });
      check(
        `${pad(tier, 10)} on ${pad(zl(cost), 12)}`,
        longhand,
        model.totalGrantPln,
      );
    }
  }
}

// --- the scope gate ---------------------------------------------------------

rule(
  "Scope gate: above 140 kWh/m²/y, a heat source alone gets no unconditional grant",
);

for (const [demand, expectType] of [
  [79, 1],
  [80, 2],
  [139, 2],
  [140, 3],
  [250, 3],
] as const) {
  check(
    `band for ${demand} kWh/m²/y`,
    expectType,
    scopeBandFor(demand).projectType,
  );
}

const blocked = calculateGrant({
  optionId: "airToWaterHp",
  heatingCapexPln: 40000,
  tier: "highest",
  spaceHeatPerM2: 180,
});
checkText(
  "unconditional heating grant at 180 kWh/m²/y",
  "null",
  String(blocked.heating),
);
check(
  "total grant at 180 kWh/m²/y assumes insulation happens",
  blocked.heatingIfInsulated?.amountPln ?? 0,
  blocked.totalGrantPln,
);
console.log(`    >>> ${blocked.warnings[0]?.code}`);

const clamped = calculateGrant({
  optionId: "airToWaterHp",
  heatingCapexPln: 40000,
  tier: "highest",
  spaceHeatPerM2: DEMAND,
});
checkText("highest tier below 140 clamps to", "increased", clamped.tier);

// --- income tiers -----------------------------------------------------------

rule("Income tier from the sheet's own thresholds");

checkText(
  "4 people, 1 300 zł each",
  "highest",
  String(incomeTierFor(INCOME.highestPerPerson.multi * 4, 4)),
);
checkText(
  "4 people, 2 250 zł each",
  "increased",
  String(incomeTierFor(INCOME.increasedPerPerson.multi * 4, 4)),
);
checkText(
  "4 people, 11 250 zł total",
  "basic",
  String(incomeTierFor(INCOME.basicHouseholdMax, 4)),
);
checkText(
  "4 people, 11 251 zł total",
  "null",
  String(incomeTierFor(INCOME.basicHouseholdMax + 1, 4)),
);
checkText(
  "1 person, 1 800 zł",
  "highest",
  String(incomeTierFor(INCOME.highestPerPerson.single, 1)),
);

// --- the loan ---------------------------------------------------------------

rule("Solar grant: a share of the array, no cap, its own programme");

for (const tier of TIERS) {
  const effective: Tier = tier === "highest" ? "increased" : tier;
  const solarCost = 30000;
  const heatingCost = 19000;
  const caps = CAPS[LINE_FOR.airToAirHp]!;
  const longhand =
    Math.min(caps[TIERS.indexOf(effective)]!, heatingCost * RATE[effective]) +
    solarCost * PV_RATE[effective];
  const model = calculateGrant({
    optionId: "airToAirHp",
    heatingCapexPln: heatingCost,
    solarCapexPln: solarCost,
    tier,
    spaceHeatPerM2: DEMAND,
  });
  check(`${pad(tier, 10)} heat source + solar`, longhand, model.totalGrantPln);
  check(
    `${pad(tier, 10)} solar line alone`,
    solarCost * PV_RATE[effective],
    model.solar!.amountPln,
  );
}

// The highest tier is unreachable below 140 kWh/m²/y: it gets clamped: so
// its PV rate can only be exercised above that line. Solar is a separate
// programme and survives the scope gate that blocks the heat source there,
// which is exactly the household this checks.
{
  const solarCost = 30000;
  const model = calculateGrant({
    optionId: "airToAirHp",
    heatingCapexPln: 19000,
    solarCapexPln: solarCost,
    tier: "highest",
    spaceHeatPerM2: 180,
  });
  checkText("above 140, highest tier survives", "highest", model.tier);
  check(
    "highest-tier solar, 0.32 x 30 000",
    solarCost * PV_RATE.highest,
    model.solar!.amountPln,
  );
  check("...and the heat source is still blocked", 0, model.heating ? 1 : 0);
}

rule(
  "Monthly capex = (net + net x interest) / (years x 12): the sheet's formula",
);

// The engine's own loan table has to be checked against this script's
// transcription of it. Passing the script's rate straight into the engine
// would leave SHEET_LOAN_OPTIONS unexercised: the engine could hold any rate
// at all and every figure below would still agree.
check("loan terms offered", LOANS.length, LOAN_OPTIONS.length);
for (const [i, { years, interest }] of LOANS.entries()) {
  check(`loan option ${i}: years`, years, LOAN_OPTIONS[i]!.years);
  check(
    `loan option ${i}: interest`,
    interest,
    LOAN_OPTIONS[i]!.annualInterest,
  );
}
check("default term, years", 5, DEFAULT_LOAN_TERMS.years);
check("default term, interest", 0.07, DEFAULT_LOAN_TERMS.annualInterest);

const NET = 44400;
for (const { years, interest } of LOANS) {
  const longhand = (NET + NET * interest) / (years * 12);
  check(
    `${years} years at ${(interest * 100).toFixed(0)}%`,
    longhand,
    sheetMonthlyCapex(NET, { years, annualInterest: interest }),
  );
}

// --- the anchor: the sheet's own final-tab row ------------------------------

rule(
  "End to end against the sheet's own numbers: price_calculator row 371 (gas194)",
);

// Straight off the sheet: total capex 54 000 (24 000 heat source + 30 000
// solar), grant 9 600, net 44 400, monthly capex 791.80, running 732.6410455,
// true monthly 1 524.441046.
const SHEET_ROW = {
  heatSourceCapex: 24000,
  solarCapex: 30000,
  totalCapex: 54000,
  grant: 9600,
  netCapex: 44400,
  monthlyCapex: 791.8,
  runningPerMonth: 732.6410455,
  trueMonthly: 1524.441046,
};

// The sheet's grant on this row is PV only: gas is not in its GRANT block —
// and it applies the highest column's rate, 0.32.
check(
  "PV grant, 0.32 x 30 000",
  SHEET_ROW.grant,
  SHEET_ROW.solarCapex * PV_RATE.highest,
);
check(
  "net capex, 54 000 - 9 600",
  SHEET_ROW.netCapex,
  SHEET_ROW.totalCapex - SHEET_ROW.grant,
);

const loan = calculateLoan({
  grossCapexPln: SHEET_ROW.totalCapex,
  grantPln: SHEET_ROW.grant,
  // The engine's own default term, not re-stated here: the sheet's live
  // formula points at its 5-year row, so this pins that too. The method is
  // pinned explicitly to the sheet's formula, independent of whichever
  // REPAYMENT_METHOD the product currently shows, because this check anchors
  // the transcription itself, not the UI's current choice.
  terms: DEFAULT_LOAN_TERMS,
  method: "sheetSimpleInterest",
});
check("net capex", SHEET_ROW.netCapex, loan.netCapexPln);
check(
  "monthly capex, from the sheet",
  SHEET_ROW.monthlyCapex,
  loan.monthlyRepaymentPln,
);

const trueCost = trueMonthlyCost(SHEET_ROW.runningPerMonth, loan);
check(
  "true monthly, from the sheet",
  SHEET_ROW.trueMonthly,
  trueCost.truePlnPerMonth,
);
console.log(
  `    >>> ${zl(SHEET_ROW.runningPerMonth)}/m running + ${zl(loan.monthlyRepaymentPln)}/m capex = ${zl(trueCost.truePlnPerMonth)}/m`,
);

// --- how far the sheet's formula sits from a real loan ----------------------

rule(
  "The open question: the sheet's simple interest vs. a real amortising loan",
);

for (const { years, interest } of LOANS) {
  const l = calculateLoan({
    grossCapexPln: 40000,
    grantPln: 0,
    terms: { years, annualInterest: interest },
  });
  console.log(
    `    ${pad(`${years}y at ${(interest * 100).toFixed(0)}%`, 14)} sheet ${pad(zl(l.sheetMonthlyPln), 14)} annuity ${pad(zl(l.annuityMonthlyPln), 14)} annuity is ${((l.annuityMonthlyPln / l.sheetMonthlyPln - 1) * 100).toFixed(0)}% higher`,
  );
}

rule(failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`);
console.log("");
process.exit(failures === 0 ? 0 : 1);
