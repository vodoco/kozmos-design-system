import { createRoot } from "react-dom/client";
import { ClientAppBanner, ThemeProvider } from "@kozmos-ds/react";

/**
 * A raster icon of the given size, as Pointr Cloud serves a customer's: a
 * PNG, green on its start half and blue on the rest. Drawn here, not an SVG:
 * WebKit reports an SVG's natural size as the size it is drawn at.
 */
const icon = (width: number, height: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#1d4ed8";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#16a34a";
  context.fillRect(0, 0, width / 2, height);
  return canvas.toDataURL("image/png");
};

/** A square icon far larger than it is drawn, one twice as wide as tall, and none. */
const ICONS = {
  large: icon(1024, 1024),
  wide: icon(200, 100),
  none: undefined,
} as const;

interface Config {
  dir?: "ltr" | "rtl";
  icon?: keyof typeof ICONS;
  dismiss?: boolean;
}
declare global {
  interface Window {
    renderClientAppBanner: (config: Config) => void;
  }
}
const root = createRoot(document.getElementById("root")!);
window.renderClientAppBanner = ({
  dir = "ltr",
  icon = "large",
  dismiss = true,
}) =>
  root.render(
    <ThemeProvider dir={dir}>
      {/* The top bar's own inset, as AdaptiveMapShell leaves it on a phone. */}
      <div style={{ padding: 16 }}>
        <ClientAppBanner
          promotionText="Northfield's own app"
          appName="Northfield Airport"
          description="Live gate changes, step-free routes and your boarding pass, on your phone."
          appIconSrc={ICONS[icon]}
          actionLabel="Get the app"
          onAction={() => {}}
          onDismiss={dismiss ? () => {} : undefined}
        />
      </div>
    </ThemeProvider>,
  );
