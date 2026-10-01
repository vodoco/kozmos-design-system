import React from "react";
import { createRoot } from "react-dom/client";
import {
  AdaptiveMapShell,
  LanguageSwitcher,
  ThemeProvider,
} from "@kozmos-ds/react";

type Config = {
  dir?: "ltr" | "rtl";
  locale?: string;
  height?: number;
  pending?: boolean;
  long?: boolean;
  width?: number;
  panelHeight?: number;
};
declare global {
  interface Window {
    renderLanguage: (config: Config) => void;
    localeRequests: string[];
  }
}
window.localeRequests = [];
const languages = [
  { id: "en", label: "English" },
  { id: "de", label: "Deutsch" },
  { id: "fr", label: "Français", disabled: true },
  { id: "ar", label: "العربية", direction: "rtl" as const },
];
const root = createRoot(document.getElementById("root")!);
window.renderLanguage = ({
  dir = "ltr",
  locale = "en",
  height = 400,
  pending = false,
  long = false,
  width = 360,
  panelHeight,
}) =>
  root.render(
    <ThemeProvider dir={dir}>
      <AdaptiveMapShell
        style={{ width, height }}
        panelPlacement="start"
        panel={
          panelHeight === undefined ? undefined : (
            <div style={{ height: panelHeight }}>Browse content</div>
          )
        }
        map={
          <div data-map-surface="" style={{ position: "absolute", inset: 0 }} />
        }
        topBar={
          <div data-map-search="" style={{ height: 44 }}>
            Search
          </div>
        }
        controlsBottomStart={
          <LanguageSwitcher
            selectedLocale={locale}
            pending={pending}
            languages={
              long
                ? Array.from({ length: 40 }, (_, i) => ({
                    id: `en-x-${i}`,
                    label: `Language ${i}`,
                  }))
                : languages
            }
            onLocaleRequest={(value) => window.localeRequests.push(value)}
          />
        }
      />
    </ThemeProvider>,
  );
