import type { Meta, StoryObj } from "@storybook/react";
import { AIMessage } from "../AIMessage";
import { UserMessage } from "../UserMessage";
import { AIMessageList } from "./AIMessageList";

const meta = {
  title: "Product SDK/AIMessageList",
  component: AIMessageList,
  parameters: { layout: "centered" },
} satisfies Meta<typeof AIMessageList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    className: "h-64 w-80 border border-border rounded-container",
    children: (
      <>
        <AIMessage>Hello! What are you looking for?</AIMessage>
        <UserMessage>Somewhere quiet to work.</UserMessage>
      </>
    ),
  },
};
