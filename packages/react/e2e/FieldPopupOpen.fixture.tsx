import React from "react";
import { ThemeProvider } from "../src/components/ThemeProvider/ThemeProvider";
import { Combobox } from "../src/components/Combobox/Combobox";
import { MultiSelect } from "../src/components/MultiSelect/MultiSelect";

const options = [
  { value: "filters", label: "Filters", description: "Show saved filters" },
  { value: "layers", label: "Layers", description: "Map and data layers" },
  { value: "routes", label: "Routes", description: "Route overlays" },
  { value: "alerts", label: "Alerts", description: "Operational notices" },
];

/** A MultiSelect and a Combobox, as their Default stories draw them. */
export function FieldPopupOpenFixture({
  part,
}: {
  part: "MultiSelect" | "Combobox";
}) {
  return (
    <ThemeProvider theme="light">
      <div data-react={React.version} style={{ width: 384, margin: 48 }}>
        {part === "MultiSelect" ? (
          <MultiSelect label="Tools" options={options} />
        ) : (
          <Combobox label="Tools" options={options} />
        )}
      </div>
    </ThemeProvider>
  );
}
