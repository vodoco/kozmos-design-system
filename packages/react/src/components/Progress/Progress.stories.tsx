import type { Meta, StoryObj } from "@storybook/react";
import { Progress, ProgressTrack } from "./Progress";
import { Box } from "../Box";
import { useEffect, useState } from "react";

const meta: Meta<typeof Progress> = {
  id: "feedback-progress",
  title: "Core/Feedback/Progress",
  component: Progress,
};

export default meta;
type Story = StoryObj<typeof Progress>;

// The value the story means, drawn from the start. It used to begin at 13 and
// move to 66 on a 500ms timer, which raced the visual review's screenshot:
// a fast machine drew 66, a slow one 13 (found running the review locally,
// 2026-09-28). The update itself is AnimatedUpdate below.
export const Default: Story = {
  args: {
    "aria-label": "Download progress",
    value: 66,
    className: "w-3/5",
  },
};

export const SelectedSection: Story = {
  render: () => (
    <Box role="img" aria-label="Selected section from 20 to 60 percent">
      <ProgressTrack
        activeRange={{ start: 0.2, end: 0.6 }}
        value={null}
        positionMode="static"
        appearance="gradient"
        motion="directional"
      />
    </Box>
  ),
};

export const LivePosition: Story = {
  render: () => (
    <Box
      role="progressbar"
      aria-label="Journey progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={30}
    >
      <ProgressTrack
        activeRange={{ start: 0.2, end: 0.6 }}
        value={0.3}
        appearance="gradient"
        motion="directional"
      />
    </Box>
  ),
};

// Progress moving after it appears. Left out of the visual review: what it
// draws depends on when the screenshot lands.
export const AnimatedUpdate: Story = {
  tags: ["no-visual"],
  render: () => {
    const [progress, setProgress] = useState(13);
    useEffect(() => {
      const timer = setTimeout(() => setProgress(66), 500);
      return () => clearTimeout(timer);
    }, []);
    return (
      <Progress
        aria-label="Download progress"
        value={progress}
        className="w-3/5"
      />
    );
  },
};
