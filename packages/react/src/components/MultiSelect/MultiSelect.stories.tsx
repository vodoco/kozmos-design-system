import type { Meta, StoryObj } from "@storybook/react";
import { MultiSelect } from "./MultiSelect";

const options = [
  { value: "filters", label: "Filters", description: "Show saved filters" },
  { value: "layers", label: "Layers", description: "Map and data layers" },
  { value: "routes", label: "Routes", description: "Route overlays" },
  { value: "alerts", label: "Alerts", description: "Operational notices" },
];

const meta = {
  id: "components-multiselect",
  title: "Core/Inputs/MultiSelect",
  component: MultiSelect,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof MultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-96">
      <MultiSelect label="Tools" options={options} {...args} />
    </div>
  ),
};

export const WithSelectedValues: Story = {
  render: () => (
    <div className="w-96">
      <MultiSelect
        label="Visible layers"
        options={options}
        defaultValue={["filters", "routes"]}
        helperText="Choose up to three layers."
        maxSelected={3}
      />
    </div>
  ),
};
