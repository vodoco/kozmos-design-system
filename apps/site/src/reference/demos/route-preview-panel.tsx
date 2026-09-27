import { useState } from "react";
import {
  Box,
  RoutePreviewPanel,
  SegmentedControl,
  Text,
} from "@kozmos-ds/react";
import { routeOptions } from "../sample-data";
import type { DemoModule } from "../types";

type Status = "ready" | "calculating" | "no-route" | "error";
const statuses: readonly Status[] = [
  "ready",
  "calculating",
  "no-route",
  "error",
];

const statusContent: Record<Exclude<Status, "ready">, string> = {
  calculating: "Finding routes to the bookshop…",
  "no-route":
    "No route reaches the bookshop from here. Try another starting point.",
  error: "Routing is unavailable right now. Try again in a moment.",
};

function Preview() {
  const [status, setStatus] = useState<Status>("ready");
  const [selected, setSelected] = useState("quickest");
  const [note, setNote] = useState("Choose a route, then continue.");
  return (
    <Box className="site-demo-column">
      <SegmentedControl
        label="Routing status"
        size="sm"
        items={statuses.map((value) => ({ value, label: value }))}
        value={status}
        onValueChange={(next) => {
          if (statuses.includes(next as Status)) setStatus(next as Status);
        }}
      />
      <RoutePreviewPanel
        status={status}
        destinationName="Bookshop"
        options={routeOptions.map((option) => ({
          ...option,
          selected: option.id === selected,
        }))}
        optionsCountLabel={`${routeOptions.length} routes`}
        selectedRouteAnnouncement={`${routeOptions.find((option) => option.id === selected)?.label} selected`}
        statusContent={
          status === "ready" ? undefined : (
            <Text color="muted">{statusContent[status]}</Text>
          )
        }
        backLabel="Back"
        continueLabel="Start"
        onBack={() => setNote("Back to the place.")}
        onOptionSelect={setSelected}
        onContinue={(routeId) => setNote(`Started the ${routeId} route.`)}
      />
      <Text size="sm" color="muted" aria-live="polite">
        {note}
      </Text>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Routes to the bookshop",
    description:
      "The options under the destination, with back and continue; status swaps the options for statusContent while calculating, without a route, or on an error.",
    Component: Preview,
  },
];
