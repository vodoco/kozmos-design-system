import { createRoot, type Root } from "react-dom/client";
import {
  Combobox,
  LanguageSwitcher,
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
 * The list rows of Combobox, MultiSelect, Select, Listbox and the SDK's
 * LanguageSwitcher (Select's items) in the built
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
  part: "combobox" | "multiselect" | "select" | "listbox" | "languageswitcher";
  theme: "light" | "dark";
  density: "touch" | "compact";
}

let root: Root | null = null;
function mount({ part, theme, density }: Mount) {
  root?.unmount();
  root = createRoot(document.getElementById("fixture")!);
  root.render(
    <ThemeProvider theme={theme} density={density}>
      {/* LanguageSwitcher opens its list above it (decision 77): room for it. */}
      <div
        data-testid="frame"
        style={{
          width: 320,
          padding: 24,
          paddingTop: part === "languageswitcher" ? 280 : 24,
        }}
      >
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
        {part === "languageswitcher" && (
          <LanguageSwitcher
            label="Language"
            languages={options.map(({ value, label }) => ({
              id: value,
              label,
            }))}
            selectedLocale="lisbon"
            onLocaleRequest={() => {}}
          />
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
