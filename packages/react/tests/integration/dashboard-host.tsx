import { createRoot } from "react-dom/client";
import { Button, ThemeProvider } from "@kozmos-ds/react";
import {
  BrandLoader,
  KeyValueList,
  MapEditToolbar,
  PropertyPicker,
  type KeyValueRow,
  type MapEditToolbarItem,
} from "@kozmos-ds/react/dashboard";
import {
  Circle,
  Code02,
  Divider,
  FlipBackward,
  FlipForward,
  MarkerPin01,
  Pentagon,
  RefreshCcw01,
  Ruler,
  ScissorsCut01,
  Transform,
  XSquare,
} from "@kozmos-ds/icons";

/**
 * The Dashboard entry in the built package, for scripts/check-dashboard-css.mjs
 * (decision 183): a BrandLoader in place, light and dark, and one over the
 * page, drawn from @kozmos-ds/react/dashboard with dashboard.css loaded after
 * style.css.
 */
function Host() {
  return (
    <>
      <ThemeProvider defaultTheme="light">
        <BrandLoader data-testid="light" label="Loading Pointr Cloud" />
      </ThemeProvider>
      <ThemeProvider defaultTheme="dark">
        <BrandLoader data-testid="dark" label="Loading Pointr Cloud" />
      </ThemeProvider>
      <ThemeProvider defaultTheme="light">
        <Button data-testid="under">Open</Button>
        <BrandLoader data-testid="overlay" label="Loading" overlay />
      </ThemeProvider>
    </>
  );
}

// A long toolbar: three groups, so two dividers with their margins.
const TOOLS: MapEditToolbarItem[] = [
  { type: "tool", id: "polygon", label: "Polygon", icon: Pentagon },
  { type: "tool", id: "point", label: "Point", icon: MarkerPin01 },
  { type: "tool", id: "circle", label: "Circle", icon: Circle },
  { type: "divider" },
  { type: "action", id: "json", label: "JSON", icon: Code02 },
  { type: "divider" },
  { type: "tool", id: "adjust", label: "Adjust", icon: Transform },
  { type: "tool", id: "cut", label: "Cut-out", icon: ScissorsCut01 },
  { type: "tool", id: "split", label: "Split", icon: Divider },
  { type: "action", id: "straighten", label: "Straighten", icon: Ruler },
  { type: "divider" },
  { type: "action", id: "undo", label: "Undo", icon: FlipBackward },
  { type: "action", id: "redo", label: "Redo", icon: FlipForward },
  { type: "action", id: "clear", label: "Clear", icon: XSquare },
  { type: "action", id: "reset", label: "Reset", icon: RefreshCcw01 },
];

const ROWS: KeyValueRow[] = [
  { id: "a", name: "vendor", type: "text", value: "Acme" },
  { id: "b", name: "public", type: "boolean", value: true },
];

/**
 * The other modules, drawn when the check sets `window.__dashboardModules`
 * (the loader's overlay above would make them inert): MapEditToolbar on maps
 * 640, 700 and 760 wide, a PropertyPicker, and a KeyValueList outside and
 * inside a <form>.
 */
function Modules() {
  return (
    <ThemeProvider defaultTheme="light">
      {[640, 700, 760].map((width) => (
        <div key={width} data-testid={`toolbar-${width}`} style={{ width }}>
          <MapEditToolbar label="Geometry tools" items={TOOLS} value="adjust" />
        </div>
      ))}
      <div style={{ width: 360 }}>
        <PropertyPicker
          data-testid="picker"
          properties={[{ id: "p", name: "Vendor", type: "Text" }]}
        />
      </div>
      <div data-testid="list-outside" style={{ width: 480 }}>
        <KeyValueList defaultValue={ROWS} />
      </div>
      <form data-testid="list-inside" style={{ width: 480 }}>
        <KeyValueList defaultValue={ROWS} />
      </form>
    </ThemeProvider>
  );
}

createRoot(document.getElementById("fixture")!).render(
  (window as { __dashboardModules?: boolean }).__dashboardModules ? (
    <Modules />
  ) : (
    <Host />
  ),
);
