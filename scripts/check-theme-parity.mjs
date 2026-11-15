/**
 * Keep every component drawing in the theme it is in.
 *
 * iOS resolves each of its 453 colours per trait and the web scopes its
 * variables by `data-theme`, so both follow the theme without a component
 * asking. Compose has two one-theme palettes, `KozmosColors` and
 * `KozmosColorsDark`, and a composable that reads either stays in that theme
 * whatever the device shows: until 2026-09-22 the components read
 * `KozmosColors` 272 times and drew light in dark mode. `KozmosThemeTokens` is
 * generated for every colour of both palettes. This asserts the palettes name
 * the same colours, the accessor wraps each of them and nothing else, and no
 * Compose source outside the token files reads a one-theme palette — a Code
 * Connect file only for a colour that is the same in both themes;
 * `pnpm tokens:copies:check` holds the package's copies to the build. It also holds the places that scope a theme on
 * purpose: the island reads dark in both themes, only the theme provider sets
 * a window's scheme, and every scrim is the scrim role.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const problems = [];
const ok = (msg) => console.log(`  ok    ${msg}`);
const info = (msg) => console.log(`  info  ${msg}`);
const fail = (msg) => {
  problems.push(msg);
  console.log(`  FAIL  ${msg}`);
};

const TOKENS = "packages/android/src/main/java/com/kozmos/tokens";
const GENERATED = "// Do not edit directly, this file was auto-generated.";

// Blank comments out of Kotlin or Swift source, keeping strings and line
// numbers, so a read in a doc comment is not a read. Both languages nest
// block comments.
export function blankComments(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  const blank = (s) => s.replace(/[^\n]/g, " ");
  while (i < n) {
    const two = src.slice(i, i + 2);
    if (two === "//") {
      const end = src.indexOf("\n", i);
      const stop = end < 0 ? n : end;
      out += blank(src.slice(i, stop));
      i = stop;
    } else if (two === "/*") {
      let depth = 0;
      let j = i;
      while (j < n) {
        if (src.startsWith("/*", j)) { depth++; j += 2; }
        else if (src.startsWith("*/", j)) { depth--; j += 2; if (!depth) break; }
        else j++;
      }
      out += blank(src.slice(i, j));
      i = j;
    } else if (src.startsWith('"""', i)) {
      const end = src.indexOf('"""', i + 3);
      const stop = end < 0 ? n : end + 3;
      out += src.slice(i, stop);
      i = stop;
    } else if (src[i] === '"') {
      let j = i + 1;
      while (j < n && src[j] !== '"' && src[j] !== "\n") j += src[j] === "\\" ? 2 : 1;
      out += src.slice(i, j + 1);
      i = j + 1;
    } else {
      out += src[i];
      i++;
    }
  }
  return out;
}

function walk(dir, keep) {
  const found = [];
  if (!exists(dir)) return found;
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) found.push(...walk(p, keep));
    else if (keep(p)) found.push(p);
  }
  return found;
}

const paletteNames = (file) => {
  const names = new Map();
  for (const line of read(file).split("\n")) {
    const m = /^ {2}val (\w+) = Color\(0x([0-9a-fA-F]{8})\)$/.exec(line);
    if (m) names.set(m[1], m[2].toLowerCase());
    else if (/^\s*val /.test(line)) fail(`${path.basename(file)}: a line the palette format does not write: ${line.trim()}`);
  }
  return names;
};

