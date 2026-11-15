import { createRoot, type Root } from "react-dom/client";
import { Chip, ChipGroup, MultiSelect, ThemeProvider } from "@kozmos-ds/react";

/**
 * Chips with labels longer than their room, in the built package, for
 * scripts/check-chip-shrink.mjs: MultiSelect in a 296px field (the
 * PropertyField story's at 320 wide, where the audit found a chip under the
 * clear button) and in a 200px one, chosen with long labels; and Chip on its
 * own, removable, pressable and plain, in a 120px box and in a 160px
 * ChipGroup. In a provider of the given density and direction.
 */
const options = [
  { value: "booking", label: "Booking required" },
  { value: "step-free", label: "Step-free access from the street entrance" },
  { value: "open", label: "Open 24 hours" },
];

interface Mount {
  density: "touch" | "compact";
  dir: "ltr" | "rtl";
}

let root: Root | null = null;
function mount({ density, dir }: Mount) {
  root?.unmount();
  root = createRoot(document.getElementById("fixture")!);
  root.render(
    <ThemeProvider theme="light" density={density} dir={dir}>
      <div style={{ display: "grid", gap: 24, padding: 12 }}>
        <div data-part="multiselect" style={{ width: 296 }}>
          <MultiSelect
            label="Amenities"
            options={options}
            defaultValue={["booking", "step-free", "open"]}
          />
        </div>
        <div data-part="multiselect-narrow" style={{ width: 200 }}>
          <MultiSelect
            label="Amenities"
            options={options}
            defaultValue={["step-free"]}
          />
        </div>
        <div data-part="chip-removable" style={{ width: 120 }}>
          <Chip onRemove={() => {}}>Booking required</Chip>
        </div>
        <div data-part="chip-pressable" style={{ width: 120 }}>
          <Chip onClick={() => {}}>Booking required</Chip>
        </div>
        <div data-part="chip-plain" style={{ width: 120 }}>
          <Chip>Booking required</Chip>
        </div>
        <div data-part="chip-group" style={{ width: 160 }}>
          <ChipGroup>
            <Chip onRemove={() => {}} selected>
              Step-free access from the street entrance
            </Chip>
            <Chip onRemove={() => {}}>Open 24 hours</Chip>
          </ChipGroup>
        </div>
      </div>
    </ThemeProvider>,
  );
}

declare global {
  interface Window {
    mountChips: (options: Mount) => void;
  }
}
window.mountChips = mount;
