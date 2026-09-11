# Baseline model: extracted from `price_calculator`

What this is: every constant and formula taken out of the `price_calculator`
sheet (all tabs except subsidies) and turned into code, so the baseline: what a
household is paying today, on coal: can be computed from the wizard's answers.

Source sheet: [`price_calculator`](https://docs.google.com/spreadsheets/d/1F6GGkd0rCYwusvp986ifhh2VAxyXdX2rHGsk0I04o6E/edit)
· read 2026-09-09.

| File                                                                  | What it holds                                                            |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`src/data/sheet.constants.ts`](../src/data/sheet.constants.ts)       | Every number, transcribed verbatim, each labelled with its sheet section |
| [`src/engines/baseline.ts`](../src/engines/baseline.ts)               | The formulas, and `calculateUserBaseline`: the only entry point         |
| [`src/__tests__/baseline.test.ts`](../src/__tests__/baseline.test.ts) | Reproduces the sheet's own worked scenarios                              |
| [`src/wizard/BaselineSummary.tsx`](../src/wizard/BaselineSummary.tsx) | The block that renders it on the financials screen                       |

`baseline.ts` is the **single source of truth**. The band-based
`runningCost.ts`, which computed a second and disagreeing baseline, was deleted
when this landed: recover it from git history if its pellet and heat-pump
scenario functions are wanted for the replacement-options step.

Run `npm test` to check the whole thing against the sheet.

---

## 1. Constants, and where each came from

### CONSTANTS block

| Constant                  | Value      | Notes                                                                                                               |
| ------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| `WATER_KWH_PER_LITRE_45C` | 0.05 kWh/l | Physics gives 1 × 45 × 4.186 / 3600 = **0.0523**. The sheet rounds down, and carries no tank or circulation losses. |

### ELECTRICITY TARIFFS block

| Tariff   | PLN/kWh | Wizard answer |
| -------- | ------- | ------------- |
| Standard | 1.00    | G11           |
| Dynamic  | 0.70    | G12           |

One blended all-in number per tariff: the sheet does not model peak vs
off-peak separately.

### PV block

| Field               | Value        |
| ------------------- | ------------ |
| PV production       | 5 000 kWh/y  |
| Share used directly | 0.25         |
| Export price        | 0.30 PLN/kWh |

### COOLING block

| Source                       | SEER | Sheet kWh | Cooling only? |
| ---------------------------- | ---- | --------- | ------------- |
| none                         |:    | 0         | no            |
| AC                           | 5.0  | 750       | yes           |
| air-to-air HP                | 5.0  | 750       | no            |
| air-to-water HP AC fan coils | 4.0  | 940       | yes           |

### FUEL block

| Fuel                  | kWh/unit | Unit | Efficiency | PLN/unit | Fixed PLN/y | Electric? | Extra water device? |
| --------------------- | -------- | ---- | ---------- | -------- | ----------- | --------- | ------------------- |
| Groszek               | 7 222    | t    | 0.80       | 1 150    | 0           | no        | no                  |
| Orzech                | 8 056    | t    | 0.80       | 1 150    | 0           | no        | no                  |
| Kostka                | 8 056    | t    | 0.80       | 1 200    | 0           | no        | no                  |
| Muł                   | 5 300    | t    | 0.55       | 500      | 0           | no        | no                  |
| Miner                 | 7 800    | t    | 0.80       | **0**    | 0           | no        | no                  |
| Pellet                | 4 800    | t    | 0.85       | 1 450    | 0           | no        | no                  |
| gas                   | 9.8      | m³   | 0.92       | 3.20     | 900         | no        | no                  |
| electric boiler       | 1.0      | kWh  | 0.98       | 0        | 0           | yes       | yes                 |
| air-to-air HP         | 1.0      | kWh  | 4.00       | 0        | 0           | yes       | no                  |
| air-to-water HP       | 1.0      | kWh  | 3.00       | 0        | 0           | yes       | no                  |
| air-to-air HP water   | 1.0      | kWh  | 2.60       | 0        | 0           | yes       | yes                 |
| air-to-water HP water | 1.0      | kWh  | 2.30       | 0        | 0           | yes       | yes                 |

