import { Box, Itinerary } from "@kozmos-ds/react";
import { itinerary } from "../sample-data";
import type { DemoModule } from "../types";

function ToTheBookshop() {
  return (
    <Box className="site-demo-column">
      <Itinerary
        origin="Main entrance"
        destination="Bookshop"
        steps={[...itinerary]}
      />
    </Box>
  );
}

function NoCurrentStep() {
  return (
    <Box className="site-demo-column">
      <Itinerary
        origin="Bus interchange"
        destination="Gate B12"
        label="Itinerary before setting off"
        originLabel="Start"
        destinationLabel="End"
        steps={itinerary.map((step) => ({ ...step, current: false }))}
      />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "To the bookshop",
    description:
      "Origin, the steps with a manoeuvre glyph each, the destination; the current step is marked.",
    Component: ToTheBookshop,
  },
  { title: "Before setting off", Component: NoCurrentStep },
];
