import { useState } from "react";
import { Box, Combobox, Text } from "@kozmos-ds/react";
import { comboboxOptions } from "../sample-data";
import type { DemoModule } from "../types";

function Cities() {
  const [value, setValue] = useState<string>();
  return (
    <Box className="site-demo-column">
      <Combobox
        label="City"
        helperText="Type to filter; Singapore is disabled."
        options={comboboxOptions}
        onValueChange={(next) => setValue(next)}
      />
      <Text size="sm" color="muted" aria-live="polite">
        {value ? `Chosen: ${value}` : "Nothing chosen."}
      </Text>
    </Box>
  );
}

function Required() {
  return (
    <Box className="site-demo-column">
      <Combobox
        label="Venue"
        options={comboboxOptions}
        error="Choose a venue to continue."
        emptyText="No venue matches"
      />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Cities",
    description:
      "An input with a filtered list; each option can carry a description and be disabled.",
    Component: Cities,
  },
  {
    title: "With an error",
    Component: Required,
  },
];
