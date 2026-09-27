import type { Meta, StoryObj } from "@storybook/react";
import { AIMessage } from "./AIMessage";

const meta = {
  title: "Product SDK/AIMessage",
  component: AIMessage,
  parameters: { layout: "centered" },
} satisfies Meta<typeof AIMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "The closest accessible restroom is on the second floor." },
};

/** Story 10: an acknowledgement is itself the first visible response. */
export const Streaming: Story = {
  args: { status: "streaming", children: "Looking through this building…" },
};

/** Story 10: the ten-second stop, drawn rather than left silent. */
export const TimedOut: Story = { args: { status: "timedOut" } };
