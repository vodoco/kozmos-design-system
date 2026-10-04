import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { RouteOptionCard } from "./RouteOptionCard";

const meta = {
  id: "product-sdk-routeoptioncard",
  title: "SDK/Navigation/RouteOptionCard",
  component: RouteOptionCard,
  parameters: { layout: "centered" },
  args: {
    onSelect: fn(),
    option: {
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
  },
} satisfies Meta<typeof RouteOptionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Selected: Story = {};

export const Unavailable: Story = {
  args: {
    option: {
      id: "step-free",
      label: "Step-free",
      durationSeconds: 360,
      durationLabel: "6 min",
      distanceMetres: 173,
      distanceLabel: "173 m",
      preference: "step-free",
      selected: false,
      available: false,
      warning: "Lift access is temporarily unavailable.",
    },
  },
};
