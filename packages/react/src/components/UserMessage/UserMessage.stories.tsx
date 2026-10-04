import type { Meta, StoryObj } from "@storybook/react";
import { UserMessage } from "./UserMessage";

const meta = {
  id: "product-sdk-usermessage",
  title: "Core/Feedback/UserMessage",
  component: UserMessage,
  parameters: { layout: "centered" },
} satisfies Meta<typeof UserMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "Where is the nearest accessible restroom?" },
};
