import { assetPath } from "./asset";

/**
 * Storybook is the component reference (decision 44): every component's
 * docs, stories, controls and code on each platform. It is published with
 * the site, in the same Pages artifact, in a folder of its own
 * (.github/workflows/pages.yml), so it hangs off the site's base like the
 * files in public/.
 *
 * It is not a page of this app. A link to it must be a plain link, which
 * leaves the app and loads Storybook; a router link would look for a route
 * of that name and find the not-found page.
 */
export const STORYBOOK_FOLDER = "storybook/";

/** Storybook's address under a base that ends in "/". */
export function storybookPath(base: string): string {
  return assetPath(base, STORYBOOK_FOLDER);
}

/** Storybook's address in this build. */
export function storybookHref(): string {
  return storybookPath(import.meta.env.BASE_URL);
}
