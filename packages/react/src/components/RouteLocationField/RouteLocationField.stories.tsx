import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { RouteLocationField } from "./RouteLocationField";

const lobby = {
  value: "lobby",
  label: "North terminal lobby",
  description: "North Terminal · Ground floor",
};
const meta = {
  title: "Map/RouteLocationField",
  component: RouteLocationField,
  parameters: { layout: "padded" },
  args: {
    label: "From",
    location: null,
    query: "",
    options: [lobby],
    onQueryChange: fn(),
    onSelect: fn(),
    onClear: fn(),
    onChooseMap: fn(),
  },
} satisfies Meta<typeof RouteLocationField>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Search: Story = {
  render: function Search(args) {
    const [query, setQuery] = React.useState("");
    const [location, setLocation] = React.useState<typeof lobby | null>(null);
    return (
      <RouteLocationField
        {...args}
        query={query}
        location={location}
        onQueryChange={setQuery}
        onSelect={(place) =>
          setLocation({ ...place, description: place.description ?? "" })
        }
        onClear={() => {
          setLocation(null);
          setQuery("");
        }}
      />
    );
  },
};
export const Resolved: Story = { args: { location: lobby } };
export const Loading: Story = { args: { query: "North", status: "loading" } };
export const Empty: Story = {
  args: { query: "Gallery", status: "empty", options: [] },
};
export const Error: Story = {
  args: {
    query: "Lobby",
    status: "error",
    statusText: "Search is unavailable. Choose a place on the map.",
  },
};
export const Disabled: Story = { args: { location: lobby, disabled: true } };
export const LongLocation: Story = {
  args: {
    location: {
      value: "assistance",
      label:
        "International departures assistance and accessible transport meeting point",
      description: "Upper departures level · International Terminal East",
    },
  },
};
