import React from "react";
import { createRoot } from "react-dom/client";
import {
  Combobox,
  Listbox,
  MultiSelect,
  ThemeProvider,
  type ComboboxOption,
} from "@kozmos-ds/react";

/**
 * Options with and without media (decision 215) in the built package, for
 * scripts/check-option-media.mjs: a Listbox, and a Combobox and a
 * MultiSelect whose lists open when their fields are focused.
 */
const options: ComboboxOption[] = [
  { value: "plain", label: "Plain" },
  { value: "acme", label: "Acme Airport", media: { initials: "AA" } },
  { value: "pointr", label: "Pointr Cloud", media: {}, trailing: "3 sites" },
  { value: "described", label: "Described", description: "A second line" },
  {
    value: "both",
    label: "Both",
    description: "A second line",
    media: { initials: "BO" },
  },
];

createRoot(document.getElementById("fixture")!).render(
  <ThemeProvider theme="light">
    <div style={{ width: 320, margin: 24, display: "grid", gap: 24 }}>
      <Listbox aria-label="Clients" options={options} />
      <div data-testid="combobox">
        <Combobox label="Client" options={options} />
      </div>
      <div data-testid="multiselect">
        <MultiSelect label="Clients" options={options} />
      </div>
    </div>
  </ThemeProvider>,
);
