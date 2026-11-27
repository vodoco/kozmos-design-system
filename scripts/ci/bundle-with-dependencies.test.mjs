// The per-export measurement of scripts/performance/bundle-analyzer.ts counts
// a part's dependencies (the owner's ruling of 27 Nov 2026): everything but
// the frameworks an app already has, tree-shaken by each package's
// sideEffects, as a Vite app's production build ships it.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const { createDependencyCost, isFramework, ownerOf } = await import(
  root + "scripts/performance/with-dependencies.mjs"
);
const requireFromReact = createRequire(root + "packages/react/package.json");
const requireFromVite = createRequire(
  requireFromReact.resolve("vite/package.json"),
);
const { rollup } = requireFromVite("rollup");
const esbuild = requireFromVite("esbuild");

// An app with a part, its dependencies and React, in node_modules.
const app = fs.mkdtempSync(path.join(os.tmpdir(), "kozmos-with-deps-"));
const write = (file, text) => {
  fs.mkdirSync(path.dirname(path.join(app, file)), { recursive: true });
  fs.writeFileSync(path.join(app, file), text);
};
const pkg = (name, fields, files) => {
  write(
    `node_modules/${name}/package.json`,
    JSON.stringify({ name, version: "1.0.0", ...fields }),
  );
  for (const [file, text] of Object.entries(files))
    write(`node_modules/${name}/${file}`, text);
};
// A part that leans on a primitive, as React's lean on Radix.
pkg(
  "kozmos-part",
  { type: "module", sideEffects: false, exports: { ".": "./index.mjs" } },
  {
    "index.mjs": [
      'import { useState } from "react";',
      'import { Primitive } from "primitive";',
      'import { shim } from "cjs-shim";',
      'export const Part = () => [useState(), Primitive("PART_OWN_CODE"), shim];',
      'export const Other = () => "OTHER_PART_CODE";',
    ].join("\n"),
  },
);
pkg(
  "primitive",
  {
    type: "module",
    sideEffects: false,
    exports: {
      ".": {
        import: "./esm/index.mjs",
        require: "./cjs/index.cjs",
      },
    },
  },
  {
    "esm/index.mjs": [
      'export { Primitive } from "./primitive.mjs";',
      'export { Unused } from "./unused.mjs";',
    ].join("\n"),
    "esm/primitive.mjs":
      'export const Primitive = (x) => ["PRIMITIVE_CODE", x];',
    // a top-level statement only `sideEffects: false` lets a bundler drop
    "esm/unused.mjs":
      'globalThis.registry = ["UNUSED_PRIMITIVE_CODE"];\nexport const Unused = () => 1;',
    "cjs/index.cjs": 'exports.Primitive = () => "PRIMITIVE_CJS_BUILD";',
  },
);
pkg(
  "cjs-shim",
  { main: "index.js" },
  { "index.js": 'exports.shim = "CJS_SHIM_CODE";' },
);
pkg(
  "react",
  { type: "module", exports: { ".": "./index.mjs" } },
  { "index.mjs": 'export const useState = () => "REACT_CODE";' },
);

const withDependencies = await createDependencyCost({ rollup, esbuild });
test.after(async () => {
  await withDependencies.dispose();
  fs.rmSync(app, { recursive: true, force: true });
});
const part = () =>
  withDependencies.cost(
    'import { Part } from "kozmos-part"; console.log(Part);',
    app,
  );

test("a part's dependency is counted, as an app ships it", async () => {
  const { code, by } = await part();
  assert.match(code, /PRIMITIVE_CODE/);
  assert.ok(by.primitive > 0, JSON.stringify(by));
  // the ES build its `exports` names for an import, not the CommonJS one
  assert.doesNotMatch(code, /PRIMITIVE_CJS_BUILD/);
});

test("a CommonJS dependency is counted with its named exports", async () => {
  const { code, by } = await part();
  assert.match(code, /CJS_SHIM_CODE/);
  assert.ok(by["cjs-shim"] > 0, JSON.stringify(by));
});

test("a dependency is tree-shaken by its sideEffects", async () => {
  const { code } = await part();
  assert.doesNotMatch(code, /UNUSED_PRIMITIVE_CODE/);
  assert.doesNotMatch(code, /OTHER_PART_CODE/);
});

test("the frameworks an app already has are never counted", async () => {
  const { code, modules } = await part();
  assert.doesNotMatch(code, /REACT_CODE/);
  assert.ok(!modules.some((id) => /node_modules[\\/]react[\\/]/.test(id)));
  for (const id of ["react", "react/jsx-runtime", "react-dom/client", "vue"])
    assert.ok(isFramework(id), id);
  for (const id of ["reka-ui", "@radix-ui/react-slot", "@kozmos-ds/icons/vue"])
    assert.ok(!isFramework(id), id);
});

test("a file is owned by its npm package or its Kozmos package", () => {
  assert.equal(
    ownerOf(
      "/x/node_modules/.pnpm/a@1/node_modules/@radix-ui/react-slot/dist/index.mjs",
    ),
    "@radix-ui/react-slot",
  );
  assert.equal(ownerOf("/r/packages/icons/dist/index.mjs"), "@kozmos-ds/icons");
});
