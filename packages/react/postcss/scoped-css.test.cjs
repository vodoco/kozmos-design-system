/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test");
const assert = require("node:assert/strict");
const postcss = require("postcss");
const plugin = require("./scoped-css.cjs");
const compile = async (css) =>
  (await postcss([plugin()]).process(css, { from: undefined })).root;

test("identical theme tokens share a rule without losing dark specificity", async () => {
  const root = await compile(
    ':root {--same:8px;--surface:white;--alias:var(--surface)} [data-theme="dark"] {--same:8px;--surface:black;--alias:var(--surface)}',
  );
  const declarations = [];
  root.walkDecls("--same", (d) => declarations.push(d));
  assert.equal(declarations.length, 1, "common token emitted once");
  assert.deepEqual(declarations[0].parent.selectors, [
    "[data-kozmos-root]",
    '[data-kozmos-root][data-theme="dark"]',
  ]);
  const surfaces = [];
  root.walkDecls("--surface", (d) =>
    surfaces.push([d.parent.selector, d.value]),
  );
  assert.deepEqual(surfaces, [
    ["[data-kozmos-root]", "white"],
    ['[data-kozmos-root][data-theme="dark"]', "black"],
  ]);
  assert.equal(
    root.nodes.filter(
      (n) => n.type === "rule" && n.nodes.some((d) => d.prop === "--alias"),
    ).length,
    1,
  );
});

test("theme sharing preserves importance differences and fallback declarations", async () => {
  const root = await compile(
    ':root {--same:8px!important;--different:0;--fallback:red;--fallback:color(display-p3 1 0 0)} [data-theme="dark"] {--same:8px;--different:1;--fallback:red;--fallback:color(display-p3 1 0 0)}',
  );
  const declarations = [];
  root.walkDecls("--fallback", (d) => declarations.push(d.value));
  assert.deepEqual(declarations, [
    "red",
    "color(display-p3 1 0 0)",
    "red",
    "color(display-p3 1 0 0)",
  ]);
  const important = [];
  root.walkDecls("--same", (d) => important.push(Boolean(d.important)));
  assert.deepEqual(important, [true, false]);
});

test("theme sharing does not factor arbitrary mixed or repeated root recipes", async () => {
  for (const source of [
    ':root {--same:8px;color:red} [data-theme="dark"] {--same:8px;color:blue}',
    ':root {--same:8px} [data-theme="dark"] {--same:8px} :root {--same:9px}',
  ]) {
    const root = await compile(source);
    const values = [];
    root.walkDecls("--same", (d) => values.push(d.value));
    assert.deepEqual(
      values,
      source.includes("9px") ? ["8px", "8px", "9px"] : ["8px", "8px"],
    );
  }
});

test("tokens and owned recipes work without scope; legacy utilities remain bounded", async () => {
  const root = await compile(
    ':root {--surface:white} [data-theme="dark"] {--surface:black} .bg-background {background:var(--surface)} @kozmos-owned {.kozmos-input {background:var(--surface)}}',
  );
  const owned = [];
  root.walkRules(".kozmos-input", (r) => owned.push(r));
  assert.equal(owned.length, 1);
  assert.equal(owned[0].parent, root);
  const legacy = [];
  root.walkRules(":scope .bg-background", (r) => legacy.push(r));
  assert.equal(legacy[0].parent.name, "scope");
  root.walkAtRules("scope", (r) => r.remove());
  assert.match(root.toString(), /\[data-kozmos-root\] \{--surface:white\}/);
  assert.match(
    root.toString(),
    /\[data-kozmos-root\]\[data-theme="dark"\] \{--surface:black\}/,
  );
  assert.doesNotMatch(root.toString(), /:root|@kozmos-owned|\.bg-background/);
});

