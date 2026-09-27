import { useState } from "react";
import {
  Box,
  Button,
  Text,
  WayfindingCard,
  WayfindingInputRow,
} from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Directions() {
  const [origin, setOrigin] = useState("Main entrance");
  const [destination, setDestination] = useState("Bookshop");
  const [note, setNote] = useState("Fill both, then find a route.");
  return (
    <Box className="site-demo-column">
      <WayfindingCard title="Directions" onClose={() => setNote("Closed.")}>
        <WayfindingInputRow
          originValue={origin}
          destinationValue={destination}
          onOriginChange={setOrigin}
          onDestinationChange={setDestination}
          onSwap={() => {
            setOrigin(destination);
            setDestination(origin);
          }}
        />
        <Button
          className="site-fill"
          onClick={() =>
            setNote(`Finding a route from ${origin} to ${destination}.`)
          }
        >
          Find a route
        </Button>
      </WayfindingCard>
      <Text size="sm" color="muted" aria-live="polite">
        {note}
      </Text>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Origin and destination",
    description:
      "A titled card with a close button; WayfindingInputRow gives the two fields and the swap.",
    Component: Directions,
  },
];
