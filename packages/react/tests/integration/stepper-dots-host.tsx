import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { Stepper, ThemeProvider, type StepperProps } from "@kozmos-ds/react";

/**
 * Stepper's dots in the built package, for scripts/check-stepper-dots.mjs
 * (GAP-191): a five-step tour on the second step, on the surface named, in
 * a provider of the given theme. The page is the provider's background; a
 * tour's step card is a popover; muted is the quiet fill a card can carry.
 */
interface Mount {
  theme: "light" | "dark";
  surface: "page" | "popover" | "muted";
  currentStep?: number;
  positionLabel?: StepperProps["positionLabel"] | "function";
  /** Inside the config's reduced motion, as a DesignConfig provider marks it. */
  configReduced?: boolean;
}

const surfaces = {
  page: "bg-background",
  popover: "bg-popover",
  muted: "bg-muted",
};

let root: Root | null = null;
function mount({
  theme,
  surface,
  currentStep = 1,
  positionLabel,
  configReduced = false,
}: Mount) {
  root?.unmount();
  root = createRoot(document.getElementById("fixture")!);
  flushSync(() =>
    root!.render(
      <ThemeProvider theme={theme}>
        <div
          id="surface"
          className={surfaces[surface]}
          style={{ padding: 24, width: 320 }}
          data-kozmos-motion={configReduced ? "reduced" : undefined}
        >
          <Stepper
            id="stepper"
            variant="dots"
            steps={["Search", "Route", "Floors", "Share", "Go"]}
            currentStep={currentStep}
            positionLabel={
              positionLabel === "function"
                ? (step, count) => `Paso ${step} de ${count}`
                : positionLabel
            }
          />
        </div>
      </ThemeProvider>,
    ),
  );
}

declare global {
  interface Window {
    stepperDots: { mount: typeof mount };
  }
}
window.stepperDots = { mount };
