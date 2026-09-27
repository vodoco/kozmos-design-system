/**
 * The venue explorer's shopping centre again, with photographs for one place:
 * the three illustrations the site serves, so the gallery has something to
 * turn through.
 */
import type {
  POIMediaPresentation,
  POIPresentation,
} from "@kozmos-ds/product-contracts";
import { places as venuePlaces, type Place } from "../venue-explorer/data";

export {
  categories,
  categoryFor,
  floorLabel,
  floors,
  tint,
  venueName,
  type Place,
} from "../venue-explorer/data";

const bookshopMedia: readonly POIMediaPresentation[] = [
  {
    id: "shelves",
    src: "/media/bookshop-shelves.svg",
    alt: "Shelves of books on two levels",
  },
  {
    id: "counter",
    src: "/media/bookshop-counter.svg",
    alt: "The counter with a stack of books",
  },
  {
    id: "window",
    src: "/media/bookshop-window.svg",
    alt: "The reading corner by the window",
  },
];

function withMedia(place: Place): Place {
  if (place.poi.id !== "books") return place;
  const poi: POIPresentation = { ...place.poi, media: bookshopMedia };
  return {
    ...place,
    poi,
    details: {
      ...place.details,
      tags: [
        { id: "books", label: "Books" },
        { id: "cafe", label: "Café" },
        { id: "events", label: "Author events" },
      ],
    },
  };
}

export const places: readonly Place[] = venuePlaces.map(withMedia);
