import type { Meta, StoryObj } from "@storybook/react";
import { Stepper, type StepperStep } from "./Stepper";
import { useState } from "react";
import { Button } from "../Button/Button";

const meta: Meta<typeof Stepper> = {
  id: "navigation-stepper",
  title: "Core/Layout/Stepper",
  component: Stepper,
};

export default meta;
type Story = StoryObj<typeof Stepper>;

export const Default: Story = {
  render: () => (
    <Stepper steps={["Step 1", "Step 2", "Step 3", "Step 4"]} currentStep={1} />
  ),
};

export const Interactive: Story = {
  render: () => {
    const [currentStep, setCurrentStep] = useState(0);
    const steps = ["Details", "Shipping", "Payment", "Confirmation"];

    return (
      <div className="space-y-8">
        <Stepper steps={steps} currentStep={currentStep} />
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          <Button
            onClick={() =>
              setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))
            }
            disabled={currentStep === steps.length - 1}
          >
            Next
          </Button>
        </div>
      </div>
    );
  },
};

/**
 * A tour's progress (GAP-191): one dot per step, the current one long, the
 * done ones filled. A screen reader hears "Step 2 of 5" from the group, and
 * each dot's step by name.
 */
export const Dots: Story = {
  render: () => (
    <Stepper
      variant="dots"
      steps={[
        "Choose a floor",
        "Draw a room",
        "Name it",
        "Check the route",
        "Publish",
      ]}
      currentStep={1}
    />
  ),
};

/** The dots follow the step; `positionLabel` says the position in the product's words. */
export const DotsInteractive: Story = {
  render: () => {
    const [currentStep, setCurrentStep] = useState(0);
    const steps = [
      "Choose a floor",
      "Draw a room",
      "Name it",
      "Check the route",
      "Publish",
    ];
    return (
      <div className="space-y-8">
        <Stepper
          variant="dots"
          steps={steps}
          currentStep={currentStep}
          positionLabel={(step, count) =>
            `Step ${step} of ${count} of the tour`
          }
        />
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
          >
            Back
          </Button>
          <Button
            onClick={() =>
              setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))
            }
            disabled={currentStep === steps.length - 1}
          >
            Next
          </Button>
        </div>
      </div>
    );
  },
};

/**
 * Pointr Cloud's building wizard (GAP-173): five steps in a column, each
 * indicator beside its label. `orientation="vertical"`; the steps are the
 * same strings or objects as in a row.
 */
export const Vertical: Story = {
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <Stepper
        orientation="vertical"
        steps={[
          "Building details",
          "Levels",
          "Alignment",
          "Fine-tune",
          "Preview",
        ]}
        currentStep={2}
      />
    </div>
  ),
};

/**
 * A status for each step: done, current and pending follow `currentStep`
 * unless a step says its own; `error` is the danger fill and `loading` a
 * turning arc while the step works. Each is said after the label, "Levels,
 * Error", in the product's words from `statusLabels`.
 */
export const Statuses: Story = {
  render: () => (
    <Stepper
      steps={[
        { label: "Details", status: "done" },
        { label: "Levels", status: "error" },
        { label: "Alignment", status: "loading" },
        { label: "Fine-tune", status: "pending" },
        { label: "Preview", status: "done" },
      ]}
      currentStep={2}
    />
  ),
};

const wizardSteps = [
  "Building details",
  "Levels",
  "Alignment",
  "Fine-tune",
  "Preview",
];

/**
 * Going back: with `onStepSelect`, every step before the current one is a
 * button and a Tab stop, and a step ahead is one when it says
 * `disabled: false`, as a step already visited does here. The current step
 * never is, and a `disabled` one never is.
 */
export const Navigable: Story = {
  render: () => {
    const [currentStep, setCurrentStep] = useState(3);
    const [reached, setReached] = useState(3);
    const steps: StepperStep[] = wizardSteps.map((label, index) => ({
      label,
      status: index === 1 ? "error" : undefined,
      disabled: index > currentStep ? index > reached : undefined,
    }));
    return (
      <div style={{ maxWidth: 320 }} className="space-y-8">
        <Stepper
          orientation="vertical"
          steps={steps}
          currentStep={currentStep}
          onStepSelect={setCurrentStep}
        />
        <Button
          onClick={() => {
            const next = Math.min(wizardSteps.length - 1, currentStep + 1);
            setCurrentStep(next);
            setReached((prev) => Math.max(prev, next));
          }}
          disabled={currentStep === wizardSteps.length - 1}
        >
          Continue
        </Button>
      </div>
    );
  },
};

/** Right to left, the indicators and their line sit at the inline start, on the right. */
export const VerticalRightToLeft: Story = {
  render: () => (
    <div dir="rtl" lang="ar" style={{ maxWidth: 320 }}>
      <Stepper
        orientation="vertical"
        steps={[
          { label: "تفاصيل المبنى", status: "done" },
          { label: "الطوابق", status: "loading" },
          "المحاذاة",
          "الضبط الدقيق",
          "المعاينة",
        ]}
        currentStep={1}
        positionLabel="الخطوة {step} من {count}"
        statusLabels={{
          done: "مكتملة",
          loading: "قيد التنفيذ",
          pending: "لم تبدأ",
        }}
        onStepSelect={() => {}}
      />
    </div>
  ),
};