**"Miner"** is the _deputat węglowy_: coal received free or deeply discounted.
Full energy content, zero price. The wizard collects this as `freeCoalReceived`
/ `freeCoalTonnes`.

**Muł is the outlier worth noticing**: 5 300 kWh/t at 0.55 efficiency delivers
2 915 kWh/t, against orzech's 6 445. Less than half the useful heat per tonne.
This is why asking the grade matters more than almost any other question.

### HOUSE SCENARIOS block: House 1

| Field                | Value        |
| -------------------- | ------------ |
| People               | 4            |
| Area                 | 150 m²       |
| Condition            | 120 kWh/m²/y |
| Space heat           | 18 050 kWh/y |
| Hot water            | 50 000 l/y   |
| Base electricity     | 2 500 kWh/y  |
| Cooling demand       | 3 750 kWh/y  |
| Water heating energy | 2 600 kWh/y  |

---

## 2. Formulas

### Coal → useful heat

```
heat delivered (kWh/y) = tonnes × kWh per tonne × efficiency
```

Free (Miner) tonnes go through the same formula and add energy, but never cost.

The efficiency comes from the **boiler**, not the fuel row. The sheet folds a
flat 0.80 into every coal grade, which credits a no-class kopciuch and a class 5
unit with identical output from identical tonnage. We override it with the
household's emission class:

| Class                 | Efficiency |
| --------------------- | ---------- |
| No class (bezklasowy) | 0.60       |
| Class 3               | 0.75       |
| Class 4               | 0.75       |
| Class 5               | 0.85       |

Free (Miner) tonnes burn in the same boiler, so they are rated the same way.

When the class is not collected the fuel row's flat 0.80 stands, which is what
keeps the sheet-regression tests meaningful. Both paths name themselves in the
assumptions shown to the household.

Two more efficiencies are named alongside these: **electric boiler 0.98**, which
agrees with the sheet's own row and is what the hot-water branch divides by, and
**gas boiler 0.95**, which does _not_ agree with the sheet's 0.92 and is unused
at baseline: it is there for the replacement-scenario step. See the
disagreements table at the end.

### Hot water

```
litres/y          = people × showers per week × litres per shower × 52
effective litres  = litres/y × HOT_WATER_BLEND_FACTOR (0.6)
useful energy     = effective litres × 0.05 kWh/l
```

The blend step is new. A shower's 40 l is the whole mixed flow at the tap, not
neat hot water: a mixing valve tempers it with cold mains to reach a
comfortable temperature, so part of it never touched the boiler. Without this
correction the litres figure scales linearly with occupants × showers per week,
and a large household showering often reads as needing far more hot-water
energy than a real boiler or immersion tank would show for it (see the Krysia
gap below). `hotWaterLitresPerYear` in the model's output is still the full,
unblended draw: a household's own water use should not be reported back to
them shrunk to match an internal energy correction. Only `waterEnergyKwh`, and
everything computed from it, reflects the blend.

How much of that the coal boiler makes depends on the wizard's water-heating
answer:

| Answer                     | Coal's share                                     |
| -------------------------- | ------------------------------------------------ |
| `coalCentralAllYear`       | 1.00: boiler lit in July just for washing water |
| `electricSummerCoalWinter` | 1 − `SUMMER_DHW_SHARE` (0.42)                    |
| `electricBoilerNew`        | 0                                                |
| `electricNightTariff`      | 0                                                |

Whatever is not made by coal is bought as electricity, at the electric boiler's
0.98 efficiency.

### Space heat and building condition

```
space heat  = coal heat delivered − hot water made by coal
condition   = space heat / heated area          (kWh/m²/y)
```

That condition figure is the most consequential output here: it is what the
Czyste Powietrze scope gate bands on (below 80 / 80–140 / above 140). It is
derived from **measured tonnage in this specific house**, not from floor area,
which is the thing that separates this tool from every other Polish calculator.

