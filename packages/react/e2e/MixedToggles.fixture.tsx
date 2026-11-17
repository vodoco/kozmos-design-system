import React from "react";
import { ThemeProvider } from "../src/components/ThemeProvider/ThemeProvider";
import { Switch } from "../src/components/Switch/Switch";
import { ToggleButton } from "../src/components/ToggleButton/ToggleButton";

/**
 * Decisions 188 to 190: Switch's and ToggleButton's mixed looks in a light
 * and a dark root, beside a switch and a toggle at rest, on and pressed,
 * whose looks the mixed state must leave as they were.
 */
export function MixedTogglesFixture() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      {(["light", "dark"] as const).map((theme) => (
        <ThemeProvider key={theme} theme={theme}>
          <div
            data-testid={`${theme}-page`}
            style={{ display: "grid", gap: 8, padding: 16, width: 320 }}
          >
            <Switch
              data-testid={`${theme}-switch-mixed`}
              label="Step-free"
              mixed
            />
            <Switch
              data-testid={`${theme}-switch-mixed-error`}
              label="Step-free"
              mixed
              error
            />
            <Switch data-testid={`${theme}-switch-off`} label="Step-free" />
            <Switch
              data-testid={`${theme}-switch-on`}
              label="Step-free"
              checked
            />
            <div style={{ display: "flex", gap: 8 }}>
              <ToggleButton data-testid={`${theme}-toggle-mixed`} mixed>
                Bold
              </ToggleButton>
              <ToggleButton
                data-testid={`${theme}-toggle-mixed-outline`}
                variant="outline"
                mixed
              >
                Bold
              </ToggleButton>
              <ToggleButton data-testid={`${theme}-toggle-off`}>
                Bold
              </ToggleButton>
              <ToggleButton data-testid={`${theme}-toggle-on`} pressed>
                Bold
              </ToggleButton>
            </div>
          </div>
        </ThemeProvider>
      ))}
    </div>
  );
}
