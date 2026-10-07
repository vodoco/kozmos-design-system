import type { Meta, StoryObj } from "@storybook/react";
import { Switch } from "./Switch";

const meta = {
  id: "components-switch",
  title: "Core/Inputs/Switch",
  component: Switch,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Switch>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Switch id="airplane-mode" label="Airplane Mode" />,
};

// On: the track is the theme fill and the thumb the theme foreground, white
// in both themes (decision 59).
export const Checked: Story = {
  render: () => (
    <Switch id="airplane-mode-checked" label="Airplane Mode" defaultChecked />
  ),
};

export const Disabled: Story = {
  render: () => (
    <Switch id="airplane-mode-disabled" label="Airplane Mode" disabled />
  ),
};

export const Error: Story = {
  render: () => (
    <Switch
      id="airplane-mode-error"
      label="Airplane Mode"
      error="Required field"
    />
  ),
};
