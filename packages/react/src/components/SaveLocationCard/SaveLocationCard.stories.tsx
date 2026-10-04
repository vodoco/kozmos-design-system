import type { Meta, StoryObj } from "@storybook/react";
import { SaveLocationCard } from "./SaveLocationCard";

const meta = {
  id: "map-savelocationcard",
  title: "SDK/Place details/SaveLocationCard",
  component: SaveLocationCard,
  parameters: { layout: "centered" },
} satisfies Meta<typeof SaveLocationCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unsaved: Story = {
  args: {
    title: "Mark my car",
    description: "Remember where you parked",
    isSaved: false,
    className: "w-[360px]",
    onSaveToggle: () => console.log("save toggled"),
  },
};

export const Saved: Story = {
  args: {
    ...Unsaved.args,
    isSaved: true,
    description: "Level 2, Row C",
    onRouteToLocation: () => console.log("route requested"),
    onEditNote: () => console.log("edit note"),
  },
};
