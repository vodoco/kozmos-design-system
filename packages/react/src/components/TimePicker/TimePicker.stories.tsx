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

/**
 * Figma's Open variant (444:11455): the field's button opens Combobox's
 * list of times, on the field's time: 08:00 to 09:30 here, as Figma draws.
 */
export const Open: Story = {
  render: (args) => (
    <div className="w-80" style={{ height: 320 }}>
      <TimePicker
        label="Time"
        defaultValue="09:30"
        min="08:00"
        max="09:30"
        locale="en-GB"
        defaultOpen
        {...args}
      />
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
