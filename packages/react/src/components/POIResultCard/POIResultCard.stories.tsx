import type * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import {
  travelTimeBand,
  type POIPresentation,
} from "@kozmos-ds/product-contracts";
import { ThemeProvider } from "../ThemeProvider";
import { POIResultCard } from "./POIResultCard";

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
  actions: ["navigate", "favourite", "bookmark"],
};

const meta = {
  title: "Product SDK/POIResultCard",
  component: POIResultCard,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    poi,
    onSelect: fn(),
    className: "w-full max-w-[24rem]",
    result: {
      poiId: poi.id,
      resultIndex: 1,
      selected: false,
      featured: false,
      floorId: poi.floorId,
      travelEstimate: { durationSeconds: 180, durationLabel: "3 min" },
    },
  },
} satisfies Meta<typeof POIResultCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FeaturedSelected: Story = {
  args: {
    result: {
      poiId: poi.id,
      resultIndex: 1,
      selected: true,
      featured: true,
      floorId: poi.floorId,
      travelEstimate: { durationSeconds: 180, durationLabel: "3 min" },
    },
  },
};

/**
 * Selected, with the actions the product chose to offer. The card draws what
 * it is given, in the order given: a restaurant may book where a shop does
 * not, so there is no fixed Go/Details pair baked in here.
 */
export const SelectedWithActions: Story = {
  args: {
    onAction: fn(),
    result: {
      poiId: poi.id,
      resultIndex: 1,
      selected: true,
      featured: false,
      floorId: poi.floorId,
      travelEstimate: { durationSeconds: 180, durationLabel: "3 min" },
      actions: [
        { action: "navigate", label: "Go", primary: true },
        { action: "details", label: "Details" },
        { action: "bookmark", label: "Book" },
      ],
    },
  },
};

/**
 * A badge says why a result is in this list — "Alternative", "Similar",
 * "Close by". It is quiet: a neutral tab with no star, on the card's grey
 * edge, so it never reads as featured (GAP-054). It never replaces Featured:
 * featured is set in the CMS and the map marker acts on it too, so a result
 * that is both shows featured.
 */
export const AlternativeBadge: Story = {
  args: {
    result: {
      poiId: poi.id,
      resultIndex: 1,
      selected: false,
      featured: false,
      floorId: poi.floorId,
      travelEstimate: { durationSeconds: 300, durationLabel: "5 min" },
      badge: { label: "Alternative" },
    },
  },
};

/** One card per tab, as a list of quick-access results draws them. */
function ResultTabs({
  args,
  names = ["Burger King", "Burger King", "Burger King", "Burger King"],
}: {
  args: React.ComponentProps<typeof POIResultCard>;
  names?: readonly [string, string, string, string];
}) {
  const card = (
    index: number,
    result: Partial<React.ComponentProps<typeof POIResultCard>["result"]>,
    numbered = false,
  ) => (
    <POIResultCard
      {...args}
      numbered={numbered}
      poi={{ ...poi, id: `tab-${index}`, name: names[index] }}
      result={{
        poiId: `tab-${index}`,
        resultIndex: 2,
        selected: false,
        featured: false,
        floorId: poi.floorId,
        travelEstimate: {
          durationSeconds: 240,
          durationLabel: "4 min",
          band: "twoToFiveMinutes",
        },
        ...result,
      }}
    />
  );
  return (
    <div className="flex w-full flex-col items-center gap-3">
      {card(0, { featured: true }, true)}
      {card(1, { resultIndex: 1, selected: true }, true)}
      {card(2, {}, true)}
      {card(3, { badge: { label: "Alternative" } })}
    </div>
  );
}

/**
 * The card's one tab, in the order it wins (Olcay, 2026-09-29):
 *
 * - **Featured**: the SDK's bright amber under dark words, with a star, and
 *   the card's edge in the same amber. It is set in the CMS, and a featured
 *   result's pin shows its logo, so it shows no number even in a numbered
 *   list.
 * - **A number**, in a list the product numbers (`numbered`): the result's
 *   `resultIndex`, the number its pin shows. Selected, it fills with the
 *   primary colour; at rest it is quiet and outlined, on the card's grey edge,
 *   so it is never taken for the selected card.
 * - **A badge**: quiet, neutral and without a star (GAP-054).
 */
export const Tabs: Story = {
  render: (args) => <ResultTabs args={args} />,
};

/** The same four in the dark theme, whatever the toolbar says. */
export const TabsInTheDark: Story = {
  render: (args) => (
    <ThemeProvider theme="dark">
      <div className="w-full rounded-container bg-background p-4">
        <ResultTabs args={args} />
      </div>
    </ThemeProvider>
  ),
};

/**
 * Right to left, the tab hangs from the card's start edge, the right, where
 * the name begins, and the number still leads the name read aloud.
 */
export const TabsRightToLeft: Story = {
  render: function TabsRightToLeftStory(args, { globals }) {
    return (
      <ThemeProvider
        dir="rtl"
        theme={globals.theme === "dark" ? "dark" : "light"}
      >
        <ResultTabs
          args={args}
          names={["برجر كنج", "برجر كنج", "برجر كنج", "برجر كنج"]}
        />
      </ThemeProvider>
    );
  },
};

/**
 * A result list shows the walk as a band (decision 50). The product passes
 * the walking time it already has, with the band `travelTimeBand` gives it,
 * and the card draws the band's words: Nearby, under a minute, in the success
 * colour, and the other four in the card's text colour. The details card
 * keeps the exact minutes from the same estimate.
 */
export const TravelTimeBands: Story = {
  render: (args) => (
    <div className="flex w-full flex-col items-center gap-3">
      {(
        [
          ["Meeting Point", 45],
          ["Meeting and Greet", 100],
          ["Meeting Room (3B)", 240],
          ["Meeting Room (5C)", 420],
          ["Meeting Point 2B", 900],
        ] as const
      ).map(([name, seconds], index) => (
        <POIResultCard
          {...args}
          key={name}
          // The one green on these cards is Nearby's, so the availability
          // label, green when open, is left out.
          poi={{
            ...poi,
            id: `meeting-${index}`,
            name,
            categoryLabel: undefined,
            availability: undefined,
            availabilityLabel: undefined,
          }}
          result={{
            poiId: `meeting-${index}`,
            resultIndex: index + 1,
            selected: false,
            featured: false,
            floorId: poi.floorId,
            travelEstimate: {
              durationSeconds: seconds,
              durationLabel: `${Math.ceil(seconds / 60)} min`,
              band: travelTimeBand(seconds),
            },
          }}
        />
      ))}
    </div>
  ),
};
