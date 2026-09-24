import React from "react";
import { ThemeProvider } from "../src/components/ThemeProvider/ThemeProvider";
import { AISearchButton } from "../src/components/AISearchButton/AISearchButton";
import { Stepper } from "../src/components/Stepper/Stepper";

// A phone's row, 320 less a 16 gutter each side, in a wide face: CI's Linux
// draws the system stack in DejaVu Sans, which Verdana matches in width.
const narrow: React.CSSProperties = {
  width: 288,
  overflow: "auto",
  fontFamily: "Verdana, 'DejaVu Sans', sans-serif",
};

export function NarrowStepper() {
  return (
    <ThemeProvider theme="light">
      <div data-testid="row" style={narrow}>
        <Stepper
          steps={["Details", "Shipping", "Payment", "Confirmation"]}
          currentStep={0}
        />
      </div>
    </ThemeProvider>
  );
}

export function ButtonAtTheEnd() {
  return (
    <ThemeProvider theme="light">
      <div
        data-testid="row"
        style={{ ...narrow, display: "flex", justifyContent: "flex-end" }}
      >
        <AISearchButton />
      </div>
    </ThemeProvider>
  );
}
