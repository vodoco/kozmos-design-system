/**
 * Keep every glass surface reading the same effect.
 *
 * `Semantics.Effect.glass` existed for months as numbers no platform read:
 * the web's glass utility computed its own blur from a design-config slider,
 * three map cards each hand-wrote "bg-white/70 backdrop-blur-3xl", and iOS
 * and Android drew their glass buttons as white at 16 % with no blur at all.
 * The glass surface role composes from the token; this
 * asserts the token, its native emission, the web's rule and the consumers
 * still agree.
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
const near = (a, b) => Math.abs(a - b) < 1e-6;

const FIELDS = {
  opacity: { swift: "opacity", kotlin: "opacity", css: "--semantics-effect-glass-opacity" },
  blur: { swift: "blur", kotlin: "blur", css: "--semantics-effect-glass-blur" },
  saturation: { swift: "saturation", kotlin: "saturation", css: "--semantics-effect-glass-saturation" },
  "noise.opacity": { swift: "noiseOpacity", kotlin: "noiseOpacity", css: "--semantics-effect-glass-noise-opacity" },
  "border.opacity": { swift: "borderOpacity", kotlin: "borderOpacity", css: "--semantics-effect-glass-border-opacity" },
  "refraction.opacity": { swift: "refractionOpacity", kotlin: "refractionOpacity", css: "--semantics-effect-glass-refraction-opacity" },
};

const lookup = (tokens, dotted) =>
  dotted.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), tokens);

console.log("Glass parity — Semantics.Effect.glass against its consumers\n");

// 1. The token, both modes, the same numbers.
const values = {};
{
  const modes = {};
  for (const mode of ["light", "dark"]) {
    const t = JSON.parse(read(`packages/tokens/src/tokens-${mode}.json`));
    modes[mode] = {};
    for (const field of Object.keys(FIELDS)) {
      const token = lookup(t, `Semantics.Effect.glass.${field}`);
      if (!token || typeof token.$value !== "number") {
        fail(`${mode}: Semantics.Effect.glass.${field} is missing or not a number`);
        continue;
      }
      modes[mode][field] = token.$value;
    }
  }
  for (const field of Object.keys(FIELDS)) {
    if (modes.light[field] === undefined || modes.dark[field] === undefined) continue;
    if (!near(modes.light[field], modes.dark[field]))
      fail(`Effect.glass.${field} differs between modes (${modes.light[field]} / ${modes.dark[field]}); the theme decides the tint, not the effect`);
    else {
      values[field] = modes.light[field];
      ok(`token: Effect.glass.${field} = ${modes.light[field]}`);
    }
  }
}

// 2. The web: the role reads the token's variables, not its own numbers.
{
  const css = read("packages/react/src/styles/owned-components.css");
  const block = /\.kozmos-surface-glass\s*\{([\s\S]*?)\n\s*\}/.exec(css);
  if (!block) fail("web: .kozmos-surface-glass is missing from owned-components.css");
  else {
    for (const field of ["opacity", "blur", "saturation", "border.opacity"]) {
      const variable = FIELDS[field].css;
      if (block[1].includes(`var(${variable})`)) ok(`web: the role reads ${variable}`);
      else fail(`web: the role does not read ${variable}`);
    }
    if (/\d\.\d+\s*\)/.test(block[1].replace(/calc\([^)]*\)/g, "")))
      fail("web: the role carries a number of its own where the token should be");
    const button = /\.kozmos-button-glass\s*\{([\s\S]*?)\n\s*\}/.exec(css);
    if (!button) fail("web: .kozmos-button-glass is missing");
    else {
      const missing = ["opacity", "blur", "saturation", "border.opacity"].map((f) => FIELDS[f].css).filter((v) => !button[1].includes(`var(${v})`));
      if (missing.length) fail(`web: the button's glass variant does not read ${missing.join(", ")}`);
      else ok("web: the button's glass variant reads the glass token, as the surface does");
    }
  }
  const emitted = "packages/tokens/dist/css/variables-light.css";
  if (!exists(emitted)) ok("web: tokens dist not built in this checkout, emitted variables skipped");
  else {
    const vars = read(emitted);
    for (const [field, spec] of Object.entries(FIELDS)) {
      const m = new RegExp(`${spec.css}:\\s*([\\d.]+)`).exec(vars);
      if (!m) fail(`web: ${spec.css} is not emitted`);
      else if (!near(Number(m[1]), values[field])) fail(`web: ${spec.css} is ${m[1]}, the token is ${values[field]}`);
      else ok(`web: ${spec.css} emitted as the token`);
    }
  }
}

// 3. The native emissions, in the packages and — when built — in dist.
{
  const files = {
    swift: ["packages/ios/Sources/KozmosEffects.swift", "packages/tokens/dist/ios/KozmosEffects.swift"],
    kotlin: ["packages/android/src/main/java/com/kozmos/tokens/KozmosEffects.kt", "packages/tokens/dist/android/src/main/java/com/kozmos/tokens/KozmosEffects.kt"],
  };
  for (const [lang, [packaged, built]] of Object.entries(files)) {
    if (!exists(packaged)) {
      fail(`native: ${packaged} is missing`);
      continue;
    }
    const src = read(packaged);
    for (const [field, spec] of Object.entries(FIELDS)) {
      const name = spec[lang];
      const m = new RegExp(`${name}\\s*[:=]\\s*([\\d.]+)`).exec(src);
      if (!m) fail(`native: ${name} is missing from ${packaged}`);
      else if (!near(Number(m[1]), values[field])) fail(`native: ${name} is ${m[1]} in ${packaged}, the token is ${values[field]}`);
      else ok(`native: ${lang} ${name} matches the token`);
    }
    if (exists(built) && read(built) !== src) fail(`native: ${packaged} differs from the built ${built}; copy the build over`);
  }
}

// 4. The consumers: on the role, and none of them hand-rolling glass.
{
  const web = [
    "packages/react/src/components/ManoeuvreCard/ManoeuvreCard.tsx",
    "packages/react/src/components/RouteSummary/RouteSummary.tsx",
    "packages/react/src/components/FeedbackCard/FeedbackCard.tsx",
    "packages/react/src/components/SaveLocationCard/SaveLocationCard.tsx",
    "packages/react/src/components/RoutingInputGroup/RoutingInputGroup.tsx",
  ];
  const surface = read("packages/react/src/components/Surface/Surface.tsx");
  if (!surface.includes('glass: "kozmos-reset kozmos-surface-glass"') || !surface.includes('solid: "kozmos-reset kozmos-surface-solid"'))
    fail("web: Surface does not name both variants with kozmos-reset");
  else ok("web: Surface names solid and glass, with kozmos-reset");
  for (const file of web) {
    const src = read(file);
    if (!src.includes("surfaceClass(surface)")) fail(`consumer: ${file} does not take its surface from Surface`);
    else if (/bg-white\/70|backdrop-blur-3xl|bg-background\/90|kozmos-surface-glass/.test(src)) fail(`consumer: ${file} still hand-rolls glass`);
    else ok(`consumer: ${path.basename(file)} takes its surface from Surface`);
  }
  const ios = ["packages/ios/Sources/Components/ManoeuvreCard/ManoeuvreCard.swift", "packages/ios/Sources/Components/RouteSummary/RouteSummary.swift"];
  for (const file of ios) {
    const src = read(file);
    if (!src.includes(".kozmosSurface(")) fail(`consumer: ${file} is not on the role`);
    else if (src.includes("Background0.opacity(0.9)")) fail(`consumer: ${file} still hand-rolls glass`);
    else ok(`consumer: ${path.basename(file)} on the role`);
  }
  const android = ["packages/android/src/main/java/com/kozmos/components/ManoeuvreCard/ManoeuvreCard.kt", "packages/android/src/main/java/com/kozmos/components/RouteSummary/RouteSummary.kt"];
  for (const file of android) {
    const src = read(file);
    if (!src.includes("KozmosSurfaceDefaults")) fail(`consumer: ${file} is not on the role`);
    else if (src.includes("copy(alpha = 0.9f)")) fail(`consumer: ${file} still hand-rolls glass`);
    else ok(`consumer: ${path.basename(file)} on the role`);
  }
}

console.log();
if (problems.length) {
  console.log(`${problems.length} problem(s)`);
  process.exit(1);
}
console.log("ok    glass parity");
