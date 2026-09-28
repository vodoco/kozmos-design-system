/**
 * The foundations pages, as data: the sidebar, the index cards and the route
 * table all read this. Each slug needs `src/routes/foundations/<slug>.tsx`.
 */
export interface FoundationPage {
  slug: string;
  title: string;
  summary: string;
}

export const foundationPages: readonly FoundationPage[] = [
  {
    slug: "colour",
    title: "Colour",
    summary:
      "The primitive ramps, the semantic roles built on them, and the contrast pairs CI holds in both themes.",
  },
  {
    slug: "typography",
    title: "Typography",
    summary:
      "The families, the scale the components use, and the heading and paragraph sizes the tokens carry.",
  },
  {
    slug: "layout",
    title: "Layout",
    summary:
      "Spacing, sizing, radius roles, border widths, breakpoints, touch targets and layers.",
  },
  {
    slug: "elevation",
    title: "Elevation and effects",
    summary:
      "The three shadow roles, the overlay scrims, the glass material and the opacity scale.",
  },
  {
    slug: "motion",
    title: "Motion",
    summary:
      "Durations, easings, entry and exit scale, slide distances, and reduced motion.",
  },
  {
    slug: "icons",
    title: "Icons",
    summary:
      "Every icon in the set, searchable, with its name to copy and its aliases.",
  },
  {
    slug: "theming",
    title: "Theming",
    summary:
      "Light and dark, right to left, a theme kept between visits, and re-pointing tokens for a brand.",
  },
];

export const foundationsSection = {
  title: "Foundations",
  summary: "What every component is made from.",
  pages: [
    { to: "/foundations", title: "Overview" },
    ...foundationPages.map((page) => ({
      to: `/foundations/${page.slug}`,
      title: page.title,
    })),
  ],
};

export function foundationPage(slug: string): FoundationPage {
  const page = foundationPages.find((entry) => entry.slug === slug);
  if (!page) throw new Error(`No foundations page is registered as "${slug}".`);
  return page;
}
