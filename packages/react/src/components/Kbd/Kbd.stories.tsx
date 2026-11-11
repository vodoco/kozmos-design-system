import type { Meta, StoryObj } from "@storybook/react";
import { Kbd } from "./Kbd";
import { Text } from "../Text/Text";

const meta: Meta<typeof Kbd> = {
  id: "data-display-kbd",
  title: "Core/Data display/Kbd",
  component: Kbd,
  parameters: { layout: "padded" },
  args: { children: "Esc" },
};

export default meta;
type Story = StoryObj<typeof Kbd>;

export const Default: Story = {};

/** A combination: keys joined by "+", read by each key's name. */
export const Combination: Story = {
  args: { keys: ["Ctrl", "Shift", "P"] },
};

/** In a hint: Esc is drawn as a key and read "Escape" (GAP-156). */
export const InAHint: Story = {
  render: () => (
    <Text size="sm" color="muted">
      Press <Kbd>Esc</Kbd> to clear the selection, or <Kbd keys={["⌘", "A"]} />{" "}
      to select every feature.
    </Text>
  ),
};
