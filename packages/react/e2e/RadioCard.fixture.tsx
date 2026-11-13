import React from "react";
import { ThemeProvider } from "../src/components/ThemeProvider/ThemeProvider";
import { RadioGroup, RadioGroupItem } from "../src/components/Radio/Radio";

// GAP-158: two cards, the second chosen, in a light theme.
export function RadioCardFixture() {
  return (
    <ThemeProvider theme="light">
      <div style={{ width: 480 }}>
        <RadioGroup aria-label="Map style" defaultValue="satellite">
          <RadioGroupItem
            value="vector"
            variant="card"
            label="Vector"
            media={<div style={{ height: 40 }} />}
          />
          <RadioGroupItem value="satellite" variant="card" label="Satellite" />
        </RadioGroup>
      </div>
    </ThemeProvider>
  );
}
