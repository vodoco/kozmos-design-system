import { assetPath } from "./asset";

/**
 * Storybook is the component reference (decision 44): every component's
 * docs, stories, controls and code on each platform. It is published with
 * the site, in the same Pages artifact, in a folder of its own
 * (.github/workflows/pages.yml), so it hangs off the site's base like the
 * files in public/.
 *
 * It is not a page of this app. A link to it must load it: a plain link, or
 * a router link with `reloadDocument`. A router link that navigates in the
 * app would look for a route of that name and find the not-found page.
 */
export const STORYBOOK_FOLDER = "storybook/";

/** Storybook's address under a base that ends in "/". */
export function storybookPath(base: string): string {
  return assetPath(base, STORYBOOK_FOLDER);
}

/** Storybook's address in this build, for a plain link. */
export function storybookHref(): string {
  return storybookPath(import.meta.env.BASE_URL);
}

/**
 * Storybook, or one of its pages, as a router link's `to`: from the app's
 * root, since the router adds its basename itself. A page is named by the
 * `path` Storybook's address takes — `/docs/<id>` for a docs page,
 * `/story/<id>` for a story — which the site's component data carries for
 * every component (scripts/generate-reference.mjs).
 */
export function storybookTo(page?: string): string {
  return `/${STORYBOOK_FOLDER}${page ? `?path=${page}` : ""}`;
}
