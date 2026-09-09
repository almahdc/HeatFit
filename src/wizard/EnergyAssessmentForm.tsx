import { useState } from "react";
import { ArrowLeft, ArrowRight, Flame, Info, MapPin } from "lucide-react";
import {
  Block,
  FieldLabel,
  InfoBox,
  StepProgress,
  TextInputWithIcon,
} from "./FormPrimitives";
import { AssessmentState, initialAssessmentState } from "./assessmentTypes";
import {
  CurrentHeatingSection,
  ElectricityWaterSection,
  HomeComfortSection,
  PersonaPicker,
} from "./HouseholdCaseStudy";
import { HouseholdCaseInputs, initialHouseholdCase } from "./householdCases";

const STEP_LABELS = [
  "Welcome & Location",
  "Home Profile & Comfort",
  "Current Heating & Fuel",
  "Electricity & Water",
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
  const [step, setStep] = useState(initialStep);
  const [state, setState] = useState<AssessmentState>(initialState);
  const [household, setHousehold] =
    useState<HouseholdCaseInputs>(initialHousehold);
  const [attemptedNext, setAttemptedNext] = useState(false);

  const isLastStep = step === STEP_LABELS.length - 1;

  // Every field elsewhere has a sensible default from a persona or the
  // initial state, so it can never be "empty" — postal code, boiler year and
  // coal provider are the only fields a user must actually type themselves,
  // which makes them the only ones worth gating on.
  const postalCodeValid = state.location.postalCode.trim() !== "";
  const boilerYearValid = household.boilerYear !== "";
  const coalProviderValid = household.coalProvider.trim() !== "";

  const stepValid =
    step === 0
      ? postalCodeValid
      : step === 2
        ? boilerYearValid && coalProviderValid
        : true;

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
      <StepProgress steps={STEP_LABELS} current={step} />

      <div className="flex flex-col gap-6">
        {step === 0 && (
          <>
            <Block
              title="Welcome"
              subtitle="A few minutes of questions, in exchange for a clear answer on what replacing your boiler would actually cost and save."
            >
              <p className="text-base text-ink-soft">
                This tool is built{" "}
                <strong className="text-ink">
                  exclusively for households currently heating with a coal
                  boiler
                </strong>
                . Over the next few steps we'll ask about your home, your
                current coal use, and your electricity and water setup, then use
                that to estimate the running costs, subsidies, and financing for
                switching to gas, pellet, or a heat pump. If your home doesn't
                burn coal for heat, this calculator isn't the right fit yet.
              </p>
            </Block>

            <Block
              title="Location"
              subtitle="Your location determines climate zones and local anti-smog ordinances."
            >
              <div>
                <FieldLabel icon={MapPin}>
                  Postal Code <span className="text-accent">*</span>
                </FieldLabel>
                <TextInputWithIcon
                  icon={MapPin}
                  inputMode="text"
                  placeholder="e.g., 10115"
                  value={state.location.postalCode}
                  onChange={(v) =>
                    setState((s) => ({ ...s, location: { postalCode: v } }))
                  }
                />
                {attemptedNext && !postalCodeValid && (
                  <p className="mt-2 text-sm font-medium text-red-600">
                    Enter a postal code to continue.
                  </p>
                )}
              </div>
              <InfoBox icon={Info}>
                We use your postal code to check which regional subsidies apply
                to your area, what your municipality's deadline for replacing
                coal boilers is, and whether a local clean-air programme covers
                part of the cost.
              </InfoBox>
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
                Boiler installation year and coal provider are required to
                continue.
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
          Back
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
          {isLastStep ? "Continue to Financials" : "Continue"}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

export default EnergyAssessmentForm;
