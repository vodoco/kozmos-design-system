import type { Meta, StoryObj } from "@storybook/react";
import { ColorPicker } from "./ColorPicker";

const meta = {
  id: "components-colorpicker",
  title: "Core/Inputs/ColorPicker",
  component: ColorPicker,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-80">
      <ColorPicker
        label="Brand color"
        helperText="Use a hex value or choose a preset."
        {...args}
      />
    </div>
  ),
};

export const Compact: Story = {
  render: () => (
    <div className="w-64">
      <ColorPicker
        label="Layer color"
        defaultValue="#0F766E"
        showPresets={false}
      />
    </div>
  ),
};

export const Open: Story = {
  render: () => (
    <div className="w-80">
      <ColorPicker
        defaultOpen
        label="Brand color"
        helperText="Choose a color."
      />
    </div>
  ),
};

export const NarrowOpen: Story = {
  render: () => (
    <div className="w-56">
      <ColorPicker
        defaultOpen
        label="Accent"
        defaultValue="#C2410C"
        helperText="Panel should stay inside this width."
      />
    </div>
  ),
};

export const Error: Story = {
  render: () => (
    <div className="w-80">
      <ColorPicker label="Brand color" error="Choose an approved color." />
    </div>
  ),
};
