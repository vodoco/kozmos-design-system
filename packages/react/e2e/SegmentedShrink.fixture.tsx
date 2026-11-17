import React from "react";
import { ThemeProvider } from "../src/components/ThemeProvider/ThemeProvider";
import { SegmentedControl } from "../src/components/SegmentedControl/SegmentedControl";

// GAP-267 (decision 201): OpeningHoursEditor's choice for a day, in its
// words, English and German, the 0.16.0 story's labels.
export const labels = {
  en: ["Hours", "Closed", "Always open"],
  de: ["Öffnungszeiten", "Geschlossen", "Immer geöffnet"],
} as const;

/** A phone's column (320 less a 12 gutter each side), or a wide one. */
export function SegmentedColumn({
  width,
  words = "en",
  size = "sm",
  fullWidth = false,
  face,
}: {
  width: number;
  words?: keyof typeof labels;
  size?: "sm" | "default" | "lg";
  fullWidth?: boolean;
  // A wide face: CI's Linux draws the system stack in DejaVu Sans, which
  // Verdana matches in width.
  face?: "wide";
}) {
  return (
    <ThemeProvider theme="light">
      <div
        data-testid="column"
        style={{
          width,
          fontFamily:
            face === "wide" ? "Verdana, 'DejaVu Sans', sans-serif" : undefined,
        }}
      >
        <SegmentedControl
          aria-label="Monday"
          size={size}
          fullWidth={fullWidth}
          defaultValue="o0"
          items={labels[words].map((label, i) => ({ value: `o${i}`, label }))}
        />
      </div>
    </ThemeProvider>
  );
}
