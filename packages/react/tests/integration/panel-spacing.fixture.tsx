import { createRoot } from "react-dom/client";
import {
  AdaptiveMapShell,
  AICompanionPanel,
  BrowseCategoriesPanel,
  POIDetailPanel,
  ThemeProvider,
} from "@kozmos-ds/react";

type Config = {
  side: boolean;
  header: boolean;
  grip: boolean;
  long: boolean;
  details: boolean;
  rtl: boolean;
  instance?: string;
  /** The assistant as the panel's content (GAP-121). */
  assistant?: boolean;
  /**
   * The sheet rests at medium, with large too under a grip, rather than
   * fitting its content. The assistant fills its panel, so a sheet fitted to
   * it has no height of its own: Chromium and Firefox keep the 160 they first
   * measured, while WebKit 26.0 grows it 16px a measurement to its largest
   * height, where the fitted and large detents fold into one and the grip
   * goes.
   */
  medium?: boolean;
  /** The assistant alone, outside any shell. */
  standalone?: boolean;
  /** The category browser, a part with an end padding of its own. */
  browse?: boolean;
};
declare global {
  interface Window {
    renderPanelSpacing: (config: Config) => void;
  }
}
const root = createRoot(document.getElementById("root")!);
const assistant = (
  <AICompanionPanel open title="Assistant" onClose={() => {}}>
    <div style={{ height: 300 }}>Thread</div>
  </AICompanionPanel>
);
window.renderPanelSpacing = (config) =>
  root.render(
    <ThemeProvider dir={config.rtl ? "rtl" : "ltr"} defaultTheme="light">
      {config.standalone ? (
        <div data-standalone style={{ width: 390, height: 500 }}>
          {assistant}
        </div>
      ) : (
        <AdaptiveMapShell
          key={config.instance ?? JSON.stringify(config)}
          style={{ width: config.side ? 900 : 390, height: 800 }}
          map={<div>Map</div>}
          panelPresentation={config.side ? "side" : "bottom"}
          panelDetents={
            config.medium
              ? config.grip
                ? ["medium", "large"]
                : ["medium"]
              : config.grip
                ? ["content", "large"]
                : ["content"]
          }
          panelDetent={config.medium ? "medium" : "content"}
          panelHeader={
            config.header ? (
              <div data-spacing-header style={{ height: 44 }}>
                Search places
              </div>
            ) : undefined
          }
          panel={
            config.assistant ? (
              assistant
            ) : config.browse ? (
              <BrowseCategoriesPanel
                categories={Array.from({ length: 8 }, (_, index) => ({
                  id: `category-${index}`,
                  label: `Category ${index + 1}`,
                }))}
                onSelect={() => {}}
                renderIcon={() => <span style={{ width: 24, height: 24 }} />}
              />
            ) : config.details ? (
              <POIDetailPanel
                poi={{
                  id: "cafe",
                  name: "Harbour Coffee",
                  actions: [],
                  media: [],
                }}
                actionLabels={{
                  navigate: "Go",
                  favourite: "Favourite",
                  bookmark: "Save",
                  share: "Share",
                  order: "Order",
                }}
                onAction={() => {}}
                onClose={() => {}}
                presentation="sheet"
              />
            ) : (
              <div
                data-spacing-content
                style={{ height: config.long ? 1200 : 300 }}
              >
                First result
              </div>
            )
          }
        />
      )}
    </ThemeProvider>,
  );
