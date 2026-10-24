import { createRoot, type Root } from "react-dom/client";
import { Combobox, MultiSelect, ThemeProvider } from "@kozmos-ds/react";

/**
 * Combobox's and MultiSelect's clear and open buttons in the built package,
 * for scripts/check-field-actions.mjs: a Combobox with a choice, a
 * MultiSelect with one chip on one line, and a narrow MultiSelect whose
 * three chips wrap, in a provider of the given theme, density and direction.
 */
const options = [
  { value: "lisbon", label: "Lisbon" },
  { value: "porto", label: "Porto" },
  { value: "faro", label: "Faro" },
];

interface Mount {
  theme: "light" | "dark";
  density: "touch" | "compact";
  dir: "ltr" | "rtl";
}

let root: Root | null = null;
function mount({ theme, density, dir }: Mount) {
  root?.unmount();
  root = createRoot(document.getElementById("fixture")!);
  root.render(
    <ThemeProvider theme={theme} density={density} dir={dir}>
      <div style={{ display: "grid", gap: 24, width: 320, padding: 24 }}>
        <div data-part="combobox">
          <Combobox
            label="City"
            options={options}
            defaultValue="lisbon"
            clearable
          />
        </div>
        <div data-part="multiselect">
          <MultiSelect
            label="Cities"
            options={options}
            defaultValue={["lisbon"]}
          />
        </div>
        <div data-part="multiselect-wrapped" style={{ width: 200 }}>
          <MultiSelect
            label="Stops"
            options={options}
            defaultValue={["lisbon", "porto", "faro"]}
          />
        </div>
      </div>
    </ThemeProvider>,
  );
}

declare global {
  interface Window {
    fieldActions: { mount: typeof mount };
  }
}
window.fieldActions = { mount };
