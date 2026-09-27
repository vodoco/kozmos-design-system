import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Accessibility } from "@kozmos-ds/icons";
import { CategoryTile } from "./CategoryTile";

const meta = {
  title: "Product SDK/CategoryTile",
  component: CategoryTile,
  parameters: { layout: "centered" },
  args: {
    category: {
      id: "accessible-places",
      label: "Accessible places",
      selected: false,
      resultCount: 12,
      resultCountLabel: "12 places",
    },
    className: "w-32",
    icon: <Accessibility className="h-8 w-8" />,
    onSelect: fn(),
  },
} satisfies Meta<typeof CategoryTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: {
    category: {
      id: "accessible-places",
      label: "Accessible places",
      selected: true,
    },
  },
};

/** A tile in its category's colours: the accent on the icon, the inked fill
 *  on the counter. The taxonomy's palette lives in the category tokens. */
export const Tinted: Story = {
  args: {
    tint: {
      accent: "var(--semantics-category-accent-red)",
      fill: "var(--semantics-category-fill-red)",
      onFill: "var(--semantics-category-on-fill-red)",
    },
  },
};
