import { useState } from "react";
import {
  Box,
  Itinerary,
  ManoeuvreCard,
  MapOverlay,
  MapView,
} from "@kozmos/react";
import { itinerary } from "../sample-data";
import type { DemoModule } from "../types";

function WithTheItinerary() {
  const [expanded, setExpanded] = useState(false);
  return (
    <Box className="site-demo-column">
      <ManoeuvreCard
        type="left"
        instruction="Turn left at the pharmacy"
        detail="20 m"
        expanded={expanded}
        onToggle={() => setExpanded((value) => !value)}
      >
        <Itinerary
          label="Itinerary, solid"
          origin="Main entrance"
          destination="Bookshop"
          steps={[...itinerary]}
        />
      </ManoeuvreCard>
    </Box>
  );
}

function OnGlass() {
  const [expanded, setExpanded] = useState(false);
  return (
    <Box className="site-demo-map">
      <MapView mapLabel="Illustrative map">
        <MapOverlay position="bottom-center" width="md">
          <ManoeuvreCard
            surface="glass"
            /* The card is a landmark named "Current manoeuvre" while it is
               closed, and both demos on this page are closed, so the second
               takes its own name (the site's rule: several of one landmark
               need different names). */
            manoeuvreLabel="Current manoeuvre, on glass"
            type="escalator-up"
            instruction="Take the escalator to the first floor"
            detail="Then 40 m"
            expanded={expanded}
            onToggle={() => setExpanded((value) => !value)}
          >
            <Itinerary
              label="Itinerary, on glass"
              origin="Main entrance"
              destination="Bookshop"
              steps={[...itinerary]}
            />
          </ManoeuvreCard>
        </MapOverlay>
      </MapView>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "The current manoeuvre, with the itinerary behind it",
    description:
      "The card names the manoeuvre; a button opens the itinerary underneath it, up to maxItineraryHeight.",
    Component: WithTheItinerary,
  },
  {
    title: "On glass, over a map",
    description:
      "The same card on the glass surface, in a MapOverlay at the map’s bottom edge — where a product puts it. Open the itinerary to see the glass over the map.",
    Component: OnGlass,
    tall: true,
  },
];
