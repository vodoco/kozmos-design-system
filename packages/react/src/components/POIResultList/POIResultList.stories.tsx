import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import type { POIPresentation } from "@kozmos-ds/product-contracts";
import { Button } from "../Button";
import { ThemeProvider } from "../ThemeProvider";
import {
  POIResultList,
  type POIResultListEntry,
  type POIResultListItem,
} from "./POIResultList";

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
  id: "product-sdk-poiresultlist",
  title: "SDK/Search and browse/POIResultList",
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

const dining = (
  id: string,
  name: string,
  // Counted from 1: the number the place's map marker shows.
  resultIndex: number,
  minutes: number,
  floorLabel = "First floor",
): POIResultListItem => ({
  poi: {
    id,
    name,
    categoryLabel: "Dining",
    floorId: "1",
    floorLabel,
    media: [],
    actions: ["navigate"],
  },
  result: {
    poiId: id,
    resultIndex,
    selected: false,
    featured: false,
    floorId: "1",
    travelEstimate: {
      durationSeconds: minutes * 60,
      durationLabel: `${minutes} min`,
    },
  },
});

// The host supplies 6 even though Featured displays first. SDK cards retain
// that number; the list never derives an index from display order or logos.
const featuredBurgerKing = dining("burger-king", "Burger King", 6, 2);

/** Dining, chosen in the browse grid: its places, numbered as their pins are. */
const quickAccessDining: POIResultListEntry[] = [
  {
    ...featuredBurgerKing,
    result: { ...featuredBurgerKing.result, featured: true },
  },
  dining("starbucks", "Starbucks", 1, 3),
  dining("mcdonalds", "McDonald's", 2, 4),
  {
    id: "costa",
    label: "Costa Coffee, 2 results",
    items: [
      dining("costa-1", "Costa Coffee", 3, 5),
      dining("costa-2", "Costa Coffee", 4, 6, "Second floor"),
    ],
    collapsedCount: 2,
  },
  dining("pret", "Pret A Manger", 5, 7),
];

/**
 * Quick access: a category chosen in the browse grid lists that category's
 * places, and the map pins them with numbers. The product turns `numbered`
 * on for this list, and each result shows its own `resultIndex`, the number
 * on its pin; the selected one's tab fills, as its pin stands out. SDK rows
 * combine that number with Featured or badge labels in the same corner tab,
 * grouped or standalone. Marker sprites and logos remain host-owned.
 */
export const QuickAccessNumbered: Story = {
  args: {
    items: quickAccessDining,
    numbered: true,
    resultCountLabel: "6 dining places",
    selectedPoiId: "starbucks",
  },
};

/** The same list right to left: tabs and numbers keep to the start edge. */
export const QuickAccessNumberedRightToLeft: Story = {
  args: {
    items: quickAccessDining,
    numbered: true,
    resultCountLabel: "6 dining places",
    selectedPoiId: "starbucks",
  },
  render: function QuickAccessNumberedRightToLeftStory(args, { globals }) {
    return (
      <ThemeProvider
        dir="rtl"
        theme={globals.theme === "dark" ? "dark" : "light"}
      >
        <POIResultList {...args} />
      </ThemeProvider>
    );
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
