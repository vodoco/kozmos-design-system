// The by-name registry, held to itself and to its three platforms.
//
// Every alias resolves: a typo in a list of 57 is a name that silently draws
// nothing on the web and a stand-in on the natives, and an alias spelled like a
// name would take that name's place.
//
// The three platforms hold the same names: what SwiftUI's and Compose's
// `KozmosIcon` draw by name is the web's list, no more and no less, and their
// aliases are the web's. KozmosIconNamesTests and IconNamesTest prove the
// drawing, on a simulator and under Gradle; this says the same of the lists in
// a second, on any machine, before either has run. scripts/ci/icon-names.test.mjs
// breaks each rule and reads the refusal.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const FILES = {
  registry: "packages/icons/src/registry.ts",
  swiftIcon: "packages/ios/Sources/Components/Icon/Icon.swift",
  swiftGlyph: "packages/ios/Sources/Components/Icon/PointrGlyph.swift",
  swiftGenerated:
    "packages/ios/Sources/Components/Icon/PointrIcons.generated.swift",
  kotlinIcon:
    "packages/android/src/main/java/com/kozmos/components/Icon/Icon.kt",
  kotlinGenerated:
    "packages/android/src/main/java/com/kozmos/components/Icon/PointrIcons.generated.kt",
};

/** The source between two markers, or nothing to read if either has moved. */
function between(source, start, end, where) {
  const from = source.indexOf(start);
  const to = from < 0 ? -1 : source.indexOf(end, from + start.length);
  if (to < 0) throw new Error(`${where}: no "${start}" … "${end}" to read`);
  return source.slice(from + start.length, to);
}

const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const quoted = (source) =>
  [...source.matchAll(/"([a-z0-9-]+)"/g)].map((match) => match[1]);

/** `key: value` lines of a TypeScript object, a quoted key or a bare one. */
const entries = (source, value) =>
  [
    ...source.matchAll(
      new RegExp(`^\\s*(?:"([a-z0-9-]+)"|([a-z0-9]+)):\\s*${value},?$`, "gm"),
    ),
  ].map((match) => [match[1] ?? match[2], match[3]]);

function readRegistry(source) {
  const code = stripComments(source);
  const where = FILES.registry;
  const names = quoted(
    between(code, "export const kozmosIconNames = [", "] as const", where),
  );
  const beyond = quoted(
    between(
      code,
      "export const kozmosIconNamesBeyondTheLibrary = [",
      "] as const",
      where,
    ),
  );
  const beyondMap = entries(
    between(code, "const kozmosIconsBeyondTheLibrary", "\n};", where),
    "([A-Za-z0-9]+)",
  );
  const lookup = entries(
    between(code, "export const kozmosIconRegistry", "\n};", where),
    "([A-Za-z0-9]+)",
  );
  const definitions = [
    ...between(
      code,
      "export const kozmosIconDefinitions",
      "\n];",
      where,
    ).matchAll(/\n {4}name: "([a-z0-9-]+)",[\s\S]*?\n {4}component: (\w+),/g),
  ].map((match) => [match[1], match[2]]);
  const aliases = entries(
    between(code, "export const kozmosIconAliases = {", "} as const", where),
    '"([a-z0-9-]+)"',
  );
  return { names, beyond, beyondMap, lookup, definitions, aliases };
}

const duplicates = (list) => [
  ...new Set(list.filter((item, index) => list.indexOf(item) !== index)),
];
const missing = (from, other) => from.filter((item) => !other.includes(item));

/** The names a platform's lists draw, and its aliases. */
function readSwift(files) {
  const where = "SwiftUI";
  const symbols = between(
    files.swiftIcon,
    "private static func knownSymbolName",
    "default: return nil",
    where,
  );
  const named = between(
    files.swiftGlyph,
    "static func named(_ name: String)",
    "default:",
    where,
  );
  const kinds = between(
    files.swiftGlyph,
    "static let wayfindingKinds: [String: String] = [",
    "]\n",
    where,
  );
  const data = between(
    files.swiftGenerated,
    "static func data(_ name: String)",
    "default: return nil",
    where,
  );
  const symbol = between(
    files.swiftGenerated,
    "static func symbol(_ name: String)",
    "default: return nil",
    where,
  );
  const aliasBlock = between(
    files.swiftGenerated,
    "enum KozmosIconAliases {",
    "default: return name",
    where,
  );
  const cases = (source) =>
    [...source.matchAll(/case "([a-z0-9-]+)":/g)].map((match) => match[1]);
  return {
    names: [
      ...cases(symbols),
      ...cases(named),
      ...cases(data),
      ...cases(symbol),
      ...[...kinds.matchAll(/"([a-z0-9-]+)":/g)].map((match) => match[1]),
    ],
    aliases: [
      ...aliasBlock.matchAll(/case "([a-z0-9-]+)": return "([a-z0-9-]+)"/g),
    ].map((match) => [match[1], match[2]]),
  };
}

