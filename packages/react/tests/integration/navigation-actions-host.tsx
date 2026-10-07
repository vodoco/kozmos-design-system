import React from "react";
import { createRoot } from "react-dom/client";
import {
  ArrivalPanel,
  Button,
  RouteProgressRail,
  RouteSummary,
} from "@kozmos-ds/react";

declare global {
  interface Window {
    navigationAction:
      | "arrival"
      | "summary"
      | "summary-steps"
      | "summary-preview"
      | "summary-mixed";
    navigationDone: number;
    navigationSubmits: number;
    navigationStep: number;
  }
}
window.navigationDone = 0;
window.navigationSubmits = 0;
window.navigationStep = 1;
const done = () => {
  window.navigationDone++;
};

/**
 * Static wayfinding as the docs recipe draws it: the host's Previous and
 * Next in the summary's actions, Buttons that never submit, the end of the
 * route unavailable through aria-disabled and a guarded handler, so the
 * focus stays on Previous when pressing it reaches the first step.
 *
 * The destination is one 29-letter word, wider than the 320px panel at 200%
 * text in any font, so its wrap is tested wherever the check runs, not only
 * where the host's font happens to be wide (DejaVu Sans on CI).
 */
const LONG_DESTINATION = "Abflughallenaussichtsterrasse";
function Steps() {
  const [step, setStep] = React.useState(1);
  const last = 3;
  const go = (to: number) => {
    window.navigationStep = to;
    setStep(to);
  };
  return (
    <RouteSummary
      destination={LONG_DESTINATION}
      durationText="4 min"
      distanceText="201 m"
      onEndRoute={done}
      progress={
        <RouteProgressRail
          progress={step / last}
          type="straight"
          label={`Step ${step + 1} of ${last + 1}`}
        />
      }
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            aria-disabled={step === 0 || undefined}
            onClick={() => step > 0 && go(step - 1)}
          >
            Back to the previous step
          </Button>
          <Button
            type="button"
            aria-disabled={step === last || undefined}
            onClick={() => step < last && go(step + 1)}
          >
            Continue to the next step
          </Button>
        </>
      }
    />
  );
}

createRoot(document.getElementById("root")!).render(
  <form
    onSubmit={(event) => {
      event.preventDefault();
      window.navigationSubmits++;
    }}
  >
    {window.navigationAction === "arrival" ? (
      <ArrivalPanel
        destination="International departures gallery"
        doneLabel="Finish navigation and return to the selected destination"
        onDone={done}
      />
    ) : window.navigationAction === "summary-steps" ? (
      <Steps />
    ) : window.navigationAction === "summary-mixed" ? (
      // Not only Buttons: one child that can grow and one with a size of its
      // own, beside a Button whose label wraps.
      <RouteSummary
        destination="Gate 12"
        presentation="hosted"
        actions={
          <>
            <Button type="button" onClick={done}>
              Continue to the next step
            </Button>
            <div data-probe="grows" />
            <div data-probe="fixed" style={{ width: 24, height: 24 }} />
          </>
        }
      />
    ) : window.navigationAction === "summary-preview" ? (
      // The route preview: no End, the place's line, Go and Details.
      <RouteSummary
        destination={LONG_DESTINATION}
        locationText="Sicherheitskontrollbereich · Level 2 · Terminal 1"
        durationText="3 min"
        distanceText="205 m"
        presentation="hosted"
        actions={
          <>
            <Button type="button" onClick={done}>
              Start the route now
            </Button>
            <Button type="button" variant="outline" onClick={done}>
              Show the directions for this route
            </Button>
          </>
        }
      />
    ) : (
      <RouteSummary
        destination="International departures gallery"
        endLabel="End navigation and return to the map"
        onEndRoute={done}
      />
    )}
  </form>,
);
