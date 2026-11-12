import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Button, BUTTON_EMOTIONS } from "./Button";

const meta: Meta<typeof Button> = {
  id: "components-button",
  title: "Core/Actions/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },

  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "destructive",
        "outline",
        "secondary",
        "ghost",
        "link",
        "glass",
        "subtle",
      ],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
    emotion: {
      control: "select",
      options: [undefined, ...BUTTON_EMOTIONS],
    },
    disabled: { control: "boolean" },
    isLoading: { control: "boolean" },
  },
  args: { onClick: fn() },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "default",
    children: "Button",
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Destructive",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Ghost",
  },
};

export const Link: Story = {
  args: {
    variant: "link",
    children: "Link",
  },
};

export const Glass: Story = {
  args: {
    variant: "glass",
    children: "Glass",
  },
};

/**
 * The subtle variant (GAP-200, decision 135): a pale theme fill, theme 0,
 * under the theme's words, theme 600, with its own token tier. Pointr
 * Cloud's "+ Add additional field" is one, the width of its form through
 * `className="w-full"`.
 */
export const Subtle: Story = {
  parameters: { layout: "padded" },
  args: {
    variant: "subtle",
    children: "+ Add additional field",
  },
  render: (args) => (
    <div style={{ inlineSize: 360 }}>
      <Button {...args} className="w-full" />
    </div>
  ),
};

/**
 * The subtle Button in a destructive tone (decision 139): Pointr Cloud's
 * Delete Feature and Delete Beacon, a rose fill under red words. Every
 * emotion has its own pale fill in the subtle tier.
 */
export const SubtleEmotions: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-col gap-4" style={{ inlineSize: 360 }}>
      <Button variant="subtle" emotion="danger" className="w-full">
        Delete feature
      </Button>
      <div className="flex flex-wrap items-center gap-2">
        {BUTTON_EMOTIONS.map((emotion) => (
          <Button key={emotion} variant="subtle" emotion={emotion}>
            {emotion}
          </Button>
        ))}
      </div>
    </div>
  ),
};

export const Loading: Story = {
  args: {
    isLoading: true,
    children: "Please wait",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Disabled",
  },
};

/**
 * What the button means, across the weights that carry a colour. `glass` is an
 * effect rather than a weight and takes no emotion, so it is not shown here.
 */
export const Emotions: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-col gap-4">
      {(["default", "outline", "ghost"] as const).map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-2">
          <span className="w-20 text-xs text-muted-foreground">{variant}</span>
          {BUTTON_EMOTIONS.map((emotion) => (
            <Button key={emotion} variant={variant} emotion={emotion}>
              {emotion}
            </Button>
          ))}
        </div>
      ))}
    </div>
  ),
};