`heatedAreaM2` itself, however, is not always the household's own stated
number. The wizard asks for total floor area, then whether the whole house is
heated; if not, it asks which part isn't (one whole floor / some rooms /
basement or garage only) and applies a fixed reduction — see
`computeHeatedAreaM2` and `UNHEATED_PORTION_REDUCTION` in
[`src/wizard/householdCases.ts`](../src/wizard/householdCases.ts). Those
percentages are working assumptions (marked `// VERIFY`), not measured, and
are due for revision once the 50-household Silesia pilot gives a real sense of
the heated/unheated split in the target housing stock. The raw Step 3
selection is stored alongside the computed number (`unheatedPortion`) and
surfaced in the UI as "estimated heated area" whenever it applies, so the
assumption stays visible rather than silently folding into the condition
figure.

### Cooling

```
demand      = area × 25 kWh/m²/y
electricity = demand / SEER
```

25 kWh/m²/y is **derived, not stated**: House 1's 3 750 kWh over 150 m². It
checks out both ways against the SEER column: 3750/5 = 750 and 3750/4 = 937.5,
which the sheet shows as 940.

### Electricity, with PV

Without PV:

```
cost = consumption × tariff price
```

With PV:

```
self-consumed = consumption × 0.25
import        = (consumption − self-consumed) × tariff price
export credit = (5 000 − self-consumed) × 0.30
cost          = import − export credit
```

**The important subtlety:** `share used directly` multiplies **consumption**,
not generation. The label suggests the opposite. Consumption is the reading that
reproduces the sheet's outputs exactly: see the verification table below, where
the generation reading misses by 25 zł/month on the very first scenario.

Two consequences worth knowing before this number goes in front of anyone:

- **It can go negative.** Miner69 lands at exactly 0.00 zł/month; a smaller
  consumer would go below zero. The sheet has no floor on the export credit.
- **A battery changes nothing.** Miner60 (PV + battery) and Miner61 (PV, no
  battery) are identical in the sheet, at 98.44. There is no battery term in the
  model at all.

### Which electricity figure gets used

The wizard collects a monthly bill, which is measured energy for this house, so
it wins:

```
measured kWh = bill × 12 / tariff price
modelled kWh = 2 500 base + water electricity + cooling electricity
```

`calculateBaseline` prices the measured figure and reports the **gap** between
the two. That gap is diagnostic, not noise:

- large **positive** → electric heaters, an immersion tank, or a workshop nobody
  mentioned
- large **negative** → the modelled hot water or cooling is too generous for
  this household

Mrs. Teresa runs negative in the test suite, and correctly so: she lives alone
and her coal boiler makes her hot water, so nothing electric is heating
anything.

---

## 3. Verification against the sheet

The `Miner60`–`Miner71` family is the useful one to pin: coal is free, so the
entire running cost is electricity, which isolates the tariff and PV arithmetic
from everything else.

Consumption = 2 500 base + cooling. All figures PLN/month.

| Scenario | Cooling | Tariff   | PV            | Sheet  | Model    |
| -------- | ------- | -------- | ------------- | ------ | -------- |
| Miner60  | AC      | Standard | yes + battery | 98.44  | 98.44 ✓  |
| Miner61  | AC      | Standard | yes           | 98.44  | 98.44 ✓  |
| Miner62  | AC      | Standard | no            | 270.83 | 270.83 ✓ |
| Miner63  | AC      | Dynamic  | yes + battery | 37.50  | 37.50 ✓  |
| Miner64  | AC      | Dynamic  | yes           | 37.50  | 37.50 ✓  |
| Miner65  | AC      | Dynamic  | no            | 189.58 | 189.58 ✓ |
| Miner66  | none    | Standard | yes + battery | 46.88  | 46.88 ✓  |
| Miner67  | none    | Standard | yes           | 46.88  | 46.88 ✓  |
| Miner68  | none    | Standard | no            | 208.33 | 208.33 ✓ |
| Miner69  | none    | Dynamic  | yes + battery | 0.00   | 0.00 ✓   |
| Miner70  | none    | Dynamic  | yes           | 0.00   | 0.00 ✓   |
| Miner71  | none    | Dynamic  | no            | 145.83 | 145.83 ✓ |

