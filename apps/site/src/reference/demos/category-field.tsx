import { useState } from "react";
import { Box, Button, CategoryField, Icon, SearchBar } from "@kozmos-ds/react";
import { tint } from "../sample-data";
import type { DemoModule } from "../types";

function Chosen() {
  return (
    <Box className="site-demo-column">
      <CategoryField
        label="Shops"
        count={24}
        tint={tint("blue")}
        icon={<Icon name="shopping-bag-02" />}
        clearLabel="Clear Shops"
        onClear={() => undefined}
      />
      <CategoryField
        label="Transport"
        count={6}
        tint={tint("green")}
        icon={<Icon name="bus" />}
        clearLabel="Clear Transport"
        onClear={() => undefined}
      />
    </Box>
  );
}

function InTheSearchRow() {
  const [category, setCategory] = useState<string | undefined>("Information");
  const [query, setQuery] = useState("");
  return (
    <Box className="site-demo-column">
      {category ? (
        <CategoryField
          label={category}
          count={3}
          tint={tint("turquoise")}
          icon={<Icon name="info-circle" />}
          clearLabel={`Clear ${category}`}
          onClear={() => setCategory(undefined)}
        />
      ) : (
        <SearchBar
          variant="inline"
          aria-label="Search places"
          placeholder="Search places"
          value={query}
          onChange={setQuery}
          onClear={() => setQuery("")}
        />
      )}
      {category ? null : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCategory("Information")}
        >
          Choose Information again
        </Button>
      )}
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "A chosen category",
    description:
      "The search field’s form once a quick-access category is chosen: its icon and name in the category’s colour, a count pill, a clear button in a 44px target.",
    Component: Chosen,
  },
  {
    title: "In the search row",
    description:
      "It takes the search field’s place; clearing it brings the field back.",
    Component: InTheSearchRow,
  },
];
