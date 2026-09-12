import { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Clock,
  Flame,
  Mail,
  MapPin,
  Megaphone,
  Newspaper,
  UserCheck,
} from "lucide-react";
import {
  Block,
  FieldLabel,
  IconCardGroup,
  StepProgress,
  TextInputWithIcon,
  WhyNote,
  type IconCardOption,
} from "./FormPrimitives";
import { AssessmentState, initialAssessmentState } from "./assessmentTypes";
import { CONTACT_EMAIL } from "../constants";
import {
  CurrentHeatingSection,
  ElectricityWaterSection,
  HomeComfortSection,
  PersonaPicker,
} from "./HouseholdCaseStudy";
import {
  CityDeadlineNotice,
  HouseholdCaseInputs,
  initialHouseholdCase,
} from "./householdCases";
import { useScrollToTopOnChange } from "../hooks/useScrollToTopOnChange";
import { formatPolishPostalCode, postalCodeIssue } from "../utils/postalCode";
import { LanguageToggle, useT } from "../i18n";
import type { Dictionary } from "../i18n";

const cityDeadlineOptions = (
  t: Dictionary,
): IconCardOption<CityDeadlineNotice>[] => [
  {
    value: "none",
    label: t.options.cityDeadlineNotice.none.label,
    icon: Megaphone,
  },
  {
    value: "pressOrMediaOnly",
    label: t.options.cityDeadlineNotice.pressOrMediaOnly.label,
    icon: Newspaper,
  },
  {
    value: "officialLetter",
    label: t.options.cityDeadlineNotice.officialLetter.label,
    icon: Mail,
  },
  {
    value: "chimneySweep",
    label: t.options.cityDeadlineNotice.chimneySweep.label,
    icon: UserCheck,
  },
];

