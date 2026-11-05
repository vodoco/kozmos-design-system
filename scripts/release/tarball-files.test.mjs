import assert from "node:assert/strict";
import { test } from "node:test";
import { unexpectedFiles } from "./tarball-files.mjs";

const icons = {
  name: "@kozmos-ds/icons",
  exports: {
    ".": { import: "./dist/index.mjs" },
    "./vue": { import: "./dist/vue/index.mjs" },
    "./package.json": "./package.json",
  },
};
const react = {
  name: "@kozmos-ds/react",
  exports: { ".": { import: "./dist/kozmos-react.mjs" }, "./style.css": "./dist/style.css" },
};

test("a subpath's own package.json ships, for the folder an exports key names", () => {
  assert.deepEqual(
    unexpectedFiles(["package/package.json", "package/vue/package.json", "package/dist/vue/index.mjs"], icons),
    [],
  );
});

test("a package.json in any other folder does not", () => {
  assert.deepEqual(
    unexpectedFiles(["package/dist/package.json", "package/build/package.json", "package/vue/package.json"], react),
    ["package/dist/package.json", "package/build/package.json", "package/vue/package.json"],
  );
  assert.deepEqual(
    unexpectedFiles(["package/dist/package.json", "package/build/package.json"], icons),
    ["package/dist/package.json", "package/build/package.json"],
  );
});

test("a file subpath, such as ./style.css, names no folder", () => {
  assert.deepEqual(unexpectedFiles(["package/style.css/package.json"], react), [
    "package/style.css/package.json",
  ]);
});

test("the kinds every package may ship are unchanged", () => {
  const ok = [
    "package/package.json",
    "package/README.md",
    "package/LICENSE",
    "package/THIRD-PARTY-NOTICES",
    "package/dist/index.d.ts",
    "package/dist/index.d.mts",
    "package/dist/index.d.cts",
    "package/dist/index.mjs",
    "package/dist/index.cjs",
    "package/dist/index.mjs.map",
    "package/dist/style.css",
  ];
  assert.deepEqual(unexpectedFiles(ok, react), []);
  assert.deepEqual(unexpectedFiles(["package/dist/stats.html", "package/logo.png"], react), [
    "package/dist/stats.html",
    "package/logo.png",
  ]);
});
