import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  Accessibility,
  Heart,
  InfoCircle as Info,
  ShoppingBag01 as ShoppingBag,
  Utensils,
} from "@kozmos-ds/icons";
import { AdaptiveMapShell, panelPeekAnchorProps } from "./AdaptiveMapShell";
import { BrowseCategoriesPanel } from "../BrowseCategoriesPanel";
import { MapControlButton } from "../MapControlButton";
import { Input } from "../Input";
import { POIDetailPanel } from "../POIDetailPanel";
import { POIResultList, type POIResultListItem } from "../POIResultList";
import { RoutePreviewPanel } from "../RoutePreviewPanel";
import { Button } from "../Button";
import { FloorSelector } from "../FloorSelector";
import { MapControlsGroup } from "../MapControlsGroup";
import { SearchBar } from "../SearchBar";
import { MapAttribution } from "../MapAttribution";
import { LanguageSwitcher } from "../LanguageSwitcher";

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

/**
 * A search field in the panel header: under the grip, above the results, and
 * not scrolled with them (row 73). A collapsed sheet always shows the whole
 * header, and a drag that starts on it always moves the sheet.
 */
export const SheetPanelHeader: Story = {
  args: {
    className: "h-[42rem] max-w-[402px]",
    panelPresentation: "bottom",
    panelLabel: "Places",
    panelHeader: (
      <div className="px-4">
        <Input aria-label="Search places" placeholder="Search" />
      </div>
    ),
    panel: (
      <ul className="m-0 list-none p-0">
        {Array.from({ length: 30 }, (_, index) => (
          <li
            key={index}
            className="h-20 border-t border-border px-4 py-3 text-sm"
          >
            Place {index + 1}
          </li>
        ))}
      </ul>
    ),
  },
};

/**
 * A place's details hosted in the sheet, as a product shows a tapped pin:
 * the card paints no surface of its own (`presentation="sheet"`), so it sits
 * on the sheet's, and its header tops its padding up to what the grip's row
 * already leaves. The close button sits as far from the sheet's side as from
 * its top, plus the 4px that keeps the grip's target clear (GAP-083).
 */
export const SheetWithPlaceDetails: Story = {
  args: {
    className: "h-[42rem] max-w-[402px]",
    panelPresentation: "bottom",
    panelLabel: "Place details",
    panel: (
      <POIDetailPanel
        presentation="sheet"
        poi={{
          id: "harbour-coffee",
          name: "Harbour Coffee Co.",
          floorId: "2",
          floorLabel: "Level 2",
          buildingLabel: "Terminal 2",
          description: "Speciality coffee, pastries and breakfast to go.",
          media: [],
          services: [],
          actions: ["favourite", "bookmark", "navigate", "share"],
        }}
        actionLabels={{
          favourite: "Favourite",
          bookmark: "Save",
          navigate: "Go",
          share: "Share",
        }}
        onAction={() => undefined}
        onClose={() => undefined}
      />
    ),
  },
};

/** One fitted detent: no grip, but the shell still owns the top inset. */
export const GriplessFittedPanel: Story = {
  args: {
    ...SheetWithPlaceDetails.args,
    panelDetents: ["content"],
    panelDetent: "content",
  },
};

const browseIcons = {
  accessible: <Accessibility className="h-8 w-8" />,
  dining: <Utensils className="h-8 w-8" />,
  favourites: <Heart className="h-8 w-8" />,
  information: <Info className="h-8 w-8" />,
  shopping: <ShoppingBag className="h-8 w-8" />,
};

/**
 * The category browser hosted in the sheet, as a product shows it at rest:
 * its search row is the top of the sheet, so the row tops its padding up to
 * what the grip's row already leaves rather than adding to it, and keeps the
 * 4px that keeps the grip's target clear (decision 14). The search field sits
 * as far from the sheet's side as from its top, plus those 4.
 */
export const SheetWithBrowseCategories: Story = {
  args: {
    className: "h-[42rem] max-w-[402px]",
    panelPresentation: "bottom",
    panelLabel: "Places",
    panel: (
      <BrowseCategoriesPanel
        categories={[
          { id: "favourites", label: "Favourites", selected: false },
          { id: "shopping", label: "Shopping", selected: false },
          { id: "dining", label: "Dining", selected: false },
          { id: "accessible", label: "Accessible places", selected: false },
          {
            id: "information",
            label: "Information and help",
            selected: false,
          },
        ]}
        onSelect={() => undefined}
        renderIcon={(category) =>
          browseIcons[category.id as keyof typeof browseIcons]
        }
        search={<SearchBar aria-label="Search places" placeholder="Search" />}
      />
    ),
  },
};

/**
 * A route preview hosted in the sheet, as a product shows one after Go: its
 * destination row is the top of the sheet, so the row tops its padding up to
 * what the grip's row already leaves rather than adding to it, and keeps the
 * 4px that keeps the grip's target clear (decision 14). "To" sits as far
 * from the sheet's side as from its top, plus those 4.
 */