test("each keyframe is named exactly once and references agree after moving", async () => {
  const root = await compile(
    "@keyframes enter {from {opacity:0} to {opacity:1}} @keyframes exit {to {opacity:0}} .animate {animation:enter 1s} @kozmos-owned {.kozmos-popover {animation-name:exit} @keyframes spin {to {transform:rotate(360deg)}} .kozmos-loader {animation:spin 1s linear infinite}}",
  );
  const names = [];
  root.walkAtRules(/keyframes$/, (r) => {
    names.push(r.params);
    assert.equal(r.parent, root);
  });
  assert.deepEqual(names.sort(), [
    "kozmos-enter",
    "kozmos-exit",
    "kozmos-spin",
  ]);
  root.walkDecls(/animation/, (d) =>
    assert.match(d.value, /^kozmos-(enter|exit|spin)/),
  );
});

test("conditioned keyframes keep their media condition", async () => {
  const root = await compile(
    "@media (prefers-reduced-motion: no-preference) {@keyframes appear {to {opacity:1}}}",
  );
  root.walkAtRules("keyframes", (r) => {
    assert.equal(r.parent.name, "media");
    assert.equal(r.params, "kozmos-appear");
  });
});

// Tailwind 3 declares its compiler variables' defaults on every element.
// Kozmos registers them instead (inherits: false), as Tailwind 4 registers
// the same names, and a read of one with no initial value falls back to
// Tailwind 3's default.
const TAILWIND_DEFAULTS =
  "*,\n::before,\n::after {--tw-translate-x:0; --tw-skew-x:0; --tw-blur: ; --tw-ring-offset-width:0px; --tw-ring-color:rgb(59 130 246 / .5); --tw-shadow-colored:0 0 #0000; --tw-contain-size: } ::backdrop {--tw-translate-x:0; --tw-skew-x:0; --tw-blur: ; --tw-ring-offset-width:0px; --tw-ring-color:rgb(59 130 246 / .5); --tw-shadow-colored:0 0 #0000; --tw-contain-size: } *, ::before, ::after {box-sizing:border-box; border-width:0}";
const USES =
  ".translate {transform:translateX(var(--tw-translate-x)) skewX(var(--tw-skew-x))} .blur {filter:var(--tw-blur) blur(1px)} .ring {box-shadow:0 0 0 var(--tw-ring-offset-width) var(--tw-ring-color)} @kozmos-owned {.kozmos-ring {--tw-ring-offset-width:2px; box-shadow:0 0 0 var(--tw-ring-offset-width, 1px) red}}";

test("Tailwind's compiler defaults are declared on no element, inside a root or out", async () => {
  const root = await compile(TAILWIND_DEFAULTS + USES);
  const declared = [];
  root.walkDecls(/^--tw-/, (d) => declared.push([d.parent.selector, d.prop]));
  assert.deepEqual(declared, [[".kozmos-ring", "--tw-ring-offset-width"]]);
  // Tailwind's reset keeps its place (and GAP-52's weight); only the
  // initialisers go.
  const reset = [];
  root.walkDecls("box-sizing", (d) => reset.push(d.parent.selector));
  assert.equal(reset.length, 1);
  assert.match(reset[0], /^:scope \*:not\(:where\(\.kozmos-reset\)\)/);
});

test("every compiler variable read is registered as Tailwind 4 registers it, at the top level", async () => {
  const root = await compile(TAILWIND_DEFAULTS + USES);
  const registered = {};
  root.walkAtRules("property", (rule) => {
    assert.equal(rule.parent, root, `${rule.params} is registered globally`);
    registered[rule.params] = Object.fromEntries(
      rule.nodes.map((d) => [d.prop, d.value]),
    );
  });
  assert.deepEqual(registered, {
    "--tw-translate-x": {
      syntax: '"*"',
      inherits: "false",
      "initial-value": "0",
    },
    // Tailwind 4 has no initial value for these: Kozmos's reads fall back.
    "--tw-skew-x": { syntax: '"*"', inherits: "false" },
    "--tw-blur": { syntax: '"*"', inherits: "false" },
    "--tw-ring-color": { syntax: '"*"', inherits: "false" },
    "--tw-ring-offset-width": {
      syntax: '"<length>"',
      inherits: "false",
      "initial-value": "0px",
    },
  });
  // Unread defaults are neither declared nor registered.
  assert.doesNotMatch(root.toString(), /--tw-shadow-colored|--tw-contain-size/);
  // Registrations come before everything else.
  assert.equal(root.first.type, "atrule");
  assert.equal(root.first.name, "property");
});

