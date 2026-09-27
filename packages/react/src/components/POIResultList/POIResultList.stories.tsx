import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import type { POIPresentation } from "@kozmos-ds/product-contracts";
import { POIResultList } from "./POIResultList";

const pois: POIPresentation[] = [
  {
    id: "baskin-robbins",
    name: "Baskin-Robbins",
    categoryLabel: "Dining",
    floorId: "2",
    floorLabel: "Second floor",
    media: [],
    actions: ["navigate"],
  },
  {
    id: "burger-king",
    name: "Burger King",
    categoryLabel: "Dining",
    floorId: "1",
    floorLabel: "First floor",
    media: [],
    actions: ["navigate"],
  },
];

const meta = {
  title: "Product SDK/POIResultList",
  component: POIResultList,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    className: "w-full max-w-[26rem]",
    items: pois.map((poi, index) => ({
      poi,
      result: {
        poiId: poi.id,
        resultIndex: index + 1,
        selected: index === 0,
        featured: index === 0,
        floorId: poi.floorId,
        travelEstimate: {
          durationSeconds: 120 + index * 60,
          durationLabel: `${2 + index} min`,
        },
      },
    })),
    onSelect: fn(),
    resultCountLabel: "2 results",
  },
} satisfies Meta<typeof POIResultList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    emptyState: "No places match these filters. Remove a filter to see more.",
    items: [],
    resultCountLabel: "No results",
  },
};
