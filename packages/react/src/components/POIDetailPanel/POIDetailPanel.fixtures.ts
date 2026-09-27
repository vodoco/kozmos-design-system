import type {
  POIAction,
  POIDetailsPresentation,
  POIPresentation,
} from "@kozmos-ds/product-contracts";

import { presentTaxonomyProperties } from "./POITaxonomy.fixtures";

export const poiActionLabels: Record<POIAction, string> = {
  navigate: "Go",
  favourite: "Favourite",
  bookmark: "Bookmark",
  share: "Share",
  order: "Order",
};
const openingHours = {
  label: "Opening hours",
  summary: "Open · Closes 12:30 pm",
  rows: [
    { id: "weekdays", day: "Monday–Friday", hours: "8:00 am–12:30 pm" },
    { id: "saturday", day: "Saturday", hours: "9:00 am–12:30 pm" },
    { id: "sunday", day: "Sunday", hours: "Closed" },
  ],
  note: "Illustrative venue-local hours; not a live opening-status calculation.",
};

export const restaurantPOI: POIPresentation = {
  id: "il-forno",
  name: "Il Forno",
  floorId: "1",
  floorLabel: "Current floor",
  buildingLabel: "Building A",
  availability: "open",
  availabilityLabel: "Open",
  description:
    "Wood-fired Neapolitan pizza & handmade pasta in a lively open kitchen.",
  // No logos or photography were supplied. Empty media deliberately renders no placeholders.
  media: [],
  actions: ["navigate", "share", "favourite", "bookmark"],
};
export const restaurantDetails: POIDetailsPresentation = {
  travelEstimate: {
    durationSeconds: 120,
    durationLabel: "2 min",
    distanceMetres: 120,
    distanceLabel: "120 m",
  },
  supplementaryActions: [{ action: "book", label: "Book" }],
  ...presentTaxonomyProperties(
    {
      rating: { demoScore: 4.7, demoCount: 32 },
      cuisines: ["Italian", "Pizza", "Mediterranean"],
      dietaryOptions: ["Vegetarian", "Vegan", "Gluten-Free"],
      serviceOptions: "Dine-in",
      isWheelchairAccessible: true,
      hasHearingLoop: true,
      hasVisualAids: true,
      isAutismFriendly: true,
      hasAssistance: true,
      hasWifi: true,
      hasPlayArea: true,
      hasRestrooms: true,
      hasAlcoholService: true,
      hasOutdoorSeating: true,
      isFamilyFriendly: true,
      isPetFriendly: true,
      paymentMethods: [
        "Cash",
        "Credit",
        "Google Pay",
        "Apple Pay",
        "Contactless",
      ],
      dressCodes: ["smart-casual"],
      ageRestriction: "18+",
      priceRange: 3,
    },
    {
      customHighlights: {
        rating: {
          id: "rating",
          kind: "rating",
          label: "Rating",
          value: "4.7 / 5",
          detail: "32 reviews",
        },
      },
    },
  ),
  openingHours,
  description: {
    preview:
      "Family-run since 1998, Il Forno serves Naples-style pizza from a wood-fired oven and pasta made fresh daily.",
    full: "Family-run since 1998, Il Forno serves Naples-style pizza from a wood-fired oven and pasta made fresh daily. The terrace seats overlook the atrium, and the open kitchen is the heart of the room. Weekend evenings are lively — booking recommended.",
  },
  tags: [
    { id: "pizza", label: "#pizza" },
    { id: "italian", label: "#italian" },
    { id: "patio", label: "#patio" },
  ],
};
export const entrancePOI: POIPresentation = {
  id: "terminal-1",
  name: "Terminal 1 Main Entrance",
  floorId: "1",
  floorLabel: "Current floor",
  buildingLabel: "Building A",
  availability: "open",
  availabilityLabel: "Open",
  media: [],
  actions: ["navigate", "share", "favourite", "bookmark"],
};
export const entranceDetails: POIDetailsPresentation = {
  travelEstimate: restaurantDetails.travelEstimate,
  ...presentTaxonomyProperties({
    isWheelchairAccessible: true,
    hasHearingLoop: true,
    hasVisualAids: true,
    isAutismFriendly: true,
    hasAssistance: true,
    hasWifi: true,
    hasChargingAvailable: true,
    hasRestrooms: true,
    hasLuggageStorage: true,
    hasSecurityStaff: true,
    languageSupport: ["English", "Spanish", "French"],
    accessPrograms: ["tsa-precheck", "clear", "global-entry"],
  }),
  openingHours,
};

