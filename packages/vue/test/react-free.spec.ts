import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The main entry of `@kozmos-ds/vue` reaches no React (Vue 3 Phase 0): its
 * built JavaScript and its declarations import nothing from `react`,
 * `react-dom` or `@kozmos-ds/react`. Only `react-bridge` may. Read from the
 * build (`pnpm build`, which `test` depends on), so it holds what ships.
 */
const DIST = path.resolve(__dirname, "../dist");
const REACT = /^(react|react-dom|@kozmos-ds\/react)(\/.*)?$/;

/** Every module a file names, in an import, export … from, import() or require(). */
export function specifiers(text: string): string[] {
  const found: string[] = [];
  const patterns = [
    /\bfrom\s*["']([^"']+)["']/g,
    /\bimport\s*["']([^"']+)["']/g,
    /\b(?:import|require)\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const pattern of patterns)
    for (const match of text.matchAll(pattern)) found.push(match[1]);
  return found;
}

/** What a file imports from React, as `file: specifier`. */
export function reactImports(
  files: { file: string; text: string }[],
): string[] {
  return files.flatMap(({ file, text }) =>
    specifiers(text)
      .filter((specifier) => REACT.test(specifier))
      .map((specifier) => `${file}: ${specifier}`),
  );
}

/** The main entry's built files: its bundles and every declaration outside react-bridge. */
function mainEntryFiles() {
  const declarations: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (path.relative(DIST, full) !== "react-bridge") walk(full);
      } else if (entry.name.endsWith(".d.ts")) declarations.push(full);
    }
  };
  walk(DIST);
  return [
    path.join(DIST, "kozmos-vue.mjs"),
    path.join(DIST, "kozmos-vue.cjs"),
    ...declarations,
  ].map((file) => ({
    file: path.relative(DIST, file),
    text: fs.readFileSync(file, "utf8"),
  }));
}

describe("the main entry is React-free", () => {
  it("reads the built bundles and declarations", () => {
    const files = mainEntryFiles().map((entry) => entry.file);
    expect(files).toEqual(
      expect.arrayContaining([
        "kozmos-vue.mjs",
        "kozmos-vue.cjs",
        "index.d.ts",
        path.join("components", "Button", "Button.d.ts"),
      ]),
    );
    expect(files.some((file) => file.startsWith("react-bridge"))).toBe(false);
  });

  it("imports nothing from react, react-dom or @kozmos-ds/react", () => {
    expect(reactImports(mainEntryFiles())).toEqual([]);
  });

  it("names a React import in every form it can be written", () => {
    expect(
      reactImports([
        {
          file: "planted.mjs",
          text: [
            'import React from "react";',
            'import { createRoot } from "react-dom/client";',
            'export { Button } from "@kozmos-ds/react";',
            'const s = require("react-dom/server");',
            'await import("react/jsx-runtime");',
            'import "react";',
            'import { h } from "vue";',
            'import { cva } from "class-variance-authority";',
            'import { Slot } from "reka-ui";',
          ].join("\n"),
        },
      ]),
    ).toEqual([
      "planted.mjs: react",
      "planted.mjs: react-dom/client",
      "planted.mjs: @kozmos-ds/react",
      "planted.mjs: react",
      "planted.mjs: react-dom/server",
      "planted.mjs: react/jsx-runtime",
    ]);
  });

  it("lets the bridge import React, which is what it is for", () => {
    const bridge = fs.readFileSync(path.join(DIST, "react-bridge.mjs"), "utf8");
    expect(
      reactImports([{ file: "react-bridge.mjs", text: bridge }]),
    ).not.toEqual([]);
  });
});
