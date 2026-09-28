import { useState } from "react";
import { AISearchButton, Box, SearchBar, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Alone() {
  const [pressed, setPressed] = useState(0);
  return (
    <Box className="site-demo-row">
      <AISearchButton onClick={() => setPressed((count) => count + 1)} />
      <Text size="sm" color="muted" aria-live="polite">
        {pressed
          ? `Pressed ${pressed} time${pressed === 1 ? "" : "s"}`
          : "The assistant’s entry point."}
      </Text>
    </Box>
  );
}

function BesideTheSearch() {
  const [query, setQuery] = useState("");
  return (
    <Box className="site-demo-row">
      <SearchBar
        variant="inline"
        aria-label="Search places"
        placeholder="Search places"
        value={query}
        onChange={setQuery}
        onClear={() => setQuery("")}
      />
      <AISearchButton label="Ask the assistant" />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "On its own",
    description:
      "A button that opens the assistant; the label is its accessible name.",
    Component: Alone,
  },
  {
    title: "Beside the search field",
    description: "Where the SDK places it: at the end of the search row.",
    Component: BesideTheSearch,
  },
];
