import { createRoot } from "react-dom/client";
import {
  Combobox,
  type ComboboxOption,
  Listbox,
  MultiSelect,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  ThemeProvider,
} from "@kozmos-ds/react";

// GAP-192: options under their groups, in a browser
// (scripts/check-option-groups.mjs). Given out of order: the groups come in
// the order they first appear. `part` picks the widget; `select` draws
// Select's own SelectLabel, the label the groups' labels are drawn as.
const types: ComboboxOption[] = [
  { value: "office-desk", label: "Office Desk", group: "Interior Asset" },
  { value: "reception-desk", label: "Reception Desk", group: "POI" },
  { value: "hot-desk", label: "Hot Desk", group: "Interior Asset" },
  { value: "lift", label: "Lift" },
  { value: "standing-desk", label: "Standing Desk", group: "Interior Asset" },
];

const root = document.getElementById("root")!;
const part = root.dataset.part;

function Part() {
  if (part === "listbox") return <Listbox aria-label="Type" options={types} />;
  if (part === "multiselect")
    return <MultiSelect label="Types" options={types} />;
  if (part === "select")
    return (
      <Select defaultOpen>
        <SelectTrigger aria-label="Type">
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel data-select-label="">Interior Asset</SelectLabel>
            <SelectItem value="office-desk">Office Desk</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  return <Combobox label="Type" options={types} />;
}

createRoot(root).render(
  <ThemeProvider theme={root.dataset.theme === "dark" ? "dark" : "light"}>
    <main style={{ padding: 24, width: 360 }}>
      <Part />
    </main>
  </ThemeProvider>,
);
