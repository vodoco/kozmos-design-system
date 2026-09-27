import { Box, Search } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Field() {
  return (
    <Box className="site-demo-column">
      <Search label="Search venues" placeholder="Name or city" />
      <Search label="With an error" error="Enter at least two characters." />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "A search field",
    description:
      'An Input with a search glyph and type="search": the field for a form, where SearchBar is the field for a map.',
    Component: Field,
  },
];
