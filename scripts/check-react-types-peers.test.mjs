/**
 * check-react-types-peers.mjs, over a made-up install: a package whose
 * declarations use React's types must have its own copy linked beside it,
 * whatever its folder's name says; only the folders the install reaches
 * count; and every package extension must name an installed package.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  packageOfFolder,
  reachedFolders,
  reactTypesUsedBy,
  scan,
  staleExtensions,
} from "./check-react-types-peers.mjs";

/**
 * An install in a temporary root: `folder → { name, version, files, linked,
 * leftover }`. The importer `.` links every folder but a leftover one, as an
 * earlier install leaves its folders behind.
 */
function install(packages) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "react-types-peers-"));
  const store = path.join(root, "node_modules/.pnpm");
  fs.mkdirSync(path.join(store, "node_modules"), { recursive: true });
  fs.writeFileSync(
    path.join(store, "lock.yaml"),
    "lockfileVersion: '9.0'\nimporters:\n  .: {}\n",
  );
  for (const [
    folder,
    { name, version, files = {}, linked = [], leftover = false },
  ] of Object.entries(packages)) {
    const dir = path.join(store, folder, "node_modules");
    fs.mkdirSync(path.join(dir, name), { recursive: true });
    fs.writeFileSync(
      path.join(dir, name, "package.json"),
      JSON.stringify({ name, version }),
    );
    for (const [file, text] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(dir, name, file)), {
        recursive: true,
      });
      fs.writeFileSync(path.join(dir, name, file), text);
    }
    for (const types of linked)
      fs.mkdirSync(path.join(dir, types), { recursive: true });
    if (leftover) continue;
    const link = path.join(root, "node_modules", name);
    fs.mkdirSync(path.dirname(link), { recursive: true });
    fs.symlinkSync(path.join(dir, name), link);
  }
  return root;
}

test("a .pnpm folder names its package", () => {
  assert.equal(
    packageOfFolder("framer-motion@11.18.2_react@19.2.4"),
    "framer-motion",
  );
  assert.equal(
    packageOfFolder("@storybook+react-dom-shim@8.6.19_react@18.3.1"),
    "@storybook/react-dom-shim",
  );
  assert.equal(packageOfFolder("node_modules"), null);
});

test("what counts as using React's types is what TypeScript reads, not what a comment says", () => {
  const used = (text) => [...reactTypesUsedBy(text)].sort();
  assert.deepEqual(used('import * as React from "react";'), ["@types/react"]);
  assert.deepEqual(used('export type { Root } from "react-dom/client";'), [
    "@types/react-dom",
  ]);
  assert.deepEqual(used('/// <reference types="react-dom" />\n'), [
    "@types/react-dom",
  ]);
  assert.deepEqual(used('type C = import("react").FC;'), ["@types/react"]);
  assert.deepEqual(
    used('declare module "react" {\n  interface CSSProperties {}\n}\n'),
    ["@types/react"],
  );
  assert.deepEqual(
    used(
      '/**\n * Use it like `import { motion } from "react"` in your app.\n */\nexport declare const x: 1;\n',
    ),
    [],
  );
  assert.deepEqual(used('import "react-native";'), []);
});

test("a package that uses React's types needs its own copy linked, whatever its folder's name says", (t) => {
  const root = install({
    "framer-motion@11.18.2_react@19.2.4": {
      name: "framer-motion",
      version: "11.18.2",
      files: { "dist/index.d.ts": 'import * as React from "react";\n' },
    },
    // A child's peer put @types+react in the name; nothing is linked inside.
    "@xstate+react@3.2.2_@types+react@18.3.28_react@18.3.1": {
      name: "@xstate/react",
      version: "3.2.2",
      files: { "es/index.d.cts": 'export type { FC } from "react";\n' },
    },
    "@radix-ui+react-slot@1.2.4_@types+react@18.3.28": {
      name: "@radix-ui/react-slot",
      version: "1.2.4",
      files: { "dist/index.d.mts": 'import * as React from "react";\n' },
      linked: ["@types/react"],
    },
    "react-router@7.18.4_@types+react@19.2.14": {
      name: "react-router",
      version: "7.18.4",
      files: {
        "dist/index.d.mts":
          '/// <reference types="react-dom" />\nimport type { FC } from "react";\n',
      },
      linked: ["@types/react"],
    },
    // A comment that mentions React is not a use of its types.
    "documented@1.0.0": {
      name: "documented",
      version: "1.0.0",
      files: {
        "index.d.ts":
          '/** e.g. `import { x } from "react"` */\nexport declare const x: 1;\n',
      },
    },
    // Nested node_modules belong to other packages.
    "plain@1.0.0": {
      name: "plain",
      version: "1.0.0",
      files: {
        "index.d.ts": "export declare const x: 1;\n",
        "node_modules/other/index.d.ts": 'import "react";\n',
      },
    },
    // Left behind by an earlier install: no importer reaches it.
    "framer-motion@11.0.0_react@18.3.1": {
      name: "framer-motion",
      version: "11.0.0",
      files: { "dist/index.d.ts": 'import * as React from "react";\n' },
      leftover: true,
    },
    "@types+react@18.3.28": {
      name: "@types/react",
      version: "18.3.28",
      files: {
        "index.d.ts": 'export = React;\nimport "react/jsx-runtime";\n',
      },
    },
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.ok(!reachedFolders(root).has("framer-motion@11.0.0_react@18.3.1"));
  const { installed, unlinked, usingReact } = scan(root);
  assert.deepEqual(
    unlinked.map(({ name, version, absent }) => [name, version, absent]).sort(),
    [
      ["@xstate/react", "3.2.2", ["@types/react"]],
      ["framer-motion", "11.18.2", ["@types/react"]],
      ["react-router", "7.18.4", ["@types/react-dom"]],
    ],
  );
  assert.equal(usingReact.size, 4);
  assert.deepEqual([...installed.get("framer-motion")], ["11.18.2"]);
  assert.deepEqual([...installed.get("@types/react")], ["18.3.28"]);
});

test("a package extension that matches nothing installed is stale", () => {
  const installed = new Map([
    ["framer-motion", new Set(["11.18.2"])],
    ["@storybook/theming", new Set(["7.6.24", "8.6.19"])],
  ]);
  assert.deepEqual(
    staleExtensions(
      {
        "framer-motion": {},
        "@storybook/theming@7": {},
        "@storybook/router@7": {},
        "framer-motion@12": {},
      },
      installed,
    ),
    ["@storybook/router@7", "framer-motion@12"],
  );
});
