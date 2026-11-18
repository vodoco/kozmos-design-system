import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { OTPInput, ThemeProvider, type OTPInputProps } from "@kozmos-ds/react";

/**
 * OTPInput in the built package, for scripts/check-otp-input.mjs: one field
 * per mount, between two buttons, with every change it reports kept on
 * window.otpInput. `controlled` holds the code in state, as a form would.
 */
interface Mount {
  props: Record<string, unknown>;
  controlled?: string;
}

let root: Root | null = null;
const state = {
  changes: [] as string[],
  mount({ props, controlled }: Mount) {
    root?.unmount();
    state.changes = [];
    root = createRoot(document.getElementById("fixture")!);
    function Field() {
      const [value, setValue] = React.useState(controlled ?? "");
      return (
        <OTPInput
          label="Code"
          {...(props as OTPInputProps)}
          {...(controlled === undefined ? {} : { value })}
          onChange={(next) => {
            state.changes.push(next);
            if (controlled !== undefined) setValue(next);
          }}
        />
      );
    }
    root.render(
      <ThemeProvider theme="light">
        <button type="button">before</button>
        <div style={{ width: 360, margin: "0 24px" }}>
          <Field />
        </div>
        <button type="button">after</button>
      </ThemeProvider>,
    );
  },
};

declare global {
  interface Window {
    otpInput: typeof state;
  }
}
window.otpInput = state;