function readCompose(files) {
  const where = "Compose";
  const known = between(
    files.kotlinIcon,
    "internal fun knownIconVector(rawName: String)",
    "else -> KozmosPointrIcons.named(name)",
    where,
  );
  const named = between(
    files.kotlinGenerated,
    "fun named(name: String): ImageVector? = when (name) {",
    "else -> null",
    where,
  );
  const aliasBlock = between(
    files.kotlinGenerated,
    "internal object KozmosIconAliases {",
    "else -> name",
    where,
  );
  const arms = (source) =>
    [...source.matchAll(/^\s*"([a-z0-9-]+)" ->/gm)].map((match) => match[1]);
  return {
    names: [...arms(known), ...arms(named)],
    aliases: [
      ...aliasBlock.matchAll(/^\s*"([a-z0-9-]+)" -> "([a-z0-9-]+)"/gm),
    ].map((match) => [match[1], match[2]]),
  };
}

/** Every rule the registry breaks, each as a sentence naming what to fix. */
export function findProblems(files) {
  const problems = [];
  const web = readRegistry(files.registry);
  const known = [...web.names, ...web.beyond];

  // One list of names, however many places spell it.
  for (const item of duplicates(known))
    problems.push(`${item} is listed twice`);
  const definitionNames = web.definitions.map(([name]) => name);
  for (const name of missing(web.names, definitionNames))
    problems.push(`${name} is in kozmosIconNames with no definition`);
  for (const name of missing(definitionNames, web.names))
    problems.push(`${name} has a definition and is not in kozmosIconNames`);
  const lookup = new Map(web.lookup);
  const definitionsByName = new Map(web.definitions);
  for (const [name, component] of definitionsByName)
    if (lookup.get(name) !== component)
      problems.push(
        `the lookup draws ${name} with ${lookup.get(name) ?? "nothing"}, and its definition with ${component}`,
      );
  for (const name of missing([...lookup.keys()], definitionNames))
    problems.push(`the lookup draws ${name}, which has no definition`);
  const beyondMap = web.beyondMap.map(([name]) => name);
  for (const name of missing(web.beyond, beyondMap))
    problems.push(`${name} is beyond the library with nothing to draw it`);
  for (const name of missing(beyondMap, web.beyond))
    problems.push(`${name} draws beyond the library and is not listed there`);

  // Every alias resolves, in one step, and takes no name's place.
  for (const item of duplicates(web.aliases.map(([alias]) => alias)))
    problems.push(`the alias ${item} is listed twice`);
  for (const [alias, target] of web.aliases) {
    if (known.includes(alias))
      problems.push(`the alias ${alias} takes the place of the name ${alias}`);
    if (!known.includes(target))
      problems.push(
        `the alias ${alias} stands for ${target}, which draws nothing`,
      );
  }

  // The three platforms.
  for (const [platform, read] of [
    ["SwiftUI", readSwift],
    ["Compose", readCompose],
  ]) {
    const native = read(files);
    for (const name of missing(known, native.names))
      problems.push(`${platform} does not draw ${name}`);
    for (const name of missing(native.names, known))
      problems.push(`${platform} draws ${name}, which the web does not know`);
    const webAliases = new Map(web.aliases);
    const nativeAliases = new Map(native.aliases);
    for (const [alias, target] of webAliases)
      if (nativeAliases.get(alias) !== target)
        problems.push(
          `${platform} reads the alias ${alias} as ${nativeAliases.get(alias) ?? "nothing"}, the web as ${target}: run pnpm icons:native:generate`,
        );
    for (const alias of nativeAliases.keys())
      if (!webAliases.has(alias))
        problems.push(
          `${platform} has the alias ${alias}, which the web does not: run pnpm icons:native:generate`,
        );
  }
  return { problems, web };
}

export function readFiles() {
  return Object.fromEntries(
    Object.entries(FILES).map(([key, relative]) => [
      key,
      fs.readFileSync(path.join(root, relative), "utf8"),
    ]),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { problems, web } = findProblems(readFiles());
  if (problems.length) {
    console.error(`${problems.length} icon name problem(s):`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(
    `Icon names: ${web.names.length} in the registry, ${web.beyond.length} beyond it and ${web.aliases.length} aliases, on all three platforms`,
  );
}
