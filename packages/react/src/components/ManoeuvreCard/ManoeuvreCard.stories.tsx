import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ManoeuvreCard } from "./ManoeuvreCard";
import { Itinerary } from "../Itinerary";
import type { InstructionPart } from "@kozmos-ds/product-contracts";

const steps = [
  {
    id: "1",
    instruction: "Take Elevator down to First Floor",
    type: "lift-down" as const,
    current: true,
  },
  {
    id: "2",
    instruction: "Take Corridor to Garage B",
    type: "transition" as const,
  },
  {
    id: "3",
    instruction: "Take Walkway to Terminal B",
    type: "transition" as const,
  },
  { id: "4", instruction: "Destination", type: "destination" as const },
];

const meta = {
  id: "map-manoeuvrecard",
  title: "SDK/Navigation/ManoeuvreCard",
  component: ManoeuvreCard,
  parameters: { layout: "padded" },
  args: {
    type: "lift-down",
    instruction: "Take Elevator down to First Floor",
    detail: "58 m · Second Floor",
    expanded: false,
    onToggle: () => {},
    appearance: "theme",
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

export const Background: Story = { args: { appearance: "background" } };
export const BackgroundGlass: Story = {
  args: { appearance: "background", surface: "glass" },
};

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
    type: "escalator-up",
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
    type: "escalator-up",
    instruction:
      "Take the escalator up to the Departures level and continue past the security checkpoint",
    detail: "120 m · First Floor",
    instructionLines: 2,
  },
};

const germanParts: readonly InstructionPart[] = [
  { text: "Biegen Sie bei " },
  { text: "Marlow Pharmacy", lang: "en" },
  { text: " auf der linken Seite", role: "secondary" },
  { text: " rechts ab" },
];
const japaneseParts: readonly InstructionPart[] = [
  { text: "左側の", role: "secondary" },
  { text: "Bean & Leaf Café", lang: "en" },
  { text: "で右折してください" },
];
const arabicParts: readonly InstructionPart[] = [
  { text: "عند " },
  { text: "Lumen Books", lang: "en" },
  { text: " على يسارك", role: "secondary" },
  { text: " انعطف يميناً" },
];

function localizedItinerary(instruction: readonly InstructionPart[]) {
  return (
    <Itinerary
      origin="Main Entrance"
      destination="Gate 3"
      steps={[{ id: "one", instruction, type: "right", current: true }]}
    />
  );
}
export const GermanParts: Story = {
  args: {
    type: "right",
    lang: "de",
    surface: "solid",
    instruction: germanParts,
    children: localizedItinerary(germanParts),
  },
};
export const JapaneseParts: Story = {
  args: {
    type: "right",
    lang: "ja",
    surface: "solid",
    instruction: japaneseParts,
    children: localizedItinerary(japaneseParts),
  },
};
export const ArabicParts: Story = {
  args: {
    type: "right",
    lang: "ar",
    dir: "rtl",
    surface: "solid",
    instruction: arabicParts,
    children: localizedItinerary(arabicParts),
  },
};
export const PartsItinerary: Story = {
  args: { ...ArabicParts.args, expanded: true },
};
export const GlassParts: Story = {
  args: { ...GermanParts.args, appearance: "background", surface: "glass" },
};
