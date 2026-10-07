import { createRoot } from "react-dom/client";
import {
  AdaptiveMapShell,
  MapAttribution,
  Button,
  ThemeProvider,
} from "@kozmos-ds/react";
import type { AdaptiveMapLayoutSnapshot, PanelDetent } from "@kozmos-ds/react";
interface Config {
  width?: number;
  height?: number;
  dir?: "ltr" | "rtl";
  panel?: boolean;
  large?: boolean;
  keyboard?: number;
  credits?: boolean;
  long?: boolean;
  detent?: PanelDetent;
  tallBrand?: boolean;
  corners?: boolean;
  panelPlacement?: "start" | "end";
  /** A top bar this tall, as an opened direction card is. */
  barHeight?: number;
  /** The Pointr logo alone, with no third-party credits. */
  brandOnly?: boolean;
}
const root = createRoot(document.getElementById("root")!);
declare global {
  interface Window {
    renderAttributionShell: (config: Config) => void;
    attributionLayout: AdaptiveMapLayoutSnapshot;
  }
}
window.renderAttributionShell = ({
  width = 390,
  height = 720,
  dir = "ltr",
  panel = false,
  large = false,
  keyboard = 0,
  credits = true,
  long = false,
  detent,
  tallBrand = false,
  corners = true,
  panelPlacement = "end",
  barHeight,
  brandOnly = false,
}) =>
  root.render(
    <ThemeProvider dir={dir}>
      <AdaptiveMapShell
        style={{ width, height }}
        data-testid="shell"
        panelPlacement={panelPlacement}
        map={<div />}
        topBar={
          barHeight ? (
            <div data-testid="bar" style={{ height: barHeight }}>
              Opened card
            </div>
          ) : (
            <Button>Search</Button>
          )
        }
        controls={<Button>Info</Button>}
        controlsBottomStart={
          corners ? <Button data-testid="start">Language</Button> : undefined
        }
        controlsBottomEnd={
          corners ? (
            <Button data-testid="end" style={{ height: 140 }}>
              Floor and zoom
            </Button>
          ) : undefined
        }
        attribution={
          credits ? (
            <MapAttribution
              brand={
                tallBrand ? (
                  <div style={{ height: 180 }}>Custom brand</div>
                ) : undefined
              }
              credits={
                brandOnly
                  ? []
                  : [
                      {
                        id: "a",
                        label: long
                          ? "Outdoor map contributors ".repeat(8)
                          : "© Indoor and outdoor contributors",
                        href: "https://example.com",
                      },
                    ]
              }
            />
          ) : undefined
        }
        panel={panel ? <div style={{ height: 900 }}>Details</div> : undefined}
        panelDetent={detent ?? (large ? "large" : "collapsed")}
        safeAreaInsets={{ bottom: keyboard }}
        onLayoutChange={(value) => {
          window.attributionLayout = value;
        }}
      />
    </ThemeProvider>,
  );
