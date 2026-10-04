import type { Meta, StoryObj } from "@storybook/react";
import {
  Timeline,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
  TimelineDescription,
} from "./Timeline";

const meta: Meta<typeof Timeline> = {
  id: "data-display-timeline",
  title: "Core/Data display/Timeline",
  component: Timeline,
  argTypes: {
    density: {
      control: "select",
      options: ["default", "compact"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Timeline>;

const events = [
  {
    time: "09:00",
    title: "Created",
    description: "Initial event captured.",
  },
  {
    time: "10:30",
    title: "Reviewed",
    description: "Status changed by the team.",
  },
  {
    time: "Now",
    title: "Published",
    description: "Latest update is ready.",
  },
];

export const Detailed: Story = {
  args: {
    density: "default",
  },
  render: (args) => (
    <Timeline {...args}>
      {events.map((event) => (
        <TimelineItem key={event.title}>
          <TimelineTime>{event.time}</TimelineTime>
          <TimelineTitle>{event.title}</TimelineTitle>
          <TimelineDescription>{event.description}</TimelineDescription>
        </TimelineItem>
      ))}
    </Timeline>
  ),
};

export const Basic: Story = {
  args: {
    density: "default",
  },
  render: (args) => (
    <Timeline {...args}>
      {events.map((event) => (
        <TimelineItem key={event.title}>
          <TimelineTitle>{event.title}</TimelineTitle>
        </TimelineItem>
      ))}
    </Timeline>
  ),
};

export const Compact: Story = {
  args: {
    density: "compact",
  },
  render: Detailed.render,
};

export const Default = Detailed;
