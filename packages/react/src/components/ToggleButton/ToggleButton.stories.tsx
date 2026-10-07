import type { Meta, StoryObj } from "@storybook/react";
import { ToggleButton } from "./ToggleButton";
import { Bold01 as Bold } from "@kozmos-ds/icons";

const meta: Meta<typeof ToggleButton> = {
  id: "action-togglebutton",
  title: "Core/Actions/ToggleButton",
  component: ToggleButton,
};

export default meta;
type Story = StoryObj<typeof ToggleButton>;

export const Default: Story = {
  args: {
    "aria-label": "Toggle bold",
    children: <Bold className="h-4 w-4" />,
  },
};

// On: the theme fill under the theme foreground, white in both themes
// (decision 59).
export const On: Story = {
  args: {
    "aria-label": "Toggle bold",
    children: <Bold className="h-4 w-4" />,
    defaultPressed: true,
  },
};
