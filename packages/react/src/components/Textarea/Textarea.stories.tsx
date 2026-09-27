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

/**
 * A character count, in all four states the MAP-474 feedback flow draws.
 *
 * `limit` is a **soft** maximum, deliberately not `maxLength`: a browser
 * refuses the keystroke past `maxLength`, so someone pasting a long answer
 * loses the end of it in silence instead of being told. `minimum` only
 * applies once something has been typed — an empty field is unanswered, not
 * wrong.
 *
 * The count itself is never in the `role="alert"` element while it is only a
 * count: it changes on every keystroke, and a screen reader would read the
 * number back after each letter.
 */
export const CharacterCount: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex max-w-[420px] flex-col gap-6">
      <Textarea
        count={{ limit: 512, minimum: 50 }}
        defaultValue=""
        label="Empty — unanswered, not yet wrong"
      />
      <Textarea
        count={{ limit: 512, minimum: 50 }}
        defaultValue={
          "I reached my destination with such ease and comfort, and the signage was clear."
        }
        label="Long enough"
      />
      <Textarea
        count={{ limit: 512, minimum: 50 }}
        defaultValue="I got lost while navigating."
        label="Too short"
      />
      <Textarea
        count={{ limit: 60 }}
        defaultValue={
          "Express Maps has completely revolutionized my travel experience and I could not do without it."
        }
        label="Over the limit"
      />
    </div>
  ),
};
