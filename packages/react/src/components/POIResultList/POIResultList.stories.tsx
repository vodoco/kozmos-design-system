import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import type { POIPresentation } from "@kozmos-ds/product-contracts";
import { Button } from "../Button";
import { POIResultList, type POIResultListItem } from "./POIResultList";

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

const manyResults: POIResultListItem[] = Array.from(
  { length: 12 },
  (_, index) => ({
    poi: {
      id: `gate-${index + 1}`,
      name: `Gate B${index + 1}`,
      categoryLabel: "Gates",
      floorId: "1",
      floorLabel: "Departures",
      media: [],
      actions: ["navigate"],
    },
    result: {
      poiId: `gate-${index + 1}`,
      resultIndex: index + 1,
      selected: false,
      featured: false,
      floorId: "1",
      actions: [{ action: "navigate", label: "Go", primary: true }],
    },
  }),
);

/**
 * A pin's tap selects a result that may be anywhere in the list. The list
 * scrolls what it sits in — here a box that hides its overflow, as a map
 * sheet does below its largest detent, so it cannot be scrolled by hand —
 * and nothing further out (row 70).
 */
export const SelectionComesIntoView: Story = {
  args: { items: manyResults, resultCountLabel: "12 results" },
  render: function SelectionComesIntoViewStory(args) {
    const [selected, setSelected] = React.useState<string>();
    return (
      <div className="flex w-full max-w-[26rem] flex-col gap-3">
        {/* Wraps: at 320px, in a font as wide as CI's DejaVu Sans, the two
            buttons do not fit on one line and the page scrolled sideways. */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setSelected("gate-11")}>
            Tap the pin for B11
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelected("gate-2")}
          >
            Tap the pin for B2
          </Button>
        </div>
        <div
          className="rounded-container bg-muted p-3"
          // A box that hides its overflow is clipping unless it says it
          // scrolls, as the map sheet's content does.
          data-kozmos-scroller=""
          style={{ height: 320, overflowY: "hidden" }}
        >
          <POIResultList
            {...args}
            onSelect={setSelected}
            selectedPoiId={selected}
          />
        </div>
      </div>
    );
  },
};
