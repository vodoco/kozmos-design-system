import { Grid, Surface, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Cell({ children }: { children: string }) {
  return (
    <Surface className="site-theme-sample">
      <Text size="sm">{children}</Text>
    </Surface>
  );
}

function ThreeColumns() {
  return (
    <Grid cols={3} gap={3}>
      {["One", "Two", "Three", "Four", "Five", "Six"].map((label) => (
        <Cell key={label}>{label}</Cell>
      ))}
    </Grid>
  );
}

function TwoByTwo() {
  return (
    <Grid cols={2} rows={2} gap={2} align="stretch">
      {["North", "East", "South", "West"].map((label) => (
        <Cell key={label}>{label}</Cell>
      ))}
    </Grid>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Three columns",
    description:
      "cols is a fixed count, 1 to 6 or 12; gap from the spacing scale. There is no responsive or auto-fit axis (GAP-04).",
    Component: ThreeColumns,
  },
  { title: "Two by two", Component: TwoByTwo },
];
