import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { useEffect, useRef } from "react";
import { ThemeProvider } from "../ThemeProvider";
import { FloorSelector, type FloorSelectorProps } from "./FloorSelector";

// Top floor first, on every variant (Olcay, 2026-09-28): the highest level at
// the top, as on a lift panel and in the SDK's level switcher. The stepper's
// up chevron steps to the previous level in the list, so "Floor up" goes up.
const floors = [
  { id: "2", label: "Second floor", shortLabel: "2F" },
  { id: "1", label: "First floor", shortLabel: "1F" },
  { id: "g", label: "Ground floor", shortLabel: "GF" },
];

const meta: Meta<typeof FloorSelector> = {
  title: "Product SDK/FloorSelector",
  component: FloorSelector,
  args: {
    floors,
    selectedFloor: "1",
    onFloorSelect: fn(),
  },
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof FloorSelector>;

export const VerticalList: Story = {};

export const HorizontalList: Story = {
  args: { variant: "horizontal-list" },
};

export const CompactStepper: Story = {
  args: { variant: "compact-stepper" },
};

/**
 * The SDK's level switcher, at rest: one map-control tile showing the current
 * level's short label. Activate it to open the column of every level.
 */
export const Collapsible: Story = {
  args: { variant: "collapsible" },
};

/**
 * The tile carries the dot while it shows the level the visitor is on
 * (`userFloor`), and says so: "First floor, your level".
 */
export const CollapsibleOnYourLevel: Story = {
  args: { variant: "collapsible", userFloor: "1" },
};

/**
 * The switcher, opened as it arrives, for the review to see the open column.
 * A story draws the state it means from the start: a `play` step would race
 * the visual review's photograph.
 */
function OpenedOnArrival(props: FloorSelectorProps) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    root.current?.querySelector("button")?.click();
  }, []);
  return <FloorSelector ref={root} {...props} />;
}

// Every mark the column draws: the current level outlined, the visitor's level
// with its dot and a result count in the other corner, and a closed level.
const switcherLevels = [
  { id: "3", label: "Third floor", shortLabel: "3F" },
  { id: "2", label: "Second floor", shortLabel: "2F", resultCount: 3 },
  { id: "1", label: "First floor", shortLabel: "1F" },
  { id: "g", label: "Ground floor", shortLabel: "GF", disabled: true },
];

/**
 * Open: the tile grows into a column of every level, top floor first, the
 * current one outlined in the theme's primary. The visitor is on the second
 * floor, which holds three results. A choice, Escape or a tap outside closes
 * it, and focus goes back to the tile.
 */
export const CollapsibleOpen: Story = {
  args: { variant: "collapsible", floors: switcherLevels, userFloor: "2" },
  render: (args) => <OpenedOnArrival {...args} />,
};

/**
 * Right to left, the column keeps to the tile's trailing edge — the left —
 * and its marks mirror with it.
 */
export const CollapsibleOpenRightToLeft: Story = {
  args: { variant: "collapsible", floors: switcherLevels, userFloor: "2" },
  render: function CollapsibleOpenRightToLeftStory(args, { globals }) {
    return (
      <ThemeProvider
        dir="rtl"
        theme={globals.theme === "dark" ? "dark" : "light"}
      >
        <OpenedOnArrival {...args} />
      </ThemeProvider>
    );
  },
};
