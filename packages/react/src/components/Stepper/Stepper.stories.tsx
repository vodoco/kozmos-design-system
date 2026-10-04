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
