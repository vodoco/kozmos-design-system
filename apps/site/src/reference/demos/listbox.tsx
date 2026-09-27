import { useState } from "react";
import { Box, Listbox, Text } from "@kozmos-ds/react";
import { comboboxOptions } from "../sample-data";
import type { DemoModule } from "../types";

function Single() {
  const [value, setValue] = useState<string>("london");
  return (
    <Box className="site-demo-column">
      <Listbox
        aria-label="City"
        options={comboboxOptions}
        value={value}
        onValueChange={(next) => {
          if (typeof next === "string") setValue(next);
        }}
      />
      <Text size="sm" color="muted" aria-live="polite">
        Chosen: {value}
      </Text>
    </Box>
  );
}

function Multiple() {
  const [value, setValue] = useState<string[]>(["london", "dubai"]);
  return (
    <Box className="site-demo-column">
      <Listbox
        aria-label="Cities"
        multiple
        options={comboboxOptions}
        value={value}
        onValueChange={(next) => {
          if (Array.isArray(next)) setValue(next);
        }}
      />
      <Text size="sm" color="muted" aria-live="polite">
        {value.length} chosen
      </Text>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "One choice",
    description:
      "The open list that Combobox and MultiSelect show, on its own, keyboard-navigable.",
    Component: Single,
  },
  {
    title: "Several choices",
    description: "multiple reports an array.",
    Component: Multiple,
  },
];
