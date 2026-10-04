import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "./Skeleton";

const meta: Meta<typeof Skeleton> = {
  id: "feedback-skeleton",
  title: "Core/Feedback/Skeleton",
  component: Skeleton,
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  render: () => (
    <div className="flex w-full items-center gap-4" style={{ maxWidth: 320 }}>
      <Skeleton className="h-12 w-12 shrink-0 rounded-pill" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  ),
};
