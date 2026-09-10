import { ReactNode } from "react";
import { Check, type LucideIcon } from "lucide-react";
import { useT } from "../i18n";

/** Every major section: a distinct rounded block with its own header.
 *
 *  `eyebrow` carries the roadmap step ("Step 2 of 5 · Your options"). Naming
 *  the step turns a wall of separate money blocks into one route the
 *  household is being walked along, and tells them how much is still ahead. */
export function Block({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[20px] border border-line bg-white p-6 shadow-block">
      <header className="mb-5">
        {eyebrow && <StepEyebrow>{eyebrow}</StepEyebrow>}
        <h2 className="text-[23px] font-bold tracking-tight text-ink">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-[14.5px] text-ink-soft">{subtitle}</p>
        )}
      </header>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

/** The roadmap step label above a block heading. */
export function StepEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-accent">
      {children}
    </p>
  );
}

/** A verified-status pill: what a programme actually recognises, said plainly
 *  enough that it can be checked rather than taken on faith. */
export function TrustBadge({
  icon: Icon,
  label,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-[12px] border border-accent-tint2 bg-accent-tint px-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" aria-hidden />
      <div>
        <p className="text-[13px] font-semibold text-accent-600">{label}</p>
        <p className="text-[12px] leading-snug text-accent-600/80">{detail}</p>
      </div>
    </div>
  );
}

/**
 * "Why does this matter?" disclosure.
 *
 * A tooltip would hide this behind a hover the household cannot perform on a
 * phone, so it is a real disclosure instead: closed by default, one tap to
 * open, and the answer stays on screen while they read it. Every number this
 * tool shows should be traceable to an answer they gave.
 */
export function WhyNote({
  summary,
  children,
}: {
  summary: string;
  children: ReactNode;
}) {
  return (
    <details className="mt-2 rounded-[12px] border border-line bg-[#fbfaf8] px-3.5 py-2.5">
      <summary className="cursor-pointer text-[12.5px] font-semibold text-ink-soft hover:text-ink">
        {summary}
      </summary>
      <div className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">
        {children}
      </div>
    </details>
  );
}

/** The small uppercase title every field/group needs above it. */
export function FieldLabel({
  icon: Icon,
  children,
}: {
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-ink-soft">
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
      {children}
    </p>
  );
}

export interface IconCardOption<T extends string> {
  value: T;
  label: string;
  sublabel?: string;
  badge?: string;
  icon: LucideIcon;
}

