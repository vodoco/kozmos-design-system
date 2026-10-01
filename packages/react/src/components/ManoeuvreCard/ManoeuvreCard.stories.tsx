import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ManoeuvreCard } from "./ManoeuvreCard";
import { Itinerary } from "../Itinerary";

const steps = [
  {
    id: "1",
    instruction: "Take Elevator down to First Floor",
    type: "straight" as const,
    current: true,
  },
  {
    id: "2",
    instruction: "Take Corridor to Garage B",
    type: "straight" as const,
  },
  {
    id: "3",
    instruction: "Take Walkway to Terminal B",
    type: "straight" as const,
  },
  { id: "4", instruction: "Destination", type: "destination" as const },
];

const meta = {
  title: "Map/ManoeuvreCard",
  component: ManoeuvreCard,
  parameters: { layout: "padded" },
  args: {
    type: "straight",
    instruction: "Take Elevator down to First Floor",
    detail: "58 m · Second Floor",
    expanded: false,
    onToggle: () => {},
    surface: "glass",
    children: (
      <Itinerary
        origin="Dunkin'"
        steps={steps}
        destination="Airport Shuttles"
      />
    ),
  },
  render: function Render(args) {
    const [expanded, setExpanded] = React.useState(args.expanded);
    return (
      <div className="max-w-[402px] bg-muted/40 p-3">
        <ManoeuvreCard
          {...args}
          expanded={expanded}
          onToggle={() => setExpanded((open) => !open)}
        />
      </div>
    );
  },
} satisfies Meta<typeof ManoeuvreCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = { args: { expanded: true } };

/** Ordinary itinerary content does not have to provide its own landmark. */
export const CustomContent: Story = {
  args: {
    expanded: true,
    manoeuvreLabel: "Navigation en cours",
    collapseLabel: "Masquer le trajet",
    children: <p>Continue to the gate</p>,
  },
};

/** The whole instruction, however many lines it takes: the card grows with it. */
export const LongInstruction: Story = {
  args: {
    instruction:
      "Take the escalator up to the Departures level and continue past the security checkpoint",
    detail: "120 m · First Floor",
  },
};

/**
 * A product that wants a limit asks for one: `instructionLines`, here 2, and
 * the instruction ends in an ellipsis there. Assistive technology still hears
 * it whole.
 */
export const InstructionLines: Story = {
  args: {
    instruction:
      "Take the escalator up to the Departures level and continue past the security checkpoint",
    detail: "120 m · First Floor",
    instructionLines: 2,
  },
};
