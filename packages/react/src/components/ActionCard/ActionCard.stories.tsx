import type { Meta, StoryObj } from "@storybook/react";
import { ActionCard } from "./ActionCard";

const meta = {
  title: "Product SDK/ActionCard",
  component: ActionCard,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ActionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { title: "2 results", children: "A POIResultList sits here." },
};
