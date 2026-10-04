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
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-80">
      <Combobox label="View" options={options} {...args} />
    </div>
  ),
};

export const WithValidation: Story = {
  render: () => (
    <div className="w-80">
      <Combobox
        label="Project"
        options={options}
        error="Choose a project before continuing."
      />
    </div>
  ),
};
