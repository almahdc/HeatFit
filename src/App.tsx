import { useEffect, useMemo, useRef, useState } from "react";
import { StepShell, ChoiceGroup, MultiChoiceGroup } from "./wizard/StepShell";
import { Range, exact, range } from "./engines/range";
import { runningCosts, Tariff } from "./engines/runningCost";
import { Applicant, subsidiesFor } from "./engines/subsidy";
import { ROUTES, financingPlan, headlineMonthly } from "./engines/financing";
import { ScenarioSummary, verdict } from "./engines/verdict";
import {
  BuildingType,
  FuelAccess,
  Ownership,
  OutdoorSpace,
  RoofAccess,
  screenHousehold,
} from "./engines/screening";
import { isValidPolishPostcode, lookupPostcode, maskPostcodeInput } from "./data/postcodes.pl";
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

// The step order. Everything upstream of "results" scrolls: each answered
// step stays on screen, smaller, and clicking it jumps back to edit it.
const STEP_IDS = [
  "buildingType",
  "ownership",
  "outdoorSpace",
  "roofAccess",
  "fuelAccess",
  "postcode",
  "coalTonnes",
  "dhwSource",
  "householdSize",
  "area",
  "scop",
  "tariff",
  "route",
  "termYears",
  "results",
] as const;
type StepId = (typeof STEP_IDS)[number];

const idx = (id: StepId) => STEP_IDS.indexOf(id);

