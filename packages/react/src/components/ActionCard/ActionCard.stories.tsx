import type { Meta, StoryObj } from "@storybook/react";
import { ActionCard } from "./ActionCard";

const meta = {
  id: "product-sdk-actioncard",
  title: "Core/Data display/ActionCard",
  component: ActionCard,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ActionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { title: "2 results", children: "A POIResultList sits here." },
};
