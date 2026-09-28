import { Box, Button, EmptyState, Icon } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function NoResults() {
  return (
    <Box className="site-demo-column">
      <EmptyState
        icon={<Icon name="search-md" size="lg" />}
        title="No places match"
        description="Try another word, or browse by category."
        action={<Button variant="outline">Browse categories</Button>}
      />
    </Box>
  );
}

function NothingSavedYet() {
  return (
    <Box className="site-demo-column">
      <EmptyState
        icon={<Icon name="heart" size="lg" />}
        title="Nothing saved yet"
        description="Places you favourite appear here, on every device you sign in to."
      />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "No results, with a way out",
    description:
      "Icon, title, description and an action. The title is a paragraph, not a heading (GAP-11).",
    Component: NoResults,
  },
  { title: "Nothing yet", Component: NothingSavedYet },
];
