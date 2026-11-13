import { createRoot } from "react-dom/client";
import {
  Checkbox,
  Label,
  PersonaMark,
  PersonaMarkGroup,
  Text,
  ThemeProvider,
} from "@kozmos-ds/react";

/**
 * PersonaMark in the built package, for scripts/check-persona-mark.mjs
 * (GAP-106): a checkbox labelled with a persona's mark and name, a mark
 * standing alone, and a tree row's group, light and dark.
 */
function Case({ name }: { name: string }) {
  return (
    <div data-case={name} style={{ display: "grid", gap: 8, padding: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Checkbox id={`${name}-customer`} wrapperClassName="w-auto" />
        <Label htmlFor={`${name}-customer`} data-part="label">
          <PersonaMark color="#FF9800" data-part="beside" /> Customer
        </Label>
      </div>
      <Text size="sm" data-part="row">
        Gate A12{" "}
        <PersonaMarkGroup
          data-part="group"
          personas={[
            { name: "Customer", color: "#FF9800" },
            { name: "Visitor", color: "#2196F3" },
            { name: "Staff", color: "#4CAF50" },
          ]}
        />
      </Text>
      <PersonaMark color="#2196F3" name="Visitor" data-part="alone" />
    </div>
  );
}

function Fixture() {
  return (
    <>
      <ThemeProvider theme="light">
        <Case name="light" />
      </ThemeProvider>
      <ThemeProvider theme="dark">
        <Case name="dark" />
      </ThemeProvider>
    </>
  );
}

createRoot(document.getElementById("fixture")!).render(<Fixture />);
