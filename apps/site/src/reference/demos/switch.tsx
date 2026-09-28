import { useState } from "react";
import { Box, Switch, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Settings() {
  const [stepFree, setStepFree] = useState(true);
  return (
    <Box className="site-demo-column">
      <Switch
        label="Step-free routes"
        checked={stepFree}
        onCheckedChange={setStepFree}
      />
      <Switch label="Push notifications" defaultChecked={false} />
      <Switch label="Location sharing" disabled />
      <Text size="sm" color="muted" aria-live="polite">
        Step-free routes {stepFree ? "on" : "off"}.
      </Text>
    </Box>
  );
}

function WithAnError() {
  return (
    <Box className="site-demo-column">
      <Switch label="Accept the terms" error="You have to accept the terms." />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "On, off, disabled",
    description:
      "checked and onCheckedChange, or defaultChecked. Each toggle is reported to analytics.",
    Component: Settings,
  },
  { title: "With an error", Component: WithAnError },
];
