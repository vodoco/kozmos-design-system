/**
 * The TypeScript setup reads one React: packages/react's own types, whatever
 * pnpm hoisted (claude-design-typescript.mjs). On 7 Nov main's CI install
 * hoisted @types/react 19 where the pull request's had hoisted 18, and the
 * Vue bridge's part-takes.ts, read through this setup, went stale on main.
 *
 * They need the built declarations: `pnpm --filter "@kozmos-ds/react..." build`.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  PINNED_REACT_TYPES,
  compilerOptions,
  hostWith,
  ts,
  unpinnedReactTypes,
} from "./claude-design-typescript.mjs";
import { DECLARATIONS } from "./claude-design-api.mjs";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const fromReact = createRequire(path.join(ROOT, "packages/react/package.json"));

test("the pinned React types are the ones packages/react resolves", () => {
  for (const name of ["@types/react", "@types/react-dom"]) {
    const { version } = fromReact(`${name}/package.json`);
    const pinned = createRequire(path.join(PINNED_REACT_TYPES[name], "x"))(
      "./package.json",
    );
    assert.equal(pinned.name, name);
    assert.equal(pinned.version, version, `${name} pinned at packages/react's`);
  }
});

test("a copy other than the pinned one is named, and the pinned one is not", () => {
  const pinned = path.join(PINNED_REACT_TYPES["@types/react"], "index.d.ts");
  assert.equal(unpinnedReactTypes(pinned), null);
  const other = path.join(
    ROOT,
    "node_modules/.pnpm/@types+react@0.0.0/node_modules/@types/react/index.d.ts",
  );
  assert.equal(unpinnedReactTypes(other), "@types/react");
  const otherDom = other.replace(
    `${path.sep}react${path.sep}index.d.ts`,
    `${path.sep}react-dom${path.sep}index.d.ts`,
  );
  assert.equal(unpinnedReactTypes(otherDom), "@types/react-dom");
  assert.equal(unpinnedReactTypes(path.join(ROOT, "src/react.d.ts")), null);
});

test("the host refuses another copy of React's types", () => {
  const host = hostWith();
  const other = path.join(
    ROOT,
    "node_modules/.pnpm/@types+react@0.0.0/node_modules/@types/react/index.d.ts",
  );
  assert.throws(
    () => host.getSourceFile(other, ts.ScriptTarget.Latest),
    /other than packages\/react's/,
  );
});

test("the published declarations, framer-motion's included, read only the pinned React", () => {
  const program = ts.createProgram({
    rootNames: [path.join(ROOT, DECLARATIONS)],
    options: compilerOptions,
    host: hostWith(),
  });
  const files = program.getSourceFiles().map((file) => file.fileName);
  const reactTypes = files.filter((file) =>
    /[\\/]@types[\\/]react[\\/]/.test(file),
  );
  assert.ok(reactTypes.length > 0, "React's types are read");
  for (const file of reactTypes)
    assert.ok(
      file.startsWith(PINNED_REACT_TYPES["@types/react"] + path.sep),
      `${file} is packages/react's`,
    );
  // framer-motion's declarations import `react` with no @types/react of
  // their own: the import the hoist used to answer.
  assert.ok(
    files.some((file) => /[\\/]framer-motion[\\/]/.test(file)),
    "framer-motion's declarations are in the program",
  );
});
