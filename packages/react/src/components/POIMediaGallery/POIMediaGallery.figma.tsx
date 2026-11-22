import figma from "@figma/code-connect";
import { POIMediaGallery, type POIMediaGalleryProps } from "./POIMediaGallery";

const poiMediaGalleryUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1351-8119";

// What the caller supplies, typed from the component's own props so the
// example type-checks against them; Code Connect renders the names as written.
declare const media: POIMediaGalleryProps["media"];
declare const setActiveIndex: NonNullable<
  POIMediaGalleryProps["onActiveIndexChange"]
>;

// Nothing on the Figma set maps to a prop. Position Text is what positionLabel
// returns for the active index, and Content maps to how many items media
// holds: Single hides the paging controls, Empty renders nothing.
// positionLabel joins its words without a template literal: Figma's template
// is one itself, and would read a `${current}` in the snippet as its own.
figma.connect(POIMediaGallery, poiMediaGalleryUrl, {
  example: () => (
    <POIMediaGallery
      media={media}
      label="Venue photographs"
      positionLabel={(current, total) => current + " of " + total}
      onActiveIndexChange={(index) => setActiveIndex(index)}
    />
  ),
});
