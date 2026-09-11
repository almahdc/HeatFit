import { Clock, ExternalLink, Gavel } from "lucide-react";
import {
  getRegulatoryCountdown,
  monthsAndDaysUntil,
} from "../engines/regulatoryDeadlines";
import { SILESIAN_ANTI_SMOG_SOURCE_URL } from "../data/silesianAntiSmogResolution";
import type { BoilerClass } from "./householdCases";
import { StepEyebrow } from "./FormPrimitives";
import { useI18n } from "../i18n";

/** Three visual/copy tiers, not the same as `BoilerDeadline.status`:
 *  "uncertain" is a `status: "passed"` result carrying `ecodesignCaveat`,
 *  and reads differently on purpose (see below). */
type Severity = "upcoming" | "uncertain" | "passed";

const PALETTE: Record<
  Severity,
  { border: string; bg: string; iconBg: string; iconText: string }
> = {
  upcoming: {
    border: "border-yellow-200",
    bg: "bg-yellow-50",
    iconBg: "bg-yellow-100",
    iconText: "text-yellow-700",
  },
  // Deliberately not red: we cannot confirm non-compliance from Ecodesign
  // certification alone, so this sits visually between "still fine" and
  // "confirmed non-compliant" rather than reading as an alarm.
  uncertain: {
    border: "border-orange-200",
    bg: "bg-orange-50",
    iconBg: "bg-orange-100",
    iconText: "text-orange-700",
  },
  passed: {
    border: "border-red-200",
    bg: "bg-red-50",
    iconBg: "bg-red-100",
    iconText: "text-red-700",
  },
};

/**
 * Regulatory-deadline card for the results screen: the Silesian anti-smog
 * resolution's Class 5 deadline for the household's own boiler, covering all
 * four §8 tiers (see engines/regulatoryDeadlines.ts), not just the one that
 * still has time left on it.
 *
 * Shows nothing outside the Silesian voivodeship, and nothing for a boiler
 * that already meets Class 5: `getRegulatoryCountdown` returns null in both
 * cases, and this component returns null right back. It reads only the
 * postal code and boiler fields already collected on the wizard's location
 * and current-heating steps, so it never gates or changes the subsidy/cost
 * calculator itself.
 *
 * A boiler whose only known credential is Ecodesign certification (not a
 * confirmed Class 5 rating) gets a hedged "uncertain" reading once its
 * age-based deadline is behind us, rather than the flat "no longer meets"
 * wording used for a confirmed off-class boiler: Ecodesign is a separate EU
 * standard, and we genuinely do not know whether that boiler meets Class 5,
 * so the copy says "may", never "illegal".
 */
export function RegulatoryCountdownCard({
  postalCode,
  boilerClass,
  boilerYear,
}: {
  postalCode: string;
  boilerClass: BoilerClass;
  boilerYear: number | "";
}) {
  const { t, lang } = useI18n();
  const rc = t.regulatoryCountdown;

  const deadline = getRegulatoryCountdown(postalCode, boilerClass, boilerYear);
  if (!deadline) return null;

  const dateFormatter = new Intl.DateTimeFormat(
    lang === "pl" ? "pl-PL" : "en-GB",
    { day: "numeric", month: "long", year: "numeric" },
  );
  const deadlineDate = new Date(deadline.deadline);
  const formattedDate = dateFormatter.format(deadlineDate);

  const upcoming = deadline.status === "upcoming";
  const uncertain = !upcoming && deadline.ecodesignCaveat;
  const severity: Severity = upcoming
    ? "upcoming"
    : uncertain
      ? "uncertain"
      : "passed";
  const palette = PALETTE[severity];

  const { months, days } = upcoming
    ? monthsAndDaysUntil(new Date(), deadlineDate)
    : { months: 0, days: 0 };

  const headline = upcoming
    ? rc.headlineUpcoming(formattedDate)
    : uncertain
      ? rc.headlinePassedUncertain
      : rc.headlinePassed;

  const requirement = upcoming
    ? rc.requirementUpcoming(formattedDate)
    : uncertain
      ? rc.requirementPassedUncertain(formattedDate)
      : rc.requirementPassed(formattedDate);

  return (
    <section
      className={`rounded-[20px] border p-6 shadow-block ${palette.border} ${palette.bg}`}
    >
      <div
        className={`mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] ${palette.iconBg} ${palette.iconText}`}
      >
        <Gavel className="h-5 w-5" aria-hidden />
      </div>
      <StepEyebrow>{rc.eyebrow}</StepEyebrow>
      <h2 className="text-[23px] font-bold tracking-tight text-ink">
        {headline}
      </h2>
      <p className="mt-2 text-base text-ink-soft">{requirement}</p>

      {upcoming && (
        <div className="mt-5 rounded-[16px] border border-yellow-200 bg-white p-5">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-yellow-700">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {rc.countdownLabel}
          </p>
          <p className="mt-1 text-[28px] font-bold leading-none tracking-tight text-ink">
            {rc.countdown(months, days)}
          </p>
        </div>
      )}

      <div
        className={`mt-5 rounded-[14px] border p-4 text-[13.5px] leading-relaxed text-ink-soft ${palette.border} bg-white`}
      >
        <p className="font-semibold text-ink">{rc.consequenceTitle}</p>
        <p className="mt-1">{rc.consequenceBody}</p>
      </div>

      <div className="mt-4 text-[12.5px] text-ink-soft">
        <p>{rc.sourceLabel}</p>
        <a
          href={SILESIAN_ANTI_SMOG_SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1.5 font-semibold text-accent-600 underline decoration-accent-tint2 underline-offset-2 hover:decoration-accent-600"
        >
          {rc.sourceLink}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>
    </section>
  );
}
