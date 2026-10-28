import figma from "@figma/code-connect";
import { Stepper, type StepperStepStatus } from "./Stepper";

const stepperUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=512-39614";

// Code Connect substitutes a property's value where the example names it
// bare, or as an object literal's value, and nowhere else: an expression
// such as `[a, b].slice(0, count)` reaches Dev Mode as written. So there is
// one connect per Count, each listing exactly its steps as objects, and
// every value in the snippet is the instance's own.

const stepperProps = {
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

// GAP-173 (decision 119): Orientation, and a status for each step. A step's
// Error, Loading and Done booleans are its status, Error over Loading over
// Done, as the plugin draws them; with none on, it is the status its place
// gives it: done before Current, current at it, pending after it.
const numberedProps = {
  ...stepperProps,
  orientation: figma.enum("Orientation", {
    Horizontal: undefined,
    Vertical: "vertical",
  }),
  step1Status: figma.boolean<StepperStepStatus, StepperStepStatus>(
    "Step 1 Error",
    {
      true: "error",
      false: figma.boolean<StepperStepStatus, StepperStepStatus>(
        "Step 1 Loading",
        {
          true: "loading",
          false: figma.boolean<StepperStepStatus, StepperStepStatus>(
            "Step 1 Done",
            {
              true: "done",
              false: figma.enum<StepperStepStatus>("Current", {
                "1": "current",
                "2": "done",
                "3": "done",
                "4": "done",
                "5": "done",
                "6": "done",
                "7": "done",
                "8": "done",
              }),
            },
          ),
        },
      ),
    },
  ),
  step2Status: figma.boolean<StepperStepStatus, StepperStepStatus>(
    "Step 2 Error",
    {
      true: "error",
      false: figma.boolean<StepperStepStatus, StepperStepStatus>(
        "Step 2 Loading",
        {
          true: "loading",
          false: figma.boolean<StepperStepStatus, StepperStepStatus>(
            "Step 2 Done",
            {
              true: "done",
              false: figma.enum<StepperStepStatus>("Current", {
                "1": "pending",
                "2": "current",
                "3": "done",
                "4": "done",
                "5": "done",
                "6": "done",
                "7": "done",
                "8": "done",
              }),
            },
          ),
        },
      ),
    },
  ),
  step3Status: figma.boolean<StepperStepStatus, StepperStepStatus>(
    "Step 3 Error",
    {
      true: "error",
      false: figma.boolean<StepperStepStatus, StepperStepStatus>(
        "Step 3 Loading",
        {
          true: "loading",
          false: figma.boolean<StepperStepStatus, StepperStepStatus>(
            "Step 3 Done",
            {
              true: "done",
              false: figma.enum<StepperStepStatus>("Current", {
                "1": "pending",
                "2": "pending",
                "3": "current",
                "4": "done",
                "5": "done",
                "6": "done",
                "7": "done",
                "8": "done",
              }),
            },
          ),
        },
      ),
    },
  ),
  step4Status: figma.boolean<StepperStepStatus, StepperStepStatus>(
    "Step 4 Error",
    {
      true: "error",
      false: figma.boolean<StepperStepStatus, StepperStepStatus>(
        "Step 4 Loading",
        {
          true: "loading",
          false: figma.boolean<StepperStepStatus, StepperStepStatus>(
            "Step 4 Done",
            {
              true: "done",
              false: figma.enum<StepperStepStatus>("Current", {
                "1": "pending",
                "2": "pending",
                "3": "pending",
                "4": "current",
                "5": "done",
                "6": "done",
                "7": "done",
                "8": "done",
              }),
            },
          ),
        },
      ),
    },
  ),
  step5Status: figma.boolean<StepperStepStatus, StepperStepStatus>(
    "Step 5 Error",
    {
      true: "error",
      false: figma.boolean<StepperStepStatus, StepperStepStatus>(
        "Step 5 Loading",
        {
          true: "loading",
          false: figma.boolean<StepperStepStatus, StepperStepStatus>(
            "Step 5 Done",
            {
              true: "done",
              false: figma.enum<StepperStepStatus>("Current", {
                "1": "pending",
                "2": "pending",
                "3": "pending",
                "4": "pending",
                "5": "current",
                "6": "done",
                "7": "done",
                "8": "done",
              }),
            },
          ),
        },
      ),
    },
  ),
  step6Status: figma.boolean<StepperStepStatus, StepperStepStatus>(
    "Step 6 Error",
    {
      true: "error",
      false: figma.boolean<StepperStepStatus, StepperStepStatus>(
        "Step 6 Loading",
        {
          true: "loading",
          false: figma.boolean<StepperStepStatus, StepperStepStatus>(
            "Step 6 Done",
            {
              true: "done",
              false: figma.enum<StepperStepStatus>("Current", {
                "1": "pending",
                "2": "pending",
                "3": "pending",
                "4": "pending",
                "5": "pending",
                "6": "current",
                "7": "done",
                "8": "done",
              }),
            },
          ),
        },
      ),
    },
  ),
  step7Status: figma.boolean<StepperStepStatus, StepperStepStatus>(
    "Step 7 Error",
    {
      true: "error",
      false: figma.boolean<StepperStepStatus, StepperStepStatus>(
        "Step 7 Loading",
        {
          true: "loading",
          false: figma.boolean<StepperStepStatus, StepperStepStatus>(
            "Step 7 Done",
            {
              true: "done",
              false: figma.enum<StepperStepStatus>("Current", {
                "1": "pending",
                "2": "pending",
                "3": "pending",
                "4": "pending",
                "5": "pending",
                "6": "pending",
                "7": "current",
                "8": "done",
              }),
            },
          ),
        },
      ),
    },
  ),
  step8Status: figma.boolean<StepperStepStatus, StepperStepStatus>(
    "Step 8 Error",
    {
      true: "error",
      false: figma.boolean<StepperStepStatus, StepperStepStatus>(
        "Step 8 Loading",
        {
          true: "loading",
          false: figma.boolean<StepperStepStatus, StepperStepStatus>(
            "Step 8 Done",
            {
              true: "done",
              false: figma.enum<StepperStepStatus>("Current", {
                "1": "pending",
                "2": "pending",
                "3": "pending",
                "4": "pending",
                "5": "pending",
                "6": "pending",
                "7": "pending",
                "8": "current",
              }),
            },
          ),
        },
      ),
    },
  ),
};

figma.connect(Stepper, stepperUrl, {
  variant: { Variant: "Numbered", Count: "2" },
  props: numberedProps,
  example: ({
    currentStep,
    orientation,
    step1Text,
    step1Status,
    step2Text,
    step2Status,
  }) => (
    <Stepper
      orientation={orientation}
      currentStep={currentStep}
      steps={[
        { label: step1Text, status: step1Status },
        { label: step2Text, status: step2Status },
      ]}
    />
  ),
});

figma.connect(Stepper, stepperUrl, {
  variant: { Variant: "Numbered", Count: "3" },
  props: numberedProps,
  example: ({
    currentStep,
    orientation,
    step1Text,
    step1Status,
    step2Text,
    step2Status,
    step3Text,
    step3Status,
  }) => (
    <Stepper
      orientation={orientation}
      currentStep={currentStep}
      steps={[
        { label: step1Text, status: step1Status },
        { label: step2Text, status: step2Status },
        { label: step3Text, status: step3Status },
      ]}
    />
  ),
});

figma.connect(Stepper, stepperUrl, {
  variant: { Variant: "Numbered", Count: "4" },
  props: numberedProps,
  example: ({
    currentStep,
    orientation,
    step1Text,
    step1Status,
    step2Text,
    step2Status,
    step3Text,
    step3Status,
    step4Text,
    step4Status,
  }) => (
    <Stepper
      orientation={orientation}
      currentStep={currentStep}
      steps={[
        { label: step1Text, status: step1Status },
        { label: step2Text, status: step2Status },
        { label: step3Text, status: step3Status },
        { label: step4Text, status: step4Status },
      ]}
    />
  ),
});

figma.connect(Stepper, stepperUrl, {
  variant: { Variant: "Numbered", Count: "5" },
  props: numberedProps,
  example: ({
    currentStep,
    orientation,
    step1Text,
    step1Status,
    step2Text,
    step2Status,
    step3Text,
    step3Status,
    step4Text,
    step4Status,
    step5Text,
    step5Status,
  }) => (
    <Stepper
      orientation={orientation}
      currentStep={currentStep}
      steps={[
        { label: step1Text, status: step1Status },
        { label: step2Text, status: step2Status },
        { label: step3Text, status: step3Status },
        { label: step4Text, status: step4Status },
        { label: step5Text, status: step5Status },
      ]}
    />
  ),
});

figma.connect(Stepper, stepperUrl, {
  variant: { Variant: "Numbered", Count: "6" },
  props: numberedProps,
  example: ({
    currentStep,
    orientation,
    step1Text,
    step1Status,
    step2Text,
    step2Status,
    step3Text,
    step3Status,
    step4Text,
    step4Status,
    step5Text,
    step5Status,
    step6Text,
    step6Status,
  }) => (
    <Stepper
      orientation={orientation}
      currentStep={currentStep}
      steps={[
        { label: step1Text, status: step1Status },
        { label: step2Text, status: step2Status },
        { label: step3Text, status: step3Status },
        { label: step4Text, status: step4Status },
        { label: step5Text, status: step5Status },
        { label: step6Text, status: step6Status },
      ]}
    />
  ),
});

figma.connect(Stepper, stepperUrl, {
  variant: { Variant: "Numbered", Count: "7" },
  props: numberedProps,
  example: ({
    currentStep,
    orientation,
    step1Text,
    step1Status,
    step2Text,
    step2Status,
    step3Text,
    step3Status,
    step4Text,
    step4Status,
    step5Text,
    step5Status,
    step6Text,
    step6Status,
    step7Text,
    step7Status,
  }) => (
    <Stepper
      orientation={orientation}
      currentStep={currentStep}
      steps={[
        { label: step1Text, status: step1Status },
        { label: step2Text, status: step2Status },
        { label: step3Text, status: step3Status },
        { label: step4Text, status: step4Status },
        { label: step5Text, status: step5Status },
        { label: step6Text, status: step6Status },
        { label: step7Text, status: step7Status },
      ]}
    />
  ),
});

figma.connect(Stepper, stepperUrl, {
  variant: { Variant: "Numbered", Count: "8" },
  props: numberedProps,
  example: ({
    currentStep,
    orientation,
    step1Text,
    step1Status,
    step2Text,
    step2Status,
    step3Text,
    step3Status,
    step4Text,
    step4Status,
    step5Text,
    step5Status,
    step6Text,
    step6Status,
    step7Text,
    step7Status,
    step8Text,
    step8Status,
  }) => (
    <Stepper
      orientation={orientation}
      currentStep={currentStep}
      steps={[
        { label: step1Text, status: step1Status },
        { label: step2Text, status: step2Status },
        { label: step3Text, status: step3Status },
        { label: step4Text, status: step4Status },
        { label: step5Text, status: step5Status },
        { label: step6Text, status: step6Status },
        { label: step7Text, status: step7Status },
        { label: step8Text, status: step8Status },
      ]}
    />
  ),
});

// GAP-191: a tour's progress. The step texts name the dots in code, where a
// screen reader reads them; positionLabel's English default says "Step n of m".

figma.connect(Stepper, stepperUrl, {
  variant: { Variant: "Dots", Count: "2" },
  props: stepperProps,
  example: ({ currentStep, step1Text, step2Text }) => (
    <Stepper
      variant="dots"
      currentStep={currentStep}
      steps={[{ label: step1Text }, { label: step2Text }]}
    />
  ),
});

figma.connect(Stepper, stepperUrl, {
  variant: { Variant: "Dots", Count: "3" },
  props: stepperProps,
  example: ({ currentStep, step1Text, step2Text, step3Text }) => (
    <Stepper
      variant="dots"
      currentStep={currentStep}
      steps={[{ label: step1Text }, { label: step2Text }, { label: step3Text }]}
    />
  ),
});

figma.connect(Stepper, stepperUrl, {
  variant: { Variant: "Dots", Count: "4" },
  props: stepperProps,
  example: ({ currentStep, step1Text, step2Text, step3Text, step4Text }) => (
    <Stepper
      variant="dots"
      currentStep={currentStep}
      steps={[
        { label: step1Text },
        { label: step2Text },
        { label: step3Text },
        { label: step4Text },
      ]}
    />
  ),
});

figma.connect(Stepper, stepperUrl, {
  variant: { Variant: "Dots", Count: "5" },
  props: stepperProps,
  example: ({
    currentStep,
    step1Text,
    step2Text,
    step3Text,
    step4Text,
    step5Text,
  }) => (
    <Stepper
      variant="dots"
      currentStep={currentStep}
      steps={[
        { label: step1Text },
        { label: step2Text },
        { label: step3Text },
        { label: step4Text },
        { label: step5Text },
      ]}
    />
  ),
});

figma.connect(Stepper, stepperUrl, {
  variant: { Variant: "Dots", Count: "6" },
  props: stepperProps,
  example: ({
    currentStep,
    step1Text,
    step2Text,
    step3Text,
    step4Text,
    step5Text,
    step6Text,
  }) => (
    <Stepper
      variant="dots"
      currentStep={currentStep}
      steps={[
        { label: step1Text },
        { label: step2Text },
        { label: step3Text },
        { label: step4Text },
        { label: step5Text },
        { label: step6Text },
      ]}
    />
  ),
});

figma.connect(Stepper, stepperUrl, {
  variant: { Variant: "Dots", Count: "7" },
  props: stepperProps,
  example: ({
    currentStep,
    step1Text,
    step2Text,
    step3Text,
    step4Text,
    step5Text,
    step6Text,
    step7Text,
  }) => (
    <Stepper
      variant="dots"
      currentStep={currentStep}
      steps={[
        { label: step1Text },
        { label: step2Text },
        { label: step3Text },
        { label: step4Text },
        { label: step5Text },
        { label: step6Text },
        { label: step7Text },
      ]}
    />
  ),
});

figma.connect(Stepper, stepperUrl, {
  variant: { Variant: "Dots", Count: "8" },
  props: stepperProps,
  example: ({
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
      currentStep={currentStep}
      steps={[
        { label: step1Text },
        { label: step2Text },
        { label: step3Text },
        { label: step4Text },
        { label: step5Text },
        { label: step6Text },
        { label: step7Text },
        { label: step8Text },
      ]}
    />
  ),
});
