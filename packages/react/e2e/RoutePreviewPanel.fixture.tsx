import React from "react";
import type { RouteOptionPresentation } from "@kozmos-ds/product-contracts";
import { ThemeProvider } from "../src/components/ThemeProvider/ThemeProvider";
import { RoutePreviewPanel } from "../src/components/RoutePreviewPanel/RoutePreviewPanel";

const options: RouteOptionPresentation[] = [
  {
    id: "quickest",
    label: "Quickest",
    durationSeconds: 240,
    durationLabel: "4 min",
    distanceMetres: 150,
    distanceLabel: "150 m",
    preference: "quickest",
    selected: true,
    available: true,
  },
];

export function RoutePreviewInDirection({ dir }: { dir: "ltr" | "rtl" }) {
  return (
    <ThemeProvider theme="light">
      <div dir={dir} style={{ width: 360 }}>
        <RoutePreviewPanel
          backLabel="Back"
          continueLabel="Continue"
          destinationName="Gate 12"
          onBack={() => {}}
          onContinue={() => {}}
          onOptionSelect={() => {}}
          options={options}
          status="ready"
        />
      </div>
    </ThemeProvider>
  );
}
