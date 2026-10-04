import type { Meta, StoryObj } from "@storybook/react";
import { AnalyticsProvider } from "../../utils/analytics";
import { NavigationAnnouncer } from "./NavigationAnnouncer";

const meta = {
  id: "utilities-navigationannouncer",
  title: "SDK/Navigation/NavigationAnnouncer",
  component: NavigationAnnouncer,
  args: {
    message: "Proceed to gate A",
    isActive: true,
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof NavigationAnnouncer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <AnalyticsProvider>
      <div className="rounded-control border border-border bg-background p-4 text-sm text-muted-foreground">
        <NavigationAnnouncer {...args} />
        <span aria-hidden="true">{args.message}</span>
      </div>
    </AnalyticsProvider>
  ),
};
