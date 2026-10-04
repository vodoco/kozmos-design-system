import type { Meta, StoryObj } from "@storybook/react";
import { IconButton } from "./IconButton";
import { Icon } from "../Icon/Icon";

const meta: Meta<typeof IconButton> = {
  id: "action-iconbutton",
  title: "Core/Actions/IconButton",
  component: IconButton,
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "destructive",
        "outline",
        "secondary",
        "ghost",
        "link",
        "glass",
      ],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Default: Story = {
  args: {
    children: <Icon name="search-md" size="sm" />,
    "aria-label": "Search",
    variant: "ghost",
    size: "icon",
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <IconButton variant="default" aria-label="Default">
        <Icon name="search-md" size="sm" />
      </IconButton>
      <IconButton variant="secondary" aria-label="Secondary">
        <Icon name="search-md" size="sm" />
      </IconButton>
      <IconButton variant="outline" aria-label="Outline">
        <Icon name="search-md" size="sm" />
      </IconButton>
      <IconButton variant="ghost" aria-label="Ghost">
        <Icon name="search-md" size="sm" />
      </IconButton>
      <IconButton variant="destructive" aria-label="Destructive">
        <Icon name="search-md" size="sm" />
      </IconButton>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <IconButton size="sm" variant="outline" aria-label="Small">
        <Icon name="search-md" size="xs" />
      </IconButton>
      <IconButton size="default" variant="outline" aria-label="Default">
        <Icon name="search-md" size="sm" />
      </IconButton>
      <IconButton size="lg" variant="outline" aria-label="Large">
        <Icon name="search-md" size="md" />
      </IconButton>
    </div>
  ),
};
