/**
 * check-react-types-peers.mjs, over a made-up node_modules/.pnpm: a package
 * whose declarations use React's types must have its own copy linked beside
 * it, whatever its folder's name says, and every package extension must name
 * an installed package.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  packageOfFolder,
  scan,
  staleExtensions,
} from "./check-react-types-peers.mjs";

/** A store of `folder → { name, version, files, linked }`, in a temporary root. */
function store(packages) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "react-types-peers-"));
  for (const [
    folder,
    { name, version, files = {}, linked = [] },
  ] of Object.entries(packages)) {
    const dir = path.join(root, "node_modules/.pnpm", folder, "node_modules");
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
  }
  fs.mkdirSync(path.join(root, "node_modules/.pnpm/node_modules"), {
    recursive: true,
  });
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

test("a package that uses React's types needs its own copy linked, whatever its folder's name says", (t) => {
  const root = store({
    "framer-motion@11.18.2_react@19.2.4": {
      name: "framer-motion",
      version: "11.18.2",
      files: { "dist/index.d.ts": 'import * as React from "react";\n' },
    },
    // A child's peer put @types+react in the name; nothing is linked inside.
    "@xstate+react@3.2.2_@types+react@18.3.28_react@18.3.1": {
      name: "@xstate/react",
      version: "3.2.2",
      files: { "es/index.d.ts": 'export type { FC } from "react";\n' },
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
          '/// <reference types="react" />\nimport type { Root } from "react-dom/client";\n',
      },
      linked: ["@types/react"],
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
    "@types+react@18.3.28": {
      name: "@types/react",
      version: "18.3.28",
      files: { "index.d.ts": 'export = React;\nimport "react/jsx-runtime";\n' },
    },
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const { installed, unlinked, usingReact } = scan(root);
  assert.deepEqual(unlinked.map(({ name, absent }) => [name, absent]).sort(), [
    ["@xstate/react", ["@types/react"]],
    ["framer-motion", ["@types/react"]],
    ["react-router", ["@types/react-dom"]],
  ]);
  assert.equal(usingReact.size, 4);
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
