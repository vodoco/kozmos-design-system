import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const { rewriteModule, DEVELOPMENT } = await import(
  root + "packages/react/vite-plugins/shakable-components.mjs"
);
const requireFromReact = createRequire(root + "packages/react/package.json");
const requireFromVite = createRequire(
  requireFromReact.resolve("vite/package.json"),
);
const { parseAst } = requireFromVite("rollup/parseAst");
const { rollup } = requireFromVite("rollup");

const rewrite = (code, options = { pureFactories: ["createThemePortal"] }) =>
  rewriteModule(code, parseAst(code), options);

test("a part's name is set in development only", () => {
  const { code, gated } = rewrite(
    'import React from "react";\nconst Button = React.forwardRef(() => null);\nButton.displayName = "Button";\n',
  );
  assert.equal(gated, 1);
  assert.match(
    code,
    new RegExp(
      `if \\(${DEVELOPMENT.replace(/[.()]/g, "\\$&")}\\) Button\\.displayName = "Button";`,
    ),
  );
});

test("a name set in the body of an if keeps its else", () => {
  const { code } = rewrite(
    'if (a) X.displayName = "A";\nelse X.displayName = "B";\n',
  );
  assert.equal(
    code,
    `if (a) { if (${DEVELOPMENT}) X.displayName = "A"; }\nelse { if (${DEVELOPMENT}) X.displayName = "B"; }\n`,
  );
});

test("a name already gated on NODE_ENV is left as it is", () => {
  const source = `if (${DEVELOPMENT}) X.displayName = "X";\n`;
  assert.equal(rewrite(source).code, source);
});

test("a name set inside a function is gated too", () => {
  const { code, gated } = rewrite(
    'export function make(P) { function T() {} T.displayName = "T"; return T; }\n',
  );
  assert.equal(gated, 1);
  assert.match(
    code,
    /if \(process\.env\.NODE_ENV !== "production"\) T\.displayName = "T";/,
  );
});

test("the calls that only make something are marked pure, once, at the top level", () => {
  const { code, marked } = rewrite(
    [
      'import React, { forwardRef as fr, memo } from "react";',
      'import * as R from "react";',
      'import { cva } from "class-variance-authority";',
      'import { createThemePortal } from "../../theme/ThemePortal";',
      'import { other } from "./other";',
      "const A = React.forwardRef(() => null);",
      "const B = fr(() => null);",
      "const C = /* @__PURE__ */ memo(() => null);",
      "const D = R.createContext(null);",
      'const E = cva("a", {});',
      "const F = createThemePortal(P);",
      "const G = other();",
      "function later() { return React.createContext(null); }",
      "",
    ].join("\n"),
  );
  assert.equal(marked, 5);
  for (const call of [
    "React.forwardRef(",
    "fr(",
    "R.createContext(",
    'cva("a"',
    "createThemePortal(P)",
  ])
    assert.ok(code.includes(`/* @__PURE__ */ ${call}`), call);
  assert.ok(!code.includes("/* @__PURE__ */ /* @__PURE__ */"));
  assert.ok(code.includes("const G = other();"));
  assert.ok(code.includes("return React.createContext(null);"));
});

test("a production build drops the name and an unused part; a development build keeps both", async () => {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "kozmos-shakable-"));
  try {
    const source = [
      'import React from "react";',
      "export const Used = React.forwardRef(() => null);",
      'Used.displayName = "Used";',
      "export const Unused = React.forwardRef(() => null);",
      'Unused.displayName = "Unused";',
      "",
    ].join("\n");
    fs.writeFileSync(path.join(work, "parts.mjs"), rewrite(source).code);
    fs.writeFileSync(
      path.join(work, "app.mjs"),
      'import { Used } from "./parts.mjs";\nconsole.log(Used);\n',
    );
    const built = {};
    for (const mode of ["production", "development"]) {
      const bundle = await rollup({
        input: path.join(work, "app.mjs"),
        external: ["react"],
        onwarn: () => {},
        // What an app's bundler does first: replace the variable (Vite, webpack, esbuild,
        // @rollup/plugin-replace).
        plugins: [
          {
            name: "replace",
            transform: (code) =>
              code.replaceAll("process.env.NODE_ENV", JSON.stringify(mode)),
          },
        ],
        treeshake: { moduleSideEffects: (id, external) => external },
      });
      built[mode] = (await bundle.generate({ format: "es" })).output[0].code;
    }
    assert.ok(!built.production.includes("Unused"), built.production);
    assert.ok(!built.production.includes("displayName"), built.production);
    assert.ok(
      built.development.includes('Used.displayName = "Used"'),
      built.development,
    );
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
});
