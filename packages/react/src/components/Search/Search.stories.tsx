import type { Meta, StoryObj } from "@storybook/react";
import { Search } from "./Search";

const meta: Meta<typeof Search> = {
  id: "inputs-search",
  title: "Core/Inputs/Search",
  component: Search,
};

export default meta;
type Story = StoryObj<typeof Search>;

// The width is the wrapper's: a class on the field itself never lands in
// Safari 26.0 to 26.3, which apply no @scope rule to an <input> (GAP-174).
export const Default: Story = {
  render: () => <Search placeholder="Search..." wrapperClassName="w-72" />,
};
