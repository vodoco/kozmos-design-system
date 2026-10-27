import figma from "@figma/code-connect";
import { Stepper } from "./Stepper";

const stepperUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=512-39614";

const stepperProps = {
  count: figma.enum("Count", {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
  }),
  currentStep: figma.enum("Current", {
    "1": 0,
    "2": 1,
    "3": 2,
    "4": 3,
    "5": 4,
    "6": 5,
    "7": 6,
    "8": 7,
  }),
  step1Text: figma.string("Step 1 Text"),
  step2Text: figma.string("Step 2 Text"),
  step3Text: figma.string("Step 3 Text"),
  step4Text: figma.string("Step 4 Text"),
  step5Text: figma.string("Step 5 Text"),
  step6Text: figma.string("Step 6 Text"),
  step7Text: figma.string("Step 7 Text"),
  step8Text: figma.string("Step 8 Text"),
};

figma.connect(Stepper, stepperUrl, {
  variant: { Variant: "Numbered" },
  props: stepperProps,
  example: ({
    count,
    currentStep,
    step1Text,
    step2Text,
    step3Text,
    step4Text,
    step5Text,
    step6Text,
    step7Text,
    step8Text,
  }) => (
    <Stepper
      currentStep={Math.min(currentStep, count - 1)}
      steps={[
        step1Text,
        step2Text,
        step3Text,
        step4Text,
        step5Text,
        step6Text,
        step7Text,
        step8Text,
      ].slice(0, count)}
    />
  ),
});

// GAP-191: a tour's progress. The step texts name the dots in code, where a
// screen reader reads them; positionLabel's English default says "Step n of m".
figma.connect(Stepper, stepperUrl, {
  variant: { Variant: "Dots" },
  props: stepperProps,
  example: ({
    count,
    currentStep,
    step1Text,
    step2Text,
    step3Text,
    step4Text,
    step5Text,
    step6Text,
    step7Text,
    step8Text,
  }) => (
    <Stepper
      variant="dots"
      currentStep={Math.min(currentStep, count - 1)}
      steps={[
        step1Text,
        step2Text,
        step3Text,
        step4Text,
        step5Text,
        step6Text,
        step7Text,
        step8Text,
      ].slice(0, count)}
    />
  ),
});
