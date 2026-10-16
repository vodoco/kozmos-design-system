import type { Meta, StoryObj } from "@storybook/react";
import { MapView } from "./MapView";
import { LocationPin } from "../LocationPin";

const meta: Meta<typeof MapView> = {
  id: "map-mapview",
  title: "SDK/Map controls/MapView",
  component: MapView,
};

export default meta;
type Story = StoryObj<typeof MapView>;

export const Default: Story = {
  render: () => (
    <MapView className="h-96">
      <div style={{ position: "absolute", top: "50%", left: "50%" }}>
        <LocationPin label="Result 1, Harbour Coffee Co." number={1} selected />
      </div>
      <div style={{ position: "absolute", top: "30%", left: "40%" }}>
        <LocationPin label="Result 2, Tessel Shoes" number={2} />
      </div>
      <div style={{ position: "absolute", top: "60%", left: "70%" }}>
        <LocationPin label="Result 3, Baskin-Robbins" number={3} />
      </div>
    </MapView>
  ),
};
