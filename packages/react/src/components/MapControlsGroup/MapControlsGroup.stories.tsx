import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { UserLocationState } from "@kozmos-ds/product-contracts";
import { MapControlsGroup } from "./MapControlsGroup";

const meta = {
  id: "map-mapcontrolsgroup",
  title: "SDK/Map controls/MapControlsGroup",
  component: MapControlsGroup,
  parameters: { layout: "centered" },
} satisfies Meta<typeof MapControlsGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    compassBearing: 32,
    onZoomIn: () => console.log("zoom in"),
    onZoomOut: () => console.log("zoom out"),
    onCompassReset: () => console.log("reset bearing"),
    onMyLocation: () => console.log("locate me"),
  },
};

export const ZoomOnly: Story = {
  args: {
    onZoomIn: () => console.log("zoom in"),
    onZoomOut: () => console.log("zoom out"),
  },
};

const locationStates: [UserLocationState, string][] = [
  ["off", "Off"],
  ["locating", "Locating"],
  ["following", "On"],
  ["heading", "On"],
  ["heading-paused", "Off"],
  ["stale", "Last known"],
  ["permission-denied", "No access"],
  ["unavailable", "No Location"],
];

/**
 * Every state's mark, labelled so the state can be read beside it, in the
 * SDK's words (decision 40): "Focus" over the state, grey while off and navy
 * while on. The marks are the Location Tracking Buttons revamp's: the outline
 * pointer while the map is not following, the solid pointer with its cone
 * while it follows, the upright pointer with the turning arc for heading —
 * "On", as following reads — the upright pointer in outline while heading is
 * paused by a pan (decision 45), and the pointer struck through when there is
 * no position, which reads its state alone, on one line.
 */
export const LocationStates: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-4">
      {locationStates.map(([state, stateLabel]) => (
        <MapControlsGroup
          key={state}
          label={`Map controls, ${state}`}
          locationLabel="Focus"
          locationLabelPlacement="stacked"
          locationPresentation="labelled"
          locationState={state}
          locationStateLabel={stateLabel}
          onMyLocation={() => undefined}
        />
      ))}
    </div>
  ),
};

// Heading reads "On", as following does, and as the SDK's control does: its
// mark tells the two apart, and a screen reader hears what the group adds
// after the words ("Focus, On, map turns with you").
const sdkCycle: [UserLocationState, string][] = [
  ["off", "Off"],
  ["following", "On"],
  ["heading", "On"],
];

/**
 * The SDK's location control: icon-only over the map, widening to "Focus / On"
 * for a moment when the mode changes. Each press moves to the next mode, as
 * the revamp's sequence does — off, following, then the map turning with the
 * visitor. From following to heading the words stay "On", so nothing widens:
 * the mark changes, and the SDK says "Map Rotation: On" in a status message
 * of its own. The group draws; the product decides what a press does.
 */
export const SDKLocationControl: Story = {
  render: function SDKLocationControlStory() {
    const [index, setIndex] = React.useState(0);
    const [state, stateLabel] = sdkCycle[index];

    return (
      <MapControlsGroup
        locationLabel="Focus"
        locationLabelPlacement="stacked"
        locationRevealOnChange
        locationState={state}
        locationStateLabel={stateLabel}
        onMyLocation={() => setIndex((value) => (value + 1) % sdkCycle.length)}
        onZoomIn={() => undefined}
        onZoomOut={() => undefined}
      />
    );
  },
};

/**
 * While a route is shown, the step-free control takes the location control's
 * place and reads the same way. It follows the location control's
 * presentation settings, so the corner does not change character between
 * exploring and wayfinding.
 */
export const StepFreeDuringWayfinding: Story = {
  render: function StepFreeDuringWayfindingStory() {
    const [stepFree, setStepFree] = React.useState(false);

    return (
      <MapControlsGroup
        locationLabelPlacement="stacked"
        locationRevealOnChange
        stepFree={stepFree}
        onMyLocation={() => undefined}
        onStepFreeChange={setStepFree}
        onZoomIn={() => undefined}
        onZoomOut={() => undefined}
      />
    );
  },
};
