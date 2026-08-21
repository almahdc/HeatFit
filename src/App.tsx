import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { StepShell, ChoiceGroup } from "./wizard/StepShell";
import { Range, exact, range, scale } from "./engines/range";
import { runningCosts, Tariff } from "./engines/runningCost";
import {
  Applicant,
  IncomeLevel,
  SubsidyOutcome,
  cleanAirShareOverride,
  subsidiesFor,
} from "./engines/subsidy";
import {
  AffordabilityGuide,
  FinancingPlan,
  PayoffSchedule,
  ROUTES,
  ScheduleYear,
  financingPlan,
  headlineMonthly,
  impliedIncome,
  payoffSchedule,
} from "./engines/financing";
import {
  Driver,
  sensitivity,
  sensitivityHeadline,
} from "./engines/sensitivity";
import { ScenarioSummary, verdict } from "./engines/verdict";
import { BuildingType, Ownership, screenHousehold } from "./engines/screening";
import {
  isValidPolishPostcode,
  lookupPostcode,
  maskPostcodeInput,
} from "./data/postcodes.pl";
import * as C from "./data/constants.pl";
import { StyleTile } from "./StyleTile";

const zl = (n: number) => Math.round(n).toLocaleString("pl-PL");
const band = (r: Range) => `${zl(r.low)} \u2013 ${zl(r.high)}`;

/**
 * Re-price a running cost for a swung fuel price.
 *
 * Running cost is very close to linear in the fuel price — the standing charge
 * is the only part that is not — so scaling is accurate enough for a
 * sensitivity ranking and avoids threading overrides through every engine.
 * If a driver ever needs to be exact rather than ranked, compute it properly.
 */
const scalePrice = (
  r: Range,
  override: number | undefined,
  baseline: number,
) =>
  override === undefined || baseline === 0 ? r : scale(r, override / baseline);

// T2 — the applicant is built from what the household answered, never assumed.
//
// Nothing here needs a document. The income question is three buttons and no
// figures, and it exists only because Clean Air pays a larger share to lower
// earners — it is the single most sensitive input in the model. Skipping a
// question means the least generous assumption, and the results say so.

type TaxBand = "none" | "pit12" | "pit32" | "flat19";

const TAX_RATE: Record<TaxBand, number> = {
  none: 0,
  pit12: 0.12,
  pit32: 0.32,
  flat19: 0.19,
};

function buildApplicant(a: {
  incomeLevel: IncomeLevel;
  ownedThreeYears: boolean;
  scrappingSolidFuel: boolean;
  taxBand: TaxBand;
  taxpayerCount: 1 | 2;
}): Applicant {
  const gates: Applicant["gatesSatisfied"] = ["deviceOnZumList"];
  if (a.ownedThreeYears) gates.push("ownedThreeYears");
  if (a.scrappingSolidFuel) gates.push("replacingKopciuch");
  // The audit gate is asserted here pending T9. If it turns out not to be
  // required for the basic path, this line is the one to delete.
  gates.push("energyAuditDone");
  return {
    incomeLevel: a.incomeLevel,
    gatesSatisfied: gates,
    taxpayerCount: a.taxpayerCount,
    marginalTaxRate: TAX_RATE[a.taxBand],
  };
}

function toBand(b: C.SourcedBand): Range {
  return range(b.low, b.mid, b.high);
}

// Coal first. It is the question that signals this tool is different from every
// calculator that asks for floor area, and asking it first means the valuable
// answer is given before any admin questions have a chance to lose people.
const STEP_IDS = [
  "coalBought",
  "coalLeftOver",
  "coalType",
  "boiler",
  "burntWood",
  "pricePaid",
  "area",
  "radiators",
  "postcode",
  "buildingType",
  "ownership",
  "tariff",
  "incomeBand",
  "ownedYears",
  "taxBand",
  "financing",
  "results",
] as const;
type StepId = (typeof STEP_IDS)[number];
const idx = (id: StepId) => STEP_IDS.indexOf(id);

