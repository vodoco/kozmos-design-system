import type { Meta, StoryObj } from "@storybook/react";
import { DatePicker, DateRangePicker } from "./DatePicker";

const meta = {
  id: "components-datepicker",
  title: "Core/Inputs/DatePicker",
  component: DatePicker,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-80">
      <DatePicker
        label="Start date"
        helperText="Use local calendar dates."
        {...args}
      />
    </div>
  ),
};

/**
 * Figma's Open variant (438:2392): the field's button opens Kozmos's
 * calendar, on the field's day, where the browser's own button can give way
 * (Chromium, Edge, Safari). In Firefox the field stays the browser's.
 */
export const Open: Story = {
  render: (args) => (
    <div className="w-80" style={{ height: 440 }}>
      <DatePicker
        label="Date"
        defaultValue="2026-05-25"
        locale="en-US"
        today="2026-05-22"
        defaultOpen
        {...args}
      />
    </div>
  ),
};

export const DateRange: Story = {
  render: () => (
    <div className="w-[520px]">
      <DateRangePicker
        label="Travel window"
        helperText="Choose a start and end date."
      />
    </div>
  ),
};

export const ValidationStates: Story = {
  render: () => (
    <div className="grid w-80 gap-4">
      <DatePicker label="Default" />
      <DatePicker
        label="Warning"
        status="warning"
        helperText="Check this date."
      />
      <DatePicker
        label="Success"
        status="success"
        helperText="Date available."
      />
      <DatePicker label="Error" error="Choose a future date." />
    </div>
  ),
};
