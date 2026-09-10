import { ReactNode } from "react";

/**
 * StepShell: one question in the all-at-once layout.
 *
 * Every step renders in full (title, helper text, input) and stays that way;
 * there is no collapsed/completed state and no Next/Back navigation. The
 * user scrolls the page to move between steps and answers can be edited in
 * place at any time.
 */

export interface StepShellProps {
  title: string;
  helper?: string;
  children: ReactNode;
}

export function StepShell({ title, helper, children }: StepShellProps) {
  return (
    <div className="step-block">
      <h2 className="step-title">{title}</h2>
      {helper && <p className="step-helper">{helper}</p>}
      <div className="step-body">{children}</div>
    </div>
  );
}

/** A single-select rendered as large tappable cards rather than a dropdown.
 *  Dropdowns hide the options; for a once-through wizard, showing every
 *  choice at once reads better on a big monitor on stage and on a phone. */
export function ChoiceGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; sublabel?: string }[];
}) {
  return (
    <div className="choice-group" role="radiogroup">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          className={value === opt.value ? "choice selected" : "choice"}
          onClick={() => onChange(opt.value)}
        >
          <span className="choice-label">{opt.label}</span>
          {opt.sublabel && (
            <span className="choice-sublabel">{opt.sublabel}</span>
          )}
        </button>
      ))}
    </div>
  );
}
