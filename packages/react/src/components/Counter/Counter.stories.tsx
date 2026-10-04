import type { Meta, StoryObj } from "@storybook/react";
import { Counter } from "./Counter";

const meta = {
  id: "components-counter",
  title: "Core/Inputs/Counter",
  component: Counter,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Counter>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "2",
  },
};

export const Brand: Story = {
  args: {
    children: "12",
    tone: "brand",
  },
};

export const Small: Story = {
  args: {
    children: "4",
    size: "sm",
  },
};

export const Destructive: Story = {
  args: {
    children: "3",
    tone: "destructive",
  },
};

/**
 * The six emotions. A counter is always a filled pill, so there is one
 * treatment rather than two. `tone` stays for `inverse`, which is not an
 * emotion at all.
 */
export const Emotions: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Counter emotion="neutral">8</Counter>
      <Counter emotion="themed">12</Counter>
      <Counter emotion="success">3</Counter>
      <Counter emotion="danger">99</Counter>
      <Counter emotion="informative">5</Counter>
      <Counter emotion="alert">41</Counter>
    </div>
  ),
};
