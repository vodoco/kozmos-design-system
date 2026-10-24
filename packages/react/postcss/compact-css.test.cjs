/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const postcss = require("postcss");
const plugin = require("./compact-css.cjs");
const compile = async (css) =>
  (await postcss([plugin()]).process(css, { from: undefined })).root;
const declarations = (root, prop) => {
  const found = [];
  root.walkDecls(prop, (d) => found.push(`${d.parent.selector} ${d.value}`));
  return found;
};

test("a declaration a later one always overrides goes", async () => {
  const root = await compile(
    [
      // transition-[…] then duration-300, as @apply writes them.
      ".map-control {transition-duration:calc(.15s * var(--s, 1)); transition-duration:calc(.3s * var(--s, 1))}",
      ".reads {color:red; color:var(--ink)}",
      // animate-in's resets, then fade-in-0 in a later rule of the same selector.
      ".pop[data-state=open] {--tw-enter-opacity:initial; --tw-enter-scale:initial}",
      ".other {--tw-enter-opacity:1}",
      ".pop[data-state=open] {--tw-enter-opacity:0}",
    ].join(" "),
  );
  assert.deepEqual(declarations(root, "transition-duration"), [
    ".map-control calc(.3s * var(--s,1))",
  ]);
  assert.deepEqual(declarations(root, "color"), [".reads var(--ink)"]);
  assert.deepEqual(declarations(root, /^--tw-enter/), [
    ".pop[data-state=open] initial",
    ".other 1",
    ".pop[data-state=open] 0",
  ]);
});

test("a declaration an engine might fall back to stays", async () => {
  const root = await compile(
    [
      // A later keyword one engine may drop: a fallback pair.
      ".clip {overflow:hidden; overflow:clip}",
      // A later literal: not provably valid everywhere.
      ".label {line-height:1.25rem; line-height:1}",
      // The earlier one is !important.
      ".strong {color:red !important; color:var(--ink)}",
      // Another condition: not the same rule.
      ".p {--a:1} @media (min-width: 1px) {.p {--a:2}}",
      // Ordinary properties are never matched across rules.
      ".q {width:var(--w)} .q {width:var(--v)}",
    ].join(" "),
  );
  assert.deepEqual(declarations(root, "overflow"), [
    ".clip hidden",
    ".clip clip",
  ]);
  assert.deepEqual(declarations(root, "line-height"), [
    ".label 1.25rem",
    ".label 1",
  ]);
  assert.deepEqual(declarations(root, "color"), [
    ".strong red",
    ".strong var(--ink)",
  ]);
  assert.deepEqual(declarations(root, "--a"), [".p 1", ".p 2"]);
  assert.deepEqual(declarations(root, "width"), [".q var(--w)", ".q var(--v)"]);
});

test("a custom property's value starts right after its colon", async () => {
  const css = (
    await postcss([plugin()]).process(".a {--x: 1px; --empty: ; color: red}", {
      from: undefined,
    })
  ).css;
  assert.match(css, /--x:1px;/);
  // A value of only whitespace is left as it was.
  assert.match(css, /--empty: ;/);
});

test("whitespace no token needs goes from custom property values", async () => {
  const root = await compile(
    ".a {--rgba: rgba(23, 25, 28, .03); --var: var( --b ); --calc: calc(1px * 2 + 3px); --words: a b; --font: 16px / 1.5 a, b; --url: url( a.png ); width: rgba(1, 2, 3, .5)}",
  );
  const values = {};
  root.walkDecls((d) => {
    values[d.prop] = d.value;
  });
  assert.deepEqual(values, {
    "--rgba": "rgba(23,25,28,.03)",
    "--var": "var(--b)",
    // `+` and `-` need their spaces in calc().
    "--calc": "calc(1px*2 + 3px)",
    "--words": "a b",
    "--font": "16px/1.5 a,b",
    "--url": "url( a.png )",
    // Ordinary properties are the minifier's.
    width: "rgba(1, 2, 3, .5)",
  });
});