Twelve of twelve, exact. These are asserted in `baseline.test.ts`, so if a
constant is ever mistyped the suite says which.

---

## 4. Open questions: things to check in the sheet

These are places where the sheet does not agree with itself. Nothing has been
silently corrected; each is preserved as-is and flagged.

**1. House 1's water energy is 2 600 kWh, but its own constants give 2 500.**
50 000 l × 0.05 kWh/l = 2 500. The sheet shows 2 600, which implies 0.052 kWh/l.
A 4% difference. Is 2 600 typed by hand, or is 0.05 the rounded one?

**2. House 1's space heat is 18 050 kWh, but 150 m² × 120 kWh/m²/y = 18 000.**
A 0.3% difference: small, but it means one of the three numbers is not derived
from the other two.

**3. The `Miner72`/`Miner73` scenarios miss by 0.8 zł/month.** These are the
first to add electric water heating (Miner space heat + electric boiler water,
no cooling, Standard, PV). The sheet says 230.05; the model gives 229.27 using
House 1's stated 2 600 kWh. Working backwards, the sheet's chain appears to use
**2 611 kWh**, matching neither 2 500 nor 2 600. Probably the same rounding
question as (1). 0.34%, so it does not affect any conclusion, but it means the
water-heating branch is the one part of the model not pinned exactly.

**4. Boiler efficiency lives in the fuel row, not the boiler.** RESOLVED: the
baseline now takes efficiency from the emission class (0.60 / 0.75 / 0.75 / 0.85)
instead of the sheet's flat 0.80. Every persona's condition figure moved.

Two things about the new table are worth keeping in view, because it is a third
set of numbers rather than an adoption of the second:

- **It collapses feed type**, which
  [`constants.pl.ts`](../src/data/constants.pl.ts) treats as moving efficiency
  about as much as class does. The wizard no longer asks for it: the field was
  removed as collected-but-unused: so there is nothing left to feed a
  feed-type-aware table even if one were wired in. All four personas were
  hand-fed anyway, the worse case, before the field was dropped.
- **It sits at or above the sourced hand-fed bands.** Against
  `COAL_BOILER_EFFICIENCY` (hand-fed low/mid/high):

  | Class    | Sourced band       | We use                    |
  | -------- | ------------------ | ------------------------- |
  | No class | 0.40 / 0.50 / 0.60 | **0.60**: the ceiling    |
  | Class 3  | 0.60 / 0.66 / 0.72 | **0.75**: above the band |
  | Class 4  | 0.72 / 0.77 / 0.82 | 0.75: inside             |
  | Class 5  | 0.78 / 0.83 / 0.87 | 0.85: inside             |

  Being generous about an old boiler makes the _building_ look worse, since the
  same rooms were heated on more delivered energy. Class 3 in particular reads
  above anything the sourced band allows for a hand-fed unit.

**5. No battery term.** Flagged above; PV + battery and PV alone are identical.

**6. Litres per shower is not in the sheet at all.** The sheet types House 1's
hot water as a flat 50 000 l/y, but the wizard asks for showers per week per
person, so something has to connect the two. `LITRES_PER_SHOWER = 40` is chosen
to be consistent with the sheet rather than imported from elsewhere:

```
4 people × 6 showers/week × 40 l × 52 = 49 920 l/y ≈ 50 000
```

This is the softest number in the whole extraction. Confirm it before any figure
that depends on it is shown to a household.

PARTIALLY ADDRESSED: `HOT_WATER_BLEND_FACTOR` (0.6) now sits on top of it,
correcting for the fact that a shower's 40 l is the whole mixed flow at the tap,
not neat hot water: a mixing valve tempers it with cold mains, so part of it
never reached the boiler. This does not make `LITRES_PER_SHOWER` itself any
better sourced; it corrects a real second-order effect that was making the
first number's flaws worse for large households (see the Krysia gap above,
which the blend closed from −1 414 to +71 kWh/y). Both numbers are engineering
judgment rather than sourced figures and should be reviewed together.