test("a read of a variable registered without an initial value falls back to Tailwind 3's default", async () => {
  const root = await compile(TAILWIND_DEFAULTS + USES);
  const values = {};
  root.walkDecls(/^(transform|filter|box-shadow)$/, (d) => {
    values[d.parent.selector] = d.value;
  });
  assert.deepEqual(values, {
    // A registered initial value is the default; no fallback is needed.
    ":scope .translate":
      "translateX(var(--tw-translate-x)) skewX(var(--tw-skew-x, 0))",
    ":scope .blur": "var(--tw-blur,) blur(1px)",
    ":scope .ring":
      "0 0 0 var(--tw-ring-offset-width) var(--tw-ring-color, rgb(59 130 246 / .5))",
    // A read with its own fallback keeps it.
    ".kozmos-ring": "0 0 0 var(--tw-ring-offset-width, 1px) red",
  });
});

test("a compiler default the registration table does not know stops the build", async () => {
  await assert.rejects(
    compile(
      "*, ::before, ::after {--tw-new-thing:0} .x {width:var(--tw-new-thing)}",
    ),
    /--tw-new-thing is a Tailwind default the registration table does not know/,
  );
});

test("owned CSS rejects a native scope dependency", async () => {
  await assert.rejects(
    compile("@kozmos-owned {@scope (.root) {.kozmos-input {color:red}}}"),
    /must not depend on @scope/,
  );
});

test("legacy preflight excludes owned targets, including pseudo-elements, but utilities do not", async () => {
  const root = postcss.parse(
    "input, textarea::placeholder {padding:0} .p-4 {padding:1rem}",
  );
  root.first.raws.tailwind = { layer: "base" };
  const result = (await postcss([plugin()]).process(root, { from: undefined }))
    .css;
  assert.match(result, /input:not\(:where\(\.kozmos-reset\)\)/);
  assert.match(result, /textarea:not\(:where\(\.kozmos-reset\)\)::placeholder/);
  assert.match(result, /:scope \.p-4 \{padding:1rem\}/);
  assert.match(
    result,
    /:where\(:scope input:not\(:where\(\.kozmos-reset\)\)\)/,
  );
});

// Decision 82: density.css sets the control sizes on :root (touch) and on a
// [data-kozmos-density] provider. Like the theme tokens they belong on each
// Kozmos root itself, outside @scope: wrapped as `:scope [data-kozmos-density]`
// they would match only below a root, never the provider's own root, and
// compact would never apply. Compact is any element marked compact, a
// DensityScope's or a portalled popover's as well as a root's.
test("density tokens land on each root and on any marked element", async () => {
  const root = await compile(
    ":root {--same:8px} [data-theme=\"dark\"] {--same:8px} :root, [data-kozmos-density='touch'] {--density-field-height-md:44px} [data-kozmos-density='compact'] {--density-field-height-md:40px} .h-field {height:var(--density-field-height-md)}",
  );
  const density = [];
  root.walkDecls("--density-field-height-md", (d) =>
    density.push([d.parent.parent === root, d.parent.selector, d.value]),
  );
  assert.deepEqual(density, [
    [
      true,
      '[data-kozmos-root]:not([data-kozmos-density="compact"]), [data-kozmos-density="touch"]',
      "44px",
    ],
    [true, '[data-kozmos-density="compact"]', "40px"],
  ]);
  // The theme pair is still recognised and shared.
  const same = [];
  root.walkDecls("--same", (d) => same.push(d.parent.selector));
  assert.deepEqual(same, [
    '[data-kozmos-root], [data-kozmos-root][data-theme="dark"]',
  ]);
  // Utilities that read the tokens stay bounded inside @scope.
  const utility = [];
  root.walkRules(":scope .h-field", (r) => utility.push(r.parent.name));
  assert.deepEqual(utility, ["scope"]);
});
