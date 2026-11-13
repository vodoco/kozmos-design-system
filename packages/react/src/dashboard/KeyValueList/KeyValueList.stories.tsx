import type { Meta, StoryObj } from "@storybook/react";
import { KeyValueList } from "./KeyValueList";
import { PropertyField } from "../PropertyField/PropertyField";

// A Dashboard module (decision 183): Kozmos parts only, no utility classes.
const meta: Meta<typeof KeyValueList> = {
  id: "dashboard-keyvaluelist",
  title: "Dashboard/KeyValueList",
  component: KeyValueList,
  parameters: { layout: "padded" },
  render: (args) => (
    <PropertyField name="Extra Data (Custom Integration)" onRemove={() => {}}>
      <KeyValueList {...args} />
    </PropertyField>
  ),
};

export default meta;
type Story = StoryObj<typeof KeyValueList>;

/**
 * Rows of a name, a type and a value drawn for the type: a text field, a
 * number field, a switch. "Add field" ends the list.
 */
export const Default: Story = {
  args: {
    defaultValue: [
      { id: "a", name: "vendor", type: "text", value: "Acme" },
      { id: "b", name: "meta", type: "json", value: '{"zone":"B2"}' },
      { id: "c", name: "floors", type: "number", value: 3 },
      { id: "d", name: "public", type: "boolean", value: true },
    ],
  },
};

/** No rows yet: the add button alone. */
export const Empty: Story = {};

/** A multi-selection whose values differ in a row (GAP-153). */
export const Mixed: Story = {
  args: {
    defaultValue: [
      { id: "a", name: "vendor", type: "text", value: "", mixed: true },
      { id: "c", name: "floors", type: "number", value: null, mixed: true },
    ],
  },
};
