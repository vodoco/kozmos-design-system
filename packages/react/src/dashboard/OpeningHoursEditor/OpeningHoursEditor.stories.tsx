import type { Meta, StoryObj } from "@storybook/react";
import {
  DEFAULT_OPENING_HOURS,
  OpeningHoursEditor,
} from "./OpeningHoursEditor";
import { PropertyField } from "../PropertyField/PropertyField";

// A Dashboard module (decision 183): Kozmos parts only, no utility classes.
const meta: Meta<typeof OpeningHoursEditor> = {
  id: "dashboard-openinghourseditor",
  title: "Dashboard/OpeningHoursEditor",
  component: OpeningHoursEditor,
  parameters: { layout: "padded" },
  args: { locale: "en-GB" },
  render: (args) => (
    <PropertyField name="Opening Hours" onRemove={() => {}}>
      <OpeningHoursEditor {...args} />
    </PropertyField>
  ),
};

export default meta;
type Story = StoryObj<typeof OpeningHoursEditor>;

/** A new field: Monday to Friday 08:00 to 22:00, the weekend closed. */
export const Default: Story = {};

/**
 * Overnight hours (decision 179): a close before the open is the next
 * day's, and "+1 day" says so beside it.
 */
export const Overnight: Story = {
  args: {
    defaultValue: {
      ...DEFAULT_OPENING_HOURS,
      friday: { open: "18:00", close: "02:00" },
      saturday: { open: "18:00", close: "03:00" },
      sunday: { alwaysOpen: true },
    },
  },
};

/** In the locale's words, from the week start asked for. */
export const Localised: Story = {
  args: { locale: "de", weekStart: "sunday" },
};

/**
 * A multi-selection whose weekends differ (GAP-153): those days choose
 * nothing and say "Multiple values" until one is chosen.
 */
export const Mixed: Story = {
  args: { mixedDays: ["saturday", "sunday"] },
};
