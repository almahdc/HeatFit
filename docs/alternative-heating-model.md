# Alternative heating: running cost and savings

Companion to [baseline-model.md](baseline-model.md). That document is what a
household pays today, on coal; this one is what the same household would pay
if only the space heating source changed. Read the baseline doc first — this
one assumes its vocabulary (`spaceHeatKwh`, the three-way cost split, the
sheet's point-value FUEL table).

Code: [`src/engines/alternativeHeating.ts`](../src/engines/alternativeHeating.ts).
Tests: [`src/__tests__/alternativeHeating.test.ts`](../src/__tests__/alternativeHeating.test.ts).
Independent audit: `npm run verify:alternatives`
([`scripts/verify-alternative-heating.ts`](../scripts/verify-alternative-heating.ts)).
UI: [`src/wizard/AlternativeHeatingOptions.tsx`](../src/wizard/AlternativeHeatingOptions.tsx),
Block 2 and Block 3 on the financials screen, directly under the baseline
(Block 1).

## What this is

Three options, each priced two ways:

- **Block 2 — running cost.** What the household would pay per month and per
  year for that option alone, on today's tariff and today's coal-system
  delivered heat. No PV, no capex, no financing, no subsidy.
- **Block 3 — savings.** That total minus the baseline total, in both
  directions: "Saves X zł/month" when it is cheaper, "Costs X zł/month more"
  when it is not. Both are said the same plainly — a comparison that only ever
  shows the flattering direction is not a comparison.

The UI shows one option at a time, chosen from a picker, never all three at
once. Three running-cost figures on screen together read as a menu to rank
against EACH OTHER; the only ranking meant to be trustworthy at this stage is
each option against the baseline, and PV, capex and financing can still
reorder them once those land. Showing one keeps that honest.

## What changes, what does not

Only the space heating fuel changes. Hot water and "everything else on the
meter" (lighting, appliances, cooling) are carried over from the baseline
completely unchanged:

```
alternative total = new space heating cost
                   + baseline water heating cost      (unchanged)
                   + baseline electricity & cooling cost (unchanged)

savings = baseline total - alternative total
```

This is a deliberate simplification, not an oversight. In real installations:

- An **air-to-water heat pump** could plausibly also make the household's hot
  water, at its own lower COP for the higher temperature lift DHW needs (the
  sheet even carries a separate `air-to-water HP water` row, COP 2.3 vs 3.0
  for space heat, for exactly this).
- A **pellet boiler** typically replaces the coal boiler outright, hydronic
  coil and all, so it usually inherits water heating the same way the coal
  system does now.
- An **air-to-air heat pump** — wall or ceiling units blowing heated air —
  physically cannot make hot water at all; the household would keep whatever
  makes it today.

Modelling all three of those honestly means asking a new question ("would
this replacement also take over your hot water?") that the wizard does not
ask yet, and guessing would be worse than being explicit about not asking.
Holding water heating fixed keeps every comparison in this pass answering
one clean question — "what does the space heating alone cost with each
option" — instead of quietly answering a different, unstated one for each
row. Revisit this once the wizard collects that answer.

## The formula, per option

The useful heat a replacement has to deliver is the coal system's own
`spaceHeatKwh` from the baseline — the building needs the same warmth
regardless of what makes it, so anchoring on the coal system's own delivered
heat is what keeps the comparison apples-to-apples, rather than a second,
independent guess at heat demand that might not agree with the first.

```
fuel needed = useful heat / efficiency (combustion) or / COP (heat pump)
```

Same formula either side of one — `baseline.ts`'s own
`coalHeatDelivered()` uses it the other way round (`output = input x
efficiency`) for exactly the same reason: keep one arithmetic idea for
"how well does this appliance turn fuel into heat", whether that number is
below one (combustion) or above one (a heat pump's COP).

| Option                 | Sheet FUEL row    | Efficiency/COP | Priced as                       |
| ---------------------- | ----------------- | -------------- | ------------------------------- |
| Air-to-air heat pump   | `air-to-air HP`   | 4.0 (COP)      | electricity, household's tariff |
| Air-to-water heat pump | `air-to-water HP` | 3.0 (COP)      | electricity, household's tariff |
| Pellet boiler          | `Pellet`          | 0.85           | tonnes × 1 450 zł/t             |

All three efficiencies come straight from `sheet.constants.ts`'s own FUEL
table — the same point-value source `baseline.ts` reproduces — so both sides
of every comparison come from one consistent model, rather than mixing sheet
point values on one side with `constants.pl.ts`'s low/mid/high bands on the
other, the way the still-dormant `runningCost.ts`/`verdict.ts` engines do.

Heat pump electricity is priced at the household's own tariff (G11 or G12),
the same price the baseline already uses for their bill — a heat pump does
not get a cheaper rate just for being a heat pump in this model.

## Worked example — Mr. Marek

Baseline: class 3 boiler, 33 231 kWh/y delivered, of which `spaceHeatKwh` =
33 231 kWh (his boiler makes no hot water — `electricNightTariff`). Baseline
total 11 710 zł/y = 975.83 zł/mo, G12 tariff (0.70 zł/kWh).

| Option          | Fuel needed                      | Space heating cost       | Total                        | vs. baseline            |
| --------------- | -------------------------------- | ------------------------ | ---------------------------- | ----------------------- |
| Air-to-air HP   | 33 231 / 4.0 = 8 308 kWh         | 8 308 × 0.70 = 5 815 zł  | 10 375 zł/y (864.62 zł/mo)   | **saves 111.21 zł/mo**  |
| Air-to-water HP | 33 231 / 3.0 = 11 077 kWh        | 11 077 × 0.70 = 7 754 zł | 12 314 zł/y (1 026.16 zł/mo) | costs 50.32 zł/mo more  |
| Pellet boiler   | 33 231 / (4 800 × 0.85) = 8.14 t | 8.14 × 1 450 = 11 810 zł | 16 370 zł/y (1 364.17 zł/mo) | costs 388.34 zł/mo more |

Only the air-to-air heat pump comes out ahead on energy cost alone for
Marek, and only by about 111 zł a month. This is worth saying plainly: on
these four personas, running cost alone rarely favours a replacement over
coal. That is not a bug in the model — Polish coal is cheap and these
households burn it in reasonably efficient class 3/4 boilers already
(post the class-aware efficiency fix — see baseline-model.md's open question 4) — it is the actual, sometimes uncomfortable, answer running cost alone
gives. Subsidy and financing exist precisely because running cost alone does
not make the case; that is the honest reason PV, capex and grants come next
rather than being skipped.

## Verified

`npm run verify:alternatives` recomputes every number above longhand, from
constants re-transcribed independently inside the script, for all four
personas across all three options (24 checks) — the same audit discipline as
`verify:baseline`, confirmed to actually fail by deliberately mistyping the
pellet energy content and checking the script caught it before restoring the
correct value.

## Open questions

1. **Water heating parity**, above — the biggest one. Revisit once the wizard
   asks whether a replacement also takes over hot water.
2. **No fixed/standing charge for either heat pump row.** The sheet gives gas
   a 900 zł/y fixed charge but nothing for the heat pump rows; carried over
   as zero here, matching the sheet.
3. **A single average COP for the whole year.** Real heat pump COP falls as
   outdoor temperature drops — coldest days, when most of the heat is
   needed, are exactly when COP is worst. Using one flat seasonal COP (as
   the sheet does) likely flatters heat pump running cost somewhat. Not
   corrected here, for the same reason `sheet.constants.ts` stays
   sheet-verbatim elsewhere: it keeps this number checkable against the
   sheet, and the disagreement is worth having in the open rather than
   quietly patched.