export default function App() {
  // Route check: show style tile if requested
  const showStyleTile =
    new URLSearchParams(window.location.search).get("mode") === "style-tile";
  if (showStyleTile) {
    return <StyleTile />;
  }

  // --- what they burn -------------------------------------------------------
  const [coalBought, setCoalBought] = useState(4);
  const [coalLeftOver, setCoalLeftOver] = useState(0);
  const [coalType, setCoalType] = useState<C.CoalType>("ekogroszek");
  const [boilerClass, setBoilerClass] = useState<C.BoilerClass>("unknown");
  const [feedType, setFeedType] = useState<C.FeedType>("handFed");
  const [burntWoodToo, setBurntWoodToo] = useState(false);
  const [pricePaid, setPricePaid] = useState<string>(""); // empty = don't remember

  // --- the house ------------------------------------------------------------
  const [area, setArea] = useState(140);
  const [scop, setScop] = useState(3.0);
  const [postcode, setPostcode] = useState("");
  const [buildingType, setBuildingType] = useState<BuildingType>("detached");
  const [ownership, setOwnership] = useState<Ownership>("ownedOutright");

  // --- money ----------------------------------------------------------------
  const [tariff, setTariff] = useState<Tariff>("G11");
  const [incomeLevel, setIncomeLevel] = useState<IncomeLevel>("basic");
  const [ownedThreeYears, setOwnedThreeYears] = useState(true);
  const [scrappingSolidFuel, setScrappingSolidFuel] = useState(true);
  const [taxBand, setTaxBand] = useState<TaxBand>("pit12");
  const [taxpayerCount, setTaxpayerCount] = useState<1 | 2>(1);
  const [routeId, setRouteId] = useState("pozyczkaZielona");
  const [termYears, setTermYears] = useState(8);

  const postcodeResult = useMemo(() => lookupPostcode(postcode), [postcode]);

  // Outdoor space, roof and fuel access are not asked in the demo — they gate
  // paths we are not pricing yet. Defaulted permissively and flagged in the spec.
  const screening = useMemo(
    () =>
      screenHousehold({
        buildingType,
        ownership,
        outdoorSpace: "garden",
        roofAccess: "ownRoof",
        fuelAccess: ["truckAccess", "dryStorage"],
      }),
    [buildingType, ownership],
  );

  // --- wizard ----------------------------------------------------------------
  const [stepIndex, setStepIndex] = useState(0);
  const stepId: StepId = STEP_IDS[stepIndex]!;
  const totalSteps = STEP_IDS.length;

  const stepRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const setStepRef = (id: StepId) => (el: HTMLDivElement | null) => {
    stepRefs.current[id] = el;
  };

  const firstRender = useRef(true);
  useLayoutEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const el = stepRefs.current[stepId];
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ block: "start" }); // instant, not smooth
    });
  }, [stepIndex, stepId]);

  // Term choices are capped by the route. Offering 12 years on a product that
  // maxes at 120 months produced a monthly payment nobody could be given.
  const TERM_CHOICES = [5, 8, 10, 12];
  const routeMaxYears = Math.floor((ROUTES[routeId]?.maxTermMonths ?? 0) / 12);
  const termOptions = TERM_CHOICES.filter((y) => y <= routeMaxYears);

  const chooseRoute = (id: string) => {
    setRouteId(id);
    const max = Math.floor((ROUTES[id]?.maxTermMonths ?? 0) / 12);
    if (max > 0 && termYears > max) {
      setTermYears(Math.max(...TERM_CHOICES.filter((y) => y <= max)));
    }
  };

  const next = () => setStepIndex((i) => Math.min(i + 1, STEP_IDS.length - 1));
  const back = () => setStepIndex((i) => Math.max(i - 1, 0));
  const jumpTo = (id: StepId) => setStepIndex(idx(id));
  const showStep = (id: StepId) => idx(id) <= stepIndex;
  const isActive = (id: StepId) => idx(id) === stepIndex;

  const applicant = useMemo(
    () =>
      buildApplicant({
        incomeLevel,
        ownedThreeYears,
        scrappingSolidFuel,
        taxBand,
        taxpayerCount,
      }),
    [incomeLevel, ownedThreeYears, scrappingSolidFuel, taxBand, taxpayerCount],
  );

  // --- model -----------------------------------------------------------------
  const model = useMemo(() => {
    const rc = runningCosts({
      coalTonnesBought: coalBought,
      coalTonnesLeftOver: coalLeftOver,
      coalType,
      boilerClass,
      feedType,
      burntWoodToo,
      coalPricePaidPerTonne: pricePaid ? Number(pricePaid) : undefined,
      heatedAreaM2: area,
      heatPumpScop: range(scop - 0.4, scop, scop + 0.4),
      tariff,
      pvOffsetKwhPerYear: range(2600, 3200, 3800),
    });

    const route = ROUTES[routeId]!;
    const months = termYears * 12;

    const build = (
      id: ScenarioSummary["id"],
      label: string,
      capital: Range | null,
      device: "heatPump" | "pelletBoiler" | null,
      running: Range,
    ) => {
      // Staying on coal buys nothing, so there is no capital, no grant and no
      // loan. duringLoan and afterLoan are both just the fuel bill. The results
      // card must not print loan wording over these — see hasLoan below.
      if (!capital || !device) {
        return {
          id,
          label,
          capital: exact(0),
          grant: exact(0),
          sub: null,
          plan: null,
          running,
          summary: {
            id,
            label,
            duringLoan: running,
            afterLoan: running,
          } as ScenarioSummary,
        };
      }
      const sub = subsidiesFor(device, capital.mid, applicant);
      const plan = financingPlan({
        capitalCost: capital,
        upfrontGrant: sub.upfrontGrant,
        taxRelief: sub.taxRelief,
        route,
        termMonths: months,
      });
      const h = headlineMonthly(plan, running);
      return {
        id,
        label,
        capital,
        grant: sub.upfrontGrant,
        sub,
        plan,
        running,
        summary: {
          id,
          label,
          duringLoan: h.duringLoan,
          afterLoan: h.afterLoan,
        } as ScenarioSummary,
      };
    };

    const hpCapital = toBand(C.HEAT_PUMP_INSTALLED_COST);
    const rows = [
      build("coal", "Coal", null, null, rc.coal.monthly),
      build(
        "pellet",
        "Pellet",
        toBand(C.PELLET_BOILER_INSTALLED_COST),
        "pelletBoiler",
        rc.pellet.monthly,
      ),
      build(
        "heatPump",
        "Heat pump",
        hpCapital,
        "heatPump",
        rc.heatPump.monthly,
      ),
      build(
        "heatPumpPlusPv",
        "Heat pump + solar",
        range(
          hpCapital.low + 18000,
          hpCapital.mid + 22000,
          hpCapital.high + 28000,
        ),
        "heatPump",
        rc.heatPumpPlusPv.monthly,
      ),
    ];

    const v = verdict({
      scenarios: rows.map((r) => r.summary),
      demandPerM2: rc.demandPerM2,
      monthsUntilDeadline: 16,
    });

    // --- T3: which numbers actually decide this ----------------------------
    // The model is re-run against the winning scenario with one constant swung
    // at a time. Rebuilding running costs from scratch inside the closure is
    // what keeps the ranking honest: nothing is assumed to stay put.
    // The verdict kind names a scenario only when it picked one. For
    // "tooCloseToCall", "insulateFirst" and "wait" there is no named winner, and
    // the panels below still need a subject. Falling through to rows[0] made
    // that subject pellet every time, so the timeline described an option the
    // verdict had not recommended. Fall back to the cheapest to run instead,
    // which is the same rule the verdict itself uses to pick a winner.
    const cheapestToRun = rows
      .filter((r) => r.id !== "coal")
      .sort((a, b) => a.summary.afterLoan.mid - b.summary.afterLoan.mid)[0]!;

    const winner = rows.find((r) => r.id === v.kind) ?? cheapestToRun;

    const monthlyFor = (o: {
      pelletPricePerTonne?: number;
      electricityG11PerKwh?: number;
      coalPricePerTonne?: number;
      heatPumpInstalledCost?: number;
      pelletBoilerInstalledCost?: number;
      heatPumpScop?: number;
      loanRatePct?: number;
      cleanAirSharePct?: number;
    }): number => {
      const rcAlt = runningCosts({
        coalTonnesBought: coalBought,
        coalTonnesLeftOver: coalLeftOver,
        coalType,
        boilerClass,
        feedType,
        burntWoodToo,
        coalPricePaidPerTonne:
          o.coalPricePerTonne ?? (pricePaid ? Number(pricePaid) : undefined),
        heatedAreaM2: area,
        heatPumpScop: (() => {
          const c = o.heatPumpScop ?? scop;
          return range(c - 0.4, c, c + 0.4);
        })(),
        tariff,
        pvOffsetKwhPerYear: range(2600, 3200, 3800),
      });

      const isPellet = winner.id === "pellet";
      const runningAlt = isPellet
        ? scalePrice(
            rcAlt.pellet.monthly,
            o.pelletPricePerTonne,
            C.PELLET_PRICE_PER_TONNE.mid,
          )
        : scalePrice(
            winner.id === "heatPumpPlusPv"
              ? rcAlt.heatPumpPlusPv.monthly
              : rcAlt.heatPump.monthly,
            o.electricityG11PerKwh,
            C.ELECTRICITY_G11_PER_KWH.mid,
          );

      const capAlt = isPellet
        ? o.pelletBoilerInstalledCost
          ? exact(o.pelletBoilerInstalledCost)
          : toBand(C.PELLET_BOILER_INSTALLED_COST)
        : o.heatPumpInstalledCost
          ? exact(o.heatPumpInstalledCost)
          : toBand(C.HEAT_PUMP_INSTALLED_COST);

      const subAlt = subsidiesFor(
        isPellet ? "pelletBoiler" : "heatPump",
        capAlt.mid,
        applicant,
        o.cleanAirSharePct === undefined
          ? undefined
          : cleanAirShareOverride(o.cleanAirSharePct / 100),
      );

      const routeAlt =
        o.loanRatePct === undefined
          ? route
          : { ...route, annualRate: o.loanRatePct / 100 };

      const planAlt = financingPlan({
        capitalCost: capAlt,
        upfrontGrant: subAlt.upfrontGrant,
        taxRelief: subAlt.taxRelief,
        route: routeAlt,
        termMonths: months,
      });

      return headlineMonthly(planAlt, runningAlt).duringLoan.mid;
    };

    const drivers = sensitivity(monthlyFor, {
      loanRatePct: route.annualRate * 100,
    });

    // --- T4 and T5 ----------------------------------------------------------
    const schedule = winner.plan
      ? payoffSchedule(winner.plan, winner.running, {
          termMonths: months,
          tailYears: 3,
        })
      : null;

    const savingVsCoal = rc.coal.monthly.mid - winner.running.mid;
    const affordability = winner.plan
      ? impliedIncome(winner.plan, months, savingVsCoal)
      : null;

    return {
      rc,
      rows,
      verdict: v,
      route,
      termYears,
      drivers,
      schedule,
      affordability,
      winnerLabel: winner.label,
    };
  }, [
    applicant,
    termYears,
    coalBought,
    coalLeftOver,
    coalType,
    boilerClass,
    feedType,
    burntWoodToo,
    pricePaid,
    area,
    scop,
    tariff,
    routeId,
    termYears,
  ]);

  const shared = (id: StepId) => ({
    stepIndex: idx(id),
    totalSteps,
    active: isActive(id),
    onActivate: () => jumpTo(id),
    innerRef: setStepRef(id),
    onBack: idx(id) === 0 ? undefined : back,
    onNext: next,
  });

  return (
    <main className="wizard-shell">
      {stepId !== "results" && (
        <div className="wizard-top">
          <p className="masthead-mini">
            What's your coal boiler actually costing you?
          </p>
          <p className="masthead-submini">
            You're legally required to upgrade, but what actually makes
            financial sense? Turn a few quick questions and photos into a clear,
            monthly payment plan.
          </p>
          <div className="overall-progress-track">
            <div
              className="overall-progress-fill"
              style={{
                width: `${((stepIndex + 1) / (totalSteps - 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {showStep("coalBought") && (
        <StepShell
          {...shared("coalBought")}
          title="How much coal did you buy for last winter?"
          helper="A rough number is fine."
        >
          <input
            type="number"
            step={0.5}
            min={0.5}
            className="big-input"
            value={coalBought}
            onChange={(e) => setCoalBought(Math.max(0.5, +e.target.value))}
          />
          <span className="input-unit">tonnes</span>
        </StepShell>
      )}

      {showStep("coalLeftOver") && (
        <StepShell
          {...shared("coalLeftOver")}
          title="Anything still in the cellar?"
          helper="Bought is not burned. A tonne left over would otherwise overstate what your house needs by a quarter."
          nextDisabled={coalLeftOver >= coalBought}
        >
          <input
            type="number"
            step={0.5}
            min={0}
            className="big-input"
            value={coalLeftOver}
            onChange={(e) => setCoalLeftOver(Math.max(0, +e.target.value))}
          />
          <span className="input-unit">tonnes left</span>
          {isActive("coalLeftOver") && coalLeftOver >= coalBought && (
            <p className="inline-warn">
              That's more than you bought have another look at the two numbers.
            </p>
          )}
        </StepShell>
      )}

      {showStep("coalType") && (
        <StepShell {...shared("coalType")} title="What do you burn?">
          <ChoiceGroup
            value={coalType}
            onChange={setCoalType}
            options={[
              { value: "ekogroszek", label: "Eco-pea coal" },
              { value: "orzech", label: "Nut coal" },
              { value: "groszek", label: "Pea coal" },
              { value: "mial", label: "Fine coal" },
              { value: "unknown", label: "A mix, or not sure" },
            ]}
          />
          {isActive("coalType") && coalType === "mial" && (
            <p className="inline-warn">
              Miał is banned under the Silesian anti-smog resolution. Worth
              knowing before an inspection finds it.
            </p>
          )}
        </StepShell>
      )}

      {showStep("boiler") && (
        <StepShell
          {...shared("boiler")}
          title="What class is your boiler?"
          helper="Look for a nameplate on the front or side. This one question does more for the accuracy of your answer than any other."
        >
          <ChoiceGroup
            value={boilerClass}
            onChange={setBoilerClass}
            options={[
              {
                value: "noClass",
                label: "No class",
                sublabel: "An old boiler",
              },
              { value: "class3", label: "Class 3" },
              { value: "class4", label: "Class 4" },
              { value: "class5", label: "Class 5" },
              { value: "ecodesign", label: "Ecodesign" },
              { value: "unknown", label: "I don't know" },
            ]}
          />
          <div className="sub-question">
            <p className="stat-label">And how is it fed?</p>
            <ChoiceGroup
              value={feedType}
              onChange={setFeedType}
              options={[
                { value: "handFed", label: "By hand, with a shovel" },
                { value: "automatic", label: "Automatic feeder" },
              ]}
            />
          </div>
          {isActive("boiler") && boilerClass === "unknown" && (
            <p className="inline-warn">
              Without the class we have to allow for anything from a very poor
              boiler to a good one, which roughly triples the uncertainty in
              your result. A photo of the nameplate would fix it.
            </p>
          )}
        </StepShell>
      )}

      {showStep("burntWood") && (
        <StepShell
          {...shared("burntWood")}
          title="Did you burn wood or offcuts as well?"
          helper="We don't need an amount just whether it happened."
        >
          <ChoiceGroup
            value={burntWoodToo ? "yes" : "no"}
            onChange={(v) => setBurntWoodToo(v === "yes")}
            options={[
              { value: "no", label: "No, just coal" },
              { value: "yes", label: "Yes, wood as well" },
            ]}
          />
        </StepShell>
      )}

      {showStep("pricePaid") && (
        <StepShell
          {...shared("pricePaid")}
          title="What did you pay per tonne?"
          helper="If you remember. You know this better than any price list we could look up but skipping it is fine, we'll use the regional range."
          nextLabel={pricePaid ? "Next" : "Skip"}
        >
          <input
            type="number"
            step={50}
            min={0}
            className="big-input"
            placeholder="1 500"
            value={pricePaid}
            onChange={(e) => setPricePaid(e.target.value)}
          />
          <span className="input-unit">zł per tonne</span>
        </StepShell>
      )}

      {showStep("area") && (
        <StepShell
          {...shared("area")}
          title="How many square metres do you heat?"
          helper="If you close off part of the house in winter, give the part you heat. We use this only to check whether insulation should come first."
        >
          <input
            type="number"
            step={10}
            min={30}
            className="big-input"
            value={area}
            onChange={(e) => setArea(Math.max(30, +e.target.value))}
          />
          <span className="input-unit">m²</span>
        </StepShell>
      )}

      {showStep("radiators") && (
        <StepShell
          {...shared("radiators")}
          title="What are your radiators like?"
          helper="Coal boilers run hot, so coal-era radiators are small. A heat pump runs cooler, where the same radiator gives about half as much heat."
        >
          <ChoiceGroup
            value={String(scop)}
            onChange={(v) => setScop(+v)}
            options={[
              {
                value: "2",
                label: "Small radiators",
                sublabel: "The room takes a while to warm up",
              },
              { value: "2.6", label: "Mixed" },
              { value: "3", label: "Generous radiators" },
              { value: "3.6", label: "Underfloor, or oversized radiators" },
            ]}
          />
        </StepShell>
      )}

      {showStep("postcode") && (
        <StepShell
          {...shared("postcode")}
          title="Where is the house?"
          helper="Postcode is enough. It sets your winter temperatures, your electricity distributor, and which deadline applies to you."
          nextDisabled={!isValidPolishPostcode(postcode)}
        >
          <input
            type="text"
            inputMode="numeric"
            placeholder="40-001"
            className="big-input"
            value={postcode}
            onChange={(e) => setPostcode(maskPostcodeInput(e.target.value))}
          />
          {isActive("postcode") &&
            postcode.length === 6 &&
            !postcodeResult.inSilesia && (
              <p className="inline-warn">
                We only cover Silesia today the numbers won't be accurate for{" "}
                {postcode}.
              </p>
            )}
        </StepShell>
      )}

      {showStep("buildingType") && (
        <StepShell
          {...shared("buildingType")}
          title="What kind of building is it?"
        >
          <ChoiceGroup
            value={buildingType}
            onChange={setBuildingType}
            options={[
              { value: "detached", label: "Detached house" },
              { value: "semiDetached", label: "Semi-detached" },
              { value: "terraced", label: "Terraced" },
              { value: "flat", label: "Flat in a multi-family building" },
            ]}
          />
        </StepShell>
      )}

      {showStep("ownership") && (
        <StepShell {...shared("ownership")} title="Do you own it?">
          <ChoiceGroup
            value={ownership}
            onChange={setOwnership}
            options={[
              { value: "ownedOutright", label: "Yes, outright" },
              { value: "mortgaged", label: "Yes, still paying a mortgage" },
              { value: "renting", label: "No, I rent" },
            ]}
          />
          {isActive("ownership") && ownership === "renting" && (
            <p className="inline-warn">
              This tool is for whoever decides on the heating system as a tenant
              that's your landlord. Worth sharing it with them.
            </p>
          )}
        </StepShell>
      )}

      {showStep("tariff") && (
        <StepShell
          {...shared("tariff")}
          title="Which electricity tariff are you on?"
          helper="If you're not sure, it's almost certainly the flat one."
        >
          <ChoiceGroup
            value={tariff}
            onChange={setTariff}
            options={[
              { value: "G11", label: "Flat, all day", sublabel: "G11" },
              {
                value: "G12w",
                label: "Cheaper nights and weekends",
                sublabel: "G12w",
              },
            ]}
          />
        </StepShell>
      )}

      {showStep("incomeBand") && (
        <StepShell
          {...shared("incomeBand")}
          title="Roughly, how much does your household bring in?"
          helper="No figures, no proof, and we never store it. We ask because the Clean Air grant pays a bigger share to households that earn less, and that one fact changes the answer more than anything else on this page."
        >
          <ChoiceGroup
            value={incomeLevel}
            onChange={setIncomeLevel}
            options={[
              {
                value: "basic",
                label: "About average, or above",
                sublabel: "The standard grant tier",
              },
              {
                value: "raised",
                label: "Below average",
                sublabel: "A larger share is covered",
              },
              {
                value: "highest",
                label: "Well below average, or on benefits",
                sublabel: "The largest share is covered",
              },
            ]}
          />
          {isActive("incomeBand") && (
            <p className="inline-warn">
              If you would rather not say, leave it on the first option. That is
              the least generous assumption, so the real number can only be
              better than what we show you.
            </p>
          )}
        </StepShell>
      )}

      {showStep("ownedYears") && (
        <StepShell
          {...shared("ownedYears")}
          title="Two things the grant office will check"
          helper="Both are yes or no. Get either wrong and a grant can be clawed back later, with interest, so it is worth being honest with yourself here."
        >
          <p className="stat-label">
            Have you owned the house three years or more?
          </p>
          <ChoiceGroup
            value={ownedThreeYears ? "yes" : "no"}
            onChange={(v) => setOwnedThreeYears(v === "yes")}
            options={[
              { value: "yes", label: "Yes, three years or more" },
              { value: "no", label: "No, less than that" },
            ]}
          />
          <div className="sub-question">
            <p className="stat-label">
              Will the old solid-fuel boiler be scrapped?
            </p>
            <ChoiceGroup
              value={scrappingSolidFuel ? "yes" : "no"}
              onChange={(v) => setScrappingSolidFuel(v === "yes")}
              options={[
                {
                  value: "yes",
                  label: "Yes, it goes",
                  sublabel: "Required for the main grant",
                },
                {
                  value: "no",
                  label: "No, I want to keep it",
                  sublabel: "Keeping it as a backup forfeits the grant",
                },
              ]}
            />
          </div>
          {isActive("ownedYears") && !scrappingSolidFuel && (
            <p className="inline-warn">
              Keeping the old boiler as a backup is the single most common way
              people lose this grant. It has to be removed and scrapped.
            </p>
          )}
        </StepShell>
      )}

      {showStep("taxBand") && (
        <StepShell
          {...shared("taxBand")}
          title="Do you pay income tax?"
          helper="The thermal-modernisation relief is a deduction, not a payment. You subtract what you spent from your taxable income, and you get back your tax rate on it, over up to six years. So it is worth nothing if you pay no tax, and nearly three times more at the higher rate."
        >
          <ChoiceGroup
            value={taxBand}
            onChange={setTaxBand}
            options={[
              { value: "pit12", label: "Yes, the lower rate", sublabel: "12%" },
              {
                value: "pit32",
                label: "Yes, the higher rate",
                sublabel: "32%",
              },
              {
                value: "flat19",
                label: "Flat rate, self-employed",
                sublabel: "19%",
              },
              {
                value: "none",
                label: "No income tax",
                sublabel: "The relief is worth nothing",
              },
            ]}
          />
          <div className="sub-question">
            <p className="stat-label">How many owners will claim it?</p>
            <ChoiceGroup
              value={taxpayerCount === 2 ? "two" : "one"}
              onChange={(v) => setTaxpayerCount(v === "two" ? 2 : 1)}
              options={[
                { value: "one", label: "One", sublabel: "One allowance" },
                {
                  value: "two",
                  label: "Two",
                  sublabel: "Two allowances, twice the room",
                },
              ]}
            />
          </div>
        </StepShell>
      )}

      {showStep("financing") && (
        <StepShell
          {...shared("financing")}
          title="How would you pay for it?"
          nextLabel="See what it costs"
        >
          <ChoiceGroup
            value={routeId}
            onChange={chooseRoute}
            options={Object.values(ROUTES).map((r) => ({
              value: r.id,
              label: r.label,
              sublabel:
                r.status === "suspended"
                  ? "Not available right now"
                  : undefined,
            }))}
          />
          {routeId !== "cash" && (
            <div className="sub-question">
              <p className="stat-label">Over how long?</p>
              <ChoiceGroup
                value={String(termYears)}
                onChange={(v) => setTermYears(+v)}
                options={termOptions.map((y) => ({
                  value: String(y),
                  label: `${y} years`,
                }))}
              />
              {/* The programme sets a ceiling. The bank decides what it will
                actually lend, to this person, at this age. We do not model
                that yet, so we say so rather than implying the maximum is
                on offer. */}
              <p className="note-inline">
                The longest term shown is this product's maximum. What you are
                actually offered is decided by the bank, and can be shorter.
              </p>
            </div>
          )}
        </StepShell>
      )}

      {showStep("results") &&
        (screening.canProceed ? (
          <div ref={setStepRef("results")}>
            <ResultsScreen model={model} onBack={back} />
          </div>
        ) : (
          <div ref={setStepRef("results")} className="step-block active">
            <h2 className="step-title">This one isn't for you yet</h2>
            <p className="inline-warn">{screening.stopReason}</p>
            <div className="step-nav">
              <button type="button" className="btn-secondary" onClick={back}>
                Back
              </button>
              <span />
            </div>
          </div>
        ))}
    </main>
  );
}

interface ResultRow {
  id: ScenarioSummary["id"];
  label: string;
  capital: Range;
  grant: Range;
  /** Null for "stay on coal" — nothing is bought, so nothing is subsidised. */
  sub: SubsidyOutcome | null;
  /** Null for "stay on coal" — nothing is bought, so nothing is borrowed. */
  plan: FinancingPlan | null;
  /** Fuel and electricity only, no repayment. */
  running: Range;
  summary: ScenarioSummary;
}

/**
 * Everything the engines worked out and the card used to throw away.
 *
 * Three questions, in the order a homeowner asks them:
 *   What am I getting?   — every grant, and for the ones that do not apply, why
 *   What do I get back?  — the tax relief, with the deduction and the cash kept
 *                          visibly apart, because they differ by about eight times
 *   What am I signing?   — rate, term, what is borrowed, what it costs in total
 *
 * Collapsed by default. The headline monthly figure is what most people need;
 * this is for the one in five who will not act without seeing the workings, and
 * for the installer or auditor reading over their shoulder.
 */
function OptionBreakdown({
  row,
  sub,
  plan,
}: {
  row: ResultRow;
  sub: SubsidyOutcome;
  plan: FinancingPlan;
}) {
  const pct = (n: number) => `${(n * 100).toFixed(2).replace(".", ",")}%`;
  const stepsDown =
    Math.round(plan.monthlyAfterGrant.mid) <
    Math.round(plan.monthlyBeforeGrant.mid);

  // Applied and refused are separated rather than interleaved: a refused
  // programme is context, not an option, and should never sit above one the
  // household actually gets. Refused lines carry the reason and no amount —
  // showing money to someone who was never eligible invents a loss.
  const applied = sub.detail.filter((d) => d.applied);
  const refused = sub.detail.filter((d) => !d.applied);
  const appliedGrants = applied.filter((d) => !d.programme.isTaxRelief);
  const appliedReliefs = applied.filter((d) => d.programme.isTaxRelief);

  return (
    <details className="breakdown">
      <summary>See what you get and what you sign</summary>

      {/* === PANEL 1: what you get ========================================= */}
      <section className="money-panel">
        <p className="stat-label">What you get</p>
        <dl className="detail">
          <div>
            <dt>The work costs</dt>
            <dd>{zl(row.capital.mid)} zł</dd>
          </div>
          <div>
            <dt>Grants pay</dt>
            <dd className="grant">- {zl(sub.upfrontGrant.mid)} zł</dd>
          </div>
          <div>
            <dt>You pay</dt>
            <dd>{zl(sub.ownSpend.mid)} zł</dd>
          </div>
        </dl>

        {appliedGrants.length > 0 && (
          <ul className="programme-list">
            {appliedGrants.map((d) => (
              <li key={d.programme.id} className="applied">
                <strong>{d.programme.label}</strong> pays {zl(d.amount.mid)} zł
              </li>
            ))}
          </ul>
        )}

        {appliedReliefs.map((d) => (
          <div key={d.programme.id} className="relief-block">
            <p className="stat-label">
              Money back later, through your tax return
            </p>
            <dl className="detail">
              <div>
                <dt>You subtract from taxable income</dt>
                <dd>{zl(d.deductionBase?.mid ?? 0)} zł</dd>
              </div>
              <div>
                <dt>Which returns, in cash</dt>
                <dd className="grant">{zl(d.amount.mid)} zł</dd>
              </div>
            </dl>
            <p className="note-inline">
              This is a deduction, not a payment. You get back your tax rate on
              it, spread over up to six tax years, not the whole amount, and not
              up front.
            </p>
          </div>
        ))}

        {refused.length > 0 && (
          <ul className="programme-list refused-list">
            {refused.map((d) => (
              <li key={d.programme.id} className="refused">
                <strong>{d.programme.label}</strong>
                {d.reason ? <>: {d.reason}</> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* === BRIDGE: when the money actually moves ========================= */}
      <p className="timing-bridge">
        {plan.grantAppliedToCapital.mid > 0
          ? `The grant of ${zl(plan.grantAppliedToCapital.mid)} zł goes straight to the bank and shrinks what you owe, which is why the repayment steps down. You never handle that money.`
          : `The grant of ${zl(plan.grantReimbursed.mid)} zł is paid to you after the work is settled — so you have to cover the full cost first.`}
      </p>

      {/* === PANEL 2: how you cover it until it lands ====================== */}
      <section className="money-panel">
        <p className="stat-label">How you cover it until it lands</p>
        <dl className="detail">
          <div>
            <dt>Lender and product</dt>
            <dd>{plan.route.label}</dd>
          </div>
          <div>
            <dt>Interest rate</dt>
            <dd>{pct(plan.route.annualRate)} a year</dd>
          </div>
          <div>
            <dt>You borrow</dt>
            <dd>{zl(plan.amountBorrowed.mid)} zł</dd>
          </div>
          {plan.arrangementFee.mid > 0 && (
            <div>
              <dt>Arrangement fee, paid up front</dt>
              <dd>{zl(plan.arrangementFee.mid)} zł</dd>
            </div>
          )}
          <div>
            <dt>Monthly repayment</dt>
            <dd>
              {stepsDown
                ? `${zl(plan.monthlyBeforeGrant.mid)} zł, then ${zl(plan.monthlyAfterGrant.mid)} zł`
                : `${zl(plan.monthlyBeforeGrant.mid)} zł`}
            </dd>
          </div>
          <div>
            <dt>Interest over the whole loan</dt>
            <dd>{zl(plan.totalInterest.mid)} zł</dd>
          </div>
          <div>
            <dt>Repayments you hand over in total</dt>
            <dd>{zl(plan.paidByHomeowner.mid)} zł</dd>
          </div>
        </dl>

        {plan.grantAppliedToCapital.mid === 0 &&
          plan.grantReimbursed.mid > 0 && (
            <p className="note-inline">
              Your repayments do not change when the grant arrives, unless you
              use it to pay the loan down early, which most people do.
            </p>
          )}

        <p className="note-inline">
          Net cost across the whole term, after the grant and the tax relief:{" "}
          <strong>{zl(plan.netCapitalCost.mid)} zł</strong>.
        </p>
      </section>

      {plan.warnings.map((w) => (
        <p className="warn" key={w}>
          {w}
        </p>
      ))}
      {sub.hasUnverifiedAmounts && (
        <p className="warn">
          The grant amounts above have not yet been checked against the
          programme document. Treat them as an estimate, not a promise.
        </p>
      )}
    </details>
  );
}

function ResultsScreen({
  model,
  onBack,
}: {
  model: {
    rc: ReturnType<typeof runningCosts>;
    rows: ResultRow[];
    verdict: ReturnType<typeof verdict>;
    route: (typeof ROUTES)[keyof typeof ROUTES];
    termYears: number;
    drivers: Driver[];
    schedule: PayoffSchedule | null;
    affordability: AffordabilityGuide | null;
    winnerLabel: string;
  };
  onBack: () => void;
}) {
  const {
    rc,
    rows,
    verdict: v,
    route,
    drivers,
    schedule,
    affordability,
    winnerLabel,
  } = model;
  const best = Math.min(...rows.map((r) => r.summary.afterLoan.mid));

  // The baseline every other card is measured against. Rounded here, once, so
  // every delta on the page reconciles with the number printed on the coal card.
  const todayMonthly = Math.round(
    rows.find((r) => r.id === "coal")?.running.mid ?? 0,
  );

  /** Delta against today, split into parts so the number and the direction can
   *  carry the emphasis while the connective words stay quiet. Words rather
   *  than signs: "−280 zł" reads literally as paying negative money. */
  const deltaParts = (
    value: number,
  ): { amount: string; word: string } | "same" | null => {
    if (todayMonthly === 0) return null;
    const d = Math.round(value) - todayMonthly;
    if (Math.abs(d) < 20) return "same";
    return { amount: `${zl(Math.abs(d))} zł`, word: d > 0 ? "more" : "less" };
  };

  /**
   * Collapse runs of identical years.
   *
   * Nine rows saying the same thing are noise on a phone. But their length IS
   * the commitment, so a collapsed run states its span in years explicitly —
   * "9 years" is a fact, counting rows is a task. Years carrying a tag (grant
   * lands, last payment) are never merged: those are the rows people look for.
   */
  const groupYears = (years: ScheduleYear[]) => {
    const out: { rows: ScheduleYear[]; span: number }[] = [];
    for (const y of years) {
      const tagged = y.isStepDownYear || y.isFinalLoanYear;
      const last = out[out.length - 1];
      const prev = last?.rows[last.rows.length - 1];
      const mergeable =
        !tagged &&
        prev !== undefined &&
        !prev.isStepDownYear &&
        !prev.isFinalLoanYear &&
        Math.round(prev.repayment) === Math.round(y.repayment) &&
        Math.round(prev.running) === Math.round(y.running) &&
        prev.monthsInYear === y.monthsInYear;

      if (mergeable && last) {
        last.rows.push(y);
        last.span += 1;
      } else {
        out.push({ rows: [y], span: 1 });
      }
    }
    // A run of two saves no space and loses a year label, so split it back out.
    return out.flatMap((g) =>
      g.span >= 3 ? [g] : g.rows.map((r) => ({ rows: [r], span: 1 })),
    );
  };

  /** Same delta, as a plain sentence, for places that cannot take markup —
   *  a table cell or a headline string. Wording matches the cards exactly. */
  const deltaSentence = (value: number): string => {
    const p = deltaParts(value);
    if (p === null) return `about ${zl(value)} zł a month`;
    if (p === "same") return "about the same as you pay today";
    return `${p.amount} a month ${p.word} than you pay today`;
  };

  /** Renders a delta, or falls back to the plain absolute when there is no
   *  baseline to compare against. */
  const Delta = ({
    value,
    className,
  }: {
    value: number;
    className: string;
  }) => {
    const p = deltaParts(value);
    if (p === null) {
      return (
        <p className={className}>
          {zl(value)} <span className="unit">zł a month</span>
        </p>
      );
    }
    if (p === "same") {
      return (
        <p className={`${className} delta`}>
          <span className="delta-key">about the same</span>{" "}
          <span className="delta-quiet">as today</span>
        </p>
      );
    }
    return (
      <p className={`${className} delta`}>
        <span className="delta-key">{p.amount}</span>{" "}
        <span className="delta-quiet">a month</span>{" "}
        <span className="delta-key">{p.word}</span>{" "}
        <span className="delta-quiet">than today</span>
      </p>
    );
  };

  const confidenceLine =
    rc.demand.confidence === "good"
      ? "We're reasonably confident in this."
      : rc.demand.confidence === "rough"
        ? "This is a rough estimate knowing your boiler's class would tighten it."
        : "This is too rough to lean on. Your boiler's class and coal type would fix it.";

  return (
    <div className="results">
      <button
        type="button"
        className="btn-secondary back-link"
        onClick={onBack}
      >
        ← Back
      </button>

      <header className="masthead">
        <p className="eyebrow">Silesia · coal boiler replacement</p>
        <h1>What will it actually cost you?</h1>
        <p className="lede">
          Real monthly numbers for coal, pellet, or heat pump loan and grant
          included, priced from what you actually burned last winter.
        </p>
      </header>

      <p className="demand">
        Your house needs about <strong>{zl(rc.demand.mid)} kWh</strong> of heat
        a year, somewhere between {band(rc.demand)} kWh. That is{" "}
        <strong>{Math.round(rc.demandPerM2.mid)} kWh</strong> for every square
        metre. {confidenceLine}
      </p>

      <section className="grid" aria-label="Your four options">
        {rows.map((r) => {
          const isBest = r.summary.afterLoan.mid === best;
          // Staying on coal borrows nothing, and neither does paying cash.
          // Printing "while you repay the loan" over a fuel bill invented a
          // debt the household does not have.
          const hasLoan = r.plan !== null && r.plan.amountBorrowed.mid > 0;

          return (
            <article key={r.id} className={isBest ? "card best" : "card"}>
              <h2>{r.label}</h2>

              {hasLoan ? (
                <>
                  <p className="stat-label">While you repay the loan</p>
                  <Delta value={r.summary.duringLoan.mid} className="figure" />
                  <p className="range">
                    {zl(r.summary.duringLoan.mid)} zł a month in total, could be{" "}
                    {band(r.summary.duringLoan)} zł
                  </p>

                  <p className="stat-label">Once the loan is paid off</p>
                  <Delta
                    value={r.summary.afterLoan.mid}
                    className="figure second"
                  />
                  <p className="range">
                    {zl(r.summary.afterLoan.mid)} zł a month in total, could be{" "}
                    {band(r.summary.afterLoan)} zł
                  </p>
                </>
              ) : (
                <>
                  <p className="stat-label">
                    {r.id === "coal"
                      ? "What you pay today"
                      : "What you would pay"}
                  </p>
                  {/* The coal card is the baseline, so it keeps the absolute at
                      full display size. Every other card is measured against it. */}
                  {r.id === "coal" ? (
                    <p className="figure">
                      {zl(r.running.mid)}{" "}
                      <span className="unit">zł a month</span>
                    </p>
                  ) : (
                    <Delta value={r.running.mid} className="figure" />
                  )}
                  <p className="range">
                    {r.id === "coal"
                      ? `could be ${band(r.running)} zł`
                      : `${zl(r.running.mid)} zł a month in total, could be ${band(r.running)} zł`}
                  </p>
                  <p className="note-inline">
                    {r.id === "coal"
                      ? "Fuel only. There is nothing to repay, because you are not buying anything. This is the number every other card is compared to."
                      : "Paid from savings, so there is no repayment, only running cost."}
                  </p>
                </>
              )}

              {r.sub && r.plan ? (
                <OptionBreakdown row={r} sub={r.sub} plan={r.plan} />
              ) : (
                <p className="note">
                  Your boiler's age and class decide when this has to go. This
                  column is here so you can see what you pay today.
                </p>
              )}
            </article>
          );
        })}
      </section>

      <section className={`verdict v-${v.kind}`}>
        <p className="eyebrow">What we would tell a neighbour</p>
        <h2>{v.headline}</h2>
        <p className="because">{v.because}</p>
        <p className="stat-label">What would change this</p>
        <ul>
          {v.wouldChangeIt.map((w, i) => (
            <li key={`${v.kind}-${i}`}>{w}</li>
          ))}
        </ul>
      </section>

      {schedule && (
        <section className="timeline">
          <p className="eyebrow">When you are free of it — {winnerLabel}</p>
          <h2 className="panel-title">
            {schedule.loanFreeYear
              ? `Loan-free in ${schedule.loanFreeYear}. From then, ${deltaSentence(schedule.monthlyOnceFree)}.`
              : "This never clears within the horizon we model."}
          </h2>
          {schedule.loanFreeYear && (
            <p className="note-inline">
              That is {zl(schedule.monthlyOnceFree)} zł a month in total,
              running cost only, against the {zl(todayMonthly)} zł you pay for
              coal today.
            </p>
          )}
          <table className="years">
            <thead>
              <tr>
                <th scope="col">Years</th>
                <th scope="col">Repayment</th>
                <th scope="col">Heating</th>
                <th scope="col">Compared with today</th>
              </tr>
            </thead>
            <tbody>
              {groupYears(schedule.years).map((g) => {
                const first = g.rows[0]!;
                const last = g.rows[g.rows.length - 1]!;
                // Every figure per month, matching the cards. The instalment
                // does not change in a partial year — there are simply fewer of
                // them — so a monthly figure describes the payment honestly
                // where an annual one makes the first year look cheaper.
                const m = first.monthsInYear || 1;
                const perMonthRepay = first.repayment / m;
                const perMonthHeat = first.running / m;
                const runTotal = g.rows.reduce((s, r) => s + r.total, 0);

                return (
                  <tr
                    key={first.year}
                    className={
                      first.repayment === 0
                        ? "free"
                        : first.isFinalLoanYear
                          ? "final"
                          : undefined
                    }
                  >
                    <th scope="row">
                      {g.span > 1 ? `${first.year}–${last.year}` : first.year}
                      {g.span > 1 && (
                        <span className="year-span">{g.span} years</span>
                      )}
                      {first.monthsInYear < 12 && g.span === 1 && (
                        <span className="year-span">
                          {first.monthsInYear} months
                        </span>
                      )}
                      {first.isStepDownYear && (
                        <span className="year-tag">grant lands</span>
                      )}
                      {first.isFinalLoanYear && (
                        <span className="year-tag">last payment</span>
                      )}
                    </th>
                    <td>
                      {perMonthRepay > 0 ? `${zl(perMonthRepay)} zł` : "—"}
                    </td>
                    <td>{zl(perMonthHeat)} zł</td>
                    <td>
                      <span className="year-delta">
                        {deltaSentence(perMonthRepay + perMonthHeat)}
                      </span>
                      <span className="year-total">
                        {zl(runTotal)} zł over{" "}
                        {g.span === 1 ? "the year" : "those years"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="note-inline">
            Every figure is per month. Coal is bought in bulk, so the coal
            comparison is a year's coal divided by twelve. Heating cost is held
            at today's prices, so the later rows are the shape of the
            commitment, not a prediction of the bills.
          </p>
        </section>
      )}

      {affordability && affordability.impliedNetIncome > 0 && (
        <section className="affordability">
          <p className="eyebrow">Before you go to a bank</p>
          <h2 className="panel-title">
            A lender will want to see about {zl(affordability.impliedNetIncome)}{" "}
            zł a month coming in.
          </h2>
          <p className="because">
            We never asked what you earn and we are not going to. But a bank
            does not test you at the advertised rate, it adds a margin first, so
            this loan is assessed as if the repayment were{" "}
            {zl(affordability.stressedInstalment)} zł, not{" "}
            {zl(rows.find((r) => r.plan)?.plan?.monthlyBeforeGrant.mid ?? 0)}{" "}
            zł. Then it caps total repayments at roughly a bit under half of
            what comes in, and assumes you still have to live.
          </p>
          {affordability.loanServiceableBySaving > 0 && (
            <p className="because">
              Put the other way round: what you would stop spending on coal
              could service a loan of about{" "}
              <strong>{zl(affordability.loanServiceableBySaving)} zł</strong> on
              its own. Anything above that comes out of the rest of your budget.
            </p>
          )}
          <p className="warn">
            This is a rough guide so you know what to expect, not credit advice,
            and no lender has seen it. Your own bank decides.
          </p>
        </section>
      )}

      <section className="future">
        <p className="eyebrow">Coming</p>
        <p>
          At 500 houses nearby, this will show what a house like yours actually
          pays measured, not estimated.
        </p>
      </section>

      <footer>
        <p className="stat-label">Where these numbers come from</p>
        <ul className="sources">
          <li>
            <strong>Electricity</strong> {C.ELECTRICITY_G11_PER_KWH.mid} zł/kWh
            · {C.ELECTRICITY_G11_PER_KWH.source}
          </li>
          <li>
            <strong>Coal</strong> {zl(C.COAL_PRICE_GUS_NATIONAL.value)} zł/t ·{" "}
            {C.COAL_PRICE_GUS_NATIONAL.source}
          </li>
          <li>
            <strong>Pellet</strong> {zl(C.PELLET_PRICE_PER_TONNE.mid)} zł/t ·{" "}
            {C.PELLET_PRICE_PER_TONNE.note}
          </li>
          <li>
            <strong>Financing</strong> {route.label} · {route.source}
          </li>
        </ul>
        {route.status === "suspended" && (
          <p className="warn">
            This way of borrowing is suspended right now. The figures above show
            what it would cost if it reopens.
          </p>
        )}
        <p className="warn">
          Prices are held flat. Nobody knows what electricity or coal will cost
          in ten years, and any tool that draws a clean line that far out is
          guessing.
        </p>
      </footer>
    </div>
  );
}
