import figma from "@figma/code-connect";
import { Button } from "../Button/Button";
import { POICard } from "./POICard";

const poiCardUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1340-6879";

// Full's Button is drawn only by a mapping, which Code Connect does not collect
// imports from: it is listed here.
figma.connect(POICard, poiCardUrl, {
  imports: ["import { POICard, Button } from '@kozmos-ds/react';"],
  props: {
    title: figma.string("Title Text"),
    subtitle: figma.string("Subtitle Text"),
    description: figma.string("Description Text"),
    imageUrl: figma.enum("Content", {
      Basic: undefined,
      Media: "/venue.jpg",
      Full: undefined,
    }),
    actions: figma.enum("Content", {
      Basic: undefined,
      Media: undefined,
      Full: <Button variant="secondary">Navigate</Button>,
    }),
  },
  example: ({ title, subtitle, description, imageUrl, actions }) => (
    <POICard
      title={title}
      subtitle={subtitle}
      description={description}
      imageUrl={imageUrl}
      imageAlt="Venue photograph"
      actions={actions}
    />
  ),
});
