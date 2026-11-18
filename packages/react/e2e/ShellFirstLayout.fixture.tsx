import React from "react";
import { ThemeProvider } from "../src/components/ThemeProvider/ThemeProvider";
import { AdaptiveMapShell } from "../src/components/AdaptiveMapShell/AdaptiveMapShell";

/** A panel whose field takes focus as it mounts, as the route setup's does. */
export function ShellFirstLayoutFixture() {
  return (
    <ThemeProvider theme="light">
      <div style={{ width: 390, height: 700 }}>
        <AdaptiveMapShell
          map={<div />}
          panel={
            <label>
              From
              <input autoFocus data-testid="from" />
            </label>
          }
        />
      </div>
    </ThemeProvider>
  );
}
