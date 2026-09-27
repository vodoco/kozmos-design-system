import { useState } from "react";
import { Box, Text, Textarea } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

const LIMIT = 160;

function Note() {
  const [value, setValue] = useState("");
  return (
    <Box className="site-demo-column">
      <Textarea
        label="Note for staff"
        rows={3}
        maxLength={LIMIT}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <Text size="sm" color="muted">
        {value.length} of {LIMIT} characters. There is no helperText prop
        (GAP-13), so the count sits beside it.
      </Text>
    </Box>
  );
}

function WithAnError() {
  return (
    <Box className="site-demo-column">
      <Textarea
        label="Description"
        rows={2}
        defaultValue="Too short"
        error="Write at least 20 characters."
      />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "A note",
    description: "Owned styles, a label, native rows and maxLength.",
    Component: Note,
  },
  { title: "With an error", Component: WithAnError },
];
