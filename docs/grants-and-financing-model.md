# Grants, financing, and the true monthly cost

Third in the chain, after [baseline-model.md](baseline-model.md) (what coal
costs today) and [alternative-heating-model.md](alternative-heating-model.md)
(what a replacement costs to run and to install). This one answers the
question those two set up and cannot close: **what does the whole thing
actually cost me per month.**

Source sheet: [`price_calculator`](https://docs.google.com/spreadsheets/d/1F6GGkd0rCYwusvp986ifhh2VAxyXdX2rHGsk0I04o6E/edit),
tabs `subsidies` (grant caps, funding rates, the scope gate) and
`price_calculator` (the GRANT block, the loan table, the income tiers, and the
`monthly capex` / `true monthly` columns).

|                   |                                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| Data              | [`src/data/sheet.constants.ts`](../src/data/sheet.constants.ts), the SUBSIDIES and LOAN blocks       |
| Grant engine      | [`src/engines/grants.ts`](../src/engines/grants.ts)                                                  |
| Loan engine       | [`src/engines/loan.ts`](../src/engines/loan.ts)                                                      |
| Tests             | [`grants.test.ts`](../src/__tests__/grants.test.ts), [`loan.test.ts`](../src/__tests__/loan.test.ts) |
| Independent audit | `npm run verify:financing` ([script](../scripts/verify-grants-financing.ts))                         |
| UI                | [`AlternativeHeatingOptions.tsx`](../src/wizard/AlternativeHeatingOptions.tsx), Blocks 5 and 6       |

## The chain, end to end

The sheet's `final` tab states the whole thing in three columns :
`Running /m`, `Capex /m`, `True /m` : and this is how they are reached:

```
gross capex          hardware + installation (+ solar, if added)   Block 4
  - grant            min(cap for your tier, gross x funding rate)  Block 5
  = net capex        what you actually have to find
  / loan             (net + net x interest) / (years x 12)         Block 6
  + running cost     from alternativeHeating.ts, after PV
  = TRUE MONTHLY
```

## Where every number lives

Nothing in either engine hardcodes a złoty amount or a rate. All of it is in
`sheet.constants.ts`, in blocks named after the tab section they came from, so
changing a figure is a one-line edit in one file:

| To change                          | Edit                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------- |
| Grant caps per device              | `SHEET_GRANT_LINES` : keyed by the subsidies tab's own row ids (H2, H3, H4, H7) |
| Which device claims which line     | `GRANT_LINE_FOR_OPTION` in `grants.ts`                                          |
| Funding rate per tier (40/70/100%) | `SHEET_FUNDING_RATE`                                                            |
| PV grant rate                      | `SHEET_PV_GRANT_RATE`                                                           |
| Income thresholds                  | `SHEET_INCOME_TIERS`                                                            |
| The scope gate bands               | `SHEET_SCOPE_BANDS`                                                             |
| Loan terms and interest            | `SHEET_LOAN_OPTIONS`, `SHEET_DEFAULT_LOAN_YEARS`                                |
| Simple interest vs. a real annuity | `REPAYMENT_METHOD` in `loan.ts` : one line                                      |

Every result also carries the sheet row it came from (`sheetLineId`), and the
UI prints it, so a figure on screen can be traced to a row in the sheet
without opening any code.

## The grant: two limits, not one

```
grant = min( cap for your tier , gross capex x funding rate for your tier )
```

Both bind independently and the smaller wins. On a cheap job the rate binds;
on an expensive one the cap does. `GrantLine.cappedOut` says which, because
"you have hit the ceiling for this device" and "the programme pays 40% of what
you spend" lead a household to completely different next moves.

The caps and the rate are **not** independent numbers in the sheet. Every
line's basic and increased caps are exactly its highest cap times the funding
rate (35 200 × 0.4 = 14 080, × 0.7 = 24 640), so the cap column is already
tier-scaled. A test pins that structure; if the sheet is ever edited in a way
that breaks it, the transcription needs re-reading rather than patching.

### Income tiers

Set by income, not chosen. From `price_calculator` rows 417-419, per month:

| Tier      | Rate | Ceiling                                            |
| --------- | ---- | -------------------------------------------------- |
| Highest   | 100% | 1 300 zł per person (1 800 living alone)           |
| Increased | 70%  | 2 250 zł per person (3 150 living alone)           |
| Basic     | 40%  | 11 250 zł for the whole household (= 135 000 zł/y) |
| :         | none | above that, no grant                               |

These nest, so `incomeTierFor()` tests them highest-first: the other order
would file the poorest households into the least generous tier.

The wizard does not collect income and this does not ask for a złoty figure.
The UI shows the three bands with their thresholds and the household picks
one. It defaults to **basic**, the least generous, so a household that never
touches the control is never shown a number that overstates what they get.

## The scope gate : the rule that pays nothing

The most consequential rule in the programme is not an amount:

| Pre-project demand | Type | Heat source alone eligible? | Highest tier available? |
| ------------------ | ---- | --------------------------- | ----------------------- |
| below 80 kWh/m²/y  | 1    | yes                         | no                      |
| 80 to 140          | 2    | yes                         | no                      |
| **above 140**      | 3    | **NO**                      | yes                     |

Above 140 kWh/m²/y, Czyste Powietrze **will not fund a new heat source on its
own**. The building has to be insulated in the same project, to at least a 40%
cut and a maximum of 140. The sheet flags this row CRITICAL, and it is the one
place this model refuses to pay out rather than quietly producing a grant a
household would apply for and be refused.

It bands on `baseline.energy.spaceHeatPerM2`, which `baseline.ts` already
describes as "the number the Czyste Powietrze scope gate bands on, so it is
the single most consequential output here".

> **Every one of the four personas is in band 3.** Grandma Krysia 193,
> Grandpa Janek 243, Mrs. Teresa 207, Mr. Marek 222 kWh/m²/y. So on today's
> baseline model, none of them can claim anything for a heat pump alone, and
> Block 5 correctly shows zero with an explanation for all four. That is not a
> bug in this engine : it is the honest consequence of modelling badly
> insulated coal houses : but it does mean the grant path is never exercised
> by a demo, and it makes "insulate first" the real answer for these
> households. Worth deciding what the product should do about that.

The same band is the only one where the highest tier exists, so a household
below 140 that has selected "highest" is clamped down to "increased" with a
warning rather than being paid at a rate they cannot get.

## Solar is a different programme

The solar grant is claimed as its own line at the sheet's PV rate
(12% / 20% / 32% of the array's cost), and it is **not** subject to the Czyste
Powietrze scope gate : a household above 140 kWh/m²/y still gets it while
their heat pump gets nothing.

It carries a standing warning. The `subsidies` tab records PV support running
through `przydomowemagazyny.gov.pl`, capped at 7 000 zł at up to 50%, and
marks that programme **paused**; `Mój Prąd 6.0` is marked stopped. The
`price_calculator` GRANT block's percentage model disagrees with both. The
number is shown because it is what the sheet computes, and the warning is
shown because it is not money a household can count on today.

## The loan

Three terms, from `price_calculator` rows 411-413: **15 years at 10%**,
**10 years at 9%**, **5 years at 7%**. The sheet's live formula points at the
5-year row, so that is the default here and the term every `final` tab figure
was computed on.

### The open question: simple interest, not amortisation

The sheet's `monthly capex (with interest)` cell is:

```
(net + net x interest) / (years x 12)
```

That charges the interest **once across the whole term**. It is not compounded
and not amortised. A five-year loan at 7% pays 7% in total; so does a
fifteen-year one at 10%.

A real amortising loan on the same headline terms costs considerably more, and
the gap widens with the term : which is backwards from how the sheet behaves:

| Term            | Sheet formula | True annuity | Annuity is     |
| --------------- | ------------- | ------------ | -------------- |
| 15 years at 10% | 244 zł/m      | 430 zł/m     | **76% higher** |
| 10 years at 9%  | 363 zł/m      | 507 zł/m     | 39% higher     |
| 5 years at 7%   | 713 zł/m      | 792 zł/m     | 11% higher     |

_(40 000 zł net, no grant. `npm run verify:financing` prints this table.)_

`loan.ts` implements the sheet's formula **as the default**, because
reproducing the sheet is what makes these numbers checkable against it : the
same rule `baseline.ts` follows. But it computes the annuity on every result
too, so the gap is measured rather than assumed away, and
`REPAYMENT_METHOD` switches which one the UI shows in one line.

**This needs a decision.** On the default 5-year term the gap is 11% and
arguably tolerable. On the 15-year term the product would be understating a
household's monthly commitment by 76%, which is squarely the "marketing
calculator" failure mode the rest of this codebase is written against. The
options are: switch `REPAYMENT_METHOD` to `annuity` and accept that the
numbers no longer tie to the sheet, change the sheet, or drop the 15-year
option.

## What is deliberately not here

- **Tax relief in the monthly figure.** The relief itself is modelled, in
  `taxRelief.ts`, and shown as its own line in the grants block: claimed on
  the post-grant cost, per art. 26h ust. 5 pkt 1. What is deliberately absent
  is any attempt to fold it into a monthly figure. It is a deduction rather
  than cash, and it arrives with an annual tax return, so spreading it across
  months would overstate the benefit by roughly the inverse of the marginal
  tax rate and imply a smaller loan than the household actually needs.
- **Insulation and envelope work.** The subsidies tab's T1-T7 rows and their
  group caps are not transcribed, because HeatFit does not price insulation.
  This is what the scope gate above runs into.
- **Named bank products, arrangement fees, and the grant paying down capital
  partway through the term.** All modelled in `financing.ts`, which stays
  dormant. `loan.ts` borrows only its annuity function.
- **Whether the household would qualify at all.** Ownership, the ZUM listing,
  the chimney sweep report, the mandatory energy audit : all real gates, none
  checked here.

## Verified

`npm run verify:financing` recomputes every figure longhand from constants
re-transcribed independently inside the script, and finishes by reproducing
the sheet's own `final` tab row for gas194 end to end : 54 000 gross, 9 600
grant, 44 400 net, 791.80 zł/m capex, 1 524.44 zł/m true monthly : so the loan
formula is pinned against a number the spreadsheet computed itself.

The audit was confirmed to actually fail by perturbing ten constants in turn
(grant caps, funding rates, PV rates, all three loan interest rates, the
default term, the scope-gate threshold, and the income ceiling) and checking
each was caught. Two blind spots were found and closed that way: the script
was originally comparing the PV rate against its own copy of it without ever
calling the engine, and was passing loan terms into the engine rather than
checking the engine's own table : so both constants could have held any value
at all and every check would still have passed.

## Open questions

1. **Simple interest vs. annuity**, above. The one that most needs a decision.
2. **Every persona is blocked by the scope gate**, above.
3. **Which air/water line to claim.** The subsidies tab annotates H3
   (increased efficiency class, 14 080 / 24 640 / 35 200) as "the default
   HeatFit air-to-water line" and that is what `grants.ts` uses. The
   `price_calculator` tab's own GRANT block still carries H2's figures
   (standard class, 12 600 / 22 000 / 31 500). The two tabs disagree; H3 is
   used because the subsidies tab is the dedicated authority and says so
   explicitly. H2 is transcribed alongside it so switching is a one-line
   change.
4. **H2's 50 zł rounding.** Every grant line holds `highest x rate` exactly,
   except H2's increased cap: 22 000 where the pattern gives 22 050. Pinned by
   a test rather than corrected, since the sheet is the source.
5. **Grants are claimed against `constants.pl.ts` capex, not the sheet's.**
   Block 4 prices hardware and installation from independently sourced market
   bands; the sheet's own CAPEX table is higher (air-to-air 19 000 zł against
   12 600 mid). The grant is deliberately claimed against whatever gross
   figure is on screen, so "gross minus grant is net" always holds for the
   reader : but it means net capex here will not match the sheet's. The
   sheet's table is transcribed as `SHEET_CAPEX` so the disagreement is
   visible and switching is easy.
6. **The tier is self-declared.** No income is collected and nothing is
   checked. Fine for a comparison tool, not fine for anything that looks like
   an application.
