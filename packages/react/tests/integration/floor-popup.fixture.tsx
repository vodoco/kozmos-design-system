import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AdaptiveMapShell,
  FloorSelector,
  ThemeProvider,
} from "@kozmos-ds/react";

type Config = {
  height: number;
  dir?: "ltr" | "rtl";
  count?: number;
  width?: number;
  panelHeight?: number;
};
declare global {
  interface Window {
    renderFloorPopup: (config: Config) => void;
  }
}
function Fixture({
  height,
  dir = "ltr",
  count = 40,
  width = 320,
  panelHeight,
}: Config) {
  const [floor, setFloor] = useState("20");
  return (
    <ThemeProvider dir={dir}>
      <AdaptiveMapShell
        style={{ width, height }}
        panelPlacement="end"
        panel={
          panelHeight ? (
            <div style={{ height: panelHeight }}>Details</div>
          ) : undefined
        }
        map={
          <button
            aria-label="Map surface"
            style={{ position: "absolute", inset: 0 }}
          >
            Map
          </button>
        }
        topBar={<button style={{ height: 44 }}>Search</button>}
        controlsBottomEnd={
          <FloorSelector
            variant="collapsible"
            floors={Array.from({ length: count }, (_, i) => ({
              id: String(i),
              shortLabel: String(i),
              label: "Level " + i,
            }))}
            selectedFloor={floor}
            onFloorSelect={setFloor}
          />
        }
      />
    </ThemeProvider>
  );
}
const root = createRoot(document.getElementById("root")!);
window.renderFloorPopup = (config) =>
  root.render(<Fixture key={config.dir} {...config} />);
