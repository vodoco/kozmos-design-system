import type { Meta, StoryObj } from "@storybook/react";
import { Itinerary } from "./Itinerary";

const meta = {
  title: "Map/Itinerary",
  component: Itinerary,
  parameters: { layout: "padded" },
  args: {
    origin: "Dunkin'",
    destination: "Airport Shuttles",
    steps: [
      {
        id: "1",
        instruction: "Take Elevator down to First Floor",
        type: "lift-down",
      },
      {
        id: "2",
        instruction: "Take Corridor to Garage B",
        type: "transition",
        current: true,
      },
      {
        id: "3",
        instruction: "Turn right onto the Walkway to Terminal B",
        type: "right",
      },
      { id: "4", instruction: "Destination", type: "destination" },
    ],
  },
} satisfies Meta<typeof Itinerary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongEndpoints: Story = {
  args: {
    originLabel: "Starting location",
    destinationLabel: "Final destination",
    origin:
      "International arrivals reception and passenger assistance desk, North Terminal",
    destination:
      "ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ",
    steps: [],
  },
};

export const StepMetrics: Story = {
  args: {
    steps: [
      {
        id: "turn",
        instruction: "Turn left",
        type: "left",
        current: true,
        distance: "8 m",
        duration: "Less than 1 min",
      },
      {
        id: "lift",
        instruction: "Take the elevator up to Level 2",
        type: "lift-up",
        duration: "1 min",
      },
      {
        id: "exit",
        instruction: "Continue to the destination",
        type: "straight",
        distance: "24 m",
      },
      { id: "destination", instruction: "Destination", type: "destination" },
    ],
  },
};

export const NoCurrentStep: Story = {
  args: { steps: meta.args.steps.map((step) => ({ ...step, current: false })) },
};