// 1. The palettes name the same colours; the design-token subset agrees.
console.log("palettes");
const light = paletteNames(`${TOKENS}/KozmosColors.kt`);
const dark = paletteNames(`${TOKENS}/KozmosColorsDark.kt`);
const design = paletteNames(`${TOKENS}/KozmosDesignTokens.kt`);
{
  const lightOnly = [...light.keys()].filter((n) => !dark.has(n));
  const darkOnly = [...dark.keys()].filter((n) => !light.has(n));
  if (lightOnly.length) fail(`palettes: ${lightOnly.length} colour(s) only light has: ${lightOnly.slice(0, 8).join(", ")}`);
  if (darkOnly.length) fail(`palettes: ${darkOnly.length} colour(s) only dark has: ${darkOnly.slice(0, 8).join(", ")}`);
  if (!lightOnly.length && !darkOnly.length) ok(`palettes: light and dark name the same ${light.size} colours`);
  const off = [...design].filter(([n, v]) => light.get(n) !== v).map(([n]) => n);
  if (off.length) fail(`palettes: KozmosDesignTokens disagrees with KozmosColors on ${off.join(", ")}`);
  else ok(`palettes: KozmosDesignTokens' ${design.size} colours are KozmosColors' values`);
}

// 2. The accessor wraps every colour, each through its own two names.
console.log("themed accessor");
{
  const file = `${TOKENS}/KozmosThemeTokens.kt`;
  const src = read(file);
  if (!src.startsWith(GENERATED)) fail("accessor: KozmosThemeTokens.kt is not the generated file; run pnpm tokens:build and copy it over");
  else ok("accessor: KozmosThemeTokens.kt is generated");
  const accessors = [...src.matchAll(/^ {4}val (\w+): Color\n\s+@Composable @ReadOnlyComposable get\(\) = themed\(\n\s+KozmosColors\.(\w+),\n\s+KozmosColorsDark\.(\w+)\n\s+\)/gm)];
  const declared = [...src.matchAll(/^ {4}val (\w+): Color$/gm)].map((m) => m[1]);
  if (accessors.length !== declared.length) fail(`accessor: ${declared.length - accessors.length} accessor(s) are not the generated themed(light, dark) shape`);
  const crossed = accessors.filter((m) => m[1] !== m[2] || m[1] !== m[3]).map((m) => m[1]);
  if (crossed.length) fail(`accessor: ${crossed.join(", ")} read(s) another colour's value`);
  const names = new Set(declared);
  const missing = [...light.keys()].filter((n) => !names.has(n));
  const extra = declared.filter((n) => !light.has(n));
  if (missing.length) fail(`accessor: ${missing.length} colour(s) have no themed accessor: ${missing.slice(0, 8).join(", ")}`);
  if (extra.length) fail(`accessor: ${extra.join(", ")} wrap(s) no palette colour`);
  if (!missing.length && !extra.length && !crossed.length && accessors.length === declared.length) ok(`accessor: all ${declared.length} colours, each reading its own light and dark value`);
  if (!/LocalKozmosUseDarkTokens\.current \?: isSystemInDarkTheme\(\)/.test(src)) fail("accessor: the theme no longer comes from LocalKozmosUseDarkTokens, then the system");
  else ok("accessor: the theme comes from LocalKozmosUseDarkTokens, then the system");
}

// 3. No Compose source reads a one-theme palette. A Code Connect file may read
//    KozmosColors for a colour that is the same in both themes, and only that:
//    its mapping values are class initialisers, where a composable getter
//    cannot be read, and the category colours it maps are theme-invariant.
console.log("Compose sources");
{
  const sources = walk("packages/android/src/main/java/com/kozmos", (p) => p.endsWith(".kt") && !p.startsWith(`${TOKENS}/`));
  const onePalette = /\bKozmos(Colors|ColorsDark|DesignTokens)\b(?:\.(\w+))?/g;
  let offenders = 0;
  let invariant = 0;
  for (const file of sources) {
    const code = blankComments(read(file)).replace(/^import .*$/gm, "");
    const lines = code.split("\n");
    const hits = [];
    const connect = file.endsWith(".figma.kt");
    lines.forEach((line, i) => {
      for (const m of line.matchAll(onePalette)) {
        const same = m[1] === "Colors" && m[2] && light.has(m[2]) && light.get(m[2]) === dark.get(m[2]);
        if (connect && same) { invariant++; continue; }
        hits.push(`${i + 1}: ${m[0]}`);
      }
    });
    if (!hits.length) continue;
    offenders++;
    const remedy = connect ? "a Code Connect file may read KozmosColors only for a colour the same in both themes" : "read KozmosThemeTokens";
    fail(`${file}: reads a one-theme palette at ${hits.slice(0, 6).join(", ")}${hits.length > 6 ? ` and ${hits.length - 6} more` : ""}; ${remedy}`);
  }
  if (!offenders) ok(`Compose: ${sources.length} sources read colours through KozmosThemeTokens (Code Connect: ${invariant} theme-invariant reads)`);
}

