import { useState } from "react";
import {
  Box,
  Button,
  SegmentedControl,
  Surface,
  Switch,
  Tag,
  Text,
  ThemeProvider,
  useTheme,
} from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Sample({ dir }: { dir: "ltr" | "rtl" }) {
  const { resolvedTheme } = useTheme();
  return (
    <Surface className="site-theme-sample">
      <Text weight="semibold">
        {resolvedTheme} · {dir}
      </Text>
      <Text size="sm" color="muted">
        Every component inside reads this provider’s tokens, and useTheme
        reports its resolved theme.
      </Text>
      <Box className="site-demo-row">
        <Button emotion="themed">Primary</Button>
        <Tag emotion="success" variant="outline">
          Open
        </Tag>
      </Box>
    </Surface>
  );
}

function Nested() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [rtl, setRtl] = useState(false);
  const dir = rtl ? "rtl" : "ltr";
  return (
    <Box className="site-demo-column">
      <SegmentedControl
        label="Theme"
        size="sm"
        items={[
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
        ]}
        value={theme}
        onValueChange={(next) => {
          if (next === "light" || next === "dark") setTheme(next);
        }}
      />
      <Switch label="Right to left" checked={rtl} onCheckedChange={setRtl} />
      <ThemeProvider theme={theme} dir={dir}>
        <Sample dir={dir} />
      </ThemeProvider>
    </Box>
  );
}

function TokenOverride() {
  return (
    <Box className="site-demo-column">
      <ThemeProvider
        tokens={{
          "--primitives-colors-theme-600":
            "var(--primitives-colors-theme-variant-1-600)",
          "--components-primary-buttons-themed-button-background-idle":
            "var(--primitives-colors-theme-variant-1-700)",
        }}
      >
        <Surface className="site-theme-sample">
          <Text size="sm">
            tokens re-points variables for this subtree: here the theme’s 600
            and the themed button’s idle background take the first brand
            variant’s ramp, as Make it yours does for a whole module.
          </Text>
          <Box className="site-demo-row">
            <Button>Themed button</Button>
            <Text color="primary">Primary text</Text>
          </Box>
        </Surface>
      </ThemeProvider>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  // The override first: the index shows a component's first demo small and
  // clipped, and Firefox's axe reads a clipped dark surface as the background
  // of the card text below it, which a light surface does not confuse.
  { title: "Token overrides", Component: TokenOverride },
  {
    title: "A nested provider",
    description:
      "A module boundary: its own theme and direction, never the document’s. The provider is display: contents, so the Surface inside paints.",
    Component: Nested,
  },
];
