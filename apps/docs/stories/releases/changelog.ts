// The Releases guide reads each package's own CHANGELOG.md, so it is never a
// copy that can fall behind: a version PR that writes a changelog changes it.
import androidLog from "../../../../packages/android/CHANGELOG.md?raw";
import iconsLog from "../../../../packages/icons/CHANGELOG.md?raw";
import iosLog from "../../../../packages/ios/CHANGELOG.md?raw";
import contractsLog from "../../../../packages/product-contracts/CHANGELOG.md?raw";
import reactLog from "../../../../packages/react/CHANGELOG.md?raw";
import stylesLog from "../../../../packages/styles/CHANGELOG.md?raw";
import tokensLog from "../../../../packages/tokens/CHANGELOG.md?raw";
import vueLog from "../../../../packages/vue/CHANGELOG.md?raw";

export const REPOSITORY = "https://github.com/vodoco/kozmos-design-system";

export interface ReleasePackage {
  /** The tab's id. */
  id: string;
  label: string;
  /** The npm name, or null for a part used from the repository. */
  npm: string | null;
  /** Where the changelog lives in the repository. */
  path: string;
  /** How a product gets it. */
  channel: string;
  text: string;
}

export const PACKAGES: readonly ReleasePackage[] = [
  {
    id: "react",
    label: "React",
    npm: "@kozmos-ds/react",
    path: "packages/react",
    channel: "npm, latest",
    text: reactLog,
  },
  {
    id: "styles",
    label: "Styles",
    npm: "@kozmos-ds/styles",
    path: "packages/styles",
    channel: "npm, latest",
    text: stylesLog,
  },
  {
    id: "tokens",
    label: "Tokens",
    npm: "@kozmos-ds/tokens",
    path: "packages/tokens",
    channel: "npm, latest",
    text: tokensLog,
  },
  {
    id: "icons",
    label: "Icons",
    npm: "@kozmos-ds/icons",
    path: "packages/icons",
    channel: "npm, latest",
    text: iconsLog,
  },
  {
    id: "product-contracts",
    label: "Product contracts",
    npm: "@kozmos-ds/product-contracts",
    path: "packages/product-contracts",
    channel: "npm, latest",
    text: contractsLog,
  },
  {
    id: "vue",
    label: "Vue",
    npm: "@kozmos-ds/vue",
    path: "packages/vue",
    channel: "npm, next (prereleases only)",
    text: vueLog,
  },
  {
    id: "ios",
    label: "SwiftUI",
    npm: null,
    path: "packages/ios",
    channel: "this repository's source, at a release tag",
    text: iosLog,
  },
  {
    id: "android",
    label: "Compose",
    npm: null,
    path: "packages/android",
    channel: "this repository's source, at a release tag",
    text: androidLog,
  },
];

export interface ReleaseSection {
  /** The heading's words: `0.17.0`, or `0.13.0 — repository snapshot`. */
  title: string;
  /** The version the heading starts with, or null (an Unreleased section). */
  version: string | null;
  body: string;
}

const VERSION = /^(\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?)\b/;

/** The changelog's `## ` sections, newest first, as the file orders them. */
export function sections(text: string): ReleaseSection[] {
  const parts = text.split(/^## /m).slice(1);
  return parts.map((part) => {
    const newline = part.indexOf("\n");
    const title = (newline === -1 ? part : part.slice(0, newline)).trim();
    const body = newline === -1 ? "" : part.slice(newline + 1).trim();
    return { title, version: VERSION.exec(title)?.[1] ?? null, body };
  });
}

/**
 * A section's Markdown made readable outside the repository: Changesets'
 * commit ids link to their commits, and a link relative to the package's
 * folder links to the file on GitHub.
 */
export function forPage(body: string, packagePath: string): string {
  const linked = body
    .replace(
      /^(\s*- )([0-9a-f]{7,40}): /gm,
      (_m, lead: string, sha: string) =>
        `${lead}[${sha}](${REPOSITORY}/commit/${sha}): `,
    )
    .replace(
      /Updated dependencies \[([0-9a-f, ]+)\]/g,
      (_m, list: string) =>
        `Updated dependencies ${list
          .split(/,\s*/)
          .filter(Boolean)
          .map((sha) => `[${sha}](${REPOSITORY}/commit/${sha})`)
          .join(", ")}`,
    );
  return linked.replace(/\]\((\.{1,2}\/[^)\s]+)\)/g, (_m, relative: string) => {
    const url = new URL(relative, `https://repo.invalid/${packagePath}/`);
    return `](${REPOSITORY}/blob/main/${url.pathname.slice(1)}${url.hash})`;
  });
}
