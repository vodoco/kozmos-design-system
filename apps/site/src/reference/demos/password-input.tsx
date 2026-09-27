import { Box, PasswordInput } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function WithToggle() {
  return (
    <Box className="site-demo-column">
      <PasswordInput
        label="Password"
        autoComplete="current-password"
        helperText="At least 12 characters."
      />
      <PasswordInput
        label="Visible from the start"
        defaultVisible
        defaultValue="correct horse battery"
      />
    </Box>
  );
}

function WithoutToggleAndError() {
  return (
    <Box className="site-demo-column">
      <PasswordInput
        label="Confirm password"
        showToggle={false}
        autoComplete="new-password"
      />
      <PasswordInput
        label="New password"
        defaultValue="short"
        error="Use at least 12 characters."
      />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "With the show/hide toggle",
    description:
      "The toggle is a labelled button; visible and onVisibleChange control it.",
    Component: WithToggle,
  },
  {
    title: "Without the toggle, and an error",
    Component: WithoutToggleAndError,
  },
];
