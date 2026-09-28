#!/usr/bin/env node
/**
 * Every component page links to its page in Storybook, by the `path`
 * Storybook's address takes (`/docs/<id>`, `/story/<id>`). The site derives
 * those ids from the stories' titles as Storybook does
 * (scripts/generate-reference.mjs); this reads the ids a Storybook build
 * really has, from its index.json, and fails on any link to a page it lacks.
 * A title renamed on one side and not the other would otherwise publish a
 * link to Storybook's "not found".
 *
 *   node scripts/check-storybook-links.mjs [path/to/storybook-static/index.json]
 *
 * Run after `pnpm generate` and a Storybook build: the site's workflow runs
 * it on every pull request, and the Pages workflow before it publishes.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SITE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const COMPONENTS = path.join(SITE_ROOT, "src/generated/components.json");
const STORYBOOK_INDEX = path.join(
  SITE_ROOT,
  "..",
  "docs",
  "storybook-static",
  "index.json",
);

/** The paths a Storybook build answers: `/docs/<id>` and `/story/<id>`. */
export function storybookPaths(index) {
  return new Set(
    Object.values(index.entries ?? {}).map(
      (entry) => `/${entry.type === "docs" ? "docs" : "story"}/${entry.id}`,
    ),
  );
}

/** The components whose link names no page of the build, and those with no link at all. */
export function checkLinks(components, index) {
  const paths = storybookPaths(index);
  return {
    broken: components.filter(
      (component) => component.storybook && !paths.has(component.storybook),
    ),
    unlinked: components.filter((component) => !component.storybook),
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const indexPath = path.resolve(process.argv[2] ?? STORYBOOK_INDEX);
  const { components } = JSON.parse(fs.readFileSync(COMPONENTS, "utf8"));
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  const { broken, unlinked } = checkLinks(components, index);
  for (const component of unlinked) {
    console.log(`${component.name}: no stories, so no Storybook link`);
  }
  if (broken.length) {
    console.error(
      `check-storybook-links: ${broken.length} link(s) to pages ${path.relative(process.cwd(), indexPath)} does not have:`,
    );
    for (const component of broken) {
      console.error(`  ${component.name} → ?path=${component.storybook}`);
    }
    process.exit(1);
  }
  const linked = components.length - unlinked.length;
  const docs = components.filter((component) =>
    component.storybook?.startsWith("/docs/"),
  ).length;
  const stories = linked - docs;
  console.log(
    `check-storybook-links: all ${linked} links land — ${docs} on a docs page, ${stories} on the component's first story.`,
  );
}