export const SheetWithRoutePreview: Story = {
  args: {
    className: "h-[42rem] max-w-[402px]",
    panelPresentation: "bottom",
    panelLabel: "Directions",
    panel: (
      <RoutePreviewPanel
        backLabel="Back"
        continueLabel="Start"
        destinationName="Harbour Coffee Co."
        onBack={() => undefined}
        onContinue={() => undefined}
        onOptionSelect={() => undefined}
        options={[
          {
            id: "quickest",
            label: "Quickest",
            durationSeconds: 240,
            durationLabel: "4 min",
            distanceMetres: 150,
            distanceLabel: "150 m",
            preference: "quickest",
            selected: true,
            available: true,
          },
          {
            id: "step-free",
            label: "Step-free",
            durationSeconds: 360,
            durationLabel: "6 min",
            distanceMetres: 173,
            distanceLabel: "173 m",
            preference: "step-free",
            selected: false,
            available: true,
          },
        ]}
        optionsCountLabel="2 route options"
        status="ready"
      />
    ),
  },
};

/**
 * A stand-in map with shapes under the sheet, so a glass sheet reads as
 * glass: rooms in three colours on the page's grey, each partly under the
 * sheet at rest. Placed inline: the package's stylesheet has only the
 * classes its components use, and no arbitrary lengths.
 */
const room = (colour: string, place: CSSProperties) => (
  <div
    className={`absolute rounded-control ${colour}`}
    style={place}
    aria-hidden="true"
  />
);
const mapUnderGlass = (
  <div className="relative h-full w-full bg-muted">
    {room("bg-primary", {
      left: "8%",
      top: "30%",
      width: "38%",
      height: "40%",
    })}
    {room("bg-warning", {
      right: "10%",
      top: "44%",
      width: "34%",
      height: "34%",
    })}
    {room("bg-secondary", {
      left: "28%",
      bottom: "6%",
      width: "34%",
      height: "22%",
    })}
  </div>
);

/**
 * The category browser on a glass sheet. The sheet's glass is the one
 * surface: the browser paints no fill of its own, so the map shows through
 * under its search row and its tiles (decision 43). It was an opaque block
 * from under the grip's row down. On a solid sheet it looks as it did.
 */
export const GlassSheetWithBrowseCategories: Story = {
  args: {
    ...SheetWithBrowseCategories.args,
    map: mapUnderGlass,
    panelSurface: "glass",
  },
};

/** The route preview on a glass sheet, with no fill of its own (decision 43). */
export const GlassSheetWithRoutePreview: Story = {
  args: {
    ...SheetWithRoutePreview.args,
    map: mapUnderGlass,
    panelSurface: "glass",
  },
};

/**
 * A place's details on a glass sheet. The card's sheet presentation has
 * painted no surface of its own since GAP-083; its inset blocks keep theirs.
 */
export const GlassSheetWithPlaceDetails: Story = {
  args: {
    ...SheetWithPlaceDetails.args,
    map: mapUnderGlass,
    panelSurface: "glass",
  },
};

const glassResults: POIResultListItem[] = [
  "Harbour Coffee Co.",
  "Baskin-Robbins",
  "Burger King",
].map((name, index) => ({
  poi: {
    id: `result-${index}`,
    name,
    categoryLabel: "Dining",
    floorId: "2",
    floorLabel: "Level 2",
    media: [],
    actions: ["navigate"],
  },
  result: {
    poiId: `result-${index}`,
    resultIndex: index + 1,
    selected: false,
    featured: false,
    floorId: "2",
  },
}));

/**
 * Results on a glass sheet. The list paints no fill of its own; each result
 * is a card with its own border and fill, which it keeps on glass.
 */
export const GlassSheetWithResults: Story = {
  args: {
    className: "h-[42rem] max-w-[402px]",
    panelPresentation: "bottom",
    panelLabel: "Results",
    panelSurface: "glass",
    map: mapUnderGlass,
    panel: (
      <div className="px-4">
        <POIResultList
          items={glassResults}
          onSelect={() => undefined}
          resultCountLabel="3 results"
        />
      </div>
    ),
  },
};

/** Opposite corners are measured as one region, without a second MapOverlay. */
export const RegisteredBottomCorners: Story = {
  args: {
    className: undefined,
    style: { width: 360, height: 600, maxWidth: "100%" },
    panel: undefined,
    controls: undefined,
    controlsBottomStart: <Button variant="outline">Start-side action</Button>,
    controlsBottomEnd: (
      <div className="flex flex-col items-end gap-4">
        <FloorSelector
          floors={["2", "1", "G"]}
          selectedFloor="1"
          variant="compact-stepper"
        />
        <MapControlsGroup
          onZoomIn={() => undefined}
          onZoomOut={() => undefined}
        />
      </div>
    ),
  },
};

/** The shell reserves credits separately from its controls and panel. */
export const RegisteredAttribution: Story = {
  args: {
    ...RegisteredBottomCorners.args,
    style: { width: 390, height: 720, maxWidth: "100%" },
    controlsBottomStart: (
      <LanguageSwitcher
        languages={[
          { id: "en", label: "English" },
          { id: "de", label: "Deutsch" },
        ]}
        selectedLocale="en"
        onLocaleRequest={() => undefined}
      />
    ),
    attribution: (
      <MapAttribution
        credits={[
          { id: "owner", label: "© Example indoor data" },
          {
            id: "outdoor",
            label: "Outdoor map contributors",
            href: "https://example.com/credits",
          },
        ]}
      />
    ),
  },
};

export const AttributionWithSheet: Story = {
  args: {
    ...RegisteredAttribution.args,
    panel: (
      <div className="p-4">
        <Button>Place details</Button>
      </div>
    ),
    defaultPanelDetent: "collapsed",
  },
};

export const AttributionBesidePanel: Story = {
  args: {
    ...AttributionWithSheet.args,
    style: { width: 1000, height: 600, maxWidth: "100%" },
    panelPlacement: "start",
  },
};
