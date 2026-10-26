import type { Meta, StoryObj } from "@storybook/react";
import { Stepper } from "./Stepper";
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
