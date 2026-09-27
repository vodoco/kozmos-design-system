/**
 * Verify that the platform code snippets in Storybook MDX name things that
 * actually exist.
 *
 * The snippets live inside template strings in `<PlatformSnippets>`. React
 * recipes now compile in check-package-install; other platforms still only
 * receive this weaker identifier check, not compiler validation.
 * Four such names shipped before this check existed (KozmosComboboxOption,
 * KozmosDateRange, KozmosOverlayPosition in a Kotlin block, and a String bound
 * where SwiftUI wanted a Date).
 *
 * The check is deliberately per-platform. A global search would have passed
 * `KozmosOverlayPosition` in a Kotlin snippet, because that type does exist —
 * in Swift. Each block is resolved only against its own platform's sources.
 */
import fs from "node:fs";
import path from "node:path";
import { extractSnippets } from "./lib/doc-snippets.mjs";

const ROOT = process.cwd();
const COMPONENTS_DIR = path.join(ROOT, "packages/react/src/components");

const PLATFORMS = {
  swift: { label: "SwiftUI", roots: ["packages/ios/Sources"], ext: [".swift"] },
  kotlin: { label: "Compose", roots: ["packages/android/src"], ext: [".kt"] },
  vue: { label: "Vue", roots: ["packages/vue/src"], ext: [".ts", ".vue"] },
  react: {
    label: "React",
    roots: ["packages/react/src"],
    ext: [".ts", ".tsx"],
  },
};

function walk(dir, ext, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, ext, out);
    else if (ext.some((e) => entry.name.endsWith(e))) out.push(full);
  }
  return out;
}

/** Every Kozmos* identifier declared anywhere in a platform's sources. */
function symbolsFor(platform) {
  const spec = PLATFORMS[platform];
  const symbols = new Set();
  for (const root of spec.roots) {
    for (const file of walk(path.join(ROOT, root), spec.ext)) {
      const source = fs.readFileSync(file, "utf8");
      for (const match of source.matchAll(/\bKozmos[A-Za-z0-9]*\b/g)) {
        symbols.add(match[0]);
      }
    }
  }
  return symbols;
}

const symbolCache = {};
function knownSymbols(platform) {
  if (!symbolCache[platform]) symbolCache[platform] = symbolsFor(platform);
  return symbolCache[platform];
}

/**
 * Identifiers the snippet declares itself.
 *
 * Several snippets define an example type — `struct KozmosSwitchStyle:
 * ToggleStyle` in Switch.mdx, for instance. Those are the point of the example,
 * not references to a library symbol, so they must not be resolved against the
 * package sources.
 */
const DECLARATION_PATTERNS = [
  /\b(?:struct|class|enum|protocol|extension|actor)\s+(Kozmos[A-Za-z0-9]*)/g,
  /\b(?:func|fun)\s+(Kozmos[A-Za-z0-9]*)/g,
  /\b(?:const|let|var|function|interface|type)\s+(Kozmos[A-Za-z0-9]*)/g,
];

function declaredIn(code) {
  const declared = new Set();
  for (const pattern of DECLARATION_PATTERNS) {
    for (const match of code.matchAll(pattern)) declared.add(match[1]);
  }
  return declared;
}

const problems = [];
const mdxFiles = walk(COMPONENTS_DIR, [".mdx"]);
let snippetCount = 0;
let identifierCount = 0;

for (const file of mdxFiles) {
  const relative = path.relative(ROOT, file);
  const source = fs.readFileSync(file, "utf8");

  // Every example on the page, fenced blocks included, not only the platform
  // snippets: lucide-react left @kozmos-ds/icons on 2026-09-23, and four pages
  // went on importing their icons from it, where a reader could not follow.
  for (const match of source.matchAll(/from\s+["']lucide-react["']/g)) {
    const line = source.slice(0, match.index).split("\n").length;
    problems.push(
      `${relative}:${line}: imports from lucide-react, which Kozmos no longer uses; draw the icon from @kozmos-ds/icons`,
    );
  }

  for (const { platform, code } of extractSnippets(source, relative)) {
    snippetCount += 1;
    const known = knownSymbols(platform);
    const declared = declaredIn(code);
    const seen = new Set();

    for (const match of code.matchAll(/\bKozmos[A-Za-z0-9]*\b/g)) {
      const identifier = match[0];
      if (seen.has(identifier) || declared.has(identifier)) continue;
      seen.add(identifier);
      identifierCount += 1;
      if (!known.has(identifier)) {
        problems.push(
          `${relative}: ${PLATFORMS[platform].label} snippet names "${identifier}", which does not exist in ${PLATFORMS[platform].roots.join(", ")}`,
        );
      }
    }
  }
}

if (problems.length > 0) {
  console.error("Documentation snippet check failed:\n");
  for (const problem of problems) console.error(`- ${problem}`);
  console.error(
    `\n${problems.length} unknown identifier(s). This identifier check is not compiler validation; run docs:snippets:compile for React recipes.`,
  );
  process.exit(1);
}

console.log(
  `Documentation snippets ok (${identifierCount} identifier(s) across ${snippetCount} snippet(s) in ${mdxFiles.length} MDX file(s))`,
);
