import type { Meta, StoryObj } from "@storybook/react";
import { ChipInput } from "./ChipInput";

const meta = {
  id: "components-chipinput",
  title: "Core/Inputs/ChipInput",
  component: ChipInput,
  parameters: {
    layout: "centered",
  },
  args: {
    label: "Keywords",
    placeholder: "Add a keyword",
    helperText: "Press Enter or type a comma to add one.",
    defaultValue: ["coffee", "breakfast", "wifi"],
  },
  render: (args) => (
    <div className="w-96">
      <ChipInput {...args} />
    </div>
  ),
} satisfies Meta<typeof ChipInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The POI editor's keywords (GAP-222, decision 216): each entry a removable
 * chip inside the field, and the visitor's own words, not a list's options.
 */
export const Default: Story = {};
