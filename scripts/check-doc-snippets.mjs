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
 *
 * A type that exists says nothing about the token read from it. Six SwiftUI
 * pages drew with `KozmosColors.semanticColorTextDefault`,
 * `KozmosColors.componentCardBackgroundColorDefault` and the like, names the
 * token build has never written, and passed. So every read of a member of a
 * native token type — `KozmosColors.x`, `KozmosThemeTokens.x`,
 * `KozmosDimensions.x` and the rest (scripts/lib/native-token-members.mjs) —
 * is held to the members that platform's token sources declare, by file and
 * line.
 */
import fs from "node:fs";
import path from "node:path";
import { extractSnippets } from "./lib/doc-snippets.mjs";
import {
  nativeTokenMembers,
  tokenMemberReads,
  tokenTypeNames,
} from "./lib/native-token-members.mjs";

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

const TOKEN_TYPES = tokenTypeNames(ROOT);
const TOKEN_MEMBERS = nativeTokenMembers(ROOT, TOKEN_TYPES);
if (!TOKEN_MEMBERS.swift.size || !TOKEN_MEMBERS.kotlin.size) {
  console.error(
    "Documentation snippet check failed: no native token types were found to check token reads against",
  );
  process.exit(1);
}

const problems = [];
const mdxFiles = walk(COMPONENTS_DIR, [".mdx"]);
let snippetCount = 0;
let identifierCount = 0;
let unknownIdentifiers = 0;
let unknownMembers = 0;
const tokenReads = { swift: 0, kotlin: 0 };
const typesRead = new Set();

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

  for (const { platform, code, codeLine } of extractSnippets(
    source,
    relative,
  )) {
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
        unknownIdentifiers += 1;
        problems.push(
          `${relative}: ${PLATFORMS[platform].label} snippet names "${identifier}", which does not exist in ${PLATFORMS[platform].roots.join(", ")}`,
        );
      }
    }

    const tokens = TOKEN_MEMBERS[platform];
    if (!tokens) continue;
    for (const read of tokenMemberReads(code, TOKEN_TYPES)) {
      tokenReads[platform] += 1;
      typesRead.add(read.type);
      const at = `${relative}:${codeLine + read.line}`;
      const label = PLATFORMS[platform].label;
      const type = tokens.get(read.type);
      if (!type) {
        unknownMembers += 1;
        problems.push(
          `${at}: ${label} snippet reads ${read.type}.${read.member}, but ${label} has no token type ${read.type}`,
        );
      } else if (!type.members.has(read.member)) {
        unknownMembers += 1;
        problems.push(
          `${at}: ${label} snippet reads ${read.type}.${read.member}, which ${[...type.files].join(", ")} does not declare`,
        );
      }
    }
  }
}

if (problems.length > 0) {
  console.error("Documentation snippet check failed:\n");
  for (const problem of problems) console.error(`- ${problem}`);
  console.error(
    `\n${problems.length} problem(s): ${unknownIdentifiers} unknown identifier(s), ${unknownMembers} unknown token member(s). This identifier check is not compiler validation; run docs:snippets:compile for React recipes.`,
  );
  process.exit(1);
}

const declared = (platform) =>
  [...TOKEN_MEMBERS[platform].values()].reduce(
    (sum, type) => sum + type.members.size,
    0,
  );
console.log(
  `Documentation snippets ok (${identifierCount} identifier(s) across ${snippetCount} snippet(s) in ${mdxFiles.length} MDX file(s); ` +
    `${tokenReads.swift} SwiftUI and ${tokenReads.kotlin} Compose token member read(s) on ${[...typesRead].sort().join(", ")}, ` +
    `held to the ${declared("swift")} SwiftUI and ${declared("kotlin")} Compose members their token sources declare)`,
);
