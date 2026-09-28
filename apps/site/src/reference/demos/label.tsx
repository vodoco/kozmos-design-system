import { useId } from "react";
import { Box, Input, Label, Stack } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function ForAField() {
  const id = useId();
  return (
    <Box className="site-demo-column">
      <Stack gap={1}>
        <Label htmlFor={id}>Venue name</Label>
        <Input id={id} placeholder="Riverside Centre" />
      </Stack>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "For a field",
    description:
      "The label primitive the fields use internally, for a control that has none. htmlFor ties it to the field.",
    Component: ForAField,
  },
];
