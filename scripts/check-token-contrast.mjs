import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import {
  referenceOf,
  resolvedTokens,
  tokenDeclarations,
} from "./lib/token-css.mjs";

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

function readCss(mode) {
  return fs.readFileSync(
    path.join(root, `packages/tokens/dist/css/variables-${mode}.css`),
    "utf8",
  );
}

function readCssVariables(mode) {
  const css = readCss(mode);
  const variables = {};

  // An alias is written as a reference (GAP-23); a pair is held to the colour
  // it resolves to in this theme.
  for (const [name, value] of resolvedTokens(css)) {
    variables[name.slice(2)] = value;
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

/**
 * Decision 60: a filled emotion Button's states step along the emotion's own
 * ramp, away from the page, one step on hover and two pressed, and its focus
 * is its hover. Read from the stylesheet as written, where each state is a
 * reference to a ramp step (GAP-23), and from the colours: hover sits
 * further from the page than idle, and pressed further than hover, unless
 * the contract names the theme an exception that steps toward it.
 */
function checkStateSteps(mode, variables) {
  const rules = contract.stateSteps;
  if (!rules) return;
  const declarations = tokenDeclarations(readCss(mode));
  const page = relativeLuminance(
    hexToRgb(
      colorFor(variables, "primitives-colors-background-0", mode, "page"),
    ),
  );
  for (const emotion of rules.emotions) {
    const exception = (rules.exceptions ?? []).find(
      (entry) => entry.emotion === emotion && entry.theme === mode,
    );
    const direction = exception?.direction ?? "awayFromPage";
    const where = `${mode} ${emotion} Button states (decision 60${
      exception ? `, ${direction}: ${exception.why}` : ""
    })`;
    const token = (state) =>
      `--components-primary-buttons-${emotion}-button-background-${state}`;
    const steps = {};
    for (const state of ["idle", "hover", "pressed", "focus"]) {
      const target = referenceOf(declarations.get(token(state)) ?? "");
      const step = target?.match(/^--primitives-colors-(.+)-(\d+)$/);
      checked += 1;
      if (!step) {
        failures.push(
          `${where}: ${token(state)} is ${
            declarations.get(token(state)) ?? "missing"
          }; expected a reference to a ramp step`,
        );
        continue;
      }
      steps[state] = { ramp: step[1], step: Number(step[2]), target };
    }
    if (Object.keys(steps).length < 4) continue;
    const { idle, hover, pressed, focus } = steps;
    checked += 1;
    if (focus.target !== hover.target) {
      failures.push(
        `${where}: focus is ${focus.target}; expected the hover's, ${hover.target}`,
      );
    }
    checked += 1;
    if (hover.ramp !== idle.ramp || pressed.ramp !== idle.ramp) {
      failures.push(
        `${where}: idle, hover and pressed are ${idle.target}, ${hover.target} and ${pressed.target}; expected one ramp`,
      );
      continue;
    }
    // The ramp's own steps, in order: one step is the next one along it.
    const prefix = `--primitives-colors-${idle.ramp}-`;
    const ladder = [...declarations.keys()]
      .filter(
        (name) =>
          name.startsWith(prefix) && /^\d+$/.test(name.slice(prefix.length)),
      )
      .map((name) => Number(name.slice(prefix.length)))
      .sort((a, b) => a - b);
    const at = (entry) => ladder.indexOf(entry.step);
    const distance = (entry) =>
      Math.abs(
        relativeLuminance(
          hexToRgb(colorFor(variables, entry.target.slice(2), mode, where)),
        ) - page,
      );
    const away = direction === "awayFromPage";
    const stride = at(hover) - at(idle);
    checked += 1;
    if (Math.abs(stride) !== 1 || at(pressed) - at(hover) !== stride) {
      failures.push(
        `${where}: idle, hover and pressed are steps ${idle.step}, ${hover.step} and ${pressed.step} of ${idle.ramp}; expected one step and then one more, the same way`,
      );
      continue;
    }
    checked += 1;
    const further = (a, b) =>
      away ? distance(b) > distance(a) : distance(b) < distance(a);
    if (!further(idle, hover) || !further(hover, pressed)) {
      failures.push(
        `${where}: ${idle.ramp} ${idle.step} → ${hover.step} → ${pressed.step} steps ${
          away ? "toward" : "away from"
        } the page; expected each state ${away ? "further from" : "closer to"} it than the last`,
      );
    }
  }
}

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

// Where the hover fill must be drawn (GAP-228, decision 173): a source holds
// the rule, read with its whitespace folded. A part that moves back to muted
// fails here, not only in a browser.
const folded = (text) => text.replace(/\s+/g, " ");
const sourceHolds = (file, contains) =>
  folded(fs.readFileSync(path.join(root, file), "utf8")).includes(
    folded(contains),
  );
for (const use of contract.hoverFillUses ?? []) {
  checked += 1;
  if (!sourceHolds(use.file, use.contains))
    failures.push(
      `${use.name}: ${use.file} no longer holds ${JSON.stringify(use.contains)}`,
    );
}
// No hover or press falls back to the muted step (GAP-228, decision 173): a
// class such as hover:bg-muted, hover:bg-muted/50 or active:bg-muted, or the
// background/50 or /100 primitive behind a hover variant, anywhere in React's
// or the stylesheet's sources outside the counts allowed below, and no owned
// :hover rule that paints background/50 or /100. Tests are fixtures.
{
  const { execFileSync } = await import("node:child_process");
  const postcss = createRequire(path.join(root, "packages/react/package.json"))(
    "postcss",
  );
  const files = execFileSync(
    "git",
    ["ls-files", "packages/react/src", "packages/styles/src"],
    { cwd: root, encoding: "utf8" },
  )
    .split("\n")
    .filter(
      (file) =>
        /\.(tsx?|css)$/.test(file) && !/\.(test|spec)\.[jt]sx?$/.test(file),
    );
  const muted =
    /(?<![\w-])(?:[\w[\]=&-]+:)*(?:hover|active):(?:[\w[\]=&-]+:)*bg-(?:muted|surface-(?:50|100)|\[var\(--primitives-colors-background-(?:50|100)\)\])(?:\/[\w.[\]]+)?(?![\w-])/g;
  const allowed = Object.fromEntries(
    (contract.mutedHoverAllowed ?? []).map((entry) => [entry.file, entry]),
  );
  for (const file of files) {
    const text = fs.readFileSync(path.join(root, file), "utf8");
    const found = text.match(muted) ?? [];
    const allowance = allowed[file]?.count ?? 0;
    checked += 1;
    if (found.length !== allowance)
      failures.push(
        `${file}: ${found.length} hover or press class(es) on the muted step (${found.join(", ") || "none"}); ${allowance} allowed${
          allowed[file] ? ` (${allowed[file].name})` : ""
        }. A hover takes bg-hover-fill (decision 173)`,
      );
    if (!file.endsWith(".css")) continue;
    postcss.parse(text).walkRules((rule) => {
      if (!/:hover|\[data-highlighted\]|\[data-active/.test(rule.selector))
        return;
      rule.walkDecls(/^background(-color)?$/, (decl) => {
        if (/--primitives-colors-background-(50|100)\b/.test(decl.value))
          failures.push(
            `${file}: ${rule.selector.replace(/\s+/g, " ")} paints ${decl.value} under the pointer; a hover takes var(--semantics-hover-fill) (decision 173)`,
          );
      });
    });
  }
}

// The named exceptions: parts that keep the muted step under the pointer or
// when selected, because an ink they draw falls under its minimum on the
// hover fill. Each must still be drawn as it says, its inks must pass on the
// surface it keeps, and they must fail on the hover fill in some theme, or
// the exception is no longer needed and is taken out.
const exceptionVariables = Object.fromEntries(
  modes.map((mode) => [mode, readCssVariables(mode)]),
);
for (const exception of contract.hoverFillExceptions ?? []) {
  for (const { file, contains } of exception.sources) {
    checked += 1;
    if (!sourceHolds(file, contains))
      failures.push(
        `${exception.name}: ${file} no longer holds ${JSON.stringify(contains)}`,
      );
  }
  let needed = false;
  for (const mode of modes) {
    const variables = exceptionVariables[mode];
    const kept = colorFor(variables, exception.keeps, mode, exception.name);
    const fill = colorFor(
      variables,
      "semantics-hover-fill",
      mode,
      exception.name,
    );
    for (const ink of exception.inks) {
      const colour = colorFor(variables, ink, mode, exception.name);
      checked += 1;
      const onKept = contrastRatio(kept, colour);
      if (onKept < exception.minimum)
        failures.push(
          `${mode} ${exception.name}: --${ink} ${colour} on the kept ${kept} = ${onKept.toFixed(2)}; expected >= ${exception.minimum}`,
        );
      if (contrastRatio(fill, colour) < exception.minimum) needed = true;
    }
  }
  checked += 1;
  if (!needed)
    failures.push(
      `${exception.name}: every ink reaches ${exception.minimum}:1 on the hover fill in both themes; the exception is no longer needed`,
    );
}

for (const mode of modes) {
  const variables = readCssVariables(mode);

  // A category's count pill or counter: the ink on the fill reaches 4.5:1 in
  // both modes (the palette is the taxonomy's, the same in light and dark).
  for (const name of [
    "yellow",
    "orange",
    "turquoise",
    "red",
    "blue",
    "navy",
    "green",
    "pink",
  ]) {
    contract.pairs.push({
      name: `category ${name} fill / on-fill`,
      background: `semantics-category-fill-${name}`,
      foreground: `semantics-category-on-fill-${name}`,
      minimum: 4.5,
    });
  }
  // Pins a contrast ratio cannot express: a token that must be another
  // token's colour, or one colour, in this mode. Decision 59's theme fill is
  // theme 500 in both themes and its foreground white in both; a ratio alone
  // passed the old light-blue fill with black on it. A pin that names its
  // modes holds in those alone: the hover fill is one step in light and
  // another in dark (GAP-228).
  for (const pin of contract.pins ?? []) {
    if (pin.modes && !pin.modes.includes(mode)) continue;
    const actual = colorFor(variables, pin.token, mode, pin.name).toLowerCase();
    const expected = (
      pin.sameAs ? colorFor(variables, pin.sameAs, mode, pin.name) : pin.value
    ).toLowerCase();
    checked += 1;
    if (actual !== expected) {
      failures.push(
        `${mode} ${pin.name}: --${pin.token} is ${actual}; expected ${expected}${
          pin.sameAs ? ` (--${pin.sameAs})` : ""
        }`,
      );
    }
  }
  checkStateSteps(mode, variables);
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

console.log(`Token contrast ok (${checked} pairs and pins across light/dark)`);
