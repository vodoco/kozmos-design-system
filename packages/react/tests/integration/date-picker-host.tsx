import React from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  DatePicker,
  ThemeProvider,
  type DatePickerProps,
} from "@kozmos-ds/react";

/**
 * DatePicker in the built package, for scripts/check-date-picker.mjs: one
 * field per mount, in a provider of the given theme and direction, between
 * two buttons, with every change it reports kept on window.datePicker.
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
        <DatePicker
          label="Visit date"
          {...(props as DatePickerProps)}
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
    datePicker: typeof state;
  }
}
window.datePicker = state;
