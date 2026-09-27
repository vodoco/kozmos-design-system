import type { Meta, StoryObj } from "@storybook/react";
import { AISearchButton } from "./AISearchButton";
import { SearchBar } from "../SearchBar";

const meta = {
  title: "Product SDK/AISearchButton",
  component: AISearchButton,
  parameters: { layout: "padded" },
} satisfies Meta<typeof AISearchButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/**
 * Beside the search field, as the prototype's search sheet places it — through
 * `SearchBar`'s `trailing` slot, which owns the row.
 *
 * This example used to compose the pair by hand and pass `flex-1` through
 * `containerClassName`, because the field is `w-full` and without that the
 * button lands on the next line. It knew to; the reference site's example did
 * not, and neither would an integrator's. The row is the component's now.
 */
export const BesideTheSearchField: Story = {
  render: () => (
    <div className="max-w-[402px]">
      <SearchBar
        placeholder="Search this building"
        trailing={<AISearchButton />}
      />
    </div>
  ),
};

/** Narrow enough to have wrapped: the row holds at 320. */
export const OnANarrowScreen: Story = {
  render: () => (
    <div className="w-[320px]">
      <SearchBar
        placeholder="Search this building"
        trailing={<AISearchButton />}
      />
    </div>
  ),
};
