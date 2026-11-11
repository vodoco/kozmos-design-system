import type { Meta, StoryObj } from "@storybook/react";
import { Slider } from "./Slider";

const meta: Meta<typeof Slider> = {
  id: "components-slider",
  title: "Core/Inputs/Slider",
  component: Slider,
};

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  render: () => (
    <Slider
      label="Volume"
      defaultValue={[50]}
      max={100}
      step={1}
      className="w-3/5"
    />
  ),
};

export const Range: Story = {
  render: () => (
    <Slider defaultValue={[20, 80]} max={100} step={1} className="w-3/5" />
  ),
};

// A readout that stays (GAP-163): the value at the slider's end, at rest
// too, as formatValue words it. The thumb says it; the readout is not read.
export const WithReadout: Story = {
  render: () => (
    <div className="grid w-3/5 gap-6">
      <Slider
        label="Floor-plan opacity"
        defaultValue={[60]}
        max={100}
        step={5}
        showValue
        formatValue={(value) => `${value}%`}
      />
      <Slider
        label="Price"
        defaultValue={[20, 80]}
        max={100}
        showValue
        thumbLabels={["Lowest price", "Highest price"]}
      />
    </div>
  ),
};
