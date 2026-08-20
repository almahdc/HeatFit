import { useMemo, useState } from "react";
import { Range, exact, range } from "./engines/range";
import { runningCosts, Tariff } from "./engines/runningCost";
import { Applicant, subsidiesFor } from "./engines/subsidy";
import { ROUTES, financingPlan, headlineMonthly } from "./engines/financing";
import { ScenarioSummary, verdict } from "./engines/verdict";
import * as C from "./data/constants.pl";
import { lookupPostcode, maskPostcodeInput } from "./data/postcodes.pl";

const zl = (n: number) => Math.round(n).toLocaleString("pl-PL");
const band = (r: Range) => `${zl(r.low)} – ${zl(r.high)}`;

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

export default function App() {
  const [coalTonnes, setCoalTonnes] = useState(4);
  const [area, setArea] = useState(140);
  const [scop, setScop] = useState(3.0);
  const [tariff, setTariff] = useState<Tariff>("G11");
  const [routeId, setRouteId] = useState("pozyczkaZielona");
  const [termYears, setTermYears] = useState(8);
  const [postcode, setPostcode] = useState("");
  const postcodeResult = useMemo(() => lookupPostcode(postcode), [postcode]);
  const [dhwSource, setDhwSource] = useState<"boiler" | "separate">("boiler");
  const [householdSize, setHouseholdSize] = useState(3);

  const model = useMemo(() => {
    const rc = runningCosts({
      coalTonnesPerYear: coalTonnes,
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
          summary: { id, label, duringLoan: running, afterLoan: running },
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
        summary: { id, label, duringLoan: h.duringLoan, afterLoan: h.afterLoan },
        warnings: plan.warnings,
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
      scenarios: rows.map((r) => r.summary as ScenarioSummary),
      demandPerM2: rc.demandPerM2,
      monthsUntilDeadline: 16,
    });

    return { rc, rows, verdict: v, route };
  }, [coalTonnes, area, scop, tariff, routeId, termYears]);

  const { rc, rows, verdict: v, route } = model;
  const best = Math.min(...rows.map((r) => r.summary.afterLoan.mid));

  return (
    <main>
      <header className="masthead">
        <p className="eyebrow">Silesia · coal boiler replacement</p>
        <h1>What's your coal boiler really costing you, and what would change it?</h1>
        <p className="lede">
          Real monthly numbers for coal, pellet, or heat pump, priced from what you burned last winter. Loan and grant included. Solar lowers your bill, but not always your monthly payment. We'll show you which one makes most sense.
        </p>
      </header>

      <section className="" aria-label="Your house">
        <Field label="Where is the house?" hint="postcode">
          <p className="field-description">
            Postcode is enough. It tells us your winter temperatures, your electricity distributor, and which deadline applies to you.
          </p>
          <input
              type="text"
              inputMode="numeric"
              placeholder="40-001"
              value={postcode}
              onChange={(e) => setPostcode(maskPostcodeInput(e.target.value))}
              aria-invalid={postcode.length === 6 && !postcodeResult.valid}
          />
        </Field>


        {postcode.length === 6 && !postcodeResult.inSilesia && (
            <p className="warn">
              We only cover Silesia today. Your numbers here won't be accurate for
              {" "}{postcode}.
            </p>
        )}

            <Field label="How many people live in the house?" hint="">
              <input
                  type="number"
                  min={1}
                  max={10}
                  step={1}
                  value={householdSize}
                  onChange={(e) =>
                      setHouseholdSize(Math.max(1, Math.min(10, +e.target.value || 3)))
                  }
              />
            </Field>

        <Field label="Coal burned last winter" hint="tonnes">
          <input
            type="number"
            step="0.5"
            min="0.5"
            value={coalTonnes}
            onChange={(e) => setCoalTonnes(Math.max(0.5, +e.target.value))}
          />
        </Field>
        <Field label="Heated area" hint="square metres">
          <input
            type="number"
            step="10"
            min="30"
            value={area}
            onChange={(e) => setArea(Math.max(30, +e.target.value))}
          />
        </Field>
        <Field label="Radiator quality" hint="from your photos">
          <select value={scop} onChange={(e) => setScop(+e.target.value)}>
            <option value={2.0}>Small radiators — runs hot</option>
            <option value={2.6}>Mixed</option>
            <option value={3.0}>Generous radiators</option>
            <option value={3.6}>Underfloor or oversized</option>
          </select>
        </Field>
        <Field label="Electricity tariff" hint="">
          <select value={tariff} onChange={(e) => setTariff(e.target.value as Tariff)}>
            <option value="G11">Flat, all day (G11)</option>
            <option value="G12w">Cheap nights and weekends (G12w)</option>
          </select>
        </Field>
        <Field label="How you pay for it" hint="">
          <select value={routeId} onChange={(e) => setRouteId(e.target.value)}>
            {Object.values(ROUTES).map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
                {r.status === "suspended" ? " — not available now" : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Loan length" hint="years">
          <select value={termYears} onChange={(e) => setTermYears(+e.target.value)}>
            {[5, 8, 10, 12].map((y) => (
              <option key={y} value={y}>
                {y} years
              </option>
            ))}
          </select>
        </Field>
      </section>

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
                {zl(r.summary.duringLoan.mid)} <span className="unit">zł a month</span>
              </p>
              <p className="range">could be {band(r.summary.duringLoan)} zł</p>

              <p className="stat-label">Once the loan is paid off</p>
              <p className="figure second">
                {zl(r.summary.afterLoan.mid)} <span className="unit">zł a month</span>
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
                    <dd className="grant">− {zl(r.grant.mid)} zł</dd>
                  </div>
                </dl>
              )}
              {r.id === "coal" && (
                <p className="note">
                  You cannot keep this. Replacing the boiler is required — this is only here
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

      <section className="future" aria-hidden="false">
        <p className="eyebrow">Coming</p>
        <p>
          At 500 houses nearby, this will show what a house like yours actually pays —
          measured, not estimated.
        </p>
      </section>

      <footer>
        <p className="stat-label">Where these numbers come from</p>
        <ul className="sources">
          <li>
            <strong>Electricity</strong> {C.ELECTRICITY_G11_PER_KWH.mid} zł/kWh ·{" "}
            {C.ELECTRICITY_G11_PER_KWH.source}
          </li>
          <li>
            <strong>Coal</strong> {zl(C.COAL_PRICE_PER_TONNE.mid)} zł/t ·{" "}
            {C.COAL_PRICE_PER_TONNE.source}
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
            This way of borrowing is suspended right now. The figures above show what it
            would cost if it reopens.
          </p>
        )}
        <p className="warn">
          Prices are held flat. Nobody knows what electricity or coal will cost in ten
          years, and any tool that draws a clean line that far out is guessing.
        </p>
      </footer>
    </main>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}
