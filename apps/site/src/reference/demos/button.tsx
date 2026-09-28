import { useState } from "react";
import { Box, Button, Icon, Stack, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

const emotions = [
  "themed",
  "neutral",
  "success",
  "danger",
  "informative",
  "alert",
] as const;

function Variants() {
  return (
    <Box className="site-demo-row">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="glass">Glass</Button>
    </Box>
  );
}

function Emotions() {
  return (
    <Stack gap={3}>
      {(["default", "outline", "ghost"] as const).map((variant) => (
        <Box key={variant} className="site-demo-row">
          {emotions.map((emotion) => (
            <Button key={emotion} variant={variant} emotion={emotion}>
              {emotion}
            </Button>
          ))}
        </Box>
      ))}
    </Stack>
  );
}

function Sizes() {
  return (
    <Box className="site-demo-row">
      <Button size="sm">Small</Button>
      <Button>Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Search">
        <Icon name="search-md" />
      </Button>
    </Box>
  );
}

function States() {
  const [saving, setSaving] = useState(false);
  return (
    <Box className="site-demo-row">
      <Button
        emotion="success"
        isLoading={saving}
        onClick={() => {
          setSaving(true);
          window.setTimeout(() => setSaving(false), 1500);
        }}
      >
        <Icon name="check" size="sm" />
        {saving ? "Saving" : "Save place"}
      </Button>
      <Button disabled>Disabled</Button>
      <Button variant="outline">
        <Icon name="navigation-pointer-01" size="sm" />
        Directions
      </Button>
      <Text size="sm" color="muted">
        Press Save to see the loading state.
      </Text>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Variants",
    description:
      "Seven variants. default, secondary and destructive are filled; outline, ghost and link are not; glass is the material.",
    Component: Variants,
  },
  {
    title: "Emotions",
    description:
      "emotion says what the action means and decides the colour, whatever the variant. Measured on the product: all six are used.",
    Component: Emotions,
  },
  {
    title: "Sizes",
    description: "sm, default, lg and icon, all at least 44px tall.",
    Component: Sizes,
  },
  {
    title: "Loading, disabled, with an icon",
    description:
      "isLoading disables the button and puts a spinner before the label, so the button grows by the spinner’s width; disabled is the native attribute.",
    Component: States,
  },
];
