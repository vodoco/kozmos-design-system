import assert from "node:assert/strict";
import { test } from "node:test";
import { checkCss, checkScript, checkSite } from "./check-ds-only.mjs";

const rules = (findings) => findings.map((finding) => finding.rule).sort();

test("the site itself passes", () => {
  assert.deepEqual(checkSite(), []);
});

test("raw elements that Kozmos has a component for are refused", () => {
  const findings = checkScript(
    `export const A = () => <div><p>Hi</p><button>Go</button><a href="/">Home</a><svg /></div>;`,
    "a.tsx",
  );
  assert.deepEqual(rules(findings), [
    "element",
    "element",
    "element",
    "element",
    "element",
  ]);
  assert.match(findings[0].message, /Box/);
});

test("sectioning elements, pre and code, and components are allowed", () => {
  const findings = checkScript(
    `import { Box } from "@kozmos-ds/react";
     export const A = () => <main><section><pre><code>x</code></pre><Box /><Foo.Bar /></section></main>;`,
    "a.tsx",
  );
  assert.deepEqual(findings, []);
});

test("imports from other UI libraries are refused; the Kozmos packages pass", () => {
  const findings = checkScript(
    `import { X } from "lucide-react";
     import * as Dialog from "@radix-ui/react-dialog";
     import clsx from "clsx";
     import { Button } from "@kozmos-ds/react";
     import { kozmosIconNames } from "@kozmos-ds/icons";
     import "@kozmos-ds/react/style.css";
     import light from "@kozmos-ds/tokens/dist/css/variables-light.css?raw";
     import { Link } from "react-router";`,
    "a.tsx",
  );
  assert.deepEqual(rules(findings), ["import", "import", "import"]);
});

test("node built-ins are for tests only", () => {
  assert.deepEqual(rules(checkScript(`import fs from "node:fs";`, "a.ts")), [
    "import",
  ]);
  assert.deepEqual(
    checkScript(`import { test } from "node:test";`, "a.test.ts"),
    [],
  );
});

test("style may pass custom properties and nothing else", () => {
  assert.deepEqual(
    checkScript(
      `export const A = () => <Box style={{ "--pin-x": "20%" }} />;`,
      "a.tsx",
    ),
    [],
  );
  assert.deepEqual(
    rules(
      checkScript(
        `export const A = () => <Box style={{ color: "red", "--x": 1 }} />;`,
        "a.tsx",
      ),
    ),
    ["style"],
  );
  assert.deepEqual(
    rules(
      checkScript(
        `const s = { margin: 0 }; export const A = () => <Box style={s} />;`,
        "a.tsx",
      ),
    ),
    ["style"],
  );
});

test("colour literals in strings are refused, except in a unit test's samples", () => {
  assert.deepEqual(rules(checkScript(`const c = "#1051e8";`, "a.ts")), [
    "colour-literal",
  ]);
  assert.deepEqual(checkScript(`const c = "#1051e8";`, "a.test.ts"), []);
  assert.deepEqual(rules(checkScript("const c = `rgb(0 0 0)`;", "a.ts")), [
    "colour-literal",
  ]);
  assert.deepEqual(checkScript(`const href = "#main";`, "a.ts"), []);
});

test("CSS: colours, typography, radii, shadows and spacing must be tokens", () => {
  const findings = checkCss(`
    .a { color: #fff; background: rgb(0 0 0); border-color: red; }
    .b { font-size: 14px; line-height: 1.5; font-weight: 700; font-family: Inter, sans-serif; }
    .c { border-radius: 8px; box-shadow: 0 1px 2px black; }
    .d { padding: 16px; gap: 1rem; margin-block: 0 auto; }
    .e { width: 20rem !important; }
  `);
  assert.deepEqual(rules(findings), [
    "colour-literal",
    "colour-literal",
    "colour-literal",
    "colour-literal",
    "important",
    "radius",
    "shadow",
    "spacing",
    "spacing",
    "typography",
    "typography",
    "typography",
    "typography",
  ]);
});

