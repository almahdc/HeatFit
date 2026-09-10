import { AlertTriangle, Droplets, Flame, Plug, Wallet } from "lucide-react";
import type { Baseline } from "../engines/baseline";

const zl = (n: number) =>
  `${Math.round(n).toLocaleString("pl-PL").replace(/ /g, " ")} zł`;

/**
 * The baseline block: what this household is paying today, on coal.
 *
 * Deliberately the first thing shown on the financials screen. Everything that
 * comes later (capex, subsidy, financing) is a change measured against this
 * number, so it has to be on screen and believable before any of it lands.
 */
export function BaselineSummary({ baseline }: { baseline: Baseline }) {
  const { cost, energy, electricity } = baseline;

  const lines = [
    {
      icon: Flame,
      label: "Space heating",
      sub: "Coal burned to keep the house warm",
      value: cost.spaceHeatingPlnPerYear,
    },
    {
      icon: Droplets,
      label: "Water heating",
      sub: "Hot water, however it is made",
      value: cost.waterHeatingPlnPerYear,
    },
    {
      icon: Plug,
      label: "Electricity & cooling",
      sub: "Everything else on the meter",
      value: cost.electricityAndCoolingPlnPerYear,
    },
  ];

  return (
    <section className="rounded-[20px] border border-line bg-white p-6 shadow-block">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent text-white">
        <Wallet className="h-5 w-5" aria-hidden />
      </div>
      <h2 className="text-[23px] font-bold tracking-tight text-ink">
        What you're paying now
      </h2>
      <p className="mt-2 text-base text-ink-soft">
        Your current year on coal, reconstructed from your answers. This is the
        figure every option below will be compared against.
      </p>

      {/* The headline. A household thinks in months, so lead with the month. */}
      <div className="mt-6 rounded-[16px] border border-accent-tint2 bg-accent-tint p-5">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-accent-600">
          Total outflow
        </p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[34px] font-bold leading-none tracking-tight text-accent-600">
            {zl(cost.totalPlnPerMonth)}
          </span>
          <span className="text-[15px] font-medium text-accent-600/80">
            per month
          </span>
        </div>
        <p className="mt-1.5 text-[14px] text-accent-600/80">
          {zl(cost.totalPlnPerYear)} per year
        </p>
      </div>

      {/* The same total, split by what it was spent on. */}
      <dl className="mt-5 divide-y divide-line border-y border-line">
        {lines.map(({ icon: Icon, label, sub, value }) => (
          <div
            key={label}
            className="flex items-center justify-between gap-4 py-3.5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-chip text-ink-soft">
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <div className="min-w-0">
                <dt className="text-[15px] font-semibold text-ink">{label}</dt>
                <p className="text-[13px] text-ink-soft">{sub}</p>
              </div>
            </div>
            <dd className="shrink-0 text-right">
              <span className="text-[16px] font-bold tabular-nums text-ink">
                {zl(value)}
              </span>
              <span className="block text-[12px] text-ink-soft">per year</span>
            </dd>
          </div>
        ))}
      </dl>

      {/* Facts that decide eligibility later, so worth surfacing now. */}
      <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        <Fact
          label="Heat delivered by your boiler"
          value={`${Math.round(energy.coalHeatDeliveredKwh).toLocaleString("pl-PL").replace(/ /g, " ")} kWh/year`}
        />
        <Fact
          label="Building condition"
          value={`${energy.spaceHeatPerM2.toFixed(0)} kWh/m²/year`}
        />
      </div>

      {/*
        The bill and the model rarely agree, and the difference is information,
        not an error. Shown only when it is big enough to mean something.
      */}
      {electricity.gapKwh !== null &&
        Math.abs(electricity.gapKwh) > 500 &&
        (() => {
          const over = electricity.gapKwh! > 0;
          // Hot water and cooling are the only two things our estimate adds on
          // top of a flat "everything else" baseline. If neither contributed
          // any kWh, they cannot be why a smaller-than-expected bill looks low
          // - the flat baseline itself, sized for a typical household, is the
          // only thing left that could be. Blaming hot water or cooling here
          // would point at the wrong number.
          const modelIncludedWaterOrCooling =
            energy.waterElectricityKwh > 0 || energy.coolingElectricityKwh > 0;
          return (
            <div className="mt-5 flex gap-3 rounded-[14px] border border-line bg-[#fbfaf8] p-4 text-sm text-ink-soft">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft/70"
                aria-hidden
              />
              <p>
                Your bill implies{" "}
                <strong className="text-ink">
                  {Math.abs(Math.round(electricity.gapKwh!))
                    .toLocaleString("pl-PL")
                    .replace(/ /g, " ")}{" "}
                  kWh/year {over ? "more" : "less"}
                </strong>{" "}
                than we would expect from your answers.{" "}
                {over
                  ? "That usually means an electric heater, an immersion tank, or a workshop we have not asked about yet."
                  : modelIncludedWaterOrCooling
                    ? "That usually means our hot water or cooling estimate is too generous for your household."
                    : "That usually means the typical household we compare everyday electricity use against (lighting, fridge, and similar) uses more than your household does."}{" "}
                We priced the bill you gave us, not our estimate.
              </p>
            </div>
          );
        })()}

      {baseline.assumptions.length > 0 && (
        <details className="mt-5 rounded-[14px] border border-line bg-[#fbfaf8] p-4">
          <summary className="cursor-pointer text-[13px] font-semibold text-ink-soft">
            What we assumed ({baseline.assumptions.length})
          </summary>
          <ul className="mt-3 flex list-disc flex-col gap-2 pl-4 text-[13px] text-ink-soft">
            {baseline.assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-ink-soft/70">
        {label}
      </dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
