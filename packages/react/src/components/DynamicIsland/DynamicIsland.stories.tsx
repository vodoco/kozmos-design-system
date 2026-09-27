import type { Meta, StoryObj } from "@storybook/react";
import { NavigationPointer01 as Navigation } from "@kozmos-ds/icons";
import { DynamicIsland } from "./DynamicIsland";

const meta = {
  title: "Platform/DynamicIsland",
  component: DynamicIsland,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div
        style={{
          position: "relative",
          transform: "translateZ(0)",
          minHeight: 280,
        }}
      >
        <Story />
        <p
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            right: 16,
            textAlign: "center",
          }}
        >
          Demo navigation activity — no live device status.
        </p>
      </div>
    ),
  ],
} satisfies Meta<typeof DynamicIsland>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Compact: Story = {
  args: {
    islandState: "compact",
    compactLeading: <Navigation aria-hidden="true" className="h-4 w-4" />,
    compactTrailing: <span className="text-xs font-semibold">1.2 km</span>,
  },
};

export const Expanded: Story = {
  args: {
    islandState: "expanded",
    expandedContent: (
      <div className="flex h-full flex-col justify-center gap-2">
        <span className="text-xs font-semibold uppercase">Next turn</span>
        <span className="text-xl font-semibold">Turn right on Main St</span>
      </div>
    ),
  },
};

export const Minimal: Story = {
  args: {
    islandState: "minimal",
    minimalContent: (
      <Navigation
        role="img"
        aria-label="Navigation in progress (demo)"
        className="h-5 w-5"
      />
    ),
  },
};
