import { useState } from "react";
import { Box, POIMediaGallery, Text } from "@kozmos-ds/react";
import type { POIMediaPresentation } from "@kozmos-ds/product-contracts";
import { asset } from "../../lib/asset";
import type { DemoModule } from "../types";

export const bookshopMedia: readonly POIMediaPresentation[] = [
  {
    id: "shelves",
    src: asset("/media/bookshop-shelves.svg"),
    alt: "Shelves of books on two levels",
  },
  {
    id: "counter",
    src: asset("/media/bookshop-counter.svg"),
    alt: "The counter with a stack of books",
  },
  {
    id: "window",
    src: asset("/media/bookshop-window.svg"),
    alt: "The reading corner by the window",
  },
];

function Three() {
  const [index, setIndex] = useState(0);
  return (
    <Box className="site-demo-column">
      <POIMediaGallery
        label="Bookshop photos"
        media={bookshopMedia}
        activeIndex={index}
        onActiveIndexChange={setIndex}
        positionLabel={(current, total) => `Image ${current} of ${total}`}
      />
      <Text size="sm" color="muted" aria-live="polite">
        Showing {bookshopMedia[index].alt.toLowerCase()}.
      </Text>
    </Box>
  );
}

function Broken() {
  return (
    <Box className="site-demo-column">
      <POIMediaGallery
        label="Bookshop photos, one missing"
        media={[
          {
            id: "missing",
            src: asset("/media/does-not-exist.svg"),
            alt: "A photo that failed to load",
          },
          bookshopMedia[0],
        ]}
        positionLabel={(current, total) => `Image ${current} of ${total}`}
        unavailableLabel="This image could not be loaded"
      />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Three images",
    description:
      "POIMediaPresentation entries with previous and next; activeIndex can be controlled. The images are illustrations served by the site.",
    Component: Three,
  },
  {
    title: "An image that fails",
    description: "unavailableLabel replaces a picture that will not load.",
    Component: Broken,
  },
];
