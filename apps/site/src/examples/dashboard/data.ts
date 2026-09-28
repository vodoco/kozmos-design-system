/** Invented venues for the operations dashboard. */

export type VenueStatus = "Live" | "Draft" | "Review" | "Archived";

export interface Venue {
  id: string;
  name: string;
  city: string;
  floors: number;
  places: number;
  status: VenueStatus;
  /** ISO date of the last change. */
  updated: string;
}

export const cities = [
  "London",
  "Istanbul",
  "Dubai",
  "Singapore",
  "New York",
] as const;

export const venues: readonly Venue[] = [
  {
    id: "riverside",
    name: "Riverside Centre",
    city: "London",
    floors: 3,
    places: 148,
    status: "Live",
    updated: "2026-09-21",
  },
  {
    id: "harbour",
    name: "Harbour Terminal",
    city: "Istanbul",
    floors: 2,
    places: 96,
    status: "Live",
    updated: "2026-09-19",
  },
  {
    id: "north-campus",
    name: "North Campus",
    city: "Dubai",
    floors: 5,
    places: 312,
    status: "Draft",
    updated: "2026-09-18",
  },
  {
    id: "central-station",
    name: "Central Station",
    city: "Singapore",
    floors: 4,
    places: 205,
    status: "Review",
    updated: "2026-09-17",
  },
  {
    id: "kings-hospital",
    name: "King’s Hospital",
    city: "London",
    floors: 8,
    places: 640,
    status: "Live",
    updated: "2026-09-16",
  },
  {
    id: "bay-airport",
    name: "Bay Airport, Terminal 2",
    city: "New York",
    floors: 3,
    places: 420,
    status: "Review",
    updated: "2026-09-15",
  },
  {
    id: "marina-mall",
    name: "Marina Mall",
    city: "Dubai",
    floors: 4,
    places: 380,
    status: "Live",
    updated: "2026-09-12",
  },
  {
    id: "old-town-market",
    name: "Old Town Market",
    city: "Istanbul",
    floors: 1,
    places: 64,
    status: "Draft",
    updated: "2026-09-10",
  },
  {
    id: "science-park",
    name: "Science Park",
    city: "Singapore",
    floors: 6,
    places: 250,
    status: "Live",
    updated: "2026-09-08",
  },
  {
    id: "west-stadium",
    name: "West Stadium",
    city: "London",
    floors: 4,
    places: 190,
    status: "Archived",
    updated: "2026-08-30",
  },
  {
    id: "lakeside-offices",
    name: "Lakeside Offices",
    city: "New York",
    floors: 12,
    places: 530,
    status: "Live",
    updated: "2026-08-28",
  },
  {
    id: "grand-library",
    name: "Grand Library",
    city: "Istanbul",
    floors: 3,
    places: 88,
    status: "Review",
    updated: "2026-08-22",
  },
];

export const statuses: readonly VenueStatus[] = [
  "Live",
  "Draft",
  "Review",
  "Archived",
];

export const PAGE_SIZE = 5;

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * "21 Sep". Spelled out by hand rather than by the locale: the page is
 * pre-rendered in Node and hydrated in the browser, and WebKit's "Sep" is
 * not Node's "Sept", which React would report as a mismatch.
 */
export function formatDate(iso: string) {
  const [, month, day] = iso.split("-");
  return `${Number(day)} ${months[Number(month) - 1]}`;
}

/** "3,323": the same in Node and in every browser. */
export function thousands(value: number) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
