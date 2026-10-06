import figma from "@figma/code-connect";
import { ManoeuvreCard } from "./ManoeuvreCard";
import { Itinerary, type ItineraryProps } from "../Itinerary";

const manoeuvreCardUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2210-38624";

// The itinerary the card opens into and whether it is open are the product's:
// the route's steps come from its routing, and the toggle flips its state.
// Typed from the components' own props so the example type-checks against them.
declare const steps: ItineraryProps["steps"];
declare const toggleItinerary: () => void;

figma.connect(ManoeuvreCard, manoeuvreCardUrl, {
  props: {
    instruction: figma.string("Instruction Text"),
    detail: figma.string("Detail Text"),
    expanded: figma.enum("State", { Closed: false, Open: true }),
    appearance: figma.enum("Appearance", {
      Theme: "theme",
      Background: "background",
    }),
  },
  example: ({ instruction, detail, expanded, appearance }) => (
    <ManoeuvreCard
      type="lift-down"
      instruction={instruction}
      detail={detail}
      expanded={expanded}
      onToggle={toggleItinerary}
      appearance={appearance}
    >
      <Itinerary
        origin="Dunkin'"
        destination="Airport Shuttles"
        steps={steps}
      />
    </ManoeuvreCard>
  ),
});
