import type { Meta, StoryObj } from "@storybook/react";
import { PersonaMark, PersonaMarkGroup } from "./PersonaMark";
import { Checkbox } from "../Checkbox";
import { Label } from "../Label";
import { Text } from "../Text/Text";

// Pointr Cloud's personas and their colours: product data, as a site holds it.
const PERSONAS = [
  { name: "Customer", color: "#FF9800" },
  { name: "Visitor", color: "#2196F3" },
  { name: "Staff", color: "#4CAF50" },
];

const meta: Meta<typeof PersonaMark> = {
  id: "data-display-personamark",
  title: "Core/Data display/PersonaMark",
  component: PersonaMark,
  parameters: { layout: "padded" },
  args: { color: "#FF9800" },
  argTypes: { color: { control: "color" } },
};

export default meta;
type Story = StoryObj<typeof PersonaMark>;

export const Default: Story = {};

/** Standing alone, the mark is an image named by the persona. */
export const Named: Story = {
  args: { color: "#2196F3", name: "Visitor" },
};

/**
 * The personas a tree row is visible to: one image, read "Assigned personas:
 * Customer, Visitor, Staff".
 */
export const Group: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Text size="sm">Gate A12</Text>
      <PersonaMarkGroup personas={PERSONAS} />
    </div>
  ),
};

/**
 * The feature panel's persona visibility list (GAP-106): each checkbox's
 * label is the persona's mark and name, read as the name alone.
 */
export const InAPersonaList: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      {PERSONAS.map((persona, index) => (
        <div key={persona.name} className="flex items-center gap-2">
          <Checkbox
            defaultChecked={index !== 1}
            id={`persona-${persona.name}`}
            wrapperClassName="w-auto"
          />
          <Label
            className="flex items-center gap-2"
            htmlFor={`persona-${persona.name}`}
          >
            <PersonaMark color={persona.color} />
            {persona.name}
          </Label>
        </div>
      ))}
    </div>
  ),
};