test("a custom property's hex colour is written short where it can be", async () => {
  const root = await compile(
    ".a {--white: #ffffff; --alpha: #33993388; --half: #33993380; --long: #123456; --upper: #AABBCC; --url: url(#ffffff); color: #ffffff}",
  );
  const values = {};
  root.walkDecls((d) => {
    values[d.prop] = d.value;
  });
  assert.deepEqual(values, {
    "--white": "#fff",
    "--alpha": "#3938",
    "--half": "#33993380",
    "--long": "#123456",
    "--upper": "#ABC",
    "--url": "url(#ffffff)",
    color: "#ffffff",
  });
});

test("a var() fallback loses the space after its comma in ordinary properties", async () => {
  const root = await compile(
    ".a {width: var(--x, 1px); margin: var(--m, 0) var(--n, 2px)}",
  );
  const values = {};
  root.walkDecls((d) => {
    values[d.prop] = d.value;
  });
  assert.deepEqual(values, {
    width: "var(--x,1px)",
    margin: "var(--m,0) var(--n,2px)",
  });
});

test("transparent is #0000 where a value is a colour", async () => {
  const root = await compile(
    ".a {background-color: transparent; border: 1px solid transparent; outline: 2px solid transparent; background: linear-gradient(red, transparent); color: color-mix(in srgb, red 50%, transparent); -webkit-tap-highlight-color: transparent; animation-name: transparent; grid-area: transparent; --x: transparent}",
  );
  const values = {};
  root.walkDecls((d) => {
    values[d.prop] = d.value;
  });
  assert.deepEqual(values, {
    "background-color": "#0000",
    border: "1px solid #0000",
    outline: "2px solid #0000",
    background: "linear-gradient(red, #0000)",
    color: "color-mix(in srgb, red 50%, #0000)",
    "-webkit-tap-highlight-color": "#0000",
    // Names, not colours.
    "animation-name": "transparent",
    "grid-area": "transparent",
    "--x": "transparent",
  });
});

test("Tailwind's banner goes; any other kept comment stays", async () => {
  const root = await compile(
    "/*! tailwindcss v3.4.19 | MIT License | https://tailwindcss.com */ /*! another licence */ .a {color: red}",
  );
  const comments = [];
  root.walkComments((c) => comments.push(c.text));
  assert.deepEqual(comments, ["! another licence"]);
});

// The banner may go only because the package ships Tailwind's licence, with
// its copyright notice, which the banner never carried.
test("the package ships the licences of what its stylesheets copy", () => {
  const dir = path.join(__dirname, "..");
  const manifest = JSON.parse(
    fs.readFileSync(path.join(dir, "package.json"), "utf8"),
  );
  assert.ok(manifest.files.includes("THIRD-PARTY-NOTICES"));
  const flat = (text) => text.replace(/\s+/g, " ").trim();
  const notices = flat(
    fs.readFileSync(path.join(dir, "THIRD-PARTY-NOTICES"), "utf8"),
  );
  for (const licence of [
    "tailwindcss/LICENSE",
    "tailwindcss/lib/css/LICENSE",
    "tailwindcss-animate/LICENSE",
  ]) {
    const text = fs.readFileSync(
      require.resolve(licence, { paths: [dir] }),
      "utf8",
    );
    assert.ok(notices.includes(flat(text)), `${licence} is reproduced`);
  }
});

test("rules with the same declarations become one where the cascade allows", async () => {
  const root = await compile(
    [
      ".a {color: red} .between {padding: 1px} .c {color: red}",
      // A rule between them sets the colour: merging would move .d past it.
      ".d {color: blue} .e {color: green} .f {color: blue}",
      // In another context, a rule between them still counts.
      ".g {margin: 0} @media (min-width: 1px) {.h {margin-top: 1px}} .i {margin: 0}",
      // A selector some engine drops would take the others with it.
      ".j::-webkit-scrollbar {display: none} .k::-webkit-scrollbar {display: none}",
      // Different conditions are not the same rule.
      ".l {opacity: .5} @media (min-width: 2px) {.m {opacity: .5}}",
    ].join(" "),
  );
  const rules = [];
  root.walkRules((rule) => rules.push(rule.selector));
  assert.deepEqual(rules, [
    ".between",
    ".a,.c",
    ".d",
    ".e",
    ".f",
    ".g",
    ".h",
    ".i",
    ".j::-webkit-scrollbar",
    ".k::-webkit-scrollbar",
    ".l",
    ".m",
  ]);
});

