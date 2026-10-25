import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

// Tailwind 3 declares its compiler variables' defaults on every element.
// Kozmos registers them with @property instead (packages/react/postcss/
// scoped-css.cjs), so no element carries its own copy of them, which WebKit
// rebuilds on every re-theme. Two things are proved here, on the built
// stylesheet: nothing declares the defaults on every element any more, and
// each utility that reads them still draws what Tailwind 3's defaults drew,
// next to a reference written out by hand, with a parent's value kept from
// its child, in a light and a dark root.
const require = createRequire(
  new URL("../packages/react/package.json", import.meta.url),
);
const postcss = require("postcss");
// Every name Tailwind 3 initialises on every element.
const compilerVariables = new Set(
  Object.keys(require("./postcss/scoped-css.cjs").TAILWIND_4_REGISTRATION),
);
const { code, css } = await buildReactFixture("compiler-defaults-host.tsx");
const stylesheet = postcss.parse(css);

// 1. The stylesheet: no rule that reaches every element declares a compiler
// variable; every variable read is registered, globally, and every read of
// one has a fallback or a registered initial value.
const everyElement =
  /(^|[\s,(>])(\*|::?backdrop|::?before|::?after)|\.kozmos-reset/;
const spread = [];
stylesheet.walkRules((rule) => {
  if (rule.parent.type === "atrule" && /keyframes$/.test(rule.parent.name))
    return;
  if (!everyElement.test(rule.selector)) return;
  const declared = rule.nodes.filter(
    (node) => node.type === "decl" && compilerVariables.has(node.prop),
  );
  if (declared.length) spread.push(`${rule.selector} (${declared.length})`);
});
assert.deepEqual(
  spread,
  [],
  "no rule declares Tailwind's compiler variables on every element",
);
const registered = new Map();
stylesheet.walkAtRules("property", (rule) => {
  assert.equal(rule.parent, stylesheet, `${rule.params} registers globally`);
  const descriptors = Object.fromEntries(
    rule.nodes.map((node) => [node.prop, node.value]),
  );
  assert.equal(descriptors.inherits, "false", `${rule.params} never inherits`);
  registered.set(rule.params, descriptors);
});
const unread = new Set(registered.keys());
const bare = new Set();
stylesheet.walkDecls((decl) => {
  for (const match of decl.value.matchAll(/var\(\s*(--tw-[\w-]+)\s*([,)])/g)) {
    const [, name, next] = match;
    if (!registered.has(name)) continue;
    unread.delete(name);
    if (next === ")" && registered.get(name)["initial-value"] === undefined)
      bare.add(name);
  }
});
assert.deepEqual([...unread], [], "only variables the stylesheet reads");
assert.deepEqual(
  [...bare],
  [],
  "a variable with no initial value is read with a fallback",
);
// What registration is for: a variable a utility sets on a parent is never
// what its child reads. So every compiler variable read is registered: one
// that is not, and is not set, has no value, and a read of it with no
// fallback (`skewX(var(--tw-skew-x))`) makes its whole declaration invalid
// on a page without Tailwind.
const set = new Set();
stylesheet.walkDecls(/^--tw-/, (decl) => set.add(decl.prop));
const unregisteredReads = [];
stylesheet.walkDecls((decl) => {
  for (const [, name] of decl.value.matchAll(/var\(\s*(--tw-[\w-]+)/g))
    if (compilerVariables.has(name) && !registered.has(name))
      unregisteredReads.push(`${name} in ${decl.prop}: ${decl.value}`);
});
assert.deepEqual(
  unregisteredReads,
  [],
  "every compiler variable read is registered",
);
// One with no initial value that nothing sets has no value anywhere, so
// scoped-css.cjs writes its reads as their fallbacks and does not register
// it. It keeps a read, and the registration, only where that would leave
// the declaration empty (`filter: var(--tw-blur,)`): written as their
// fallbacks, with a rotation or skew by zero gone from a transform, the
// reads must leave nothing.
const unsetRegistered = new Set(
  [...registered]
    .filter(([name, d]) => d["initial-value"] === undefined && !set.has(name))
    .map(([name]) => name),
);
const inlinable = [];
stylesheet.walkDecls((decl) => {
  const reads = [...decl.value.matchAll(/var\(\s*(--tw-[\w-]+)/g)];
  if (!reads.some(([, name]) => unsetRegistered.has(name))) return;
  let written = decl.value.replace(
    /var\(\s*(--tw-[\w-]+)\s*(?:,([^()]*))?\)/g,
    (whole, name, fallback) =>
      unsetRegistered.has(name) ? (fallback ?? "") : whole,
  );
  if (/transform$/.test(decl.prop))
    written = written.replace(
      /\b(?:rotate|skew|skewX|skewY)\(\s*0(?:deg)?\s*\)/g,
      "",
    );
  if (written.trim()) inlinable.push(`${decl.prop}: ${decl.value}`);
});
assert.deepEqual(
  inlinable,
  [],
  "a variable registered with no initial value is set, or read only where its fallback would leave nothing",
);
assert.ok(registered.size > 0, "the stylesheet registers its variables");
console.log(
  `PASS stylesheet: ${registered.size} compiler variables registered, none declared on every element`,
);

// 2. What the utilities draw.
const browser = await launchFixtureBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 800, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) => route.abort());
  await page.setContent(
    '<!doctype html><html><head></head><body><div id="fixture"></div></body></html>',
  );
  await page.addStyleTag({ content: css });
  await page.addScriptTag({ content: code });
  await page.getByTestId("light").waitFor();
  await settleLayout(page);
  const properties = [
    "transform",
    "boxShadow",
    "backdropFilter",
    "fontVariantNumeric",
    "scrollSnapType",
  ];
  for (const theme of ["light", "dark"]) {
    const found = await page.getByTestId(theme).evaluate((section, names) => {
      const read = (id) => {
        const style = getComputedStyle(
          section.querySelector(`[data-testid="${id}"]`),
        );
        return Object.fromEntries(names.map((name) => [name, style[name]]));
      };
      const ids = [
        ...section.querySelectorAll(
          "[data-testid]:not([data-testid$=reference])",
        ),
      ].map((node) => node.getAttribute("data-testid"));
      return ids.map((id) => [id, read(id), read(`${id}-reference`)]);
    }, properties);
    assert.equal(found.length, 9, `${theme}: every sample is drawn`);
    for (const [id, drawn, reference] of found)
      assert.deepEqual(
        drawn,
        reference,
        `${theme} ${id}: the utility draws what Tailwind's defaults drew`,
      );
    console.log(
      `PASS ${theme}: ${found.map(([id]) => id).join(", ")} match their references`,
    );
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
