import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./Textarea";
import { Label } from "../Label/Label";

const meta = {
  title: "Components/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="message">Your message</Label>
      <Textarea placeholder="Type your message here." id="message" />
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="message-error">Your message</Label>
      <Textarea
        placeholder="Type your message here."
        id="message-error"
        aria-invalid="true"
        className="border-destructive focus-visible:ring-destructive"
      />
      <span className="text-sm font-medium text-destructive-text">
        Message cannot be empty.
      </span>
    </div>
  ),
};
