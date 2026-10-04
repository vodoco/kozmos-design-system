import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { RouteSetupPanel } from "./RouteSetupPanel";
import { RouteLocationField } from "../RouteLocationField";
import { Button } from "../Button";
import type { ComboboxOption } from "../Combobox";

const lobby = {
  value: "lobby",
  label: "North terminal lobby",
  description: "North Terminal · Ground floor",
};
const gallery = {
  value: "gallery",
  label: "Gallery",
  description: "North Terminal · Level 2",
};
const meta = {
  id: "map-routesetuppanel",
  title: "SDK/Navigation/RouteSetupPanel",
  component: RouteSetupPanel,
  parameters: { layout: "padded" },
  args: { ready: false, onContinue: fn(), onClose: fn(), children: null },
} satisfies Meta<typeof RouteSetupPanel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Locations: Story = {
  render: function Locations(args) {
    const [origin, setOrigin] = React.useState<ComboboxOption | null>(lobby);
    const [destination, setDestination] = React.useState<ComboboxOption | null>(
      gallery,
    );
    const [originQuery, setOriginQuery] = React.useState("");
    const [destinationQuery, setDestinationQuery] = React.useState("");
    return (
      <RouteSetupPanel
        {...args}
        ready={!!origin && !!destination}
        description="Search for a place to choose your route points."
      >
        <RouteLocationField
          label="From"
          location={origin}
          query={originQuery}
          options={[lobby, gallery]}
          disabled={args.pending}
          onQueryChange={setOriginQuery}
          onSelect={setOrigin}
          onClear={() => {
            setOrigin(null);
            setOriginQuery("");
          }}
          clearLabel="Clear origin"
        />
        <RouteLocationField
          label="To"
          location={destination}
          query={destinationQuery}
          options={[lobby, gallery]}
          disabled={args.pending}
          onQueryChange={setDestinationQuery}
          onSelect={setDestination}
          onClear={() => {
            setDestination(null);
            setDestinationQuery("");
          }}
          clearLabel="Clear destination"
        />
      </RouteSetupPanel>
    );
  },
};
export const Pending: Story = {
  ...Locations,
  args: {
    pending: true,
    continueLabel: "Calculating route…",
    closeLabel: "Cancel route calculation",
  },
};
export const MapConfirmation: Story = {
  args: {
    ready: true,
    title: "Set starting point",
    description: "Choose a level and move the map to set your starting point.",
    continueLabel: "Set starting point",
    closeLabel: "Cancel map selection",
  },
  render: (args) => (
    <RouteSetupPanel {...args}>
      <p>Selected point: North terminal lobby · Ground floor</p>
      <Button
        variant="outline"
        className="h-auto min-h-11 whitespace-normal"
        onClick={fn()}
      >
        Choose from a list instead
      </Button>
    </RouteSetupPanel>
  ),
};
export const InvalidMapPoint: Story = {
  ...MapConfirmation,
  args: {
    ...MapConfirmation.args,
    ready: false,
    description:
      "This point cannot start a route. Choose another point or choose from a list.",
  },
};
export const Standalone: Story = {
  ...Locations,
  args: { presentation: "standalone" },
};
export const LongLabels: Story = {
  args: {
    title:
      "Choose a starting point for the international departures assistance route",
    continueLabel: "Continue to available route choices",
    closeLabel: "Cancel choosing a route",
    children: "No starting point has been confirmed yet.",
  },
};
