/**
 * Facts the site states in more than one place, kept here so that changing one
 * changes every page.
 */

/**
 * Whether Kozmos's public packages are on npm: the first four since
 * 2026-09-23, and @kozmos-ds/styles since 2026-11-06 (0.15.1, with React
 * 0.15.1).
 * This flag is not a version: query npm or read the dated release evidence
 * in docs/release-process.md for package versions.
 */
export const PACKAGES_PUBLISHED = true;

/**
 * Whether search engines may index the site. False until the public launch:
 * a pre-release deploy should not be found. Every page then carries
 * `<meta name="robots" content="noindex">`.
 */
export const SITE_INDEXABLE = false;

/** The packages a web consumer installs, in the order the README lists them. */
export const PUBLIC_PACKAGES = [
  {
    name: "@kozmos-ds/react",
    summary: "The React components, their stylesheet and the ThemeProvider.",
  },
  {
    name: "@kozmos-ds/tokens",
    summary:
      "Every token as CSS variables for both themes and as JavaScript (the light values), and the Swift and Kotlin sources the native libraries build from.",
  },
  {
    name: "@kozmos-ds/icons",
    summary:
      "The icon registry and the outlines Kozmos owns, as React components and, from @kozmos-ds/icons/vue, as Vue 3 components.",
  },
  {
    name: "@kozmos-ds/product-contracts",
    summary: "Platform-neutral shapes for POI, floor, route and map data.",
  },
  {
    name: "@kozmos-ds/styles",
    summary:
      "The stylesheet alone, as plain CSS: the tokens for both themes and densities, the owned rules, the scoped preflight and the utilities. React ships the same file; an app without React imports it from here.",
  },
] as const;

/** The name the browser tab and the menu drawer use. */
export const SITE_NAME = "Kozmos";

/**
 * The words the logo shows, as its text alternative. An image of text is
 * named with that text (WCAG 1.1.1), and the header's home link, named by the
 * logo, then carries the words a visitor sees (WCAG 2.5.3, label in name), so
 * voice control can find it by them.
 */
export const LOGO_TEXT = "Kozmos UI Design Systems";

/** Where the theme choice is remembered. Only this site reads or writes it. */
export const THEME_STORAGE_KEY = "kozmos-site-theme";

/** Builds a page title the way every route does. */
export function pageTitle(title?: string) {
  const site = `${SITE_NAME} design system`;
  return title ? `${title} · ${site}` : site;
}
