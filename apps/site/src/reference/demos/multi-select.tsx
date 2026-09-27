import { useState } from "react";
import { Box, MultiSelect, Text } from "@kozmos-ds/react";
import { comboboxOptions } from "../sample-data";
import type { DemoModule } from "../types";

function Cities() {
  const [value, setValue] = useState<string[]>(["london"]);
  return (
    <Box className="site-demo-column">
      <MultiSelect
        label="Cities"
        placeholder="Add a city"
        helperText="Up to three."
        options={comboboxOptions}
        value={value}
        maxSelected={3}
        onValueChange={(next) => setValue(next)}
      />
      <Text size="sm" color="muted" aria-live="polite">
        {value.length
          ? value
              .map(
                (chosen) =>
                  comboboxOptions.find((option) => option.value === chosen)
                    ?.label ?? chosen,
              )
              .join(", ")
          : "None chosen."}
      </Text>
    </Box>
  );
}

function Required() {
  return (
    <Box className="site-demo-column">
      <MultiSelect
        label="Venues"
        options={comboboxOptions}
        required
        error="Choose at least one venue."
      />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Several cities",
    description:
      "Chosen values become removable chips in the field; the list filters as you type. maxSelected caps the count.",
    Component: Cities,
  },
  { title: "Required, with an error", Component: Required },
];
