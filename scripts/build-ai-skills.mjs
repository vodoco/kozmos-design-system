/**
 * The AI-facing component inventory, generated from the code.
 *
 * `.ai-skills/` is what an assistant is handed as fact about Kozmos. Its
 * inventory was written by hand as a brief before the system existed: it
 * listed 64 components, named several that were never built (Typography,
 * Navbar, BottomNavigation, FloorSelector, POICard, Search) and knew nothing
 * of the 48 added since — every Product/SDK part, the AI Companion, the map
 * shell. A stale inventory is worse than none, because an assistant reads it
 * as the complete set and works around what it thinks is missing.
 *
 * This generates it instead, from four sources that cannot disagree with the
 * code because they ARE the code:
 *
 *   - the component directories under packages/react/src/components;
 *   - each one's Storybook `meta.title`, which carries the real category;
 *   - each one's variant axes, read the way check-variant-parity reads them,
 *     including a union given a name;
 *   - whether SwiftUI and Compose have it.
 *
 * `--check` fails when the written file is stale, so the inventory cannot
 * drift again without a red build.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

/**
 * Written the way the repository writes markdown.
 *
 * lint-staged runs prettier over every committed .md, so a generator that
 * emits anything prettier would reflow produces a file that is stale the
 * instant it is committed — `skills:check` went red on its own output the
 * first time. Formatting here makes generate, commit and check agree. Same
 * trap the JSON generators closed.
 */
