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

// A clear at the field's end while it holds text (GAP-161): it empties the
// field, says so to the product and puts the focus back in the field. Escape
// clears too.
export const Clearable: Story = {
  render: () => (
    <Search
      label="Find a place"
      defaultValue="Gate B12"
      clearable
      wrapperClassName="w-72"
    />
  ),
};