test("an at-rule a merge leaves empty goes", async () => {
  const root = await compile(
    "@media (min-width: 1px) {.a {color: red}} @media (min-width: 1px) {.b {color: red}} @supports (display: grid) {@media (min-width: 2px) {}}",
  );
  assert.equal(
    root.toString().replace(/\s+/g, " "),
    "@media (min-width: 1px) {.a,.b {color: red}}",
  );
});

test("an empty @layer or @keyframes stays: each still means something", async () => {
  const root = await compile(
    [
      // An empty @layer a still puts layer a before layer b.
      "@layer a {} @layer b {.x {color: red}}",
      // A merge that empties a layer's block leaves the block.
      "@layer c {.p {opacity: 1}} @layer c {.q {opacity: 1}}",
      // An empty @keyframes still names an animation.
      "@keyframes noop {} .y {animation: noop 1s}",
      // An empty condition means nothing.
      "@media (min-width: 1px) {}",
    ].join(" "),
  );
  const atRules = [];
  root.walkAtRules((rule) =>
    atRules.push(`@${rule.name} ${rule.params} ${rule.nodes.length}`),
  );
  assert.deepEqual(atRules, [
    "@layer a 0",
    "@layer b 1",
    "@layer c 0",
    "@layer c 1",
    "@keyframes noop 0",
  ]);
});

test("a var() in a string or a url() is text, not a var()", async () => {
  const root = await compile(
    [
      '.a {content: "var(--x, y)"; background: url("var(--x, y).png") no-repeat; width: var(--w, 1px)}',
      // A later declaration holding var() only as text is no proof it applies.
      '.b {content: counter(c); content: "var(--x)"}',
      '.c {cursor: pointer; cursor: url("var(--x).svg"), auto}',
    ].join(" "),
  );
  assert.deepEqual(declarations(root, /^(content|background|width|cursor)$/), [
    '.a "var(--x, y)"',
    '.a url("var(--x, y).png") no-repeat',
    ".a var(--w,1px)",
    ".b counter(c)",
    '.b "var(--x)"',
    ".c pointer",
    '.c url("var(--x).svg"), auto',
  ]);
});

test("a merge joins only selectors every floor engine parses", async () => {
  const root = await compile(
    [
      ".a:hover {color: red} .b::placeholder {color: red}",
      // A newer pseudo-element, and a vendor's, are never joined.
      ".c::checkmark {opacity: 0} .d::checkmark {opacity: 0}",
      ".e:open {margin: 0} .f:open {margin: 0}",
      // An escaped colon in a class name is not a pseudo-class.
      ".hover\\:g:hover {padding: 0} .h {padding: 0}",
    ].join(" "),
  );
  const rules = [];
  root.walkRules((rule) => rules.push(rule.selector));
  assert.deepEqual(rules, [
    ".a:hover,.b::placeholder",
    ".c::checkmark",
    ".d::checkmark",
    ".e:open",
    ".f:open",
    ".hover\\:g:hover,.h",
  ]);
});

test("a second pass changes nothing", async () => {
  const source = [
    "/*! tailwindcss v3.4.19 | MIT License | https://tailwindcss.com */",
    ".a {--x: rgba(1, 2, 3, .5); --w: #ffffff; color: var(--c, transparent); color: var(--d, red)}",
    ".b {margin: var(--m, 0) var(--n, 0)} .c {margin: var(--m, 0) var(--n, 0)}",
    "@media (min-width: 1px) {.d {opacity: 0}} @media (min-width: 1px) {.e {opacity: 0}}",
  ].join(" ");
  const once = (await postcss([plugin()]).process(source, { from: undefined }))
    .css;
  const twice = (await postcss([plugin()]).process(once, { from: undefined }))
    .css;
  assert.equal(twice, once);
});
