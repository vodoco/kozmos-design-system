import type { Meta, StoryObj } from "@storybook/react";
import { Chip, ChipGroup } from "./Chip";
import {
  MarkerPin01 as MapPin,
  ShoppingBag01 as ShoppingBag,
} from "@kozmos-ds/icons";
import { Utensils as Coffee, Utensils } from "@kozmos-ds/icons";
import { useState } from "react";

const meta = {
  title: "Data Display/Chip",
  component: Chip,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Chip>;
export default meta;
type Story = StoryObj<typeof meta>;

const FilterDemo = () => {
  const [active, setActive] = useState<string>("all");
  const [visible, setVisible] = useState(true);

  return (
    <ChipGroup className="max-w-[460px]">
      <Chip selected={active === "all"} onClick={() => setActive("all")}>
        All
      </Chip>
      <Chip
        icon={<Utensils />}
        selected={active === "food"}
        onClick={() => setActive("food")}
      >
        Food & Drink
      </Chip>
      <Chip
        icon={<Coffee />}
        selected={active === "coffee"}
        onClick={() => setActive("coffee")}
      >
        Coffee
      </Chip>
      <Chip
        icon={<ShoppingBag />}
        selected={active === "shopping"}
        onClick={() => setActive("shopping")}
      >
        Retail
      </Chip>
      <Chip
        icon={<MapPin />}
        selected={active === "places"}
        onClick={() => setActive("places")}
      >
        Places
      </Chip>
      {visible ? (
        <Chip onRemove={() => setVisible(false)} variant="brand">
          Open now
        </Chip>
      ) : null}
    </ChipGroup>
  );
};

export const Default: Story = {
  render: () => <FilterDemo />,
};

export const Sizes: Story = {
  render: () => (
    <ChipGroup>
      <Chip size="sm">Small</Chip>
      <Chip>Default</Chip>
      <Chip size="lg">Large</Chip>
    </ChipGroup>
  ),
};

export const Variants: Story = {
  render: () => (
    <ChipGroup>
      <Chip variant="neutral">Neutral</Chip>
      <Chip variant="brand">Brand</Chip>
      <Chip variant="destructive">Destructive</Chip>
      <Chip selected>Selected</Chip>
      <Chip variant="destructive" selected>
        Selected destructive
      </Chip>
      <Chip disabled>Disabled</Chip>
    </ChipGroup>
  ),
};