export const retailPOI: POIPresentation = {
  ...restaurantPOI,
  id: "aria-and-co",
  name: "Aria & Co.",
  description:
    "Flagship fashion & lifestyle department store across three floors.",
};
export const retailDetails: POIDetailsPresentation = {
  travelEstimate: restaurantDetails.travelEstimate,
  supplementaryActions: [{ action: "call", label: "Call" }],
  ...presentTaxonomyProperties(
    {
      rating: { demoScore: 4.7, demoCount: 32 },
      productTypes: [
        "Womens Clothing",
        "Mens Clothing",
        "Accessories",
        "Beauty and Cosmetics",
        "Footwear",
        "Home Decor",
      ],
      isWheelchairAccessible: true,
      hasAssistance: true,
      hasChangingFacilities: true,
      hasRestrooms: true,
      paymentMethods: [
        "Cash",
        "Credit",
        "Mobile",
        "Contactless",
        "Apple Pay",
        "Google Pay",
        "Samsung Pay",
        "Store Card",
        "Gift Card",
      ],
      crowdLevel: "packed",
      waitTime: 25,
    },
    {
      customHighlights: {
        rating: {
          id: "rating",
          kind: "rating",
          label: "Rating",
          value: "4.7 / 5",
          detail: "32 reviews",
        },
      },
    },
  ),
  openingHours,
  description: {
    preview:
      "Three floors of curated fashion, beauty and homeware, with a rooftop café and a dedicated personal-shopping suite on Level 3.",
    full: "Three floors of curated fashion, beauty and homeware, with a rooftop café and a dedicated personal-shopping suite on Level 3. Seasonal collections rotate monthly and members get early access to sale previews.",
  },
  tags: [
    { id: "fashion", label: "#fashion" },
    { id: "lifestyle", label: "#lifestyle" },
  ],
};
export const fitnessPOI: POIPresentation = {
  ...restaurantPOI,
  id: "peak-performance",
  name: "Peak Performance",
  description:
    "A high-intensity fitness studio offering group classes and open gym access.",
};
export const fitnessDetails: POIDetailsPresentation = {
  travelEstimate: restaurantDetails.travelEstimate,
  supplementaryActions: [{ action: "book", label: "Book" }],
  ...presentTaxonomyProperties(
    {
      rating: { demoScore: 4.7, demoCount: 32 },
      sportTypes: ["Aerobics", "Athletics"],
      isWheelchairAccessible: true,
      hasAssistance: true,
      hasWifi: true,
      hasChargingAvailable: true,
      hasRestrooms: true,
      hasLockers: true,
      hasChangingFacilities: true,
      isFamilyFriendly: true,
      paymentMethods: [
        "Cash",
        "Credit",
        "Mobile",
        "Contactless",
        "Apple Pay",
        "Google Pay",
        "Samsung Pay",
      ],
      dressCodes: ["smart-casual"],
      ageRestriction: "18+",
      languageSupport: ["English", "Spanish", "French"],
      genderDesignation: "all-gender",
      accessRestrictions: ["booking-required"],
      priceRange: 3,
    },
    {
      customHighlights: {
        rating: {
          id: "rating",
          kind: "rating",
          label: "Rating",
          value: "4.7 / 5",
          detail: "32 reviews",
        },
      },
    },
  ),
  openingHours,
  description: {
    preview:
      "Peak Performance Studio provides cardio and weightlifting equipment alongside daily instructor-led aerobics and athletics classes.",
    full: "Peak Performance Studio provides cardio and weightlifting equipment alongside daily instructor-led aerobics and athletics classes. Lockers and showers are available on-site for all members.",
  },
  tags: [
    { id: "fitness", label: "#fitness" },
    { id: "gym", label: "#gym" },
  ],
};
export const parkingPOI: POIPresentation = {
  ...entrancePOI,
  id: "north-deck",
  name: "North Deck Parking",
};
export const parkingDetails: POIDetailsPresentation = {
  travelEstimate: restaurantDetails.travelEstimate,
  ...presentTaxonomyProperties({
    isWheelchairAccessible: true,
    paymentMethods: [
      "Credit",
      "Contactless",
      "Apple Pay",
      "Google Pay",
      "Samsung Pay",
    ],
    parkingTypes: ["Self-Park", "Valet", "EV Charging"],
    crowdLevel: "packed",
    waitTime: 25,
  }),
  openingHours,
};

