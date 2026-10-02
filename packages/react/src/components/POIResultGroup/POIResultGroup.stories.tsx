import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
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
  // Counted from 1: the number the branch's map marker shows.
  resultIndex: number,
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
      resultIndex,
      selected: false,
      featured: false,
      floorId: id,
      travelEstimate: { durationSeconds: 240, durationLabel, distanceLabel },
    },
  };
};

const items = [
  branch("a", "Current floor", "4 min", "260 m", 1),
  branch("b", "Second floor", "5 min", "300 m", 2),
  branch("c", "Second floor", "7 min", "420 m", 3),
  branch("d", "Third floor", "8 min", "440 m", 4),
  branch("e", "Fourth floor", "10 min", "500 m", 5),
];

/** One branch stands for the group; the count is of what is hidden. */
export const Collapsed: Story = { args: { items } };

export const Expanded: Story = { args: { items, defaultExpanded: true } };

/** A group of one needs no control at all. */
export const SingleBranch: Story = { args: { items: [items[0]] } };

/** The approved default: every row keeps its supplied number, including Featured. */
export const NumberedMixedStates: Story = {
  args: { items, numbered: true, defaultExpanded: true },
  render: function NumberedMixedStates(args) {
    const [selected, setSelected] = useState("b");
    return (
      <POIResultGroup
        {...args}
        label="Northfield Bakery, three locations"
        onSelect={(id) => {
          setSelected(id);
          args.onSelect(id);
        }}
        items={items.slice(0, 3).map((item, index) => ({
          poi: {
            ...item.poi,
            name:
              index === 0
                ? "Northfield Artisan Bakery & Coffee Roastery"
                : "Northfield Bakery",
            logo: {
              src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' rx='16' fill='%23963816'/%3E%3Ctext x='24' y='30' text-anchor='middle' fill='white' font-family='serif' font-size='20'%3ENB%3C/text%3E%3C/svg%3E",
              alt: "",
            },
          },
          result: {
            ...item.result,
            resultIndex: 1234 + index,
            featured: index === 0,
            badge: index === 1 ? { label: "Alternative" } : undefined,
            selected: selected === item.poi.id,
            actions: [
              { action: "navigate", label: "Go", primary: true },
              { action: "details", label: "Details" },
            ],
          },
        }))}
      />
    );
  },
};
