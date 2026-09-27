/**
 * Keep every platform timing its transitions from the same motion tokens.
 *
 * `Semantics.Motion.duration.*` and `.easing.*` are the prototype's own
 * curves; this asserts the token files agree between modes, the native
 * emissions in the packages match the build, the CSS build carries them, and
 * the shells and parts read them rather than their own numbers.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const problems = [];
const ok = (msg) => console.log(`  ok    ${msg}`);
const fail = (msg) => {
  problems.push(msg);
  console.log(`  FAIL  ${msg}`);
};

const expected = {
  "duration.quick": "150ms",
  "duration.standard": "280ms",
  "duration.deliberate": "460ms",
  "easing.standard": "cubic-bezier(0.4, 0, 0.2, 1)",
  "easing.emphasised": "cubic-bezier(0.34, 1.56, 0.64, 1)",
};

console.log("motion tokens");
for (const mode of ["light", "dark"]) {
  const t = JSON.parse(read(`packages/tokens/src/tokens-${mode}.json`));
  const motion = t.Semantics.Motion;
  for (const [key, value] of Object.entries(expected)) {
    const [group, name] = key.split(".");
    const token = motion[group]?.[name];
    if (!token) fail(`${mode}: Semantics.Motion.${key} is missing`);
    else if (token.$value !== value) fail(`${mode}: Semantics.Motion.${key} is ${token.$value}, not ${value}`);
    else ok(`${mode}: Semantics.Motion.${key} = ${value}`);
  }
}

console.log("native emission");
for (const [packaged, built] of [
  ["packages/ios/Sources/KozmosMotion.swift", "packages/tokens/dist/ios/KozmosMotion.swift"],
  ["packages/android/src/main/java/com/kozmos/tokens/KozmosMotion.kt", "packages/tokens/dist/android/src/main/java/com/kozmos/tokens/KozmosMotion.kt"],
]) {
  if (!exists(packaged)) { fail(`native: ${packaged} is missing`); continue; }
  const src = read(packaged);
  const checks = packaged.endsWith(".swift")
    ? ["DurationQuick: TimeInterval = 0.150", "DurationStandard: TimeInterval = 0.280", "DurationDeliberate: TimeInterval = 0.460", "x1: 0.4, y1: 0, x2: 0.2, y2: 1", "x1: 0.34, y1: 1.56, x2: 0.64, y2: 1"]
    : ["DurationQuick: Int = 150", "DurationStandard: Int = 280", "DurationDeliberate: Int = 460", "CubicBezierEasing(0.4f, 0f, 0.2f, 1f)", "CubicBezierEasing(0.34f, 1.56f, 0.64f, 1f)"];
  for (const needle of checks) {
    if (src.includes(needle)) ok(`native: ${path.basename(packaged)} carries ${needle}`);
    else fail(`native: ${path.basename(packaged)} lacks ${needle}`);
  }
  if (exists(built) && read(built) !== src) fail(`native: ${packaged} differs from the built ${built}; copy the build over`);
}

console.log("web");
const cssVars = "packages/tokens/dist/css/variables-light.css";
if (!exists(cssVars)) ok("web: tokens dist not built in this checkout, emitted variables skipped");
else {
  const vars = read(cssVars);
  for (const [key, value] of Object.entries(expected)) {
    const name = `--semantics-motion-${key.replace(".", "-")}: ${value}`;
    if (vars.includes(name)) ok(`web: ${name}`);
    else fail(`web: variables-light.css lacks ${name}`);
  }
}
const owned = read("packages/react/src/styles/owned-components.css");
// Match what a rule says, not how it is laid out. Prettier wraps a long `transition` across lines,
// and a needle written on one line then stops matching a rule nobody touched: that is why this
// reported the sheet as reading no motion tokens while the sheet read them perfectly well.
const flattenCss = (text) => text.replace(/\s+/g, " ");
const ownedFlat = flattenCss(owned);
for (const [rule, needle] of [
  ["the sheet", "top var(--semantics-motion-duration-standard) var(--semantics-motion-easing-standard)"],
  ["the pop", "animation: pop var(--semantics-motion-duration-standard)"],
  ["the reveal", "animation: reveal var(--semantics-motion-duration-standard)"],
  ["the category field", ".kozmos-category-field { animation: pop var(--semantics-motion-duration-standard)"],
  ["the result card", "transition: border-color var(--semantics-motion-duration-quick)"],
  ["the result action row", "animation: result-actions var(--semantics-motion-duration-standard)"],
]) {
  if (ownedFlat.includes(flattenCss(needle))) ok(`web: ${rule} reads the motion tokens`);
  else fail(`web: ${rule} does not read the motion tokens`);
}
// A bare `0fr` looks like it animates from nothing and does not: an fr track
// keeps an automatic minimum of its content, so the row starts at its
// min-content height and the card's height jumps before the reveal begins.
// Cheap to write, invisible without measuring, so assert the explicit zero.
const frTracks = flattenCss(owned).match(/grid-template-rows: [^;}]+/g) || [];
const bareFr = frTracks.filter((t) => /\dfr/.test(t) && !/minmax\(\s*0/.test(t));
if (bareFr.length) fail(`web: ${bareFr.length} fr grid track(s) without an explicit zero minimum, so they cannot animate from nothing (${bareFr[0]})`);
else ok("web: every fr grid track states its zero minimum");

if (/transition:[^;]*0\.\d+s/.test(owned.replace(/\/\*[\s\S]*?\*\//g, ""))) fail("web: an owned transition carries its own seconds instead of a motion token");
else ok("web: no owned transition carries its own seconds");

console.log("consumers");
const shellSwift = read("packages/ios/Sources/Components/AdaptiveMapShell/AdaptiveMapShell.swift");
if (shellSwift.includes(".spring(response:")) fail("iOS: the shell still snaps on its own spring");
else if (shellSwift.includes("withAnimation(KozmosMotion.standard)")) ok("iOS: the shell snaps on the standard motion");
else fail("iOS: the shell does not animate on KozmosMotion");
const shellKt = read("packages/android/src/main/java/com/kozmos/components/AdaptiveMapShell/AdaptiveMapShell.kt");
if (shellKt.includes("KozmosTransitions.standard()")) ok("Compose: the sheet animates on the standard motion");
else fail("Compose: the sheet does not animate on KozmosTransitions");

if (problems.length) {
  console.log(`\n${problems.length} motion parity problem(s)`);
  process.exit(1);
}
console.log("\nok    motion parity");
