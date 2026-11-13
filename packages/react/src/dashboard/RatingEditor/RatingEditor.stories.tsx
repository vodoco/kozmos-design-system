import type { Meta, StoryObj } from "@storybook/react";
import { RatingEditor } from "./RatingEditor";
import { PropertyField } from "../PropertyField/PropertyField";

// A Dashboard module (decision 183): Kozmos parts only, no utility classes.
const meta: Meta<typeof RatingEditor> = {
  id: "dashboard-ratingeditor",
  title: "Dashboard/RatingEditor",
  component: RatingEditor,
  parameters: { layout: "padded" },
  render: (args) => (
    <PropertyField name="Rating" onRemove={() => {}}>
      <RatingEditor {...args} />
    </PropertyField>
  ),
};

export default meta;
type Story = StoryObj<typeof RatingEditor>;

/**
 * The rating, its max and its count, and the preview: five stars to the
 * nearest half (decision 181), and the exact numbers in words.
 */
export const Default: Story = {
  args: { defaultValue: { rating: 4.3, max: 5, count: 120 } },
};

/** A rating out of 100, previewed as five stars: 86 of 100 is 4½. */
export const OutOf100: Story = {
  args: { defaultValue: { rating: 86, max: 100, count: 120 } },
};

/**
 * A rating above its max is an error on both fields, and a count must be
 * a whole number of 0 or more (Cloud took −3). Each field is invalid and
 * described by its message; no preview of a rating that cannot be.
 */
export const Errors: Story = {
  args: { defaultValue: { rating: 7, max: 5, count: -3 } },
};

/** A multi-selection whose ratings differ (GAP-153). */
export const Mixed: Story = {
  args: {
    defaultValue: { rating: null, max: 5, count: null },
    mixed: { rating: true, count: true },
  },
};