**7. `SUMMER_DHW_SHARE` is unsourced.** Reused from `constants.pl.ts`, where it
is already marked as a modelling assumption. The sheet has no equivalent.

---

## 4a. The entry point: `calculateUserBaseline`

```ts
calculateUserBaseline(householdId: string, customInputs?: Partial<HouseholdCaseInputs>): Baseline
```

One door into the model. A household's facts always arrive as **a known
household plus overrides**: a persona is picked in the wizard, then the user
edits some fields: so the merge rule is written down once, here:

- an override wins when it is present
- otherwise the persona's answer stands
- `undefined` values are stripped before merging, so
  `{ coalTonnesPerSeason: undefined }` cannot blank a real answer
- an unknown or empty `householdId` falls back to `initialHouseholdCase`, which
  is what a user who never picked a persona has

`toBaselineInputs` narrows the wizard's answers to what the baseline actually
reads: the wizard collects radiator notes, coal provider and replacement
preference, none of which the baseline uses.

### Cost, sliced two ways

The same total, twice over. `coalPlnPerYear + electricityPlnPerYear` and
`spaceHeating + waterHeating + electricityAndCooling` both equal
`totalPlnPerYear`; there is a test that says so.

Households do not think "coal and electricity", they think "heating, hot water,
and the rest of the bill", so the second slicing is what the UI shows.

- **Coal** splits by _energy_ share: space heat versus the hot water the boiler
  made.
- **Electricity** splits by _modelled kWh_ share. The bill is priced as a whole
  because it is measured, but the meter does not itemise the immersion tank, so
  the split has to come from the model.

### Worked example: Mrs. Teresa, checked by hand

| Step        | By hand                                          | Model                         |
| ----------- | ------------------------------------------------ | ----------------------------- |
| Coal heat   | 4.5 t × 8 056 kWh/t × 0.75 (class 3)             | 27 189 kWh                    |
| Hot water   | 1 × 4 × 40 l × 52 = 8 320 l × 0.6 (blend) × 0.05 | 249.6 kWh                     |
| Space heat  | 27 189 − 249.6 = 26 939.4 kWh over 130 m²        | 207.2 kWh/m²/y                |
| Coal cost   | 4.5 × 1 400                                      | 6 300 zł                      |
| Electricity | 150 × 12, G11, no PV                             | 1 800 zł                      |
| **Total**   | 6 300 + 1 800                                    | **8 100 zł/y = 675.00 zł/mo** |

Split by end use: space heating 6 242.16 zł, water heating 57.84 zł, electricity
and cooling 1 800 zł: summing back to 8 100 zł. Water heating's share fell from
90 zł (flat 40 l) to 57.84 zł once the blend was applied: the same direction as
every other persona below.

### What the four personas produce

| Household      | Boiler   | Space heat | Water    | Elec & cooling | Total/mo      | Condition    |
| -------------- | -------- | ---------- | -------- | -------------- | ------------- | ------------ |
| Grandma Krysia | no class | 6 500      | 2 262.24 | 2 537.76       | **941.67 zł** | 193 kWh/m²/y |
| Grandpa Janek  | class 4  | 5 945.45   | 234.28   | 2 100.27       | **690.00 zł** | 243 kWh/m²/y |
| Mrs. Teresa    | class 3  | 6 242.16   | 57.84    | 1 800.00       | **675.00 zł** | 207 kWh/m²/y |
| Mr. Marek      | class 3  | 7 150.00   | 1 320.24 | 3 239.76       | **975.83 zł** | 222 kWh/m²/y |

Costs did not move when class-aware efficiency or the hot-water blend landed,
and should not have: both change how much energy a litre or a tonne implies,
not what the household paid for it. What moved is the split between the three
lines: water heating fell for everyone (the blend directly shrinks it), with
the difference reassigned to whichever fuel was making that water (coal for
Teresa and Janek, electricity for Krysia and Marek): and, for Teresa and
Janek specifically, the condition column ticked up slightly (207 and 243),
because less of their coal is now credited to the taps and more to the rooms.
Krysia and Marek's condition is untouched, since neither's water comes from
coal.

