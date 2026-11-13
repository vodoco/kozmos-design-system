/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test");
const assert = require("node:assert/strict");
const postcss = require("postcss");
const plugin = require("./dashboard-sheet.cjs");
const compile = async (css) =>
  (await postcss([plugin()]).process(css, { from: undefined })).css;

test("owned rules come out unwrapped, unscoped and in order", async () => {
  const css = await compile(
    "/* a */ @kozmos-owned { .kozmos-a { color: red } } @kozmos-owned { .kozmos-b { color: blue } }",
  );
  assert.match(css, /\.kozmos-a \{ color: red \}\s*\.kozmos-b \{ color: blue \}/);
  assert.doesNotMatch(css, /kozmos-owned|@scope/);
});

test("keyframes take the kozmos- prefix, and the animations naming them follow", async () => {
  const css = await compile(
    "@kozmos-owned { .kozmos-a { animation: ripple 3s infinite, other 1s } @keyframes ripple { to { opacity: 0 } } .kozmos-b { animation-name: ripple } }",
  );
  assert.match(css, /@keyframes kozmos-ripple/);
  assert.match(css, /animation: kozmos-ripple 3s infinite, other 1s/);
  assert.match(css, /animation-name: kozmos-ripple/);
});

test("a rule outside @kozmos-owned stops the build", async () => {
  await assert.rejects(
    compile(".kozmos-a { color: red }"),
    /owned rules only/,
  );
  await assert.rejects(compile("@tailwind utilities;"), /owned rules only/);
});

test("@scope, @tailwind and @apply inside an owned block stop the build", async () => {
  for (const rule of [
    "@scope (.a) { .b { color: red } }",
    ".a { @apply flex; }",
  ])
    await assert.rejects(
      compile(`@kozmos-owned { ${rule} }`),
      /cannot use @(scope|apply)/,
    );
});
