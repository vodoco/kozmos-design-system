/**
 * A native docs snippet that says it is its MDX tab "word for word" is: the
 * SwiftUI and Compose files compiled in the test targets
 * (packages/ios/Tests/KozmosTests/DocSnippets, packages/android/src/test/
 * java/com/kozmos/docsnippets) against the tab Storybook renders.
 *
 * The tab is a JavaScript template literal, so a backslash in it is an
 * escape: a Swift interpolation written `\(number)` renders as `(number)`
 * and must be written `\\(number)`. LocationPin's Swift tab shipped that way
 * on 15 Oct and nothing compared the two (the identifier check passed).
 * Lines are compared trimmed, blank lines and the file's leading comment
 * header and package line aside.
 *
 *   node scripts/check-native-snippet-parity.mjs
 */
import fs from "node:fs";
import path from "node:path";

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

// What a template literal renders: every backslash escape becomes the
// character after it (the snippets use no \n, \t or \u escapes).
const rendered = (literal) => literal.replace(/\\([\s\S])/g, "$1");
const lines = (text) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

function tab(source, platform) {
  const start = source.indexOf(`${platform}={\``);
  if (start === -1) return null;
  const from = start + platform.length + 3;
  // The literal ends at the first backtick no backslash escapes.
  let i = from;
  while (i < source.length) {
    if (source[i] === "\\") {
      i += 2;
      continue;
    }
    if (source[i] === "`") break;
    i += 1;
  }
  return source.slice(from, i);
}

function snippetBody(text, platform) {
  const all = text.split("\n");
  let i = 0;
  while (i < all.length && (all[i].startsWith("//") || !all[i].trim())) i += 1;
  const body = all
    .slice(i)
    .filter((line) => !(platform === "kotlin" && /^package /.test(line)));
  return body.join("\n");
}

const failures = [];
let compared = 0;
for (const [platform, dir, extension] of DIRS) {
  const folder = path.join(ROOT, dir);
  if (!fs.existsSync(folder)) continue;
  for (const name of fs
    .readdirSync(folder)
    .filter((n) => n.endsWith(extension))) {
    const file = path.join(folder, name);
    const text = fs.readFileSync(file, "utf8");
    const claim = text.match(
      /^\/\/ (\S+)\.mdx's (SwiftUI|Compose) snippet, word for word/m,
    );
    if (!claim) continue;
    const page = mdx.find(
      (candidate) => path.basename(candidate) === `${claim[1]}.mdx`,
    );
    const where = `${path.relative(ROOT, file)} ↔ ${claim[1]}.mdx`;
    if (!page) {
      failures.push(`${where}: no ${claim[1]}.mdx`);
      continue;
    }
    const literal = tab(fs.readFileSync(page, "utf8"), platform);
    if (literal === null) {
      failures.push(`${where}: the page has no ${platform} tab`);
      continue;
    }
    compared += 1;
    const want = lines(snippetBody(text, platform));
    const got = lines(rendered(literal));
    const length = Math.max(want.length, got.length);
    for (let index = 0; index < length; index += 1) {
      if (want[index] !== got[index]) {
        failures.push(
          `${where}: line ${index + 1} renders ${JSON.stringify(got[index] ?? "(nothing)")}, the compiled snippet has ${JSON.stringify(want[index] ?? "(nothing)")}`,
        );
        break;
      }
    }
  }
}

// A run that compared nothing proves nothing: a moved folder or a changed
// claim line would otherwise pass in silence.
if (compared === 0)
  failures.push("no tab was compared: the snippets or their claims moved");
if (failures.length) {
  console.error(
    `FAIL native snippet parity: ${failures.length} of ${compared} tabs differ from their compiled snippets\n- ${failures.join("\n- ")}`,
  );
  process.exit(1);
}
console.log(
  `PASS native snippet parity: ${compared} SwiftUI and Compose tabs render word for word as the snippets the test targets compile`,
);
