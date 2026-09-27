import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import type { POIPresentation } from "@kozmos-ds/product-contracts";
import { POIResultGroup } from "./POIResultGroup";

const meta = {
  title: "Product SDK/POIResultGroup",
  component: POIResultGroup,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-[24rem]">
        <Story />
      </div>
    ),
  ],
  args: { onSelect: fn(), onAction: fn(), label: "Starbucks, 9 results" },
} satisfies Meta<typeof POIResultGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const branch = (
  id: string,
  floorLabel: string,
  durationLabel: string,
  distanceLabel: string,
) => {
  const poi: POIPresentation = {
    id,
    name: "Starbucks",
    categoryLabel: "Coffeehouse",
    floorId: id,
    floorLabel,
    media: [],
    actions: ["navigate"],
  };
  return {
    poi,
    result: {
      poiId: id,
      resultIndex: 0,
      selected: false,
      featured: false,
      floorId: id,
      travelEstimate: { durationSeconds: 240, durationLabel, distanceLabel },
    },
  };
};

const items = [
  branch("a", "Current floor", "4 min", "260 m"),
  branch("b", "Second floor", "5 min", "300 m"),
  branch("c", "Second floor", "7 min", "420 m"),
  branch("d", "Third floor", "8 min", "440 m"),
  branch("e", "Fourth floor", "10 min", "500 m"),
];

/** One branch stands for the group; the count is of what is hidden. */
export const Collapsed: Story = { args: { items } };

export const Expanded: Story = { args: { items, defaultExpanded: true } };

/** A group of one needs no control at all. */
export const SingleBranch: Story = { args: { items: [items[0]] } };