**Two things worth looking at in that table:**

1. **Every persona lands above 140 kWh/m²/y.** Under the scope gate on the
   subsidies tab that puts all four in project type 3, where _a heat-source-only
   project is not eligible_: the building has to be insulated too. If that is
   right, it is the single most important thing the tool will tell these
   households. Class-aware efficiency (open question 4, now resolved) pulled
   every figure down without changing that conclusion: Krysia moved 258 → 193
   and is still 53 above the gate. The hot-water blend nudged Teresa's and
   Janek's condition figures up by a kWh or two (less coal now counted as
   water), which does not move either of them across the gate either.
2. **The hot-water blend (`HOT_WATER_BLEND_FACTOR`, 0.6) fixed Krysia's
   reconciliation gap and widened Marek's.** Her gap ran from −1 414 kWh/y to
   **+71 kWh/y**: near enough to call it resolved. The unblended
   `LITRES_PER_SHOWER` assumption was overstating her hot-water electricity by
   more than her bill could be paying for; 5 people × 7 showers/week × 40 l is
   72 800 l/y before blending, an implausible amount of hot water for the house
   she describes. Marek's gap moved the other way, from +2 316 to
   **+2 996 kWh/y**, because blending shrank his modelled water-heating
   electricity further below what his bill implies: his gap was never a
   hot-water story, and shrinking that term only made the unexplained part more
   visible. Whatever is really driving it (a workshop, an EV, a heater we
   have not asked about) still needs asking about directly.

---

## 5. How this sits next to the existing engines

There are now two constant sets, and that is deliberate:

|         | `constants.pl.ts`                           | `sheet.constants.ts`                                    |
| ------- | ------------------------------------------- | ------------------------------------------------------- |
| Source  | Independently researched Polish market data | The sheet's own working assumptions                     |
| Shape   | low/mid/high bands                          | Point values                                            |
| Used by | `capex.ts`, `baseline.ts` (summer DHW share) | `baseline.ts`, `grants.ts`, `loan.ts`                  |
| Purpose | Carry honest uncertainty as a range          | Reproduce the sheet exactly, and be testable against it |

They disagree in places, and the disagreements are real:

| Quantity               | Sheet                                    | `constants.pl.ts`                |
| ---------------------- | ---------------------------------------- | -------------------------------- |
| Coal price             | 1 150–1 200 zł/t                         | 1 200 / **1 500** / 1 800 zł/t   |
| Orzech energy          | 8 056 kWh/t                              | 28 MJ/kg ≈ **7 778** kWh/t       |
| Coal boiler efficiency | flat 0.80                                | 0.40–0.89 by class and feed      |
|: what we actually use | 0.60 / 0.75 / 0.75 / 0.85 by class alone |                                  |
| Gas boiler efficiency  | 0.92                                     | we use **0.95** (scenarios only) |
| Electricity G11        | 1.00 zł/kWh                              | 1.04 / **1.07** / 1.10 zł/kWh    |

Do not quietly reconcile these in `sheet.constants.ts`: its whole value is that
it matches the sheet. The reconciliation is a decision to make once, in the
open, and question 4 above is the one that actually changes an answer.

---

## 6. Deliberately not modelled

- **Subsidies**: excluded from this pass by request, and modelled since, in
  `src/engines/grants.ts` (the Czyste Powietrze cost-line caps, the three
  funding levels and the scope gate) and `src/engines/taxRelief.ts` (the
  thermal modernisation relief). Neither touches the baseline.
- **Capex and financing**: the SCENARIOS tab's `Capex /m` column is all zeros
  for the coal options (they carry `Is capex in the past? = TRUE`), so there is
  nothing to extract for the baseline. `financing.ts` covers this.
- **Replacement options**: RESOLVED for air-to-air HP, air-to-water HP and
  pellet, at running cost only. See
  [alternative-heating-model.md](alternative-heating-model.md). Gas is still
  transcribed and unpriced; PV, capex, financing and subsidy remain layers on
  top, not folded into this pass.
