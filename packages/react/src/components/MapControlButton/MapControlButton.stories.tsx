import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import {
  NavigationPointer01 as Focus,
  InfoCircle as Info,
} from "@kozmos-ds/icons";
import { Accessibility } from "@kozmos-ds/icons";
import { MapControlButton } from "./MapControlButton";

const meta = {
  title: "Product SDK/MapControlButton",
  component: MapControlButton,
  parameters: { layout: "centered" },
  args: { onClick: fn() },
} satisfies Meta<typeof MapControlButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const IconOnly: Story = {
  args: {
    icon: <Info className="h-5 w-5" />,
    label: "Map information",
  },
};

export const LabelledState: Story = {
  args: {
    icon: <Focus className="h-5 w-5" />,
    label: "Focus",
    presentation: "labelled",
    pressed: false,
    stateLabel: "Off",
  },
};

export const StackedState: Story = {
  args: {
    icon: <Focus className="h-5 w-5" />,
    label: "Focus",
    labelPlacement: "stacked",
    presentation: "labelled",
    pressed: true,
    stateLabel: "On",
  },
};

export const FilledEmphasis: Story = {
  args: {
    emphasis: "filled",
    icon: <Focus className="h-5 w-5" />,
    label: "Focus",
    presentation: "labelled",
    pressed: true,
    stateLabel: "On",
  },
};

/**
 * A map mode toggle at rest is icon-only. When its mode changes it widens to
 * say which mode it is now, waits long enough to be read, and collapses back so
 * it stops covering the map. `revealOnChange` is that behaviour; the mode it
 * announced stays on after the label has gone.
 */
export const RevealsOnChange: Story = {
  args: {
    icon: <Focus className="h-5 w-5" />,
    label: "Focus",
    labelPlacement: "stacked",
    revealOnChange: true,
  },
  render: function RevealsOnChangeStory(args) {
    const [on, setOn] = React.useState(false);

    return (
      <MapControlButton
        {...args}
        icon={<Focus className="h-5 w-5" />}
        pressed={on}
        stateLabel={on ? "On" : "Off"}
        onClick={() => setOn((value) => !value)}
      />
    );
  },
};

/**
 * A change that takes time to settle reveals its new state once the work is
 * done rather than while it is still wrong — `revealDelay` is the recalculation
 * the SDK's step-free toggle waits out before it says "On".
 */
export const RevealsAfterWork: Story = {
  args: {
    icon: <Accessibility size={24} />,
    label: "Step-free",
    labelPlacement: "stacked",
    revealDelay: 1400,
    revealDuration: 3000,
    revealOnChange: true,
  },
  render: function RevealsAfterWorkStory(args) {
    const [on, setOn] = React.useState(false);

    return (
      <MapControlButton
        {...args}
        icon={<Accessibility size={24} />}
        pressed={on}
        stateLabel={on ? "On" : "Off"}
        onClick={() => setOn((value) => !value)}
      />
    );
  },
};
