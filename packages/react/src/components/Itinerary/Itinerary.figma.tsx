import figma from "@figma/code-connect";
import { Itinerary, type ItineraryProps } from "./Itinerary";

const itineraryUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2201-9608";

// The route's steps come from the product's routing, not from Figma: the
// variant only says whether one is current and whether they carry metrics.
// Typed from the component's own props so the example type-checks against it.
declare const steps: ItineraryProps["steps"];

figma.connect(Itinerary, itineraryUrl, {
  props: {
    origin: figma.string("Origin Text"),
    destination: figma.string("Destination Text"),
    originLabel: figma.string("Origin Label"),
    destinationLabel: figma.string("Destination Label"),
  },
  example: ({ origin, destination, originLabel, destinationLabel }) => (
    <Itinerary
      origin={origin}
      destination={destination}
      originLabel={originLabel}
      destinationLabel={destinationLabel}
      steps={steps}
    />
  ),
});
