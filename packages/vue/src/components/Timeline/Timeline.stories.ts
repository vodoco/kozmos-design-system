import type { Meta, StoryObj } from "@storybook/vue3";
import {
  KozmosTimeline,
  KozmosTimelineDescription,
  KozmosTimelineItem,
  KozmosTimelineTime,
  KozmosTimelineTitle,
} from "../../index";

/**
 * Vue's Timeline: the stories React's has, with the same names and args,
 * each inside the KozmosThemeProvider the Storybook's decorator gives every
 * story, drawn by its own render as React's is;
 * test/parity/timeline.parity.spec.ts draws each in both and holds Vue's
 * render to React's.
 */
type Args = { density?: "default" | "compact" };

const meta: Meta<Args> = {
  title: "Vue/Core/Data display/Timeline",
  component: KozmosTimeline,
  argTypes: {
    density: {
      control: "select",
      options: ["default", "compact"],
    },
  },
};

export default meta;
type Story = StoryObj<Args>;

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

const parts = {
  KozmosTimeline,
  KozmosTimelineDescription,
  KozmosTimelineItem,
  KozmosTimelineTime,
  KozmosTimelineTitle,
};

export const Detailed: Story = {
  args: { density: "default" },
  render: (args) => ({
    components: parts,
    setup: () => ({ args, events }),
    template: `
      <KozmosTimeline v-bind="args">
        <KozmosTimelineItem v-for="event in events" :key="event.title">
          <KozmosTimelineTime>{{ event.time }}</KozmosTimelineTime>
          <KozmosTimelineTitle>{{ event.title }}</KozmosTimelineTitle>
          <KozmosTimelineDescription>{{ event.description }}</KozmosTimelineDescription>
        </KozmosTimelineItem>
      </KozmosTimeline>
    `,
  }),
};

export const Basic: Story = {
  args: { density: "default" },
  render: (args) => ({
    components: parts,
    setup: () => ({ args, events }),
    template: `
      <KozmosTimeline v-bind="args">
        <KozmosTimelineItem v-for="event in events" :key="event.title">
          <KozmosTimelineTitle>{{ event.title }}</KozmosTimelineTitle>
        </KozmosTimelineItem>
      </KozmosTimeline>
    `,
  }),
};

export const Compact: Story = {
  args: { density: "compact" },
  render: Detailed.render,
};

export const Default = Detailed;
