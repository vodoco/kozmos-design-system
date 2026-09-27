import { useState } from "react";
import { Box, Checkbox, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function States() {
  const [news, setNews] = useState(false);
  return (
    <Box className="site-demo-column">
      <Checkbox
        label="Product news and offers"
        checked={news}
        onCheckedChange={(checked) => setNews(checked === true)}
      />
      <Checkbox label="Remember this venue" defaultChecked />
      <Checkbox label="Share my location with staff" disabled />
      <Text size="sm" color="muted" aria-live="polite">
        {news ? "You will get the news." : "No news."}
      </Text>
    </Box>
  );
}

function WithAnError() {
  return (
    <Box className="site-demo-column">
      <Checkbox
        label="I accept the terms"
        error="Accept the terms to continue."
      />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Checked, default, disabled",
    description:
      "Controlled with checked and onCheckedChange, or uncontrolled with defaultChecked; label draws the label and wires it.",
    Component: States,
  },
  {
    title: "With an error",
    description:
      "error as a string is shown and read; as true it only marks the box.",
    Component: WithAnError,
  },
];