/** Grid of clickable icon cards used everywhere a choice is offered. */
export function IconCardGroup<T extends string>({
  value,
  onChange,
  options,
  columns = 2,
}: {
  value: T;
  onChange: (v: T) => void;
  options: IconCardOption<T>[];
  columns?: 2 | 3 | 4;
}) {
  const colsClass =
    columns === 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : columns === 3
        ? "sm:grid-cols-3"
        : "sm:grid-cols-2";

  return (
    <div className={`grid grid-cols-1 gap-2.5 ${colsClass}`} role="radiogroup">
      {options.map((opt) => {
        const selected = value === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={`relative flex flex-col items-start gap-2 rounded-[14px] border bg-white p-3.5 text-left transition-all duration-150 active:scale-[0.97] ${
              selected
                ? "border-accent/60 bg-accent-tint shadow-card-selected"
                : "border-line shadow-card hover:border-ink-soft/30"
            }`}
          >
            {selected && (
              <span className="absolute right-2.5 top-2.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-accent">
                <Check
                  className="h-[11px] w-[11px] text-white"
                  strokeWidth={3}
                  aria-hidden
                />
              </span>
            )}
            {opt.badge && (
              <span
                className={`self-start rounded-full px-2 py-1 text-[10.5px] font-semibold ${
                  selected
                    ? "bg-accent-tint2 text-accent"
                    : "bg-chip text-ink-soft"
                }`}
              >
                {opt.badge}
              </span>
            )}
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${
                selected ? "bg-accent text-white" : "bg-chip text-ink-soft"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-ink">{opt.label}</p>
              {opt.sublabel && (
                <p className="text-[13px] text-ink-soft">{opt.sublabel}</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/** Range slider with a live numeric readout, used for heated area. */
export function IconSlider({
  icon: Icon,
  min,
  max,
  step = 1,
  value,
  unit,
  onChange,
}: {
  icon: LucideIcon;
  min: number;
  max: number;
  step?: number;
  value: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="rounded-[14px] border border-line bg-[#fbfaf8] p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-ink-soft">
          <Icon className="h-3.5 w-3.5" aria-hidden />
          <span className="text-[13px]">
            {min}–{max} {unit}
          </span>
        </div>
        <span className="text-[18px] font-bold tabular-nums text-accent">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-accent"
        style={{
          background: `linear-gradient(to right, #33508f ${pct}%, #e7e4dd ${pct}%)`,
        }}
      />
    </div>
  );
}

/** A +/- stepper for small integer counts, e.g. number of occupants. */
export function IconStepper({
  icon: Icon,
  min,
  max,
  value,
  unit,
  onChange,
}: {
  icon: LucideIcon;
  min: number;
  max: number;
  value: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  const t = useT();
  return (
    <div className="flex items-center justify-between rounded-[14px] border border-line bg-[#fbfaf8] p-4">
      <div className="flex items-center gap-2 text-ink-soft">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        <span className="text-[13px]">{unit ?? t.a11y.count}</span>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-lg font-semibold text-ink-soft shadow-sm transition-colors hover:bg-chip disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={t.a11y.decrease}
        >
          −
        </button>
        <span className="w-6 text-center text-[15px] font-bold tabular-nums text-ink">
          {value}
        </span>
        <button
          type="button"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-lg font-semibold text-ink-soft shadow-sm transition-colors hover:bg-chip disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={t.a11y.increase}
        >
          +
        </button>
      </div>
    </div>
  );
}

/** Toggle card for optional equipment: PV panels, battery, heat storage. */
export function ToggleCard({
  icon: Icon,
  label,
  sublabel,
  checked,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  sublabel?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex flex-col items-start gap-2 rounded-[14px] border bg-white p-3.5 text-left transition-all duration-150 active:scale-[0.97] ${
        checked
          ? "border-accent/60 bg-accent-tint shadow-card-selected"
          : "border-line shadow-card hover:border-ink-soft/30"
      }`}
    >
      <div className="flex w-full items-start justify-between">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${
            checked ? "bg-accent text-white" : "bg-chip text-ink-soft"
          }`}
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </div>
        <span
          className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${
            checked ? "bg-accent" : "bg-line"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              checked ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </span>
      </div>
      <div>
        <p className="text-[15px] font-semibold text-ink">{label}</p>
        {sublabel && <p className="text-[13px] text-ink-soft">{sublabel}</p>}
      </div>
    </button>
  );
}

export function TextInputWithIcon({
  icon: Icon,
  value,
  onChange,
  placeholder,
  suffix,
  inputMode,
}: {
  icon: LucideIcon;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
  inputMode?: "text" | "numeric" | "decimal";
}) {
  return (
    <div className="flex items-center gap-2 rounded-[14px] border border-line bg-white px-4 py-3 shadow-card focus-within:border-accent/60 focus-within:ring-1 focus-within:ring-accent/40">
      <Icon className="h-4 w-4 shrink-0 text-ink-soft/70" aria-hidden />
      <input
        type="text"
        inputMode={inputMode}
        className="w-full text-base text-ink outline-none placeholder:text-ink-soft/50"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {suffix && (
        <span className="shrink-0 text-sm text-ink-soft/70">{suffix}</span>
      )}
    </div>
  );
}

export function TextAreaWithIcon({
  icon: Icon,
  value,
  onChange,
  placeholder,
  rows = 2,
}: {
  icon: LucideIcon;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="flex items-start gap-2 rounded-[14px] border border-line bg-white px-4 py-3 shadow-card focus-within:border-accent/60 focus-within:ring-1 focus-within:ring-accent/40">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft/70" aria-hidden />
      <textarea
        rows={rows}
        className="w-full resize-none text-base text-ink outline-none placeholder:text-ink-soft/50"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function InfoBox({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-[14px] border border-accent-tint2 bg-accent-tint p-4 text-sm text-accent-600">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>{children}</p>
    </div>
  );
}

/** Step progress indicator for the top of the wizard. */
export function StepProgress({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  const t = useT();
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= current ? "bg-accent" : "bg-line"
            }`}
          />
        ))}
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft/70">
        {t.wizard.stepProgress(current + 1, steps.length, steps[current] ?? "")}
      </p>
    </div>
  );
}
