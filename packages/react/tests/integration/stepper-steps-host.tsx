import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { Stepper, ThemeProvider, type StepperProps } from "@kozmos-ds/react";

/**
 * Stepper's steps as objects in the built package, for
 * scripts/check-stepper-steps.mjs (GAP-173, decision 119): Pointr Cloud's
 * building wizard, five steps on the third. The first is done by its place,
 * the second has an error, the third is current and working, the fourth is
 * ahead but open (`disabled: false`), and the fifth is ahead and closed.
 * Buttons sit before and after it, so the keyboard has somewhere to start
 * and to land.
 */
interface Mount {
  theme?: "light" | "dark";
  orientation?: StepperProps["orientation"];
  dir?: "ltr" | "rtl";
  density?: "touch" | "compact";
  /** Steps the visitor may go back to are buttons. */
  navigable?: boolean;
  /** Inside the config's reduced motion, as a DesignConfig provider marks it. */
  configReduced?: boolean;
}

export const WIZARD: StepperProps["steps"] = [
  "Building details",
  { label: "Levels", status: "error" },
  { label: "Alignment", status: "loading" },
  { label: "Fine-tune", disabled: false },
  "Preview",
];

declare global {
  interface Window {
    stepperSteps: { mount: typeof mount; selected: number[] };
  }
}

let root: Root | null = null;
function mount({
  theme = "light",
  orientation,
  dir = "ltr",
  density = "touch",
  navigable = false,
  configReduced = false,
}: Mount) {
  window.stepperSteps.selected = [];
  root?.unmount();
  root = createRoot(document.getElementById("fixture")!);
  flushSync(() =>
    root!.render(
      <ThemeProvider theme={theme} density={density}>
        <div
          id="surface"
          dir={dir}
          className="bg-background"
          style={{ padding: 24, width: 560 }}
          data-kozmos-motion={configReduced ? "reduced" : undefined}
        >
          <button type="button" id="before">
            Before
          </button>
          <Stepper
            id="stepper"
            steps={WIZARD}
            currentStep={2}
            orientation={orientation}
            onStepSelect={
              navigable
                ? (index) => window.stepperSteps.selected.push(index)
                : undefined
            }
          />
          <button type="button" id="after">
            After
          </button>
        </div>
      </ThemeProvider>,
    ),
  );
}

window.stepperSteps = { mount, selected: [] };
