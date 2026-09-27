import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Rating } from "./Rating";

const meta: Meta<typeof Rating> = {
  title: "Input/Rating",
  component: Rating,
};

export default meta;
type Story = StoryObj<typeof Rating>;

export const Default: Story = {
  args: {
    value: 3,
    onChange: (val) => console.log(val),
  },
};

/**
 * `thumbs`, the two-option scale the Express Maps prompt uses: "Are you
 * enjoying this?" is a yes or a no, not a mark out of five.
 *
 * Exactly the one chosen fills — a thumbs-up is not "two thumbs" — but the
 * value is still a number, so a product stores one shape whichever scale it
 * asks on: **0 unanswered, 1 down, 2 up**.
 */
export const Thumbs: Story = {
  render: function ThumbsScale() {
    const [value, setValue] = React.useState(0);
    return (
      <div className="flex flex-col items-start gap-4">
        <Rating onChange={setValue} value={value} variant="thumbs" />
        <p className="text-sm text-muted-foreground">
          value: {value}{" "}
          {value === 0 ? "(unanswered)" : value === 1 ? "(down)" : "(up)"}
        </p>
      </div>
    );
  },
};

/**
 * Read-only is not a control.
 *
 * It was a radiogroup of *disabled* radios, which leaves the tab order
 * entirely: a rating meant only to be read could not be reached at all. It is
 * one image now, with the rating as its label.
 */
export const ReadOnly: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <Rating readOnly value={4} />
      <Rating readOnly value={2} variant="thumbs" />
      <Rating readOnly value={0} />
    </div>
  ),
};
