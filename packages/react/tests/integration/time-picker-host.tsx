import React from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  TimePicker,
  ThemeProvider,
  type TimePickerProps,
} from "@kozmos-ds/react";

/**
 * TimePicker in the built package, for scripts/check-time-picker.mjs: one
 * field per mount, in a provider of the given theme and direction, between
 * two buttons, with every change it reports kept on window.timePicker.
 * `controlled` holds the value in state, as a product's form would.
 */
interface Mount {
  props: Record<string, unknown>;
  theme?: "light" | "dark";
  dir?: "ltr" | "rtl";
  controlled?: string;
}

let root: Root | null = null;
const state = {
  changes: [] as string[],
  opens: [] as boolean[],
  mount({ props, theme = "light", dir = "ltr", controlled }: Mount) {
    root?.unmount();
    state.changes = [];
    state.opens = [];
    root = createRoot(document.getElementById("fixture")!);
    function Field() {
      const [value, setValue] = React.useState(controlled ?? "");
      return (
        <TimePicker
          label="Opening time"
          {...(props as TimePickerProps)}
          {...(controlled === undefined ? {} : { value })}
          onChange={(event) => {
            state.changes.push(event.target.value);
            if (controlled !== undefined) setValue(event.target.value);
          }}
          onOpenChange={(open) => state.opens.push(open)}
        />
      );
    }
    root.render(
      <ThemeProvider theme={theme} dir={dir}>
        <button type="button">before</button>
        <div data-testid="frame" style={{ width: 320, margin: "0 24px" }}>
          <Field />
        </div>
        <button type="button">after</button>
      </ThemeProvider>,
    );
  },
};

declare global {
  interface Window {
    timePicker: typeof state;
  }
}
window.timePicker = state;
