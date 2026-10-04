import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "./Label";
import { Input } from "../Input";

const meta = {
  id: "components-label",
  title: "Core/Inputs/Label",
  component: Label,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Label",
  },
};

export const WithInput: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gap: "0.5rem",
        width: "100%",
        maxWidth: "20rem",
      }}
    >
      <Label htmlFor="label-email">Email</Label>
      <Input id="label-email" type="email" placeholder="you@example.com" />
    </div>
  ),
};
