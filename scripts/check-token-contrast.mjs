import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const root = process.cwd();
const require = createRequire(import.meta.url);
const contractPath = path.join(
  root,
  "packages/tokens/src/contrast-contract.json",
);
const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const modes = ["light", "dark"];
// Exercise every enabled button emotion/state, not only the default themed pair.
// Outline/text treatments use the page surface, and the muted surface on hover.
for (const emotion of [
  "themed",
  "neutral",
  "success",
  "danger",
  "informative",
  "alert",
]) {
  for (const state of ["idle", "hover", "pressed", "focus"]) {
    contract.pairs.push({
      name: `primary button ${emotion} ${state}`,
      background: `components-primary-buttons-${emotion}-button-background-${state}`,
      foreground: `components-primary-buttons-${emotion}-button-foreground-content-${state}`,
      minimum: 4.5,
    });
    for (const surface of [0, 100])
      contract.pairs.push({
        name: `secondary button ${emotion} ${state} on surface ${surface}`,
        background: `primitives-colors-background-${surface}`,
        foreground: `components-secondary-buttons-${emotion}-button-foreground-content-${state}`,
        minimum: 4.5,
      });
  }
}

// An emotion's Text role is the emotion as text or a glyph on the page itself,
// and the page is any neutral surface a panel, card or sheet paints: white, and
// the two greys (a sheet is background/100). The steps were once measured on
// white alone, and four of six failed on the sheet's grey.
for (const emotion of [
  "themed",
  "neutral",
  "success",
  "danger",
  "informative",
  "alert",
]) {
  for (const surface of [0, 50, 100])
    contract.pairs.push({
      name: `${emotion} text on background ${surface}`,
      background: `primitives-colors-background-${surface}`,
      foreground: `semantics-emotion-${emotion}-text`,
      minimum: 4.5,
    });
}

function readCssVariables(mode) {
  const filePath = path.join(
    root,
    `packages/tokens/dist/css/variables-${mode}.css`,
  );
  const css = fs.readFileSync(filePath, "utf8");
  const variables = {};

  for (const match of css.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    variables[match[1]] = match[2].trim();
  }

  return variables;
}

function colorFor(variables, tokenName, mode, pairName) {
  const color = variables[tokenName];
  if (!color) {
    throw new Error(`${mode} ${pairName}: missing token --${tokenName}`);
  }

  if (!/^#[0-9a-f]{6}$/i.test(color)) {
    throw new Error(
      `${mode} ${pairName}: expected --${tokenName} to be a 6-digit hex color, received ${color}`,
    );
  }

  return color;
}

function contrastRatio(a, b) {
  const aLuminance = relativeLuminance(hexToRgb(a));
  const bLuminance = relativeLuminance(hexToRgb(b));
  const lighter = Math.max(aLuminance, bLuminance);
  const darker = Math.min(aLuminance, bLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance([r, g, b]) {
  return 0.2126 * linearRgb(r) + 0.7152 * linearRgb(g) + 0.0722 * linearRgb(b);
}

function linearRgb(value) {
  const channel = value / 255;
  return channel <= 0.03928
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function hexToRgb(value) {
  const hex = value.trim().replace(/^#/, "");
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
}

const failures = [];
let checked = 0;

function getPath(value, segments) {
  return segments.reduce((current, segment) => current?.[segment], value);
}

for (const alias of contract.runtimeAliases ?? []) {
  const absolutePath = path.join(root, alias.file);
  const config = require(absolutePath);
  const configured = getPath(config, alias.path);
  // Tailwind token colours now accept /alpha through a colour callback. The
  // unmodified role must still resolve to exactly the canonical alias.
  const actual = typeof configured === "function" ? configured({}) : configured;
  checked += 1;

  if (actual !== alias.value) {
    failures.push(
      `${alias.name}: expected ${alias.file} ${alias.path.join(".")} to be ${alias.value}, received ${String(
        actual,
      )}`,
    );
  }
}

for (const mode of modes) {
  const variables = readCssVariables(mode);

  // A category's count pill or counter: the ink on the fill reaches 4.5:1 in
  // both modes (the palette is the taxonomy's, the same in light and dark).
  for (const name of ["yellow", "orange", "turquoise", "red", "blue", "navy", "green", "pink"]) {
    contract.pairs.push({
      name: `category ${name} fill / on-fill`,
      background: `semantics-category-fill-${name}`,
      foreground: `semantics-category-on-fill-${name}`,
      minimum: 4.5,
    });
  }
  for (const pair of contract.pairs) {
    const background = colorFor(variables, pair.background, mode, pair.name);
    const foreground = colorFor(variables, pair.foreground, mode, pair.name);
    const ratio = contrastRatio(background, foreground);
    checked += 1;

    if (ratio < pair.minimum) {
      failures.push(
        `${mode} ${pair.name}: ${foreground} on ${background} = ${ratio.toFixed(
          2,
        )}; expected >= ${pair.minimum}`,
      );
    }
  }
}

if (failures.length) {
  throw new Error(`Token contrast check failed:\n- ${failures.join("\n- ")}`);
}

console.log(`Token contrast ok (${checked} pairs across light/dark)`);
