import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import type { POIPresentation } from "@kozmos-ds/product-contracts";
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
 * "Close by". It is the quiet form of the featured tab, and never replaces it:
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
