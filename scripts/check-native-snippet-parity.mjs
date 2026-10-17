/**
 * Every compiled native docs snippet is its MDX tab word for word: the
 * SwiftUI and Compose files compiled in the test targets
 * (packages/ios/Tests/KozmosTests/DocSnippets, packages/android/src/test/
 * java/com/kozmos/docsnippets) against the tab Storybook renders.
 *
 * Each file's leading comment, read across its lines, claims a page, a
 * platform and, where the page has more than one tab, the section (its
 * heading) the tab is in: `// Itinerary.mdx's SwiftUI snippet ("Changing an
 * endpoint"), word for word …`. "snippets" claims all of that section's tabs,
 * in page order. A file no page shows says `// Not a docs tab: …` on a line of
 * its leading comment instead; a file that does neither fails, so a new
 * snippet cannot go uncompared. scripts/lib/native-snippet-parity.mjs reads
 * the claims and the pages, and its tests run in `pnpm test:doc-snippets`.
 *
 * The tab is a JavaScript template literal, so a backslash in it is an
 * escape: a Swift interpolation written `\(number)` renders as `(number)`
 * and must be written `\\(number)`. LocationPin's Swift tab shipped that way
 * on 15 Oct and nothing compared the two (the identifier check passed).
 * Until 17 Oct this check read only one-line claims with no section and the
 * page's first tab, so it compared 6 of the 25 files. Lines are compared
 * trimmed, blank lines and the file's leading comment and package line aside.
 *
 *   node scripts/check-native-snippet-parity.mjs
 */
import fs from "node:fs";
import path from "node:path";
import {
  claimedTabs,
  firstDifference,
  labelFor,
  leadingComment,
  NOT_A_TAB,
  parseHeader,
  readPage,
  snippetBody,
} from "./lib/native-snippet-parity.mjs";

const ROOT = process.cwd();
const DIRS = [
  ["swift", "packages/ios/Tests/KozmosTests/DocSnippets", ".swift"],
  ["kotlin", "packages/android/src/test/java/com/kozmos/docsnippets", ".kt"],
];

function mdxFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...mdxFiles(full));
    else if (entry.name.endsWith(".mdx")) out.push(full);
  }
  return out;
}
const mdx = [
  ...mdxFiles(path.join(ROOT, "packages/react/src")),
  ...mdxFiles(path.join(ROOT, "apps/docs/stories")),
];
const pages = new Map();
const pageFor = (name) => {
  const found = mdx.filter((file) => path.basename(file) === `${name}.mdx`);
  if (found.length !== 1) return { count: found.length };
  if (!pages.has(found[0]))
    pages.set(found[0], readPage(fs.readFileSync(found[0], "utf8")));
  return { file: found[0], page: pages.get(found[0]) };
};

const failures = [];
let files = 0;
let tabs = 0;
let unmarked = 0;
const marked = [];
for (const [platform, dir, extension] of DIRS) {
  const folder = path.join(ROOT, dir);
  if (!fs.existsSync(folder)) {
    failures.push(`${dir}: the folder is gone`);
    continue;
  }
  for (const name of fs
    .readdirSync(folder)
    .filter((n) => n.endsWith(extension))
    .sort()) {
    const file = path.join(folder, name);
    const relative = path.relative(ROOT, file);
    const text = fs.readFileSync(file, "utf8");
    const header = parseHeader(leadingComment(text));
    if (header === null) {
      unmarked += 1;
      failures.push(
        `${relative}: its leading comment claims no tab (<Page>.mdx's ${labelFor(platform)} snippet ("<Section>"), word for word) and is not marked "// ${NOT_A_TAB} …"`,
      );
      continue;
    }
    if (header.error) {
      failures.push(`${relative}: ${header.error}`);
      continue;
    }
    if (header.kind === "none") {
      marked.push(relative);
      continue;
    }
    const where = `${relative} ↔ ${header.page}.mdx${header.section ? ` ("${header.section}")` : ""}`;
    if (header.platform !== platform) {
      failures.push(
        `${where}: a ${extension} file claims the ${header.label} tab`,
      );
      continue;
    }
    const found = pageFor(header.page);
    if (!found.file) {
      failures.push(
        `${where}: ${found.count ? `${found.count} pages are` : "no page is"} named ${header.page}.mdx`,
      );
      continue;
    }
    const claimed = claimedTabs(found.page, header);
    if (claimed.error) {
      failures.push(`${where}: ${claimed.error}`);
      continue;
    }
    files += 1;
    tabs += claimed.tabs.length;
    const difference = firstDifference(
      snippetBody(text, platform),
      claimed.tabs.map((tab) => tab.code).join("\n"),
    );
    if (difference)
      failures.push(
        `${where}: line ${difference.line} renders ${JSON.stringify(difference.got)}, the compiled snippet has ${JSON.stringify(difference.want)}`,
      );
  }
}

// A run that compared nothing proves nothing: a moved folder or a changed
// claim line would otherwise pass in silence.
if (files === 0)
  failures.push("no tab was compared: the snippets or their claims moved");
const tally = `${files} compiled snippets against ${tabs} tabs, ${marked.length} files marked "${NOT_A_TAB}"`;
if (failures.length) {
  console.error(
    `FAIL native snippet parity: ${failures.length} problems (${tally}${unmarked ? `, ${unmarked} unmarked` : ""})\n- ${failures.join("\n- ")}`,
  );
  process.exit(1);
}
console.log(
  `PASS native snippet parity: ${tally}; every SwiftUI and Compose tab claimed renders word for word as the snippet the test targets compile`,
);
