import { useEffect, useMemo, useRef, useState } from "react";
import { StepShell, ChoiceGroup } from "./wizard/StepShell";
import { Range, exact, range } from "./engines/range";
import { runningCosts, Tariff } from "./engines/runningCost";
import { Applicant, subsidiesFor } from "./engines/subsidy";
import { ROUTES, financingPlan, headlineMonthly } from "./engines/financing";
import { ScenarioSummary, verdict } from "./engines/verdict";
import { BuildingType, Ownership, screenHousehold } from "./engines/screening";
import {
  isValidPolishPostcode,
  lookupPostcode,
  maskPostcodeInput,
} from "./data/postcodes.pl";
import * as C from "./data/constants.pl";

const zl = (n: number) => Math.round(n).toLocaleString("pl-PL");
const band = (r: Range) => `${zl(r.low)} \u2013 ${zl(r.high)}`;

const READY: Applicant = {
  incomeLevel: "basic",
  gatesSatisfied: [
    "ownedThreeYears",
    "deviceOnZumList",
    "energyAuditDone",
    "replacingKopciuch",
    "incomeEvidenced",
  ],
};

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
  "financing",
  "results",
] as const;
type StepId = (typeof STEP_IDS)[number];
const idx = (id: StepId) => STEP_IDS.indexOf(id);

export default function App() {
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
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    stepRefs.current[stepId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [stepIndex]);

  const next = () => setStepIndex((i) => Math.min(i + 1, STEP_IDS.length - 1));
  const back = () => setStepIndex((i) => Math.max(i - 1, 0));
  const jumpTo = (id: StepId) => setStepIndex(idx(id));
  const showStep = (id: StepId) => idx(id) <= stepIndex;
  const isActive = (id: StepId) => idx(id) === stepIndex;

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
      if (!capital || !device) {
        return {
          id,
          label,
          capital: exact(0),
          grant: exact(0),
          summary: {
            id,
            label,
            duringLoan: running,
            afterLoan: running,
          } as ScenarioSummary,
        };
      }
      const sub = subsidiesFor(device, capital.mid, READY);
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

    return { rc, rows, verdict: v, route };
  }, [
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
            What's your coal boiler really costing you?
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
          helper="Tonnes, or how many deliveries. A rough number is fine we show you the range."
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
              { value: "ekogroszek", label: "Ekogroszek" },
              { value: "orzech", label: "Orzech" },
              { value: "groszek", label: "Groszek" },
              { value: "mial", label: "Miał" },
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
                sublabel: "An old kopciuch",
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
          helper="Coal boilers run hot, so coal-era radiators are small. A heat pump runs cooler, where the same radiator gives about half as much heat. This is the answer that decides the verdict."
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

      {showStep("financing") && (
        <StepShell
          {...shared("financing")}
          title="How would you pay for it?"
          nextLabel="See what it costs"
        >
          <ChoiceGroup
            value={routeId}
            onChange={setRouteId}
            options={Object.values(ROUTES).map((r) => ({
              value: r.id,
              label: r.label,
              sublabel:
                r.status === "suspended"
                  ? "Not available right now"
                  : undefined,
            }))}
          />
          <div className="sub-question">
            <p className="stat-label">Over how long?</p>
            <ChoiceGroup
              value={String(termYears)}
              onChange={(v) => setTermYears(+v)}
              options={[5, 8, 10, 12].map((y) => ({
                value: String(y),
                label: `${y} years`,
              }))}
            />
          </div>
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
  summary: ScenarioSummary;
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
  };
  onBack: () => void;
}) {
  const { rc, rows, verdict: v, route } = model;
  const best = Math.min(...rows.map((r) => r.summary.afterLoan.mid));

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
          return (
            <article key={r.id} className={isBest ? "card best" : "card"}>
              <h2>{r.label}</h2>

              <p className="stat-label">While you repay the loan</p>
              <p className="figure">
                {zl(r.summary.duringLoan.mid)}{" "}
                <span className="unit">zł a month</span>
              </p>
              <p className="range">could be {band(r.summary.duringLoan)} zł</p>

              <p className="stat-label">Once the loan is paid off</p>
              <p className="figure second">
                {zl(r.summary.afterLoan.mid)}{" "}
                <span className="unit">zł a month</span>
              </p>
              <p className="range">could be {band(r.summary.afterLoan)} zł</p>

              {r.capital.mid > 0 && (
                <dl className="detail">
                  <div>
                    <dt>The work costs</dt>
                    <dd>{zl(r.capital.mid)} zł</dd>
                  </div>
                  <div>
                    <dt>Grant pays</dt>
                    <dd className="grant">- {zl(r.grant.mid)} zł</dd>
                  </div>
                </dl>
              )}
              {r.id === "coal" && (
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
          {v.wouldChangeIt.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </section>

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