export default function App() {
  // --- screening: not about heat, gates everything downstream ---------------
  const [buildingType, setBuildingType] = useState<BuildingType>("detached");
  const [ownership, setOwnership] = useState<Ownership>("ownedOutright");
  const [outdoorSpace, setOutdoorSpace] = useState<OutdoorSpace>("garden");
  const [roofAccess, setRoofAccess] = useState<RoofAccess>("ownRoof");
  const [fuelAccess, setFuelAccess] = useState<FuelAccess[]>(["truckAccess", "dryStorage"]);

  const screening = useMemo(
    () => screenHousehold({ buildingType, ownership, outdoorSpace, roofAccess, fuelAccess }),
    [buildingType, ownership, outdoorSpace, roofAccess, fuelAccess]
  );

  function toggleFuelAccess(v: FuelAccess) {
    setFuelAccess((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));
  }

  // --- postcode ---------------------------------------------------------------
  const [postcode, setPostcode] = useState("");
  const postcodeResult = useMemo(() => lookupPostcode(postcode), [postcode]);

  // --- coal baseline ------------------------------------------------------------
  const [coalTonnes, setCoalTonnes] = useState(4);
  const [area, setArea] = useState(140);
  const [dhwSource, setDhwSource] = useState<"boiler" | "separate">("boiler");
  const [householdSize, setHouseholdSize] = useState(3);
  const [scop, setScop] = useState(3.0);
  const [tariff, setTariff] = useState<Tariff>("G11");
  const [routeId, setRouteId] = useState("pozyczkaZielona");
  const [termYears, setTermYears] = useState(8);

  // --- wizard position + scroll -------------------------------------------------
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
      return; // don't scroll on initial mount, page is already at the top
    }
    const el = stepRefs.current[stepId];
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [stepIndex]);

  function next() {
    setStepIndex((i) => Math.min(i + 1, STEP_IDS.length - 1));
  }
  function back() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }
  function jumpTo(id: StepId) {
    setStepIndex(idx(id));
  }

  const isPastScreening = (id: StepId) => idx(id) >= idx("postcode");

  // --- the pricing model (unchanged logic) ---------------------------------------
  const model = useMemo(() => {
    const rc = runningCosts({
      coalTonnesBought: coalTonnes,
      coalType: "ekogroszek",
      boilerClass: "unknown",
      feedType: "handFed",
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
      running: Range
    ) => {
      if (!capital || !device) {
        return {
          id,
          label,
          capital: exact(0),
          grant: exact(0),
          summary: { id, label, duringLoan: running, afterLoan: running } as ScenarioSummary,
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
        summary: { id, label, duringLoan: h.duringLoan, afterLoan: h.afterLoan } as ScenarioSummary,
      };
    };

    const pvCapital = toBand(C.HEAT_PUMP_INSTALLED_COST);
    const rows = [
      build("coal", "Coal", null, null, rc.coal.monthly),
      build("pellet", "Pellet", toBand(C.PELLET_BOILER_INSTALLED_COST), "pelletBoiler", rc.pellet.monthly),
      build("heatPump", "Heat pump", toBand(C.HEAT_PUMP_INSTALLED_COST), "heatPump", rc.heatPump.monthly),
      build(
        "heatPumpPlusPv",
        "Heat pump + solar",
        range(pvCapital.low + 18000, pvCapital.mid + 22000, pvCapital.high + 28000),
        "heatPump",
        rc.heatPumpPlusPv.monthly
      ),
    ];

    const v = verdict({
      scenarios: rows.map((r) => r.summary),
      demandPerM2: rc.demandPerM2,
      monthsUntilDeadline: 16,
    });

    return { rc, rows, verdict: v, route };
  }, [coalTonnes, area, scop, tariff, routeId, termYears]);

  const showStep = (id: StepId) => idx(id) <= stepIndex;
  const isActive = (id: StepId) => idx(id) === stepIndex;

  return (
    <main className="wizard-shell">
      {stepId !== "results" && (
        <div className="wizard-top">
          <p className="masthead-mini">What's your coal boiler really costing you?</p>
          <div className="overall-progress-track">
            <div
              className="overall-progress-fill"
              style={{ width: `${((stepIndex + 1) / (totalSteps - 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {showStep("buildingType") && (
        <StepShell
          stepIndex={idx("buildingType")}
          totalSteps={totalSteps}
          title="What kind of building is it?"
          active={isActive("buildingType")}
          onActivate={() => jumpTo("buildingType")}
          innerRef={setStepRef("buildingType")}
          onNext={next}
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
        <StepShell
          stepIndex={idx("ownership")}
          totalSteps={totalSteps}
          title="Do you own it?"
          active={isActive("ownership")}
          onActivate={() => jumpTo("ownership")}
          innerRef={setStepRef("ownership")}
          onBack={back}
          onNext={next}
        >
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
              This tool is for whoever decides on the heating system \u2014 as a tenant,
              that's your landlord. Worth sharing this with them once you've had a look.
            </p>
          )}
        </StepShell>
      )}

      {showStep("outdoorSpace") && (
        <StepShell
          stepIndex={idx("outdoorSpace")}
          totalSteps={totalSteps}
          title="Outdoor space?"
          helper="For a heat pump's outdoor unit."
          active={isActive("outdoorSpace")}
          onActivate={() => jumpTo("outdoorSpace")}
          innerRef={setStepRef("outdoorSpace")}
          onBack={back}
          onNext={next}
        >
          <ChoiceGroup
            value={outdoorSpace}
            onChange={setOutdoorSpace}
            options={[
              { value: "garden", label: "Garden or yard" },
              { value: "balconyOnly", label: "Balcony only" },
              { value: "none", label: "None" },
            ]}
          />
        </StepShell>
      )}

      {showStep("roofAccess") && (
        <StepShell
          stepIndex={idx("roofAccess")}
          totalSteps={totalSteps}
          title="Roof?"
          helper="For solar panels, if that turns out to make sense for you."
          active={isActive("roofAccess")}
          onActivate={() => jumpTo("roofAccess")}
          innerRef={setStepRef("roofAccess")}
          onBack={back}
          onNext={next}
        >
          <ChoiceGroup
            value={roofAccess}
            onChange={setRoofAccess}
            options={[
              { value: "ownRoof", label: "My own roof" },
              { value: "sharedRoof", label: "Shared with other owners" },
              { value: "flatRoof", label: "Flat roof" },
              { value: "none", label: "No roof access" },
            ]}
          />
        </StepShell>
      )}

      {showStep("fuelAccess") && (
        <StepShell
          stepIndex={idx("fuelAccess")}
          totalSteps={totalSteps}
          title="Fuel delivery"
          helper="Select anything that's true."
          active={isActive("fuelAccess")}
          onActivate={() => jumpTo("fuelAccess")}
          innerRef={setStepRef("fuelAccess")}
          onBack={back}
          onNext={next}
        >
          <MultiChoiceGroup
            value={fuelAccess}
            onToggle={toggleFuelAccess}
            options={[
              { value: "truckAccess", label: "A delivery truck can reach the house" },
              { value: "dryStorage", label: "There's dry storage space" },
            ]}
          />
        </StepShell>
      )}

      {showStep("postcode") && (
        <StepShell
          stepIndex={idx("postcode")}
          totalSteps={totalSteps}
          title="Where is the house?"
          helper="Postcode is enough. It tells us your winter temperatures, your electricity distributor, and which deadline applies to you."
          active={isActive("postcode")}
          onActivate={() => jumpTo("postcode")}
          innerRef={setStepRef("postcode")}
          onBack={back}
          onNext={next}
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
          {isActive("postcode") && postcode.length === 6 && !postcodeResult.inSilesia && (
            <p className="inline-warn">
              We only cover Silesia today \u2014 your numbers here won't be accurate for {postcode}.
            </p>
          )}
        </StepShell>
      )}

      {isPastScreening(stepId) && !screening.canProceed && (
        <div className="step-block active">
          <h2 className="step-title">This one isn't for you yet</h2>
          <p className="inline-warn">{screening.stopReason}</p>
          <div className="step-nav">
            <button type="button" className="btn-secondary" onClick={back}>
              Back
            </button>
            <span />
          </div>
        </div>
      )}

      {screening.canProceed && showStep("coalTonnes") && (
        <StepShell
          stepIndex={idx("coalTonnes")}
          totalSteps={totalSteps}
          title="How much coal did you burn last winter?"
          helper="Tonnes, or your best guess. We'll show you the range."
          active={isActive("coalTonnes")}
          onActivate={() => jumpTo("coalTonnes")}
          innerRef={setStepRef("coalTonnes")}
          onBack={back}
          onNext={next}
        >
          <input
            type="number"
            step={0.5}
            min={0.5}
            className="big-input"
            value={coalTonnes}
            onChange={(e) => setCoalTonnes(Math.max(0.5, +e.target.value))}
          />
          <span className="input-unit">tonnes</span>
        </StepShell>
      )}

      {screening.canProceed && showStep("dhwSource") && (
        <StepShell
          stepIndex={idx("dhwSource")}
          totalSteps={totalSteps}
          title="Does this boiler heat your water too?"
          active={isActive("dhwSource")}
          onActivate={() => jumpTo("dhwSource")}
          innerRef={setStepRef("dhwSource")}
          onBack={back}
          onNext={next}
        >
          <ChoiceGroup
            value={dhwSource}
            onChange={setDhwSource}
            options={[
              { value: "boiler", label: "Yes, the boiler heats the water" },
              { value: "separate", label: "No, that's separate" },
            ]}
          />
        </StepShell>
      )}

      {screening.canProceed && showStep("householdSize") && (
        <StepShell
          stepIndex={idx("householdSize")}
          totalSteps={totalSteps}
          title="How many people live in the house?"
          helper="This decides how much hot water to add to the comparison."
          active={isActive("householdSize")}
          onActivate={() => jumpTo("householdSize")}
          innerRef={setStepRef("householdSize")}
          onBack={back}
          onNext={next}
        >
          <input
            type="number"
            min={1}
            max={10}
            step={1}
            className="big-input"
            value={householdSize}
            onChange={(e) => setHouseholdSize(Math.max(1, Math.min(10, +e.target.value || 3)))}
          />
        </StepShell>
      )}

      {screening.canProceed && showStep("area") && (
        <StepShell
          stepIndex={idx("area")}
          totalSteps={totalSteps}
          title="How many square metres do you actually heat?"
          helper="If you close off part of the house in winter, give the part you heat."
          active={isActive("area")}
          onActivate={() => jumpTo("area")}
          innerRef={setStepRef("area")}
          onBack={back}
          onNext={next}
        >
          <input
            type="number"
            step={10}
            min={30}
            className="big-input"
            value={area}
            onChange={(e) => setArea(Math.max(30, +e.target.value))}
          />
          <span className="input-unit">m\u00b2</span>
        </StepShell>
      )}

      {screening.canProceed && showStep("scop") && (
        <StepShell
          stepIndex={idx("scop")}
          totalSteps={totalSteps}
          title="What are your radiators like?"
          helper="From your photos, roughly."
          active={isActive("scop")}
          onActivate={() => jumpTo("scop")}
          innerRef={setStepRef("scop")}
          onBack={back}
          onNext={next}
        >
          <ChoiceGroup
            value={String(scop)}
            onChange={(v) => setScop(+v)}
            options={[
              { value: "2", label: "Small radiators", sublabel: "Runs hot" },
              { value: "2.6", label: "Mixed" },
              { value: "3", label: "Generous radiators" },
              { value: "3.6", label: "Underfloor or oversized" },
            ]}
          />
        </StepShell>
      )}

      {screening.canProceed && showStep("tariff") && (
        <StepShell
          stepIndex={idx("tariff")}
          totalSteps={totalSteps}
          title="Electricity tariff"
          active={isActive("tariff")}
          onActivate={() => jumpTo("tariff")}
          innerRef={setStepRef("tariff")}
          onBack={back}
          onNext={next}
        >
          <ChoiceGroup
            value={tariff}
            onChange={setTariff}
            options={[
              { value: "G11", label: "Flat, all day (G11)" },
              { value: "G12w", label: "Cheap nights and weekends (G12w)" },
            ]}
          />
        </StepShell>
      )}

      {screening.canProceed && showStep("route") && (
        <StepShell
          stepIndex={idx("route")}
          totalSteps={totalSteps}
          title="How would you pay for it?"
          active={isActive("route")}
          onActivate={() => jumpTo("route")}
          innerRef={setStepRef("route")}
          onBack={back}
          onNext={next}
        >
          <ChoiceGroup
            value={routeId}
            onChange={setRouteId}
            options={Object.values(ROUTES).map((r) => ({
              value: r.id,
              label: r.label,
              sublabel: r.status === "suspended" ? "Not available now" : undefined,
            }))}
          />
        </StepShell>
      )}

      {screening.canProceed && showStep("termYears") && (
        <StepShell
          stepIndex={idx("termYears")}
          totalSteps={totalSteps}
          title="Loan length"
          active={isActive("termYears")}
          onActivate={() => jumpTo("termYears")}
          innerRef={setStepRef("termYears")}
          onBack={back}
          onNext={next}
        >
          <ChoiceGroup
            value={String(termYears)}
            onChange={(v) => setTermYears(+v)}
            options={[5, 8, 10, 12].map((y) => ({ value: String(y), label: `${y} years` }))}
          />
        </StepShell>
      )}

      {screening.canProceed && showStep("results") && (
        <div ref={setStepRef("results")}>
          <ResultsScreen model={model} onBack={back} />
        </div>
      )}
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

  return (
    <div className="results">
      <button type="button" className="btn-secondary back-link" onClick={onBack}>
        \u2190 Back
      </button>

      <header className="masthead">
        <p className="eyebrow">Silesia \u00b7 coal boiler replacement</p>
        <h1>What will it actually cost you?</h1>
        <p className="lede">
          Real monthly numbers for coal, pellet, or heat pump \u2014 loan and grant included,
          priced from what you actually burned last winter.
        </p>
      </header>

      <p className="demand">
        Your house needs about <strong>{zl(rc.demand.mid)} kWh</strong> of heat a year.
        That is <strong>{Math.round(rc.demandPerM2.mid)} kWh</strong> for every square metre.
      </p>

      <section className="grid" aria-label="Your four options">
        {rows.map((r) => {
          const isBest = r.summary.afterLoan.mid === best;
          return (
            <article key={r.id} className={isBest ? "card best" : "card"}>
              <h2>{r.label}</h2>

              <p className="stat-label">While you repay the loan</p>
              <p className="figure">
                {zl(r.summary.duringLoan.mid)} <span className="unit">z\u0142 a month</span>
              </p>
              <p className="range">could be {band(r.summary.duringLoan)} z\u0142</p>

              <p className="stat-label">Once the loan is paid off</p>
              <p className="figure second">
                {zl(r.summary.afterLoan.mid)} <span className="unit">z\u0142 a month</span>
              </p>
              <p className="range">could be {band(r.summary.afterLoan)} z\u0142</p>

              {r.capital.mid > 0 && (
                <dl className="detail">
                  <div>
                    <dt>The work costs</dt>
                    <dd>{zl(r.capital.mid)} z\u0142</dd>
                  </div>
                  <div>
                    <dt>Grant pays</dt>
                    <dd className="grant">\u2212 {zl(r.grant.mid)} z\u0142</dd>
                  </div>
                </dl>
              )}
              {r.id === "coal" && (
                <p className="note">
                  You cannot keep this. Replacing the boiler is required \u2014 this is only here
                  so you can see what you pay today.
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
          At 500 houses nearby, this will show what a house like yours actually pays \u2014
          measured, not estimated.
        </p>
      </section>

      <footer>
        <p className="stat-label">Where these numbers come from</p>
        <ul className="sources">
          <li>
            <strong>Electricity</strong> {C.ELECTRICITY_G11_PER_KWH.mid} z\u0142/kWh \u00b7{" "}
            {C.ELECTRICITY_G11_PER_KWH.source}
          </li>
          <li>
            <strong>Coal</strong> {zl(C.COAL_PRICE_PER_TONNE.mid)} z\u0142/t \u00b7{" "}
            {C.COAL_PRICE_PER_TONNE.source}
          </li>
          <li>
            <strong>Pellet</strong> {zl(C.PELLET_PRICE_PER_TONNE.mid)} z\u0142/t \u00b7{" "}
            {C.PELLET_PRICE_PER_TONNE.note}
          </li>
          <li>
            <strong>Financing</strong> {route.label} \u00b7 {route.source}
          </li>
        </ul>
        {route.status === "suspended" && (
          <p className="warn">
            This way of borrowing is suspended right now. The figures above show what it
            would cost if it reopens.
          </p>
        )}
        <p className="warn">
          Prices are held flat. Nobody knows what electricity or coal will cost in ten
          years, and any tool that draws a clean line that far out is guessing.
        </p>
      </footer>
    </div>
  );
}