export function EnergyAssessmentForm({
  onComplete,
  initialState = initialAssessmentState,
  initialHousehold = initialHouseholdCase,
  initialStep = 0,
}: {
  onComplete: (state: AssessmentState, household: HouseholdCaseInputs) => void;
  initialState?: AssessmentState;
  initialHousehold?: HouseholdCaseInputs;
  initialStep?: number;
}) {
  const t = useT();
  const stepLabels = [
    t.wizard.steps.welcomeLocation,
    t.wizard.steps.homeProfile,
    t.wizard.steps.currentHeating,
    t.wizard.steps.electricityWater,
  ];

  const [step, setStep] = useState(initialStep);
  const [state, setState] = useState<AssessmentState>(initialState);
  const [household, setHousehold] =
    useState<HouseholdCaseInputs>(initialHousehold);
  const [attemptedNext, setAttemptedNext] = useState(false);

  useScrollToTopOnChange(step);

  const isLastStep = step === stepLabels.length - 1;

  // Every field elsewhere has a sensible default from a persona or the
  // initial state, so it can never be "empty": postal code and boiler year
  // are the only fields a user must actually type themselves, which makes
  // them the only ones worth gating on.
  const postalCodeValid = state.location.postalCode.trim() !== "";
  const boilerYearValid = household.boilerYear !== "";

  const stepValid =
    step === 0 ? postalCodeValid : step === 2 ? boilerYearValid : true;

  const goNext = () => {
    if (!stepValid) {
      setAttemptedNext(true);
      return;
    }
    setAttemptedNext(false);
    if (isLastStep) {
      onComplete(state, household);
    } else {
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
    setAttemptedNext(false);
    setStep((s) => Math.max(0, s - 1));
  };

  return (
    <div className="mx-auto w-full lg:w-1/2 lg:min-w-[600px] xl:max-w-[820px] px-4 py-8">
      <div className="mb-4 flex justify-end">
        <LanguageToggle />
      </div>

      <StepProgress steps={stepLabels} current={step} />

      <div className="flex flex-col gap-6">
        {step === 0 && (
          <>
            <Block
              title={t.wizard.welcome.title}
              subtitle={t.wizard.welcome.subtitle}
            >
              <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-chip px-3 py-1.5 text-[12.5px] font-medium text-ink-soft">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {t.wizard.welcome.timeEstimate}
              </p>

              <div>
                <h3 className="text-base font-semibold text-ink">
                  {t.wizard.welcome.fitTitle}
                </h3>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-ink-soft">
                  <li>
                    <strong className="text-ink">
                      {t.wizard.welcome.fitCoalUsersLabel}
                    </strong>{" "}
                    {t.wizard.welcome.fitCoalUsersBody}
                    <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
                      {CONTACT_EMAIL}
                    </a>
                    {t.wizard.welcome.fitCoalUsersEmailSuffix}
                  </li>
                </ul>
              </div>

              <p className="mt-3 text-base font-medium text-ink">
                {t.wizard.welcome.readyPrompt}
              </p>
            </Block>

            <Block
              title={t.wizard.location.title}
              subtitle={t.wizard.location.subtitle}
            >
              <div>
                <FieldLabel icon={MapPin}>
                  {t.wizard.location.postalCode}{" "}
                  <span className="text-accent">*</span>
                </FieldLabel>
                <TextInputWithIcon
                  icon={MapPin}
                  inputMode="numeric"
                  placeholder={t.wizard.location.postalCodePlaceholder}
                  value={state.location.postalCode}
                  onChange={(v) =>
                    setState((s) => ({
                      ...s,
                      location: { postalCode: formatPolishPostalCode(v) },
                    }))
                  }
                />
                {attemptedNext && !postalCodeValid && (
                  <p className="mt-2 text-sm font-medium text-red-600">
                    {t.wizard.location.postalCodeRequired}
                  </p>
                )}
                {state.location.postalCode.length === 6 &&
                  postalCodeIssue(state.location.postalCode) && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-yellow-50 p-3 border border-yellow-200">
                      <AlertCircle
                        className="h-4 w-4 mt-0.5 text-yellow-600 flex-shrink-0"
                        aria-hidden
                      />
                      <p className="text-sm text-yellow-700">
                        {t.postalCode.invalidFormat}
                      </p>
                    </div>
                  )}
              </div>

              <div>
                <FieldLabel icon={Megaphone}>
                  {t.wizard.location.cityDeadline}
                </FieldLabel>
                <IconCardGroup
                  columns={4}
                  value={household.cityDeadlineNotice}
                  onChange={(v) =>
                    setHousehold((h) => ({ ...h, cityDeadlineNotice: v }))
                  }
                  options={cityDeadlineOptions(t)}
                />
              </div>

              <WhyNote summary={t.wizard.location.whySummary}>
                {t.wizard.location.info}
              </WhyNote>
            </Block>
          </>
        )}

        {step === 1 && (
          <>
            <PersonaPicker value={household} onChange={setHousehold} />
            <HomeComfortSection value={household} onChange={setHousehold} />
          </>
        )}

        {step === 2 && (
          <>
            <CurrentHeatingSection value={household} onChange={setHousehold} />
            {attemptedNext && !stepValid && (
              <p className="flex items-center gap-2 text-sm font-medium text-red-600">
                <Flame className="h-4 w-4" aria-hidden />
                {t.wizard.heatingStepRequired}
              </p>
            )}
          </>
        )}

        {step === 3 && (
          <ElectricityWaterSection value={household} onChange={setHousehold} />
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0}
          className="flex items-center gap-2 rounded-xl border border-line bg-white px-5 py-3 text-[14.5px] font-semibold text-ink-soft transition-colors hover:bg-chip disabled:cursor-not-allowed disabled:opacity-0"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t.nav.back}
        </button>
        <button
          type="button"
          onClick={goNext}
          className={`flex items-center gap-2 rounded-xl px-6 py-3 text-[14.5px] font-semibold text-white shadow-cta transition-colors active:scale-[0.98] ${
            stepValid
              ? "bg-accent hover:bg-accent-600"
              : "bg-accent/50 hover:bg-accent/50"
          }`}
        >
          {isLastStep ? t.nav.seeResults : t.nav.next}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

export default EnergyAssessmentForm;
