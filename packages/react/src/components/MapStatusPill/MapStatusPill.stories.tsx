import type { Decorator, Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { BluetoothOff, Walking } from "@kozmos-ds/icons";
import { MapStatusPill } from "./MapStatusPill";
import { MapOverlay } from "../MapOverlay";
import { MapControlsGroup } from "../MapControlsGroup";

/**
 * On the map's grey, where the pill's surface and its three shadows show, as
 * they will over a map. A story that draws its own map opts out.
 */
const onTheMapGrey: Decorator = (Story, context) =>
  context.parameters.ownMap ? (
    <Story />
  ) : (
    <div className="rounded-container bg-muted p-8">
      <Story />
    </div>
  );

const meta = {
  id: "product-sdk-mapstatuspill",
  title: "SDK/Map controls/MapStatusPill",
  component: MapStatusPill,
  parameters: { layout: "centered" },
  decorators: [onTheMapGrey],
  argTypes: {
    tone: {
      control: "select",
      options: ["neutral", "progress", "success", "danger", "warning"],
    },
    live: { control: "select", options: ["polite", "assertive", "off"] },
    icon: { control: false },
  },
} satisfies Meta<typeof MapStatusPill>;

export default meta;
type Story = StoryObj<typeof meta>;

// PositionStatus. The first story is the plainest use, the one the docs'
// controls and the component's API card start from; the rest follow the
// board's order.

/** The system's arc, turning in the theme's blue; it rests under reduced motion. */
export const CalculatingPrecisePosition: Story = {
  args: { tone: "progress", children: "Calculating Precise Position" },
};

/** The SDK's warning triangle in the danger colour; the words stay ink. */
export const FailedToCalculatePrecisePosition: Story = {
  args: { tone: "danger", children: "Failed to Calculate Precise Position" },
};

/**
 * The SDK's walking figure, `Walking`, in the arc's place: the progress tone
 * draws it in the theme's blue, as the SDK does.
 */
export const WalkingImprovesAccuracy: Story = {
  args: {
    tone: "progress",
    icon: <Walking />,
    children: "Walking improves accuracy",
  },
};

/** A check, and the words, in the success colour. */
export const Established: Story = {
  args: { tone: "success", children: "Established" },
};

/**
 * In progress, as every wait is drawn. The board sets these words in the
 * theme's blue, where it sets the other waits' in ink; Olcay chose ink
 * (2026-09-28), so the tone keeps one rule.
 */
export const UpdatingRoute: Story = {
  args: { tone: "progress", children: "Updating Route" },
};

/** The product's mark in place of the tone's: `BluetoothOff`, in the danger colour. */
export const NoBluetooth: Story = {
  args: {
    tone: "danger",
    icon: <BluetoothOff />,
    children: "No Bluetooth",
  },
};

/**
 * The SDK marks this with a walking figure struck through beside a pin, and
 * `@kozmos-ds/icons` has no such icon: neither Figma file Kozmos reads for the
 * SDK draws it. Until one does, this draws no mark rather than a stand-in.
 */
export const WayfindingUnavailable: Story = {
  args: { tone: "danger", icon: null, children: "Wayfinding Unavailable" },
};

// Downloading Content.

export const PreparingContent: Story = {
  args: { tone: "progress", children: "Preparing Content" },
};

export const UpdatingContent: Story = {
  args: { tone: "progress", children: "Updating Content" },
};

export const UpToDate: Story = {
  args: { tone: "success", children: "Up-to-date" },
};

// The Turn Back indicator.

/**
 * The filled warning: Emotion/alert/fill, the SDK's bright amber, under its
 * ink, Emotion/alert/onFill, in both themes. The SDK's U-turn arrow is not in
 * `@kozmos-ds/icons`, nor in either Figma file Kozmos reads for the SDK, so
 * this draws no mark rather than a stand-in.
 */
export const TurnBack: Story = {
  args: { tone: "warning", icon: null, children: "Turn Back" },
};

// The route being calculated when step-free is turned on (GAP-102).

export const CalculatingStepFreeRoute: Story = {
  args: { tone: "progress", children: "Calculating step-free route" },
};

/**
 * The pill is as wide as what it says, up to a map control's longest, and
 * then wraps: a product's longer words, or a longer language, grow it taller
 * rather than being cut.
 */
export const LongerWordsWrap: Story = {
  args: {
    tone: "danger",
    children:
      "Failed to Calculate Precise Position. Walk to an open area and try again.",
  },
};

/** The mark stays on the side reading starts from. */
export const RightToLeft: Story = {
  args: { tone: "progress", children: "Calculating Precise Position" },
  render: (args) => (
    <div dir="rtl">
      <MapStatusPill {...args} />
    </div>
  ),
};

/**
 * Where the pill goes is the product's: here, a MapOverlay at the bottom
 * centre of the map, clear of the controls in its corner. Kozmos draws the
 * status; when it shows, and which, is the product's to decide.
 */
export const OnTheMap: Story = {
  args: { tone: "progress", children: "Calculating step-free route" },
  parameters: { layout: "fullscreen", ownMap: true },
  render: (args) => (
    <div className="relative h-[480px] overflow-hidden rounded-container border bg-muted">
      <MapOverlay position="top-right">
        <MapControlsGroup
          onMyLocation={fn()}
          onZoomIn={fn()}
          onZoomOut={fn()}
        />
      </MapOverlay>
      <MapOverlay position="bottom-center">
        <MapStatusPill {...args} />
      </MapOverlay>
    </div>
  ),
};
