import type { Meta, StoryObj } from "@storybook/react";
import { Progress, ProgressTrack } from "./Progress";
import { Box } from "../Box";
import { Stack } from "../Stack";
import { Text } from "../Text";
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

// Decision 131 (GAP-038): a count out of a total, as a ring. It fills from
// 12 o'clock clockwise, the same right to left, with its label centred.
export const Circular: Story = {
  args: {
    shape: "circular",
    value: 66,
    label: "66%",
    "aria-label": "Upload progress",
  },
};

// The three diameters, 48, 96 and 128, with strokes of 4, 8 and 12. They
// wrap on a phone's width.
export const CircularSizes: Story = {
  render: () => (
    <Stack direction="row" gap={4} align="center" wrap="wrap">
      <Progress shape="circular" size="sm" value={25} aria-label="Small" />
      <Progress
        shape="circular"
        size="md"
        value={50}
        label="50%"
        aria-label="Medium"
      />
      <Progress
        shape="circular"
        size="lg"
        value={75}
        label="75%"
        aria-label="Large"
      />
    </Stack>
  ),
};

// MAP-64's Level Manager: 11 levels added, out of 15, its label beside the
// ring at the inline end, as the design draws it: Heading 4's size over xs
// muted. The label names the ring, and the value reads as the count.
export const LevelsAdded: Story = {
  render: () => (
    <Progress
      shape="circular"
      size="lg"
      value={11}
      max={15}
      labelPlacement="end"
      getValueLabel={(value, max) => `${value} of ${max}`}
      label={
        <>
          <Text size="xl" weight="bold">
            11 Levels
          </Text>
          <Text size="xs" color="muted">
            Added in total
          </Text>
        </>
      }
    />
  ),
};

// A status ring: its completion means something. The tones are Tag's and
// Button's emotions; each arc is its emotion's text colour, 3:1 or more on
// the track in both themes. Themed, the default, is the bar's own fill.
export const Tones: Story = {
  render: () => (
    <Stack direction="row" gap={4} align="center" wrap="wrap">
      {(
        [
          "themed",
          "neutral",
          "success",
          "informative",
          "alert",
          "danger",
        ] as const
      ).map((tone) => (
        <Progress
          key={tone}
          shape="circular"
          size="sm"
          tone={tone}
          value={75}
          aria-label={`${tone} progress`}
        />
      ))}
    </Stack>
  ),
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
