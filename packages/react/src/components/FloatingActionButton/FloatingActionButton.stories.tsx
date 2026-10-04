import type { Meta, StoryObj } from "@storybook/react";
import { FloatingActionButton } from "./FloatingActionButton";

const meta: Meta<typeof FloatingActionButton> = {
  id: "action-floatingactionbutton",
  title: "Core/Actions/FloatingActionButton",
  component: FloatingActionButton,
};

export default meta;
type Story = StoryObj<typeof FloatingActionButton>;

export const Default: Story = {
  args: {
    children: "+",
  },
};
