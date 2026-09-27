import type { Meta, StoryObj } from "@storybook/react";
import { FeedbackCard } from "./FeedbackCard";

const meta = {
  title: "Platform/FeedbackCard",
  component: FeedbackCard,
  parameters: { layout: "centered" },
} satisfies Meta<typeof FeedbackCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    className: "w-[360px]",
    title: "Rate your visit",
    description: "How was your route today?",
    onSubmitFeedback: (rating, comment) =>
      console.log("feedback", { rating, comment }),
  },
};

export const Submitting: Story = {
  args: {
    ...Default.args,
    isSubmitting: true,
  },
};

/**
 * The Express Maps prompt: a thumbs question with a counted comment.
 *
 * Every part is Kozmos — `Rating` on its thumbs scale, `Textarea` with a soft
 * limit and a minimum, `Button`. Nothing here overrides a component's own
 * styling from outside.
 */
export const ThumbsWithACountedComment: Story = {
  args: {
    title: "Are you enjoying Express Maps?",
    description: "Your feedback remains anonymous.",
    variant: "thumbs",
    count: { limit: 512, minimum: 50 },
    commentPlaceholder: "Your feedback",
    submitLabel: "Submit",
  },
};
