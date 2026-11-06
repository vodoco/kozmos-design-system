import { createRoot, type Root } from "react-dom/client";
import { Star01 } from "@kozmos-ds/icons";
import {
  Combobox,
  DatePicker,
  DesignConfigProvider,
  Input,
  MultiSelect,
  NumberInput,
  PasswordInput,
  ThemeProvider,
  TimePicker,
} from "@kozmos-ds/react";

/**
 * The buttons at a field's end in the built package, for
 * scripts/check-field-actions.mjs: a Combobox with a choice, a MultiSelect
 * with one chip on one line, and a narrow MultiSelect whose three chips
 * wrap; Input's toggle action, PasswordInput's reveal, DatePicker's and
 * TimePicker's trigger; a disabled Combobox and PasswordInput; a
 * PasswordInput under the design config's reduced motion; and NumberInput,
 * whose steps carry kozmos-field-action and keep their own hover, in a
 * provider of the given theme, density and direction.
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
        <div data-part="input">
          <Input
            label="Gate"
            action={{
              kind: "toggle",
              label: "Featured",
              icon: <Star01 aria-hidden="true" />,
              pressed: false,
              onPressedChange: () => {},
            }}
          />
        </div>
        <div data-part="password">
          <PasswordInput label="Password" defaultValue="kozmos" />
        </div>
        <div data-part="date">
          <DatePicker label="Date" />
        </div>
        <div data-part="time">
          <TimePicker label="Time" />
        </div>
        <div data-part="combobox-disabled">
          <Combobox label="Region" options={options} disabled />
        </div>
        <div data-part="password-disabled">
          <PasswordInput label="Locked" defaultValue="kozmos" disabled />
        </div>
        <div data-part="number">
          <NumberInput label="Count" defaultValue={3} />
        </div>
        <DesignConfigProvider initialConfig={{ motion: "reduced" }}>
          <div data-part="password-reduced">
            <PasswordInput label="Still" defaultValue="kozmos" />
          </div>
        </DesignConfigProvider>
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
