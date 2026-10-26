import React from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  DateRangePicker,
  ThemeProvider,
  type DateRangePickerProps,
  type DateRangeValue,
} from "@kozmos-ds/react";

/**
 * DateRangePicker in the built package, for
 * scripts/check-date-range-picker.mjs: one range per mount, in a frame of
 * the given width, between two buttons, with every range it reports kept on
 * window.dateRange. `controlled` holds the range in state, as a filter bar
 * would.
 */
interface Mount {
  props: Record<string, unknown>;
  dir?: "ltr" | "rtl";
  width?: number;
  controlled?: DateRangeValue;
}

let root: Root | null = null;
const state = {
  values: [] as DateRangeValue[],
  opens: [] as boolean[],
  mount({ props, dir = "ltr", width = 680, controlled }: Mount) {
    root?.unmount();
    state.values = [];
    state.opens = [];
    root = createRoot(document.getElementById("fixture")!);
    function Range() {
      const [value, setValue] = React.useState<DateRangeValue>(
        controlled ?? {},
      );
      return (
        <DateRangePicker
          label="Stay"
          {...(props as DateRangePickerProps)}
          {...(controlled === undefined ? {} : { value })}
          onValueChange={(next) => {
            state.values.push(next);
            if (controlled !== undefined) setValue(next);
          }}
          onOpenChange={(open) => state.opens.push(open)}
        />
      );
    }
    root.render(
      <ThemeProvider theme="light" dir={dir}>
        <button type="button">before</button>
        <div data-testid="frame" style={{ width, margin: "0 8px" }}>
          <Range />
        </div>
        <button type="button">after</button>
      </ThemeProvider>,
    );
  },
};

declare global {
  interface Window {
    dateRange: typeof state;
  }
}
window.dateRange = state;
