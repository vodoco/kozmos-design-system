import { createRoot } from "react-dom/client";
import { ArrivalPanel, RouteSummary } from "@kozmos-ds/react";

declare global {
  interface Window {
    navigationAction: "arrival" | "summary";
    navigationDone: number;
    navigationSubmits: number;
  }
}
window.navigationDone = 0;
window.navigationSubmits = 0;
const done = () => {
  window.navigationDone++;
};
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
    ) : (
      <RouteSummary
        destination="International departures gallery"
        endLabel="End navigation and return to the map"
        onEndRoute={done}
      />
    )}
  </form>,
);