// 4. The places that scope a theme on purpose.
console.log("scoped themes");
{
  const islandKt = read("packages/android/src/main/java/com/kozmos/components/DynamicIsland/DynamicIsland.kt");
  if (/CompositionLocalProvider\(LocalKozmosUseDarkTokens provides true\)/.test(blankComments(islandKt))) ok("Compose: the island's content reads the dark palette");
  else fail("Compose: the island's content no longer reads the dark palette; SwiftUI's does");
  const islandSwift = blankComments(read("packages/ios/Sources/Components/DynamicIsland/DynamicIsland.swift"));
  if (/\.environment\(\\\.colorScheme, \.dark\)/.test(islandSwift)) ok("iOS: the island scopes its content to the dark scheme");
  else fail("iOS: the island no longer scopes its content to the dark scheme");
  // `.preferredColorScheme` sets the scheme of the whole window it is in, so
  // only the theme provider, whose job that is, may use it.
  const swift = walk("packages/ios/Sources", (p) => p.endsWith(".swift"));
  const setters = swift.filter((f) => /\.preferredColorScheme\(/.test(blankComments(read(f))));
  const allowed = ["packages/ios/Sources/Components/ThemeProvider/ThemeProvider.swift"];
  const stray = setters.filter((f) => !allowed.includes(f));
  if (stray.length) fail(`iOS: ${stray.join(", ")} set(s) the window's colour scheme; scope a subtree with .environment(\\.colorScheme, …)`);
  else ok("iOS: only the theme provider sets a window's colour scheme");
}

// 5. Every dimmer is the scrim role, black at half in both themes, as React and
// Figma draw it. A primitive at an alpha turns light in dark mode.
console.log("scrims");
for (const [file, role] of [
  ["packages/ios/Sources/Components/Backdrop/Backdrop.swift", "KozmosColors.semanticsOverlayScrim"],
  ["packages/ios/Sources/Components/Dialog/Dialog.swift", "KozmosColors.semanticsOverlayScrim"],
  ["packages/ios/Sources/Components/Drawer/Drawer.swift", "KozmosColors.semanticsOverlayScrim"],
  ["packages/android/src/main/java/com/kozmos/components/Backdrop/Backdrop.kt", "KozmosThemeTokens.semanticsOverlayScrim"],
  ["packages/android/src/main/java/com/kozmos/components/Drawer/Drawer.kt", "KozmosThemeTokens.semanticsOverlayScrim"],
  // React's Backdrop dims with an owned rule (GAP-262), which applies the
  // role, so the dim holds where no @scope rule does.
  ["packages/react/src/components/Backdrop/Backdrop.tsx", "kozmos-backdrop-solid"],
  [
    "packages/styles/src/styles/owned-components.css",
    ".kozmos-backdrop-layer.kozmos-backdrop-solid {\n    @apply bg-overlay-scrim;",
  ],
]) {
  if (blankComments(read(file)).includes(role)) ok(`${path.basename(file)} dims with ${role}`);
  else fail(`${file} does not dim with ${role}`);
}

if (problems.length) {
  console.log(`\n${problems.length} theme parity problem(s)`);
  process.exit(1);
}
console.log("\nok    theme parity");
