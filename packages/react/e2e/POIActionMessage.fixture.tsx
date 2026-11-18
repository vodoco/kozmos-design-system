import React from "react";
import type { POIAction, POIPresentation } from "@kozmos-ds/product-contracts";
import { ThemeProvider } from "../src/components/ThemeProvider/ThemeProvider";
import { POIDetailPanel } from "../src/components/POIDetailPanel/POIDetailPanel";

const labels: Record<POIAction, string> = {
  navigate: "Go",
  favourite: "Favourite",
  bookmark: "Bookmark",
  share: "Share",
  order: "Order",
};
const poi: POIPresentation = {
  id: "burger-king",
  name: "Burger King",
  floorId: "1",
  floorLabel: "First floor",
  media: [],
  actions: ["navigate", "share", "order"],
};

/** A status message and an error message under the action strip. */
export function POIActionMessageFixture() {
  return (
    <ThemeProvider theme="light">
      <div style={{ width: 360 }}>
        <POIDetailPanel
          poi={poi}
          actionLabels={labels}
          onAction={() => undefined}
          actionStates={{
            share: { message: "Link copied" },
            order: {
              message: "Ordering is unavailable.",
              messageTone: "error",
            },
          }}
        />
      </div>
    </ThemeProvider>
  );
}
