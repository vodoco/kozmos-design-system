import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  FloorSelector,
  MapControlsGroup,
  MapOverlay,
  MapView,
  ThemeProvider,
  Button,
} from "@kozmos-ds/react";

function Fixture({
  dir,
  showResultCounts,
  variant = "collapsible",
}: {
  dir: "ltr" | "rtl";
  showResultCounts: boolean;
  variant?: "collapsible" | "compact-stepper";
}) {
  const [floor, setFloor] = useState("1");
  const [presses, setPresses] = useState(0);
  return (
    <ThemeProvider dir={dir} defaultTheme="light">
      <MapView style={{ width: 360, height: 420 }}>
        <button
          aria-label="Map surface"
          onClick={() => setPresses(presses + 1)}
          style={{ position: "absolute", inset: 0 }}
        >
          Map presses: {presses}
        </button>
        <MapOverlay
          position="bottom-start"
          collisionInsets={{ left: 12, right: 28 }}
        >
          <Button>Start-side layout probe</Button>
        </MapOverlay>
        <MapOverlay
          position="bottom-end"
          collisionInsets={{ left: 12, right: 28 }}
        >
          <FloorSelector
            floors={[
              {
                id: "2",
                label: "Second floor",
                shortLabel: "2F",
                resultCount: 3,
              },
              { id: "1", label: "First floor", shortLabel: "1F" },
              { id: "g", label: "Ground floor", shortLabel: "GF" },
            ]}
            showResultCounts={showResultCounts}
            selectedFloor={floor}
            onFloorSelect={setFloor}
            variant={variant}
          />
          <MapControlsGroup
            onZoomIn={() => setPresses(presses + 1)}
            onZoomOut={() => setPresses(presses - 1)}
          />
        </MapOverlay>
      </MapView>
    </ThemeProvider>
  );
}

const root = createRoot(document.getElementById("root")!);
(
  window as Window & {
    renderMapControlsFixture: (
      dir: "ltr" | "rtl",
      showResultCounts?: boolean,
      variant?: "collapsible" | "compact-stepper",
    ) => void;
  }
).renderMapControlsFixture = (
  dir,
  showResultCounts = false,
  variant = "collapsible",
) =>
  root.render(
    <Fixture
      key={dir}
      dir={dir}
      showResultCounts={showResultCounts}
      variant={variant}
    />,
  );
