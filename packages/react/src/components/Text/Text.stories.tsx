import type { Meta, StoryObj } from "@storybook/react";
import { Text } from "./Text";

const meta: Meta<typeof Text> = {
  id: "foundations-text",
  title: "Foundations/Typography/Text",
  component: Text,
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"],
    },
    weight: {
      control: "select",
      options: ["normal", "medium", "semibold", "bold"],
    },
    color: {
      control: "select",
      options: ["default", "muted", "primary", "destructive"],
    },
    as: { control: "select", options: ["p", "span", "div", "label", "h1"] }, // h1 just for demo
  },
};

export default meta;
type Story = StoryObj<typeof Text>;

export const Default: Story = {
  args: {
    children: "The quick brown fox jumps over the lazy dog.",
  },
};

export const Muted: Story = {
  args: {
    children: "This is muted text.",
    color: "muted",
  },
};

export const LargeBold: Story = {
  args: {
    children: "Big Bold Text",
    size: "2xl",
    weight: "bold",
  },
};
