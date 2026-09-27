import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import type { POIAction, POIPresentation } from "@kozmos-ds/product-contracts";
import { POIDetailPanel } from "./POIDetailPanel";

const actionLabels: Record<POIAction, string> = {
  navigate: "Go",
  favourite: "Favourite",
  bookmark: "Bookmark",
  share: "Share",
  order: "Order",
};

const poi: POIPresentation = {
  id: "burger-king",
  name: "Burger King",
  categoryLabel: "Dining",
  floorId: "1",
  floorLabel: "First floor",
  buildingLabel: "Building A",
  media: [],
  availability: "open",
  availabilityLabel: "Open",
  description: "Flame-grilled burgers, fries and shakes.",
  services: [
    { id: "dine-in", label: "Dine-in" },
    { id: "takeout", label: "Takeout" },
  ],
  actions: ["navigate", "favourite", "bookmark", "share", "order"],
};

const meta = {
  title: "Product SDK/POIDetailPanel",
  component: POIDetailPanel,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    actionLabels,
    className: "h-[34rem] w-full max-w-[25rem]",
    onAction: fn(),
    onClose: fn(),
    poi,
  },
} satisfies Meta<typeof POIDetailPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inline: Story = {};

/** In a sheet the panel paints no surface of its own; the story's grey
 *  backdrop stands for the sheet. */
export const Sheet: Story = {
  args: { presentation: "sheet" },
  decorators: [
    (StoryComponent) => (
      <div
        style={{
          background: "var(--primitives-colors-background-100)",
          padding: 16,
          maxWidth: 402,
        }}
      >
        <StoryComponent />
      </div>
    ),
  ],
};

export const DesktopPanel: Story = {
  args: { presentation: "panel" },
};

export const PartialData: Story = {
  args: {
    poi: {
      ...poi,
      availability: "unknown",
      availabilityLabel: "Hours unavailable",
      description: undefined,
      services: [],
      actions: ["navigate", "bookmark"],
    },
  },
};
