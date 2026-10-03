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
 * This generates it from source and built declarations, rather than a second
 * hand-maintained inventory. Tests independently check representative facts;
 * extraction still needs review and does not prove runtime behaviour:
 *
 *   - the component directories under packages/react/src/components, and
 *     the exports of @kozmos-ds/react each one owns;
 *   - each one's Storybook `meta.title`, which carries the real category,
 *     read the way the Claude Design cards read it;
 *   - each export's props that take a closed set of values, with every value,
 *     as the TypeScript checker resolves them from the built declarations
 *     (scripts/skills/ai-facts.mjs). They were read with regular expressions
 *     that assumed how the source was laid out, and Badge and Tag came out
 *     with no axes and Button without `emotion` (the review's T2);
 *   - whether SwiftUI and Compose have it.
 *
 * A fact the checker cannot resolve is written as unknown, never as "none".
 * `--check` fails when the written file is stale, so the inventory cannot
 * drift again without a red build.
 *
 * It also writes docs/claude-design/, what the Kozmos artifact in Claude
 * Design carries (decision 52): the consuming page and one API card per
 * component, from the built declarations — so it needs
 * `pnpm --filter "@kozmos-ds/react..." build` first, and says so without one.
 * See scripts/skills/claude-design-docs.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";
import {
  AXIS_ORIGINS,
  componentDirectories,
  readKozmosFacts,
} from "./skills/ai-facts.mjs";
import { LANGUAGES } from "./skills/ai-snippets.mjs";
import {
  CARDS_DIR,
  buildClaudeDesignDocs,
} from "./skills/claude-design-docs.mjs";
import { readStories, storyProgram } from "./skills/claude-design-examples.mjs";

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
const ANDROID = path.join(
  root,
  "packages/android/src/main/java/com/kozmos/components",
);
const OUT = path.join(root, ".ai-skills/component-inventory.md");

const read = (f) => (fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null);

// ------------------------------------------------------------- the facts

const facts = readKozmosFacts(root);
const directories = componentDirectories(root, facts);

/** The category each directory is filed under in Storybook, from meta.title. */
const storyFiles = directories
  .map((d) => path.join(REACT, d.name, `${d.name}.stories.tsx`))
  .filter((file) => fs.existsSync(file));
const stories = storyProgram(storyFiles);
function categoryOf(name) {
  const file = path.join(REACT, name, `${name}.stories.tsx`);
  if (!storyFiles.includes(file)) return "Uncategorised";
  const title = readStories(stories.program, file).meta.title;
  return title ? title.split("/")[0].trim() : "Uncategorised";
}

/** A value as the inventory writes it: a table cell holds no bare pipe. */
const cell = (text) => text.replace(/\|/g, "\\|");

/**
 * The props of one component export worth listing: its own and Radix's that
 * take literal values, each as `name`: a | b | c, and what else it takes when
 * it takes more than literals. Or the reason its facts are unknown.
 */
function variantsOf(name, prefix) {
  const component = facts.components.get(name);
  const label = (prop) => `\`${prefix ? `${name}.` : ""}${prop}\``;
  if (component.unknown)
    return [`${label("*")}: **unknown**: ${component.unknown}`];
  const lines = [];
  for (const [prop, { origin, accepted }] of component.props) {
    if (!AXIS_ORIGINS.has(origin) && origin !== "unknown") continue;
    if (accepted.unknown) {
      lines.push(`${label(prop)}: **unknown**: ${accepted.unknown}`);
      continue;
    }
    const values = [
      ...accepted.strings,
      ...accepted.numbers,
      ...(accepted.strings.length || accepted.numbers.length
        ? accepted.booleans
        : []),
    ].map(String);
    if (!accepted.strings.length && !accepted.numbers.length) continue;
    const also = [
      ...(accepted.openStrings ? ["any string"] : []),
      ...(accepted.openNumbers ? ["any number"] : []),
      ...accepted.others.map((o) => `\`${o}\``),
    ];
    lines.push(
      `${label(prop)}: ${cell(values.join(" | "))}${also.length ? `, or ${cell(also.join(" | "))}` : ""}`,
    );
  }
  return lines;
}

const byCategory = new Map();
const owned = new Set();
for (const directory of directories) {
  const category = categoryOf(directory.name);
  if (!byCategory.has(category)) byCategory.set(category, []);
  for (const part of directory.parts) owned.add(part);
  // The directory's own name is not always an export: Radio publishes
  // RadioGroup and RadioGroupItem. Then every line names its part.
  const own = directory.main === directory.name;
  const variants = directory.parts.flatMap((part, i) =>
    variantsOf(part, !own || i > 0),
  );
  byCategory.get(category).push({
    name: directory.name,
    exported: directory.parts.length > 0,
    variants,
    ios: fs.existsSync(path.join(IOS, directory.name)),
    android: fs.existsSync(path.join(ANDROID, directory.name)),
  });
}

/** Components the package exports from outside a component directory: the providers. */
const outside = [...facts.components.keys()].filter((name) => !owned.has(name));

const manifests = {};
for (const [name, { manifest }] of facts.packages)
  manifests[name] = manifest.version;

const unexported = directories.filter((d) => d.main && d.main !== d.name);
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
  "These are the public packages, on npm. SwiftUI (`packages/ios`) and Compose",
);
lines.push(
  "(`packages/android`) are used from a checkout and are not published.",
);
lines.push(
  "`@kozmos-ds/vue` exists in the workspace but is **private**: an internal",
);
lines.push(
  "harness, not something to install. There is no React Native package.",
);
lines.push("");
lines.push(`## Components (${directories.length})`);
lines.push("");
lines.push(
  "A row is a directory of `packages/react/src/components`, linked to its API card,",
);
lines.push(
  "which lists every part to import and every prop. **iOS** and **Android** say",
);
lines.push("whether that platform has the component at all.");
lines.push("");
lines.push(
  "**Variants** are the props that take a closed set of values, and every value",
);
lines.push(
  "each one accepts, as the TypeScript checker reads them from the built types:",
);
lines.push(
  "the component's own props and those it takes from Radix, not React's DOM",
);
lines.push(
  "attributes. A part other than the component itself is named (`SelectContent.side`),",
);
lines.push(
  "and a prop that also takes another kind of value says so. **none** means the",
);
lines.push(
  "component has no such prop; **unknown** means the checker could not resolve it.",
);
if (unexported.length) {
  lines.push("");
  lines.push(
    `${unexported.map((d) => `\`${d.name}\``).join(", ")} ${unexported.length === 1 ? "is a directory whose name is" : "are directories whose names are"} not an export: import the parts named in ${unexported.length === 1 ? "its" : "their"} row instead.`,
  );
}
lines.push("");

// Link the cards this invocation generates, not yesterday's files. A new
// component must produce a fresh inventory in one build, including on CI.
const claudeDesign = await buildClaudeDesignDocs(root);
const cardExists = (name) => claudeDesign.files.has(`${CARDS_DIR}/${name}.md`);
for (const category of [...byCategory.keys()].sort()) {
  const entries = byCategory.get(category);
  lines.push(`### ${category} (${entries.length})`);
  lines.push("");
  lines.push("| Component | iOS | Android | Variants |");
  lines.push("| --- | :-: | :-: | --- |");
  for (const e of entries) {
    const title = cardExists(e.name)
      ? `[**${e.name}**](../${CARDS_DIR}/${e.name}.md)`
      : `**${e.name}**`;
    const variants = !e.exported
      ? "**not exported**: @kozmos-ds/react exports no component from this directory"
      : e.variants.join("<br>") || "none";
    lines.push(
      `| ${title} | ${e.ios ? "✅" : "—"} | ${e.android ? "✅" : "—"} | ${variants} |`,
    );
  }
  lines.push("");
}
if (outside.length) {
  lines.push(`### Outside a component directory (${outside.length})`);
  lines.push("");
  lines.push("| Component | Variants |");
  lines.push("| --- | --- |");
  for (const name of outside.sort())
    lines.push(
      `| ${cardExists(name) ? `[**${name}**](../${CARDS_DIR}/${name}.md)` : `**${name}**`} | ${variantsOf(name, false).join("<br>") || "none"} |`,
    );
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

/**
 * Release notes quote fragments written against that release: each
 * TypeScript block copied from one says so, with the release, in the
 * marker `pnpm skills:check` reads (scripts/skills/ai-snippets.mjs). It is
 * still checked by name against what the package exports today.
 */
function markReleaseNotes(body, pkg) {
  let version = null;
  let fence = null;
  const out = [];
  for (const line of body.split("\n")) {
    const heading = !fence && line.match(/^## (\S+)/);
    if (heading) version = heading[1];
    const marker = line.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
    out.push(line);
    if (marker && !fence) {
      fence = { char: marker[2][0], length: marker[2].length };
      const lang = marker[3].trim().split(/\s+/)[0].toLowerCase();
      if (LANGUAGES[lang])
        out.push(
          `${marker[1]}// kozmos-skills: template — from the ${pkg} ${version ?? ""} release notes, a fragment written for that release`.replace(
            /\s+release notes/,
            " release notes",
          ),
        );
    } else if (
      marker &&
      fence &&
      marker[2][0] === fence.char &&
      marker[2].length >= fence.length &&
      !marker[3].trim()
    )
      fence = null;
  }
  return out.join("\n");
}

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
  "Follow each release's migration notes before upgrading. 0.x releases can change APIs and behaviour",
);
changelogLines.push(
  "and may require consumer changes even without a major version bump.",
);
changelogLines.push(
  "Automated codemods are not guaranteed; apply and verify the documented migration steps.",
);
changelogLines.push("");
for (const [name, version] of Object.entries(manifests).sort()) {
  const dir = facts.packages.get(name).dir;
  const log = read(path.join(root, dir, "CHANGELOG.md"));
  changelogLines.push(`## \`${name}\` — current ${version}`);
  changelogLines.push("");
  if (!log) {
    changelogLines.push("No changelog yet.");
    changelogLines.push("");
    continue;
  }
  // Every release heading and its notes, minus the package's own H1.
  const body = markReleaseNotes(
    log.split("\n").slice(1).join("\n").trim(),
    name,
  );
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

// ------------------------------------------------------------ Claude Design

/**
 * docs/claude-design: the consuming page and a card per component. A card
 * whose component has gone is stale too, so a removed component cannot leave
 * its card behind for an assistant to mount.
 */
const cardsDir = path.join(root, CARDS_DIR);
const retired = (fs.existsSync(cardsDir) ? fs.readdirSync(cardsDir) : [])
  .filter((file) => file.endsWith(".md"))
  .map((file) => `${CARDS_DIR}/${file}`)
  .filter((file) => !claudeDesign.files.has(file));

const stale = [];
if (current !== next) stale.push(path.relative(root, OUT));
if (changelogCurrent !== changelogNext)
  stale.push(path.relative(root, CHANGELOG_OUT));
for (const [file, content] of claudeDesign.files)
  if (read(path.join(root, file)) !== content) stale.push(file);
for (const file of retired) stale.push(`${file} (its component is gone)`);

const axes = directories.reduce(
  (sum, d) =>
    sum + d.parts.reduce((n, part) => n + variantsOf(part, false).length, 0),
  0,
);
const summary = `${directories.length} components across ${byCategory.size} categories, with ${axes} props of closed values read from the types`;
if (process.argv.includes("--check")) {
  if (stale.length) {
    console.error(
      `Stale AI-facing docs (${stale.length}): ${stale.join(", ")}.\nRun \`pnpm skills:build\` and commit them.`,
    );
    process.exit(1);
  }
  console.log(
    `AI-facing generated docs ok: ${summary}, ${Object.keys(manifests).length} package changelogs, and the Claude Design page and ${claudeDesign.cards.length} component cards.`,
  );
} else {
  fs.writeFileSync(OUT, next);
  fs.writeFileSync(CHANGELOG_OUT, changelogNext);
  fs.mkdirSync(cardsDir, { recursive: true });
  for (const [file, content] of claudeDesign.files)
    fs.writeFileSync(path.join(root, file), content);
  for (const file of retired) fs.rmSync(path.join(root, file));
  console.log(
    `Wrote the inventory (${summary}), the changelog (${Object.keys(manifests).length} packages), and the Claude Design page and ${claudeDesign.cards.length} component cards${retired.length ? `, removing ${retired.length} whose component is gone` : ""}.`,
  );
}
