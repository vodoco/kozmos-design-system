import type { Meta, StoryObj } from "@storybook/react";
import { Slider } from "./Slider";

const meta: Meta<typeof Slider> = {
  title: "Components/Slider",
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
