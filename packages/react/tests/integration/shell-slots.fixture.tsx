import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Accessibility, InfoCircle, LogOut01 } from "@kozmos-ds/icons";
import {
  AdaptiveMapShell,
  Button,
  FloorSelector,
  MapAttribution,
  MapControlButton,
  MapControlsGroup,
  MapStatusPill,
  ThemeProvider,
} from "@kozmos-ds/react";
import type { AdaptiveMapLayoutSnapshot, PanelDetent } from "@kozmos-ds/react";

/**
 * AdaptiveMapShell with every map-area slot filled: the top corners (Exit
 * building at the start, information at the end), the status between the
 * bottom corners, the corners (Step-free at the start, the floors and zoom at
 * the end), the credits, a top bar and a panel. scripts/check-shell-slots.mjs
 * measures it.
 */
type Config = {
  dir: "ltr" | "rtl";
  density: "touch" | "compact";
  width: number;
  height: number;
  panel?: boolean;
  detent?: PanelDetent;
  topBar?: boolean;
  legacy?: boolean;
  /** The status's words; "" keeps the pill rendered with none. */
  status?: string;
  topStart?: boolean;
  topEnd?: boolean;
  /** A wide top-end corner, to make the two top corners wrap. */
  wideTopEnd?: boolean;
  attribution?: boolean;
  /** A wide start corner, which leaves no middle slot in the bottom row. */
  wideStart?: boolean;
  floors?: number;
  padCamera?: boolean;
  panelPlacement?: "start" | "end";
};
declare global {
  interface Window {
    renderShellSlots: (config: Config) => void;
    shellLayout: AdaptiveMapLayoutSnapshot;
    shellNotifications: number;
    exits: number;
  }
}

function Fixture({
  dir,
  density,
  width,
  height,
  panel = false,
  detent = { height: 120 },
  topBar = true,
  legacy = false,
  status,
  topStart = true,
  topEnd = true,
  wideTopEnd = false,
  attribution = true,
  wideStart = false,
  floors = 3,
  padCamera = false,
  panelPlacement = "end",
}: Config) {
  const [floor, setFloor] = useState("1");
  return (
    <ThemeProvider dir={dir} density={density} defaultTheme="light">
      <AdaptiveMapShell
        data-testid="shell"
        style={{ width, height }}
        map={
          <button
            aria-label="Map surface"
            style={{ position: "absolute", inset: 0 }}
          >
            Map
          </button>
        }
        topBar={
          topBar ? <Button style={{ height: 44 }}>Search</Button> : undefined
        }
        controls={
          legacy ? (
            <MapControlButton
              icon={<InfoCircle className="h-5 w-5" />}
              label="Legacy control"
              onClick={() => undefined}
            />
          ) : undefined
        }
        controlsTopStart={
          topStart ? (
            <MapControlButton
              icon={<LogOut01 className="h-5 w-5" />}
              label="Exit Main Mall"
              presentation="labelled"
              onClick={() => {
                window.exits++;
              }}
            />
          ) : undefined
        }
        controlsTopEnd={
          topEnd ? (
            <MapControlButton
              icon={<InfoCircle className="h-5 w-5" />}
              label={wideTopEnd ? "Information about this venue" : "Info"}
              presentation={wideTopEnd ? "labelled" : "icon-only"}
              onClick={() => undefined}
            />
          ) : undefined
        }
        status={
          status === undefined ? undefined : (
            <MapStatusPill tone="progress">{status}</MapStatusPill>
          )
        }
        attribution={
          attribution ? (
            <MapAttribution
              credits={[{ id: "owner", label: "© Example indoor data" }]}
            />
          ) : undefined
        }
        controlsBottomStart={
          <MapControlButton
            icon={<Accessibility className="h-5 w-5" />}
            label={wideStart ? "Step-free routes only" : "Step-free"}
            presentation={wideStart ? "labelled" : "icon-only"}
            pressed={false}
            onClick={() => undefined}
          />
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
              variant="collapsible"
              floors={Array.from({ length: floors }, (_, i) => ({
                id: String(i),
                shortLabel: String(i),
                label: "Level " + i,
              }))}
              selectedFloor={floor}
              onFloorSelect={setFloor}
            />
            <MapControlsGroup
              onZoomIn={() => undefined}
              onZoomOut={() => undefined}
            />
          </div>
        }
        panel={panel ? <div style={{ height: 160 }}>Details</div> : undefined}
        panelPlacement={panelPlacement}
        panelDetents={[detent]}
        controlsPadCamera={padCamera}
        onLayoutChange={(layout) => {
          window.shellLayout = layout;
          window.shellNotifications++;
        }}
      />
    </ThemeProvider>
  );
}

const root = createRoot(document.getElementById("root")!);
window.shellNotifications = 0;
window.exits = 0;
window.renderShellSlots = (config) => root.render(<Fixture {...config} />);
