import React from "react";
import { ThemeProvider } from "../src/components/ThemeProvider/ThemeProvider";
import { Progress } from "../src/components/Progress/Progress";

/** An indeterminate bar 400 wide, and the page's top bar (GAP-159). */
export function ProgressSweepFixture({ dir }: { dir: "ltr" | "rtl" }) {
  return (
    <ThemeProvider theme="light">
      <div dir={dir} style={{ width: 400, paddingTop: 40 }}>
        <Progress data-testid="inline" />
        <Progress data-testid="top" placement="top" />
      </div>
    </ThemeProvider>
  );
}
