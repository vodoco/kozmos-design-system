import { useState } from "react";
import { Box, CategoryTile, Icon, Text } from "@kozmos-ds/react";
import type { ComponentProps } from "react";
import { categories, categoryTints, tint } from "../sample-data";
import type { DemoModule } from "../types";

type IconName = ComponentProps<typeof Icon>["name"];

const icons: Record<string, IconName> = {
  shops: "shopping-bag-02",
  information: "info-circle",
  transport: "bus",
  events: "calendar",
};

function Tiles() {
  const [selected, setSelected] = useState("information");
  return (
    <Box className="site-demo-column">
      <Box className="site-demo-tiles">
        {categories.map((category) => (
          <CategoryTile
            key={category.id}
            category={{ ...category, selected: category.id === selected }}
            icon={<Icon name={icons[category.id]} size="xl" />}
            tint={tint(categoryTints[category.id])}
            onSelect={setSelected}
          />
        ))}
      </Box>
      <Text size="sm" color="muted" aria-live="polite">
        {categories.find((category) => category.id === selected)?.label} is
        selected.
      </Text>
    </Box>
  );
}

function Untinted() {
  return (
    <Box className="site-demo-tiles">
      {categories.slice(0, 2).map((category) => (
        <CategoryTile
          key={category.id}
          category={category}
          icon={<Icon name={icons[category.id]} size="xl" />}
          onSelect={() => {}}
        />
      ))}
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Four categories",
    description:
      "A CategoryPresentation from the contracts, an icon the product resolves, and a tint from the category palette.",
    Component: Tiles,
  },
  { title: "Without a tint", Component: Untinted },
];
