import type { Meta, StoryObj } from "@storybook/react";
import { SplitButton } from "./SplitButton";

const meta: Meta<typeof SplitButton> = {
  id: "action-splitbutton",
  title: "Core/Actions/SplitButton",
  component: SplitButton,
};

export default meta;
type Story = StoryObj<typeof SplitButton>;

export const Default: Story = {
  args: {
    children: "Save",
    menuItems: [
      { label: "Save as Draft", onClick: () => console.log("Draft") },
      { label: "Save and Publish", onClick: () => console.log("Publish") },
    ],
  },
};
