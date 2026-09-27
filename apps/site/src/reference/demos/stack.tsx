import { Stack, Surface, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Cell({ children }: { children: string }) {
  return (
    <Surface className="site-theme-sample">
      <Text size="sm">{children}</Text>
    </Surface>
  );
}

function Column() {
  return (
    <Stack gap={2}>
      <Cell>First</Cell>
      <Cell>Second</Cell>
      <Cell>Third</Cell>
    </Stack>
  );
}

function RowThatWraps() {
  return (
    <Stack direction="row" wrap="wrap" align="center" justify="between" gap={3}>
      <Cell>Start</Cell>
      <Cell>Middle</Cell>
      <Cell>End</Cell>
    </Stack>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "A column",
    description: "The default: direction column, gap 2, stretched.",
    Component: Column,
  },
  {
    title: "A row that wraps",
    description:
      "direction, wrap, align and justify map onto flexbox; gap is a step of the spacing scale.",
    Component: RowThatWraps,
  },
];
