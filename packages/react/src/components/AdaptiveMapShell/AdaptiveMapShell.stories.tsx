import type { Meta, StoryObj } from "@storybook/react";
import { InfoCircle as Info } from "@kozmos-ds/icons";
import { AdaptiveMapShell, panelPeekAnchorProps } from "./AdaptiveMapShell";
import { MapControlButton } from "../MapControlButton";

const meta = {
  title: "Product SDK/AdaptiveMapShell",
  component: AdaptiveMapShell,
  parameters: { layout: "fullscreen" },
  args: {
    className: "h-[42rem]",
    controls: (
      <MapControlButton
        icon={<Info className="h-5 w-5" />}
        label="Map information"
        onClick={() => undefined}
      />
    ),
    map: (
      <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
        Map SDK renderer slot
      </div>
    ),
    panel: (
      <div className="p-6">
        <h2 className="text-xl font-semibold">Selected place</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Panel content remains independently scrollable.
        </p>
      </div>
    ),
  },
} satisfies Meta<typeof AdaptiveMapShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PanelAtEnd: Story = {};

export const NarrowHost: Story = {
  args: {
    className: undefined,
    style: { width: 360, height: 600, maxWidth: "100%" },
  },
};

export const LandscapeHost: Story = {
  args: {
    className: undefined,
    style: { width: 844, height: 390, maxWidth: "100%" },
  },
};

export const SeparatedRegions: Story = {
  args: {
    className: undefined,
    style: { width: 800, height: 700, maxWidth: "100%" },
    usableRegions: [
      { x: 0, y: 0, width: 390, height: 700 },
      { x: 410, y: 0, width: 390, height: 700 },
    ],
  },
};

export const Error: Story = {
  args: {
    mapStatus: "error",
    mapStatusContent: "The map could not load. Check your connection.",
    panel: undefined,
  },
};

/**
 * The bottom sheet with its three detents — a fifth, 54 % and 94 % of the
 * shell — dragged anywhere on it and snapping to the nearest; its list
 * scrolls only at the largest. The browser check `pnpm test:map-sheet`
 * drives this story.
 */
export const Sheet: Story = {
  args: {
    className: "h-[42rem] max-w-[402px]",
    panelPresentation: "bottom",
    panelLabel: "Places",
    panel: (
      <div className="flex flex-col">
        <div
          className="flex h-11 items-center px-4 text-sm text-muted-foreground"
          data-testid="sheet-header"
        >
          Search
        </div>
        <ul className="m-0 list-none p-0">
          {Array.from({ length: 30 }, (_, index) => (
            <li
              key={index}
              className="h-20 border-t border-border px-4 py-3 text-sm"
              data-testid="sheet-row"
            >
              Place {index + 1}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
};

/**
 * A place card whose Go row is the sheet's peek anchor: collapsed rests on
 * that row's bottom plus a margin, within a quarter and three quarters of the
 * shell, as the prototype's place card peeks at its header and Go.
 */
export const SheetPeekAnchor: Story = {
  args: {
    className: "h-[42rem] max-w-[402px]",
    panelPresentation: "bottom",
    panelLabel: "Place",
    defaultPanelDetent: "collapsed",
    panel: (
      <div className="flex flex-col">
        <h2
          className="m-0 px-4 pt-2 text-xl font-semibold"
          data-testid="card-title"
        >
          Starbucks
        </h2>
        <p className="m-0 px-4 text-sm text-muted-foreground">
          Current floor / Building A
        </p>
        <div
          className="px-4 py-3"
          data-testid="card-go"
          {...panelPeekAnchorProps}
        >
          <button
            type="button"
            className="h-14 rounded-control bg-primary px-5 text-primary-foreground"
          >
            Go · 2 min
          </button>
        </div>
        <p className="px-4 text-sm" data-testid="card-body">
          {Array.from(
            { length: 40 },
            () => "Wood-fired Neapolitan pizza and more. ",
          ).join("")}
        </p>
      </div>
    ),
  },
};
