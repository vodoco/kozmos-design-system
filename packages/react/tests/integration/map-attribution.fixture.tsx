import { createRoot } from "react-dom/client";
import { MapAttribution, ThemeProvider } from "@kozmos-ds/react";
declare global {
  interface Window {
    renderAttribution: (
      dir?: "ltr" | "rtl",
      showBrand?: boolean,
      long?: boolean,
      customBrand?: boolean,
      appearance?: "map" | "surface",
    ) => void;
  }
}
const root = createRoot(document.getElementById("root")!);
window.renderAttribution = (
  dir = "ltr",
  showBrand = true,
  long = false,
  customBrand = true,
  appearance = "map",
) =>
  root.render(
    <ThemeProvider dir={dir}>
      <MapAttribution
        style={{ width: 240 }}
        showBrand={showBrand}
        appearance={appearance}
        brand={customBrand ? <span>Example venue</span> : undefined}
        credits={[
          { id: "owner", label: "© Indoor data" },
          {
            id: "provider",
            label: long ? "Contributor".repeat(30) : "Outdoor contributors",
            href: "https://example.com",
          },
        ]}
      />
    </ThemeProvider>,
  );
