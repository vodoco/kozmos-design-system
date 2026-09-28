/**
 * The examples, as data. `routes.ts` reads this in Node to register one route
 * per example, so it must stay free of React and CSS imports. Each entry needs
 * `src/examples/<slug>/route.tsx`; the build fails without it.
 */

export type ExampleKind = "page" | "app";

export interface ExampleEntry {
  slug: string;
  title: string;
  kind: ExampleKind;
  /** One or two sentences for the index card and the page's meta description. */
  summary: string;
  /**
   * Where the example differs from what a product would draw, because Kozmos
   * cannot express it yet. Each names its entry in GAPS.md; the roadmap
   * lists the examples each item shows in from these.
   */
  gaps: readonly string[];
  /** Shown small on the home page; the index shows every example. */
  featured?: boolean;
  /** One sentence for the home page's card, where the summary is too long. */
  tagline?: string;
}

export const examples: readonly ExampleEntry[] = [
  {
    slug: "wayfinding",
    featured: true,
    tagline:
      "Choose a place, compare the quickest and the step-free route, and walk it step by step, floor by floor.",
    title: "Wayfinding",
    kind: "app",
    summary:
      "Directions through the shopping centre, as the SDK presents them: choose a place, compare the quickest and the step-free route, then walk it step by step with the manoeuvre card, the summary, the progress rail and the announcer, and rate it on arrival. While a route is shown, the step-free control takes the location control’s place on the map. The route is drawn by hand: Kozmos lays out around a map engine and does not draw one.",
    gaps: [
      "GAP-17 · The map shell’s panel is an aside, a landmark that should not sit inside the page’s main.",
      "GAP-33 · Kozmos has no token for the route line a map engine draws; the dots that stand in for it take the theme’s colour.",
      "GAP-91 · The map shell’s top bar and controls sit in boxes that scroll, which cut their shadows off at the box’s edge.",
      "GAP-92 · The map shell does not say which edge it sets its controls against, so the example reads it from the layout the shell reports.",
    ],
  },
  {
    slug: "phone-search",
    featured: true,
    tagline:
      "A phone’s map screen: search or browse the centre, then read about a place in a sheet at three heights.",
    title: "Phone search sheet",
    kind: "app",
    summary:
      "A phone’s map screen: search or browse the centre by category, pick a place from the list or the map, and read about it in a bottom sheet that rests at a peek, half or full height. The AI button beside the search opens the assistant, which answers with places and can hold a scripted voice conversation. The sheet is the SDK’s adaptive shell in a phone-sized frame.",
    gaps: [
      "GAP-17 · The map shell’s panel is an aside, a landmark that should not sit inside the page’s main.",
      "GAP-20 · In Safari and other WebKit browsers, the search field is drawn as a small native field: Kozmos’s styles do not reach it there.",
      "GAP-29 · A phone app’s tab bar is missing: BottomNavigation pins itself to the browser’s viewport and cannot sit in the frame.",
      "GAP-15 · Food and drink, toilets, accessible facilities, parking and first aid are left out: Kozmos has no icon for them.",
      "GAP-53 · The phone’s rounded corners cut the sheet’s: the sheet keeps square, bordered bottom corners, and the shell has no edge-to-edge form.",
      "GAP-91 · The map shell’s top bar and controls sit in boxes that scroll, which cut their shadows off at the box’s edge.",
      "GAP-83 · The assistant’s thread scrolls and takes no focus of its own, so the example gives it a tab stop.",
      "GAP-88 · The title over an answer’s places is a paragraph, not a heading, so heading navigation passes them by.",
      "GAP-93 · The assistant covers the frame but leaves what it covers in reach of the keyboard, so the example makes the map and the sheet inert while it is open.",
    ],
  },
  {
    slug: "kiosk-directory",
    title: "Kiosk directory",
    kind: "app",
    summary:
      "A touch-screen directory at the centre’s entrance: browse by category or search, see the places on the map, read about one, get the route from the kiosk and send it to a phone with a code. After a while alone it shows its attract screen.",
    gaps: [
      "GAP-15 · Food and drink, toilets, accessible facilities, parking and first aid are left out: Kozmos has no icon for them.",
      "GAP-33 · Kozmos has no token for the route line a map engine draws; the dots that stand in for it take the theme’s colour.",
      "GAP-34 · The attract screen is a Surface laid over the directory: Backdrop pins itself to the browser’s viewport and would cover the site.",
      "GAP-35 · The category grid is four columns at any width, so the directory column is kept wide enough for the names to fit.",
    ],
  },
  {
    slug: "venue-explorer",
    title: "Venue explorer",
    kind: "app",
    summary:
      "Search a shopping centre, browse it by category, pick a place from the results or the map, and read its details, across three floors, with the SDK’s location control to follow the visitor. The map is a stand-in: Kozmos lays out around a map engine and does not draw one.",
    gaps: [
      "GAP-15 · Food and drink, toilets, accessible facilities, parking and first aid are left out: Kozmos has no icon for them.",
      "GAP-17 · The map shell’s panel is an aside, a landmark that should not sit inside the page’s main.",
      "GAP-18 · The place details use the sheet presentation; on the shell’s panel, the action message’s block loses its background.",
      "GAP-20 · In Safari and other WebKit browsers, the search field is drawn as a small native field: Kozmos’s styles do not reach it there.",
      "GAP-91 · The map shell’s top bar and controls sit in boxes that scroll, which cut their shadows off at the box’s edge.",
      "GAP-92 · The map shell does not say which edge it sets its controls against, so the example reads it from the layout the shell reports.",
    ],
  },
  {
    slug: "sign-in",
    title: "Sign in",
    kind: "page",
    summary:
      "Email and password with validation, then a six-digit code sent to a phone, with a resend that waits. The code that works is 123456.",
    gaps: [],
  },
  {
    slug: "dashboard",
    featured: true,
    tagline:
      "The venues console: facts across every venue, and a table to search, filter, page through and add to.",
    title: "Operations dashboard",
    kind: "page",
    summary:
      "The venues console: a navbar, a navigation rail, facts across every venue, then a table you can search, filter by status and city, page through, refresh and add to, with an action menu per row.",
    gaps: [
      "GAP-47 · Sidebar has no narrow-screen form, so below 48rem the rail’s sections open in a Drawer from the navbar.",
      "GAP-13 · SelectTrigger takes no label, so each select is labelled by a FieldWrapper around it.",
      'GAP-32 · ChipGroup carries no role, so the status filter passes role="group" for its label to count.',
      "GAP-36 · Toasts pin themselves to the browser’s corner, outside the page, so confirmations are an inline Alert instead.",
    ],
  },
  {
    slug: "booking",
    title: "Room booking",
    kind: "page",
    summary:
      "Book a meeting room in three steps: when and which room, who and why, then confirm; each step checks its fields before the next.",
    gaps: [
      "GAP-13 · Textarea has no helper text, so the character count is a Text beside it.",
    ],
  },
  {
    slug: "notifications",
    title: "Notifications inbox",
    kind: "page",
    summary:
      "An inbox by kind: alerts, mentions and system messages, unread first if you like, marked read one at a time or all at once with an undo, and preferences in a popover.",
    gaps: [
      "GAP-36 · Toasts pin themselves to the browser’s corner, outside the page, so the undo sits in an inline Alert instead.",
    ],
  },
  {
    slug: "onboarding",
    title: "First-run onboarding",
    kind: "page",
    summary:
      "The visitor app’s first run in five short steps: units and search radius, interests, location permission, and a summary before the map opens.",
    gaps: [
      'GAP-32 · ChipGroup carries no role, so the interests pass role="group" for their label to count.',
    ],
  },
  {
    slug: "states",
    title: "Loading, empty, error, offline",
    kind: "page",
    summary:
      "One panel in every state a product meets: loading with a spinner and skeleton rows, ready, empty with a way out, failed with a retry, and offline with the saved copy while a sync keeps trying.",
    gaps: [
      "GAP-11 · EmptyState’s title is not a heading, so the empty state reads as text under the card’s heading.",
    ],
  },
  {
    slug: "feedback-survey",
    title: "Feedback survey",
    kind: "page",
    summary:
      "The SDK’s rating card first, then two more questions: a likelihood slider, how the visitor found the way, what would have helped, a comment, and an email if they want to hear back.",
    gaps: [
      "GAP-13 · Textarea has no helper text, so the character count is a Text beside it.",
    ],
  },
  {
    slug: "saved-places",
    title: "Saved places",
    kind: "page",
    summary:
      "A visitor’s saved places by venue in a tree with a remove action per row, confirmed in a dialog and undone inline; and the car’s spot, saved, routed to, or given a note.",
    gaps: [
      "GAP-36 · Toasts pin themselves to the browser’s corner, outside the page, so the undo sits in an inline Alert instead.",
    ],
  },
  {
    slug: "account-settings",
    title: "Account settings",
    kind: "page",
    summary:
      "A profile, notification and security settings page: fields with validation, switches, a radio group, tabs and confirmations.",
    gaps: [
      "GAP-13 · SelectTrigger takes no label, so each select is labelled by a FieldWrapper around it.",
      "GAP-13 · Textarea has no helper text, so the character count is a Text tied to the field with aria-describedby.",
    ],
  },
];

export const exampleKindLabel: Record<ExampleKind, string> = {
  page: "Page",
  app: "App",
};

export function getExample(slug: string): ExampleEntry {
  const example = examples.find((entry) => entry.slug === slug);
  if (!example) {
    throw new Error(`No example is registered as "${slug}".`);
  }
  return example;
}
