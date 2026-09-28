import { useState } from "react";
import { Box, ColorPicker, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Picker() {
  const [value, setValue] = useState<string>();
  return (
    <Box className="site-demo-column">
      <ColorPicker
        label="Brand colour"
        helperText="Starts on the theme’s blue; the presets are the palette."
        onValueChange={setValue}
      />
      <Text size="sm" color="muted" aria-live="polite" className="site-mono">
        {value ?? "Pick a colour to see its value here."}
      </Text>
    </Box>
  );
}

function Compact() {
  return (
    <Box className="site-demo-column">
      <ColorPicker label="Accent" showPresets={false} defaultFormat="hex" />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "The picker",
    description:
      "A field that opens a panel with a saturation and lightness area, a hue slider, alpha, the format, and presets.",
    Component: Picker,
  },
  {
    title: "Without presets, in hex",
    Component: Compact,
  },
];