async function formatted(markdown, filepath) {
  const config = (await prettier.resolveConfig(filepath)) ?? {};
  return prettier.format(markdown, { ...config, filepath });
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REACT = path.join(root, "packages/react/src/components");
const IOS = path.join(root, "packages/ios/Sources/Components");
const ANDROID = path.join(root, "packages/android/src/main/java/com/kozmos/components");
const OUT = path.join(root, ".ai-skills/component-inventory.md");

const read = (f) => (fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null);

/** The category a component is filed under in Storybook, from meta.title. */
function categoryOf(name) {
  const stories = read(path.join(REACT, name, `${name}.stories.tsx`));
  if (!stories) return "Uncategorised";
  // Only the meta block's title: a story's args can carry a `title` too, and
  // matching those filed Card under "Starbucks Coffee".
  const meta = /(?:const meta[^=]*=|export default)\s*\{([\s\S]*?)\n\}/.exec(stories);
  const title = meta && /title:\s*["']([^"']+)["']/.exec(meta[1]);
  return title ? title[1].split("/")[0].trim() : "Uncategorised";
}

/** Variant axes, inline or behind a named union — the same two forms the
 *  parity analyser reads. */
function axesOf(name) {
  const file = read(path.join(REACT, name, `${name}.tsx`));
  if (!file) return {};
  const axes = {};
  const cva = /variants:\s*\{([\s\S]*?)\n\s{2}\},?\n/.exec(file);
  if (cva) {
    for (const axis of ["variant", "size", "status", "tone", "density"]) {
      const block = new RegExp(`^\\s{4}${axis}:\\s*\\{([\\s\\S]*?)^\\s{4}\\},?$`, "m").exec(cva[1]);
      if (!block) continue;
      const values = [...block[1].matchAll(/^\s{6}["']?([\w-]+)["']?:/gm)].map((m) => m[1]);
      if (values.length) axes[axis] = values;
    }
  }
  const aliases = {};
  for (const a of file.matchAll(/^(?:export )?type (\w+)\s*=\s*((?:\s*\|?\s*["'][^"']+["'])+)\s*;/gm)) {
    const values = [...a[2].matchAll(/["']([^"']+)["']/g)].map((v) => v[1]);
    if (values.length > 1) aliases[a[1]] = values;
  }
  const props =
    file.match(new RegExp(`export interface ${name}Props[\\s\\S]*?\\n\\}`)) ??
    file.match(new RegExp(`interface ${name}Props[\\s\\S]*?\\n\\}`));
  if (props) {
    for (const m of props[0].matchAll(/^\s+([a-zA-Z][a-zA-Z0-9]*)\??:\s*(.+?);$/gm)) {
      const inline = [...m[2].matchAll(/["']([^"']+)["']/g)].map((v) => v[1]);
      if (inline.length > 1) axes[m[1]] = inline;
      else if (aliases[m[2].trim()]) axes[m[1]] = aliases[m[2].trim()];
    }
  }
  return axes;
}

/**
 * Components whose props are another component's, resolved from the built
 * types. `IconButtonProps = ButtonProps`, so IconButton accepts every one of
 * Button's variants — and printing "—" against it would tell an assistant the
 * opposite of the truth, which is the failure this file exists to stop.
 */
function propAliases() {
  const dts = read(path.join(root, "packages/react/dist/index.d.ts"));
  const map = {};
  if (!dts) return map;
  for (const m of dts.matchAll(
    /export declare type (\w+)Props = (\w+)Props;/g,
  ))
    map[m[1]] = m[2];
  return map;
}

const aliasOf = propAliases();

const components = fs
  .readdirSync(REACT)
  .filter((c) => fs.existsSync(path.join(REACT, c, `${c}.tsx`)))
  .sort();

const byCategory = new Map();
for (const name of components) {
  const category = categoryOf(name);
  if (!byCategory.has(category)) byCategory.set(category, []);
  const own = axesOf(name);
  const inherited = aliasOf[name] ? axesOf(aliasOf[name]) : null;
  byCategory.get(category).push({
    name,
    axes: Object.keys(own).length ? own : (inherited ?? {}),
    inheritsFrom: Object.keys(own).length ? null : (aliasOf[name] ?? null),
    ios: fs.existsSync(path.join(IOS, name)),
    android: fs.existsSync(path.join(ANDROID, name)),
  });
}

const manifests = {};
for (const p of fs.readdirSync(path.join(root, "packages"))) {
  const m = read(path.join(root, "packages", p, "package.json"));
  if (!m) continue;
  const json = JSON.parse(m);
  if (json.name && !json.private) manifests[json.name] = json.version;
}

const lines = [];
lines.push("# Kozmos component inventory");
lines.push("");
lines.push(
  "**Generated by `pnpm skills:build` from the code. Do not edit by hand** —",
);
lines.push(
  "`pnpm skills:check` fails when this file and the components disagree.",
);
lines.push("");
lines.push("## Packages");
lines.push("");
lines.push("| package | version |");
lines.push("| --- | --- |");
for (const [name, version] of Object.entries(manifests).sort())
  lines.push(`| \`${name}\` | ${version} |`);
lines.push("");
lines.push(
  "`@kozmos-ds/vue` exists in the workspace but is **private**: an internal",
);
lines.push("harness, not something to install. There is no React Native package.");
lines.push("");
lines.push(`## Components (${components.length})`);
lines.push("");
lines.push(
  "**iOS** and **Android** say whether that platform has the component at all.",
);
lines.push(
  "**Variants** are the axes the React component actually declares, with every",
);
lines.push("value it accepts — these are the only values that compile.");
lines.push("");

for (const category of [...byCategory.keys()].sort()) {
  const entries = byCategory.get(category);
  lines.push(`### ${category} (${entries.length})`);
  lines.push("");
  lines.push("| Component | iOS | Android | Variants |");
  lines.push("| --- | :-: | :-: | --- |");
  for (const e of entries) {
    let axes = Object.entries(e.axes)
      .map(([axis, values]) => `\`${axis}\`: ${values.join(" \\| ")}`)
      .join("<br>");
    if (axes && e.inheritsFrom)
      axes = `*same props as \`${e.inheritsFrom}\`* — ${axes}`;
    lines.push(
      `| **${e.name}** | ${e.ios ? "✅" : "—"} | ${e.android ? "✅" : "—"} | ${axes || "—"} |`,
    );
  }
  lines.push("");
}

const next = await formatted(lines.join("\n"), OUT);
const current = read(OUT);

// ---------------------------------------------------------------- changelog

/**
 * The API changelog, from the packages' own CHANGELOG.md.
 *
 * What was here described a "Current Version (v3.x)" with a planned 3.0.0, a
 * Modal component, `isLoading`, `leftIcon`/`rightIcon`, a `<Button.Icon>`
 * compound, a `variant="primary"` to `variant="solid"` rename and a
 * `color.brand.*` to `color.interactive.*` token migration. None of it was
 * ever true of this repository: the packages have never left 0.x, and none of
 * those names exists. An assistant reading it wrote code that cannot compile.
 */
const CHANGELOG_OUT = path.join(root, ".ai-skills/api-changelog.md");
const changelogLines = [];
changelogLines.push("# Kozmos API changelog");
changelogLines.push("");
changelogLines.push(
  "**Generated by `pnpm skills:build` from each package's own CHANGELOG.md.**",
);
changelogLines.push(
  "`pnpm skills:check` fails when this file and those changelogs disagree.",
);
changelogLines.push("");
changelogLines.push(
  "Every package is on 0.x. There has been no 1.0, no major version and no",
);
changelogLines.push(
  "breaking-change migration, so there are no codemods and nothing to migrate",
);
changelogLines.push("from. A minor bump can still change behaviour: read the entry.");
changelogLines.push("");
for (const [name, version] of Object.entries(manifests).sort()) {
  const dir = name.replace("@kozmos-ds/", "");
  const log = read(path.join(root, "packages", dir, "CHANGELOG.md"));
  changelogLines.push(`## \`${name}\` — current ${version}`);
  changelogLines.push("");
  if (!log) {
    changelogLines.push("No changelog yet.");
    changelogLines.push("");
    continue;
  }
  // Every release heading and its notes, minus the package's own H1.
  const body = log.split("\n").slice(1).join("\n").trim();
  // Deepest first: bumping `##` before `###` would turn a version heading
  // into `####` on the second pass and bury it under its own notes.
  changelogLines.push(
    body.replace(/^### /gm, "#### ").replace(/^## /gm, "### "),
  );
  changelogLines.push("");
}
const changelogNext = await formatted(
  changelogLines.join("\n").replace(/\n{3,}/g, "\n\n"),
  CHANGELOG_OUT,
);
const changelogCurrent = read(CHANGELOG_OUT);

const stale = [];
if (current !== next) stale.push(path.relative(root, OUT));
if (changelogCurrent !== changelogNext) stale.push(path.relative(root, CHANGELOG_OUT));

if (process.argv.includes("--check")) {
  if (stale.length) {
    console.error(
      `Stale AI-facing docs: ${stale.join(", ")}.\nRun \`pnpm skills:build\` and commit them.`,
    );
    process.exit(1);
  }
  console.log(
    `AI-facing generated docs ok: ${components.length} components across ${byCategory.size} categories, ${Object.keys(manifests).length} package changelogs.`,
  );
} else {
  fs.writeFileSync(OUT, next);
  fs.writeFileSync(CHANGELOG_OUT, changelogNext);
  console.log(
    `Wrote the inventory (${components.length} components, ${byCategory.size} categories) and the changelog (${Object.keys(manifests).length} packages).`,
  );
}