test("CSS: typography from tokens passes; a token mixed with a literal does not", () => {
  assert.deepEqual(
    checkCss(`
      .display {
        font-size: calc(var(--primitives-typography-font-size-headings-h1) * 1px);
        line-height: calc(var(--primitives-typography-line-height-700) * 1px);
        letter-spacing: calc(var(--primitives-typography-letter-spacing-compact) * 1px);
        font-family: var(--semantics-typography-family-mono);
      }
    `),
    [],
  );
  // A literal in a fallback is a literal: 1.4 is typed in, not a token.
  assert.deepEqual(
    rules(
      checkCss(
        `.a { font-size: calc(var(--x) * 1.2px); line-height: var(--y, 1.4); }`,
      ),
    ),
    ["typography", "typography"],
  );
  assert.deepEqual(
    checkCss(`.a { line-height: var(--y, var(--z)); top: var(--t, 0px); }`),
    [],
  );
});

test("CSS: tokens pass, including the unit conversion", () => {
  const findings = checkCss(`
    :root { --gap: calc(var(--primitives-layout-spacing-200) * 1px); }
    .a {
      padding: var(--gap) calc(var(--primitives-layout-spacing-100) * 1px);
      gap: 0;
      margin-inline: auto;
      border-radius: calc(var(--semantics-radius-container) * 1px);
      box-shadow: var(--semantics-elevation-raised);
      background: var(--primitives-colors-background-0);
      border-block: var(--primitives-border-width-sm) solid var(--semantics-border-subtle);
      max-inline-size: 48rem;
    }
    .pin { left: calc(50% + (var(--x) - 50%) * var(--zoom)); top: 50%; }
  `);
  assert.deepEqual(findings, []);
});

test("CSS: selectors may not reach into Kozmos components", () => {
  assert.deepEqual(
    rules(
      checkCss(
        `.card .kozmos-button { display: none; } [data-slot="navbar"] { gap: 0; }`,
      ),
    ),
    ["kozmos-internals", "kozmos-internals"],
  );
});

test("CSS: comments and nested blocks are handled", () => {
  assert.deepEqual(
    checkCss(`/* color: #fff; font-size: 12px */ .a { gap: 0; }`),
    [],
  );
  assert.deepEqual(
    rules(
      checkCss(
        `@media (min-width: 64rem) { .a { padding: 12px; } } @keyframes x { from { opacity: 0 } }`,
      ),
    ),
    ["spacing"],
  );
});

test("a className names the site's own classes, not Kozmos's utilities", () => {
  assert.deepEqual(
    checkScript(
      'export const A = ({ n }) => <Box className={`site-tile site-tile-${n}`}><Button className="ex-signin-wide" /></Box>;',
      "a.tsx",
    ),
    [],
  );
  // Kozmos's own recipe function is its interface; its arguments are not classes.
  assert.deepEqual(
    checkScript(
      `export const A = () => <Link className={buttonVariants({ variant: "outline" })} />;`,
      "a.tsx",
    ),
    [],
  );
  assert.deepEqual(
    rules(
      checkScript(
        `export const A = ({ on }) => <Box className="w-full"><Button className={on ? "site-fill" : "h-4"} /></Box>;`,
        "a.tsx",
      ),
    ),
    ["class", "class"],
  );
});

test("CSS: universal and element selectors are refused; html, body and keyframes pass", () => {
  assert.deepEqual(
    rules(
      checkCss(
        `.site-grid > * { inline-size: 100%; } .site-card h3 { margin: 0; } a:hover { color: var(--x); }`,
      ),
    ),
    ["selector", "selector", "selector"],
  );
  assert.deepEqual(
    checkCss(
      `html { color-scheme: light; } html[data-theme="dark"] .site-reveal { opacity: 1; } body { margin: 0; } @keyframes k { from { opacity: 0 } 50% { opacity: 1 } }`,
    ),
    [],
  );
});

test("an example's stylesheet reads tokens, not the site's aliases", () => {
  assert.deepEqual(
    rules(
      checkCss(
        `.ex-a { padding: var(--site-space-300); }`,
        "src/examples/a/A.css",
      ),
    ),
    ["example-alias"],
  );
  assert.deepEqual(
    checkCss(
      `.site-a { padding: var(--site-space-300); }`,
      "src/styles/site.css",
    ),
    [],
  );
  assert.deepEqual(
    checkCss(
      `.ex-a { padding: calc(var(--primitives-layout-spacing-300) * 1px); }`,
      "src/examples/a/A.css",
    ),
    [],
  );
});
