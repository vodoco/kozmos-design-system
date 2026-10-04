import type { Meta, StoryObj } from "@storybook/react";
import { TimePicker } from "./TimePicker";

const meta = {
  id: "components-timepicker",
  title: "Core/Inputs/TimePicker",
  component: TimePicker,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof TimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-80">
      <TimePicker label="Start time" helperText="Use local time." {...args} />
    </div>
  ),
};

export const Error: Story = {
  render: () => (
    <div className="w-80">
      <TimePicker label="Cutoff time" error="Choose a time before closing." />
    </div>
  ),
};
