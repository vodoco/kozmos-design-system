import React from "react";
import { ThemeProvider } from "../src/components/ThemeProvider/ThemeProvider";
import { TimePicker } from "../src/components/TimePicker/TimePicker";
import { DatePicker } from "../src/components/DatePicker/DatePicker";

/**
 * A time and a date of a multi-selection whose values differ (GAP-255): the
 * browser draws no placeholder in a date or time input, so Kozmos draws the
 * mixed label over the empty segments, which give way to it.
 */
export function MixedTemporalFixture({ mixed = true }: { mixed?: boolean }) {
  return (
    <ThemeProvider theme="light">
      <div style={{ width: 320, display: "grid", gap: 16 }}>
        <TimePicker label="Opens" value="" onChange={() => {}} mixed={mixed} />
        <DatePicker
          label="Opens on"
          value=""
          onChange={() => {}}
          mixed={mixed}
        />
        <button type="button">Elsewhere</button>
      </div>
    </ThemeProvider>
  );
}
