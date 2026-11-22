import assert from "node:assert/strict";
import { test } from "node:test";
import { exportClosure, unexpectedFiles } from "./tarball-files.mjs";

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

// @kozmos-ds/vue's tarball holds what its exports reach and nothing else.
const vue = {
  name: "@kozmos-ds/vue",
  main: "dist/kozmos-vue.cjs",
  module: "dist/kozmos-vue.mjs",
  types: "dist/index.d.ts",
  exports: {
    ".": {
      types: "./dist/index.d.ts",
      import: "./dist/kozmos-vue.mjs",
      require: "./dist/kozmos-vue.cjs",
    },
    "./react-bridge": {
      types: "./dist/react-bridge/index.d.ts",
      import: "./dist/react-bridge.mjs",
      require: "./dist/react-bridge.cjs",
    },
    "./package.json": "./package.json",
  },
};
const vueTarball = {
  "package/package.json": "{}",
  "package/README.md": "",
  "package/LICENSE": "",
  "package/dist/index.d.ts": 'export { KozmosButton } from "./components/Button/Button";\nexport type { ButtonProps } from "./components/Button/types.js";',
  "package/dist/components/Button/Button.d.ts": 'import type { ButtonProps } from "./types";',
  "package/dist/components/Button/types.d.ts": "export type ButtonProps = {};",
  "package/dist/kozmos-vue.mjs": 'export { KozmosButton } from "./esm/components/Button/Button.mjs";',
  "package/dist/esm/components/Button/Button.mjs": 'import { cn } from "../../recipes/utils.mjs";\nimport { h } from "vue";',
  "package/dist/esm/recipes/utils.mjs": "export const cn = 1;",
  "package/dist/kozmos-vue.cjs": 'const injection = require("./injection-CZj7IwJR.js");',
  "package/dist/injection-CZj7IwJR.js": "module.exports = {};",
  "package/dist/react-bridge/index.d.ts": 'export * from "./targets";',
  "package/dist/react-bridge/targets.d.ts": "export {};",
  "package/dist/react-bridge.mjs": 'import("./esm/react-bridge/targets.mjs");',
  "package/dist/esm/react-bridge/targets.mjs": "export {};",
  "package/dist/react-bridge.cjs": 'require("./injection-CZj7IwJR.js");',
};
const closureOf = (tarball) =>
  exportClosure(Object.keys(tarball), vue, (file) => tarball[file]);

test("a tarball that holds exactly what its exports reach passes", () => {
  assert.deepEqual(closureOf(vueTarball), {
    unreachable: [],
    missing: [],
    maps: [],
  });
});

test("a file no export reaches is named", () => {
  assert.deepEqual(
    closureOf({ ...vueTarball, "package/dist/esm/recipes/stray.mjs": "" })
      .unreachable,
    ["package/dist/esm/recipes/stray.mjs"],
  );
});

test("a source map is named, whatever it points at", () => {
  const withMaps = {
    ...vueTarball,
    "package/dist/index.d.ts.map": '{"sources":["../src/index.ts"]}',
    "package/dist/kozmos-vue.mjs": `${vueTarball["package/dist/kozmos-vue.mjs"]}\n//# sourceMappingURL=kozmos-vue.mjs.map`,
    "package/dist/kozmos-vue.mjs.map": '{"sources":["../src/index.ts"]}',
  };
  assert.deepEqual(closureOf(withMaps).maps, [
    "package/dist/index.d.ts.map",
    "package/dist/kozmos-vue.mjs.map",
  ]);
});

test("an export or an import naming a file the tarball lacks is named", () => {
  const { "package/dist/react-bridge.cjs": _bridge, ...noBridge } = vueTarball;
  assert.deepEqual(closureOf(noBridge).missing, ["package/dist/react-bridge.cjs"]);
  const { "package/dist/esm/recipes/utils.mjs": _utils, ...noUtils } = vueTarball;
  assert.deepEqual(closureOf(noUtils).missing, ["package/dist/esm/recipes/utils.mjs"]);
});

test("a declaration ships with the module it declares, though no declaration imports it", () => {
  const tarball = {
    ...vueTarball,
    "package/dist/esm/components/Spinner/SpinnerArc.mjs": "export {};",
    "package/dist/components/Spinner/SpinnerArc.d.ts": 'import type { X } from "./types";',
    "package/dist/components/Spinner/types.d.ts": "export type X = 1;",
    "package/dist/components/Ghost/Ghost.d.ts": "export {};",
  };
  tarball["package/dist/esm/components/Button/Button.mjs"] +=
    '\nimport "../Spinner/SpinnerArc.mjs";';
  assert.deepEqual(closureOf(tarball).unreachable, [
    "package/dist/components/Ghost/Ghost.d.ts",
  ]);
});

test("a subpath's own package.json, for resolvers that ignore exports, ships with what it names", () => {
  const redirected = {
    ...vue,
    exports: {
      ...vue.exports,
      "./react-bridge": {
        import: {
          types: "./dist/react-bridge/index.d.mts",
          default: "./dist/react-bridge.mjs",
        },
        require: {
          types: "./dist/react-bridge/index.d.ts",
          default: "./dist/react-bridge.cjs",
        },
      },
    },
  };
  const tarball = {
    ...vueTarball,
    "package/dist/react-bridge/index.d.mts": 'export * from "./index.js";',
    "package/react-bridge/package.json": JSON.stringify({
      main: "../dist/react-bridge.cjs",
      types: "../dist/react-bridge/index.d.ts",
    }),
  };
  const closure = exportClosure(Object.keys(tarball), redirected, (file) => tarball[file]);
  assert.deepEqual(closure, { unreachable: [], missing: [], maps: [] });
  const broken = {
    ...tarball,
    "package/react-bridge/package.json": JSON.stringify({ types: "../dist/react-bridge/gone.d.ts" }),
  };
  assert.deepEqual(
    exportClosure(Object.keys(broken), redirected, (file) => broken[file]).missing,
    ["package/dist/react-bridge/gone.d.ts"],
  );
});
