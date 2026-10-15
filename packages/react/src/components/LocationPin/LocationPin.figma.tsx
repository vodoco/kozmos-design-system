import figma from "@figma/code-connect";
import { LocationPin } from "./LocationPin";

const locationPinUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1340-6847";

// The SDK's map result markers (decision 71): Kind is the marker, State its
// selection, and Content whether a result shows its number or a dot. The
// Number Text the set draws is 12; React Code Connect enums take literals
// only, so a numbered result connects as number={12}.
figma.connect(LocationPin, locationPinUrl, {
  props: {
    label: figma.string("Label Text"),
    featured: figma.enum("Kind", {
      Result: false,
      Featured: true,
      Place: false,
    }),
    place: figma.enum("Kind", {
      Result: false,
      Featured: false,
      Place: true,
    }),
    selected: figma.enum("State", {
      Default: false,
      Selected: true,
    }),
    number: figma.enum("Content", {
      Number: 12,
      Dot: undefined,
    }),
  },
  // labelPlacement is owned by the map renderer, and a featured tile's logo
  // is the product's image, so neither is a Figma property.
  example: ({ label, featured, place, selected, number }) => (
    <LocationPin
      label={label}
      featured={featured}
      place={place}
      selected={selected}
      number={number}
    />
  ),
});