/** A synthetic field catalogue, never a claim that one venue offers everything. */
export const fullFieldDetails: POIDetailsPresentation = {
  ...restaurantDetails,
  ...presentTaxonomyProperties({
    cuisines: ["Italian", "Pizza", "Mediterranean"],
    dietaryOptions: ["Vegetarian", "Vegan", "Gluten-Free"],
    serviceOptions: "Dine-in",
    isWheelchairAccessible: true,
    hasHearingLoop: true,
    hasVisualAids: true,
    isAutismFriendly: true,
    hasAssistance: true,
    hasWifi: true,
    hasPlayArea: true,
    hasRestrooms: true,
    hasAlcoholService: true,
    hasOutdoorSeating: true,
    isFamilyFriendly: true,
    isPetFriendly: true,
    paymentMethods: [
      "Credit",
      "Contactless",
      "Apple Pay",
      "Google Pay",
      "Samsung Pay",
    ],
    dressCodes: ["smart-casual"],
    ageRestriction: "18+",
    priceRange: 3,
    hasChargingAvailable: true,
    hasLuggageStorage: true,
    hasSecurityStaff: true,
    languageSupport: ["English", "Spanish", "French"],
    accessPrograms: ["tsa-precheck", "clear", "global-entry"],
    productTypes: [
      "Womens Clothing",
      "Mens Clothing",
      "Accessories",
      "Beauty and Cosmetics",
      "Footwear",
      "Home Decor",
    ],
    hasChangingFacilities: true,
    crowdLevel: "packed",
    waitTime: 25,
    sportTypes: ["Aerobics", "Athletics"],
    hasLockers: true,
    genderDesignation: "all-gender",
    accessRestrictions: ["booking-required"],
    parkingTypes: ["Self-Park", "Valet", "EV Charging"],
    clinicalSpecialty: ["Acupuncture", "Allergy and Immunology", "Audiology"],
    serviceTypes: ["Barber and Hair Salon", "Beauty and Spa Services"],
    capacity: 80,
    occupancyStatus: "occupied",
  }),
};

/**
 * A name long enough to wrap, and a group label long enough to wrap: the
 * header keeps the quick buttons beside a name of up to three lines, on every
 * platform, and the detail content reflows at large type.
 */
export const longContentPOI: POIPresentation = {
  ...restaurantPOI,
  id: "long-content",
  name: "Il Forno — Neapolitan restaurant and handmade pasta kitchen on the upper concourse",
};

export const longContentDetails: POIDetailsPresentation = {
  ...restaurantDetails,
  groups: [
    {
      id: "long",
      heading: "Accessibility and assistance information",
      items: [
        {
          id: "long",
          label:
            "Please contact the venue in advance for assistance with step-free access from the south entrance",
        },
      ],
    },
    ...(restaurantDetails.groups ?? []),
  ],
};
