import type { Meta, StoryObj } from "@storybook/react";
import { SearchBar } from "./SearchBar";
import { MapOverlay } from "../MapOverlay";
import { useState } from "react";

const meta = {
  id: "components-searchbar",
  title: "SDK/Search and browse/SearchBar",
  component: SearchBar,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [val, setVal] = useState("");
    return (
      <div className="w-[400px]">
        <SearchBar value={val} onChange={setVal} placeholder="Where to?" />
      </div>
    );
  },
};

export const FloatingOverlay: Story = {
  render: () => {
    const [val, setVal] = useState("");
    return (
      <div className="relative w-full min-w-0 md:min-w-[800px] h-[500px] bg-muted rounded-panel overflow-hidden border">
        <span className="absolute inset-0 flex items-center justify-center text-muted-foreground font-mono">
          Map rendering simulation
        </span>
        <MapOverlay position="top-center">
          <SearchBar
            variant="floating"
            value={val}
            onChange={setVal}
            placeholder="Search buildings or places..."
          />
        </MapOverlay>
      </div>
    );
  },
};
