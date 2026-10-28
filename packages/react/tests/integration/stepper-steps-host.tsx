import { useState } from "react";
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
 * and to land. With `follows`, the host moves `currentStep` to the step
 * selected, as a product does.
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
  /** The selected step becomes the current one, as a product moves it. */
  follows?: boolean;
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

function Wizard({
  orientation,
  navigable,
  follows,
}: Pick<Mount, "orientation" | "navigable" | "follows">) {
  const [current, setCurrent] = useState(2);
  return (
    <Stepper
      id="stepper"
      steps={WIZARD}
      currentStep={current}
      orientation={orientation}
      onStepSelect={
        navigable
          ? (index) => {
              window.stepperSteps.selected.push(index);
              if (follows) setCurrent(index);
            }
          : undefined
      }
    />
  );
}

let root: Root | null = null;
function mount({
  theme = "light",
  orientation,
  dir = "ltr",
  density = "touch",
  navigable = false,
  configReduced = false,
  follows = false,
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
          <Wizard
            orientation={orientation}
            navigable={navigable}
            follows={follows}
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
