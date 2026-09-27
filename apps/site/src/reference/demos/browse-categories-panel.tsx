import { useState } from "react";
import {
  Box,
  BrowseCategoriesPanel,
  Button,
  Icon,
  SearchBar,
  Text,
} from "@kozmos-ds/react";
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

function Panel() {
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<string>();
  const shown = categories.filter((category) =>
    category.label.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <Box className="site-demo-column">
      <BrowseCategoriesPanel
        label="Browse by category"
        categories={shown}
        renderIcon={(category) => <Icon name={icons[category.id]} size="xl" />}
        tint={(category) => tint(categoryTints[category.id])}
        onSelect={setChosen}
        search={
          <SearchBar
            aria-label="Search categories"
            placeholder="Search categories"
            value={query}
            onChange={setQuery}
            onClear={() => setQuery("")}
          />
        }
        actions={
          <Button variant="ghost" size="sm">
            See all
          </Button>
        }
        emptyState={<Text color="muted">No category matches “{query}”.</Text>}
      />
      <Text size="sm" color="muted" aria-live="polite">
        {chosen
          ? `Chosen: ${categories.find((category) => category.id === chosen)?.label}.`
          : "Choose a category."}
      </Text>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "A sheet of categories",
    description:
      "The tiles in a grid under an optional search slot and actions; emptyState shows when the list is empty.",
    Component: Panel,
  },
];
