import type { Meta, StoryObj } from "@storybook/react";
import { DateRangePicker } from "./DateRangePicker";

const meta = {
  id: "components-daterangepicker",
  title: "Core/Inputs/DateRangePicker",
  component: DateRangePicker,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof DateRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-[520px]">
      <DateRangePicker
        label="Travel window"
        helperText="Choose a start and end date."
        defaultValue={{ start: "2026-05-21", end: "2026-05-25" }}
        {...args}
      />
    </div>
  ),
};

export const ResponsiveStack: Story = {
  render: () => (
    <div className="w-80">
      <DateRangePicker
        label="Booking dates"
        helperText="Fields stack when their container is too narrow for two columns."
      />
    </div>
  ),
};

export const ValidationStates: Story = {
  render: () => (
    <div className="grid w-[520px] gap-6">
      <DateRangePicker label="Default" />
      <DateRangePicker
        label="Warning"
        status="warning"
        helperText="Check local blackout dates."
      />
      <DateRangePicker
        label="Success"
        status="success"
        helperText="Range is available."
      />
      <DateRangePicker
        label="Error"
        error="End date must be after start date."
      />
    </div>
  ),
};
