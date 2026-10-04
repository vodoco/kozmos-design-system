import type { Meta, StoryObj } from "@storybook/react";
import { Listbox } from "./Listbox";

const options = [
  { value: "nearby", label: "Nearby", description: "Closest locations first" },
  { value: "popular", label: "Popular", description: "Highest engagement" },
  { value: "recent", label: "Recent", description: "Newest activity" },
];

const meta = {
  id: "components-listbox",
  title: "Core/Inputs/Listbox",
  component: Listbox,
  args: { "aria-label": "Sort locations" },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Listbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  args: {
    defaultValue: "nearby",
    options,
  },
};

export const Multiple: Story = {
  args: {
    multiple: true,
    defaultValue: ["nearby", "recent"],
    options,
  },
};
