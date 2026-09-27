#!/usr/bin/env node
// Removes the visual baselines whose story no longer exists in the built
// Storybook (or has opted out with `no-visual`). Recording rewrites only the
// drawings that changed, so a baseline whose story was deleted or renamed
// would otherwise stay behind for ever.
import { readdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const dir = "tests/visual/baselines";
const index = JSON.parse(
  readFileSync("apps/docs/storybook-static/index.json", "utf8"),
);
const expected = new Set(
  Object.values(index.entries)
    .filter(
      (entry) => entry.type === "story" && !entry.tags?.includes("no-visual"),
    )
    .flatMap((entry) => [`${entry.id}--light.png`, `${entry.id}--dark.png`]),
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
    `Would remove ${removed.length} baselines: is apps/docs/storybook-static built from this ` +
      "checkout? Rebuild it, or set VISUAL_PRUNE_MANY=1 if so many stories really went.",
  );
  process.exit(1);
}
for (const file of removed) rmSync(join(dir, file));
console.log(
  removed.length
    ? `Removed ${removed.length} baseline(s) of stories that are gone:\n${removed.join("\n")}`
    : "No baseline outlived its story.",
);
