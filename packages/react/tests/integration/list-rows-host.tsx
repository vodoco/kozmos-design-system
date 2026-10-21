import { createRoot, type Root } from "react-dom/client";
import {
  Combobox,
  Listbox,
  MultiSelect,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ThemeProvider,
} from "@kozmos-ds/react";

/**
 * The list rows of Combobox, MultiSelect, Select and Listbox in the built
 * package, for scripts/check-list-rows.mjs: one part per mount, in a
 * provider of the given theme and density, with Lisbon chosen.
 */
// Every label holds the chosen one's, so Combobox's filter, which reads the
// chosen label, still shows all three.
const options = [
  { value: "lisbon", label: "Lisbon" },
  { value: "oriente", label: "Lisbon Oriente" },
  { value: "rossio", label: "Lisbon Rossio" },
];

interface Mount {
  part: "combobox" | "multiselect" | "select" | "listbox";
  theme: "light" | "dark";
  density: "touch" | "compact";
}

let root: Root | null = null;
function mount({ part, theme, density }: Mount) {
  root?.unmount();
  root = createRoot(document.getElementById("fixture")!);
  root.render(
    <ThemeProvider theme={theme} density={density}>
      <div data-testid="frame" style={{ width: 320, padding: 24 }}>
        {part === "combobox" && (
          <Combobox label="City" options={options} defaultValue="lisbon" />
        )}
        {part === "multiselect" && (
          <MultiSelect
            label="Cities"
            options={options}
            defaultValue={["lisbon"]}
          />
        )}
        {part === "select" && (
          <Select defaultValue="lisbon">
            <SelectTrigger aria-label="City">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {part === "listbox" && (
          <Listbox aria-label="City" options={options} value="lisbon" />
        )}
      </div>
    </ThemeProvider>,
  );
}

declare global {
  interface Window {
    listRows: { mount: typeof mount };
  }
}
window.listRows = { mount };
