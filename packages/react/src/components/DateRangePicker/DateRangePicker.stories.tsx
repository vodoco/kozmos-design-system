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

/**
 * Figma's Open variant (443:7567): either field's button opens one panel for
 * the range, two months where the window has room, on that field's day.
 */
export const Open: Story = {
  render: (args) => (
    <div className="w-[520px]" style={{ height: 520 }}>
      <DateRangePicker
        label="Date range"
        defaultValue={{ start: "2026-05-21", end: "2026-05-25" }}
        locale="en-US"
        today="2026-05-22"
        defaultOpen
        {...args}
      />
    </div>
  ),
};

/** One month, as it opens where the window has no room for two. */
export const OneMonth: Story = {
  render: () => (
    <div className="w-80" style={{ height: 480 }}>
      <DateRangePicker
        label="Date range"
        defaultValue={{ start: "2026-05-21", end: "2026-05-25" }}
        locale="en-US"
        today="2026-05-22"
        months={1}
        defaultOpen
      />
    </div>
  ),
};

/**
 * One label for the range, for a one-line filter bar (GAP-051): the fields'
 * labels are read, not shown.
 */
export const OneLabel: Story = {
  render: () => (
    <div className="w-[520px]">
      <DateRangePicker
        label="Time period"
        defaultValue={{ start: "2026-05-01", end: "2026-05-31" }}
        hideFieldLabels
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
