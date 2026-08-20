import { ReactNode } from "react";

/**
 * StepShell — one question in the continuous-scroll flow.
 *
 * active=true  -> full editor: progress bar, helper text, Back/Next.
 * active=false -> a completed row: smaller title, the same input control
 *                 (so the chosen answer is still visible and still editable),
 *                 no nav. Clicking anywhere on a completed row jumps back to
 *                 it — editing in place rather than a separate "edit" mode.
 */

export interface StepShellProps {
  stepIndex: number; // 0-based
  totalSteps: number;
  title: string;
  helper?: string;
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  hideNext?: boolean;
  /** Is this the step currently being answered? */
  active: boolean;
  /** Called when a completed (non-active) row is clicked, to jump back to it. */
  onActivate?: () => void;
  /** Attaches the DOM node so the wizard can scroll to it on Next. */
  innerRef?: (el: HTMLDivElement | null) => void;
}

export function StepShell({
  stepIndex,
  totalSteps,
  title,
  helper,
  children,
  onBack,
  onNext,
  nextLabel = "Next",
  nextDisabled = false,
  hideNext = false,
  active,
  onActivate,
  innerRef,
}: StepShellProps) {
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  return (
    <div
      ref={innerRef}
      className={active ? "step-block active" : "step-block completed"}
      onClick={!active ? onActivate : undefined}
    >
      <h2 className="step-title">{title}</h2>
      {active && helper && <p className="step-helper">{helper}</p>}

      <div className="step-body" onClick={(e) => active && e.stopPropagation()}>
        {children}
      </div>

      {active && (
        <div className="step-nav">
          {onBack ? (
            <button type="button" className="btn-secondary" onClick={onBack}>
              Back
            </button>
          ) : (
            <span />
          )}
          {!hideNext && onNext && (
            <button
              type="button"
              className="btn-primary"
              onClick={onNext}
              disabled={nextDisabled}
            >
              {nextLabel}
            </button>
          )}
        </div>
      )}
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

/** Same idea for multi-select (checkboxes as cards), used by fuel access
 *  and the "what's been done to the house" question. */
export function MultiChoiceGroup<T extends string>({
  value,
  onToggle,
  options,
}: {
  value: T[];
  onToggle: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="choice-group">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="checkbox"
          aria-checked={value.includes(opt.value)}
          className={value.includes(opt.value) ? "choice selected" : "choice"}
          onClick={() => onToggle(opt.value)}
        >
          <span className="choice-label">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
