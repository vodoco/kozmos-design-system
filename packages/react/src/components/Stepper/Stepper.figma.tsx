import figma from "@figma/code-connect";
import { Stepper } from "./Stepper";

const stepperUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=512-39614";

// Count is the steps array, one name per step. Step 1 Text through Step 8
// Text cannot reach it: Code Connect substitutes a property in an object's
// value or as an attribute, never as a bare element of an array, so the
// steps are named as the set's defaults are, and the product names its own.
// Current is currentStep as it is: the set has no Current past its Count.
const stepperProps = {
  steps: figma.enum("Count", {
    "2": ["Step 1", "Step 2"],
    "3": ["Step 1", "Step 2", "Step 3"],
    "4": ["Step 1", "Step 2", "Step 3", "Step 4"],
    "5": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"],
    "6": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5", "Step 6"],
    "7": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5", "Step 6", "Step 7"],
    "8": [
      "Step 1",
      "Step 2",
      "Step 3",
      "Step 4",
      "Step 5",
      "Step 6",
      "Step 7",
      "Step 8",
    ],
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
};

figma.connect(Stepper, stepperUrl, {
  variant: { Variant: "Numbered" },
  props: stepperProps,
  example: ({ currentStep, steps }) => (
    <Stepper currentStep={currentStep} steps={steps} />
  ),
});

// GAP-191: a tour's progress. The steps name the dots in code, where a
// screen reader reads them; positionLabel's English default says "Step n of m".
figma.connect(Stepper, stepperUrl, {
  variant: { Variant: "Dots" },
  props: stepperProps,
  example: ({ currentStep, steps }) => (
    <Stepper variant="dots" currentStep={currentStep} steps={steps} />
  ),
});
