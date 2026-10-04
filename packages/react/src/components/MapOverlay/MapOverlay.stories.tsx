import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Accessibility } from "@kozmos-ds/icons";
import { MapOverlay } from "./MapOverlay";
import { POICard } from "../POICard";
import { MapControlButton } from "../MapControlButton";
import { MapControlsGroup } from "../MapControlsGroup";
import { FloorSelector } from "../FloorSelector/FloorSelector";

const meta = {
  id: "map-mapoverlay",
  title: "SDK/Map controls/MapOverlay",
  component: MapOverlay,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MapOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    position: "top-left",
    children: (
      <POICard
        title="Gate A12"
        subtitle="Departures"
        description="Overlay content remains interactive while the map remains pannable outside the content bounds."
      />
    ),
  },
  render: (args) => (
    <div className="relative h-[480px] bg-muted overflow-hidden rounded-container border">
      <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
        Map SDK renderer slot
      </div>
      <MapOverlay {...args} />
    </div>
  ),
};

export const BottomCenter: Story = {
  args: {
    ...Default.args,
    position: "bottom-center",
  },
  render: Default.render,
};

/**
 * Map chrome in the map's corners. Each control's floating shadow, and the
 * edge a map control draws around itself, show whole on every side: the
 * overlay keeps that shadow's reach clear around what it holds.
 */
export const MapControls: Story = {
  render: () => (
    <div className="relative h-[480px] bg-muted overflow-hidden rounded-container border">
      <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
        Map SDK renderer slot
      </div>
      <MapOverlay position="top-left">
        <MapControlButton
          icon={<Accessibility className="h-5 w-5" />}
          label="Step-free routes"
          onClick={fn()}
        />
      </MapOverlay>
      <MapOverlay position="top-right">
        <MapControlsGroup
          onZoomIn={fn()}
          onZoomOut={fn()}
          onMyLocation={fn()}
        />
      </MapOverlay>
      <MapOverlay position="bottom-right">
        <FloorSelector
          floors={[
            { id: "2", label: "Second floor", shortLabel: "2F" },
            { id: "1", label: "First floor", shortLabel: "1F" },
            { id: "g", label: "Ground floor", shortLabel: "GF" },
          ]}
          selectedFloor="1"
          onFloorSelect={fn()}
        />
      </MapOverlay>
    </div>
  ),
};
