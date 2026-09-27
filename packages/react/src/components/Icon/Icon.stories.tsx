import type { Meta, StoryObj } from "@storybook/react";
import { Icon } from "./Icon";
import { kozmosIconDefinitions, kozmosIconNames } from "@kozmos-ds/icons";
import { Settings01 as Settings } from "@kozmos-ds/icons";

const meta: Meta<typeof Icon> = {
  title: "Foundations/Icon",
  component: Icon,
  argTypes: {
    name: { control: "select", options: kozmosIconNames },
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    color: {
      control: "select",
      options: ["default", "muted", "primary", "destructive"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const Default: Story = {
  args: {
    name: "home-line",
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Icon name="user-01" size="xs" />
      <Icon name="user-01" size="sm" />
      <Icon name="user-01" size="md" />
      <Icon name="user-01" size="lg" />
      <Icon name="user-01" size="xl" />
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Icon icon={Settings} color="default" />
      <Icon icon={Settings} color="muted" />
      <Icon icon={Settings} color="primary" />
      <Icon icon={Settings} color="destructive" />
    </div>
  ),
};

export const Registry: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
      {kozmosIconDefinitions.map((icon) => (
        <div
          key={icon.name}
          className="flex items-center gap-2 rounded border p-2 text-xs"
        >
          <Icon name={icon.name} size="sm" />
          <span className="truncate">{icon.name}</span>
        </div>
      ))}
    </div>
  ),
};
