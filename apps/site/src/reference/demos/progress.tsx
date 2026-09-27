import { useEffect, useState } from "react";
import { Box, Button, Progress, Stack, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Determinate() {
  const [value, setValue] = useState(64);
  return (
    <Box className="site-demo-column">
      <Progress value={value} aria-label="Route progress" />
      <Stack direction="row" align="center" gap={2}>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setValue((v) => Math.max(0, v - 10))}
        >
          Back
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setValue((v) => Math.min(100, v + 10))}
        >
          On
        </Button>
        <Text size="sm" color="muted">
          {value}%
        </Text>
      </Stack>
    </Box>
  );
}

/**
 * Runs when asked and stops at the end: a bar that moved on its own for
 * more than five seconds would need a way to pause it (WCAG 2.2.2).
 */
function Loading() {
  const [value, setValue] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    if (value >= 100) {
      setRunning(false);
      return;
    }
    const timer = window.setTimeout(() => setValue((v) => v + 10), 250);
    return () => window.clearTimeout(timer);
  }, [running, value]);
  return (
    <Box className="site-demo-column">
      <Progress value={value} max={100} aria-label="Loading the map" />
      <Stack direction="row" align="center" gap={2}>
        <Button
          size="sm"
          variant="outline"
          disabled={running}
          onClick={() => {
            setValue(0);
            setRunning(true);
          }}
        >
          {value >= 100 ? "Load again" : "Load the map"}
        </Button>
        <Text size="sm" color="muted" aria-live="polite">
          {running ? "Loading the map…" : value >= 100 ? "Loaded." : ""}
        </Text>
      </Stack>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "A value out of a maximum",
    description:
      "value and max, from Radix; the bar is labelled for assistive technology.",
    Component: Determinate,
  },
  { title: "Advancing", Component: Loading },
];
