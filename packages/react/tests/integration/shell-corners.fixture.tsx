import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AdaptiveMapShell,
  Button,
  FloorSelector,
  MapControlsGroup,
  ThemeProvider,
} from "@kozmos-ds/react";
import type { AdaptiveMapLayoutSnapshot } from "@kozmos-ds/react";

type Config = {
  dir: "ltr" | "rtl";
  width: number;
  height: number;
  panel?: boolean;
  keyboard?: number;
  legacy?: boolean;
  padCamera?: boolean;
  hideStart?: boolean;
  contentHeight?: number;
  controlsLabel?: string;
  bottomControlsLabel?: string;
};
declare global {
  interface Window {
    renderShellCorners: (config: Config) => void;
    shellLayout: AdaptiveMapLayoutSnapshot;
    shellNotifications: number;
  }
}
function Fixture({
  dir,
  width,
  height,
  panel,
  keyboard = 0,
  legacy,
  padCamera = false,
  hideStart = false,
  contentHeight = 100,
  controlsLabel,
  bottomControlsLabel,
}: Config) {
  const [presses, setPresses] = useState(0);
  const [floor, setFloor] = useState("1");
  return (
    <ThemeProvider dir={dir} defaultTheme="light">
      <AdaptiveMapShell
        style={{ width, height }}
        controlsLabel={controlsLabel}
        bottomControlsLabel={bottomControlsLabel}
        map={
          <button
            aria-label="Map surface"
            style={{ position: "absolute", inset: 0 }}
          >
            Map
          </button>
        }
        topBar={<Button style={{ height: 44 }}>Top bar</Button>}
        controls={legacy ? <Button>Legacy controls</Button> : undefined}
        panel={
          panel ? (
            <div style={{ height: contentHeight }}>Details</div>
          ) : undefined
        }
        panelDetents={[{ height: 100 }]}
        safeAreaInsets={{ bottom: keyboard }}
        bottomControlsPadCamera={padCamera}
        onLayoutChange={(layout) => {
          window.shellLayout = layout;
          window.shellNotifications++;
        }}
        controlsBottomStart={
          !hideStart && (
            <Button
              style={{ width: 220 }}
              onClick={() => setPresses(presses + 1)}
            >
              Start-side probe: {presses}
            </Button>
          )
        }
        controlsBottomEnd={
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 16,
            }}
          >
            <FloorSelector
              floors={["2", "1", "G"]}
              selectedFloor={floor}
              onFloorSelect={setFloor}
              variant="compact-stepper"
            />
            <MapControlsGroup onZoomIn={() => {}} onZoomOut={() => {}} />
          </div>
        }
      />
    </ThemeProvider>
  );
}
const root = createRoot(document.getElementById("root")!);
window.shellNotifications = 0;
window.renderShellCorners = (config) => root.render(<Fixture {...config} />);
