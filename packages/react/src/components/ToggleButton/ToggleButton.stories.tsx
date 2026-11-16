import type { Meta, StoryObj } from "@storybook/react";
import { ToggleButton } from "./ToggleButton";
import { Bold01 as Bold } from "@kozmos-ds/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../Tooltip/Tooltip";

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

// GAP-261: a pressed ToggleButton as a tooltip's trigger keeps its fill. The
// trigger writes the tooltip's data-state over Toggle's "on", so the pressed
// look is read from aria-pressed, which no trigger touches.
export const InTooltip: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <ToggleButton aria-label="Toggle bold" defaultPressed>
            <Bold className="h-4 w-4" />
          </ToggleButton>
        </TooltipTrigger>
        <TooltipContent>Bold</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};
