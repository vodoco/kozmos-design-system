#!/usr/bin/env node
// Removes the visual baselines whose story no longer exists in the built
// Storybooks, React's and Vue's (or has opted out with `no-visual`).
// Recording rewrites only the drawings that changed, so a baseline whose
// story was deleted or renamed would otherwise stay behind for ever.
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const dir = "tests/visual/baselines";
// Both builds, or neither: pruned against React's index alone, every Vue
// baseline would look like a story that is gone.
const indexes = [
  "apps/docs/storybook-static/index.json",
  "apps/docs/storybook-internal/vue/index.json",
];
for (const file of indexes)
  if (!existsSync(file)) {
    console.error(
      `No ${file}: build both Storybooks before pruning (pnpm --filter @kozmos-ds/docs build-storybook and build-storybook:vue).`,
    );
    process.exit(1);
  }
const expected = new Set(
  indexes.flatMap((file) =>
    Object.values(JSON.parse(readFileSync(file, "utf8")).entries)
      .filter(
        (entry) => entry.type === "story" && !entry.tags?.includes("no-visual"),
      )
      .flatMap((entry) => [`${entry.id}--light.png`, `${entry.id}--dark.png`]),
  ),
);

const removed = readdirSync(dir).filter(
  (file) => file.endsWith(".png") && !expected.has(file),
);
// A Storybook built from an older checkout lacks the newest stories, and
// pruning against it would delete their baselines. A handful is a story
// renamed or removed; more looks like a stale build, so say so and stop
// unless told otherwise.
if (removed.length > 20 && process.env.VISUAL_PRUNE_MANY !== "1") {
  console.error(
    `Would remove ${removed.length} baselines: are apps/docs/storybook-static and storybook-internal/vue built from this ` +
      "checkout? Rebuild them, or set VISUAL_PRUNE_MANY=1 if so many stories really went.",
  );
  process.exit(1);
}
for (const file of removed) rmSync(join(dir, file));
console.log(
  removed.length
    ? `Removed ${removed.length} baseline(s) of stories that are gone:\n${removed.join("\n")}`
    : "No baseline outlived its story.",
);
