import type { Meta, StoryObj } from "@storybook/react";
import { WayfindingCard, WayfindingInputRow } from "./WayfindingCard";
import { MapOverlay } from "../MapOverlay";
import { useState } from "react";

const meta = {
  id: "components-wayfindingcard",
  title: "SDK/Navigation/WayfindingCard",
  component: WayfindingCard,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof WayfindingCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: <></> },
  render: () => {
    const [origin, setOrigin] = useState("Current Location");
    const [dest, setDest] = useState("Gate 42");
    return (
      <WayfindingCard
        onClose={() => alert("Close Event")}
        className="w-full max-w-[360px]"
      >
        <WayfindingInputRow
          originValue={origin}
          onOriginChange={setOrigin}
          destinationValue={dest}
          onDestinationChange={setDest}
          onSwap={() => {
            setOrigin(dest);
            setDest(origin);
          }}
        />
      </WayfindingCard>
    );
  },
};

export const InsideMapOverlay: Story = {
  args: { children: <></> },
  render: () => {
    const [origin, setOrigin] = useState("My Location");
    const [dest, setDest] = useState("Terminal C");
    return (
      <div className="relative w-full min-w-0 md:min-w-[800px] h-[500px] bg-muted rounded-panel overflow-hidden border">
        <span className="absolute inset-0 flex items-center justify-center text-muted-foreground font-mono">
          Simulated Wayfinding Environment
        </span>
        <MapOverlay position="top-left">
          <WayfindingCard
            onClose={() => alert("Close Event")}
            className="w-full"
          >
            <WayfindingInputRow
              originValue={origin}
              onOriginChange={setOrigin}
              destinationValue={dest}
              onDestinationChange={setDest}
              onSwap={() => {
                setOrigin(dest);
                setDest(origin);
              }}
            />
          </WayfindingCard>
        </MapOverlay>
      </div>
    );
  },
};
