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
