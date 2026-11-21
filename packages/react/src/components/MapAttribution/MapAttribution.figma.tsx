import figma from "@figma/code-connect";
import { MapAttribution } from "./MapAttribution";

/**
 * Figma Code Connect: MapAttribution (GAP-206)
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17387
 *
 * Appearance is appearance. Credit Text and Credit Text 2 are the credits'
 * labels, in order; Show Brand is showBrand. The brand itself is the
 * product's mark.
 */
figma.connect(
  MapAttribution,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17387",
  {
    props: {
      appearance: figma.enum("Appearance", { Map: "map", Surface: "surface" }),
      credit1: figma.string("Credit Text"),
      credit2: figma.string("Credit Text 2"),
      showBrand: figma.boolean("Show Brand"),
    },
    example: ({ appearance, credit1, credit2, showBrand }) => (
      <MapAttribution
        appearance={appearance}
        credits={[
          { id: "venue", label: credit1 },
          { id: "basemap", label: credit2 },
        ]}
        showBrand={showBrand}
      />
    ),
  },
);
