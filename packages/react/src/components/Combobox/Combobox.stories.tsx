import type { Meta, StoryObj } from "@storybook/react";
import { Combobox } from "./Combobox";

const options = [
  {
    value: "overview",
    label: "Overview",
    description: "Summary and key signals",
  },
  {
    value: "details",
    label: "Details",
    description: "Full record information",
  },
  {
    value: "activity",
    label: "Activity",
    description: "Recent changes and updates",
  },
];

const meta = {
  id: "components-combobox",
  title: "Core/Inputs/Combobox",
  component: Combobox,
  parameters: {
    layout: "centered",
  },
  args: { label: "View", options },
  render: (args) => (
    <div className="w-80">
      <Combobox {...args} />
    </div>
  ),
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValidation: Story = {
  args: { label: "Project", error: "Choose a project before continuing." },
};
