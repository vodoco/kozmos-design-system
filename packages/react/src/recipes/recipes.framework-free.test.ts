import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * `recipes/` is shared with `@kozmos-ds/vue`, which builds it in: one import
 * of React here, or of anything that renders, and Vue's bundle carries React
 * (Vue 3 Phase 0). So every module the folder imports, and every module the
 * `../utils` it re-exports `cn` from imports, must be one of these.
 */
const ALLOWED_PACKAGES = new Set([
  "class-variance-authority",
  "clsx",
  "tailwind-merge",
]);
const RECIPES = path.resolve(__dirname);
const UTILS = path.resolve(__dirname, "../utils.ts");

/** Every module specifier a file names: static and type imports, re-exports, import() and require(). */
export function moduleSpecifiers(source: string): string[] {
  const file = ts.createSourceFile(
    "module.ts",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const found: string[] = [];
  const visit = (node: ts.Node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      found.push(node.moduleSpecifier.text);
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === "require")) &&
      node.arguments[0] &&
      ts.isStringLiteralLike(node.arguments[0])
    ) {
      found.push(node.arguments[0].text);
    } else if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteral(node.argument.literal)
    ) {
      found.push(node.argument.literal.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
}

/** What a recipe module may not import, as `file: specifier` lines. */
export function forbiddenImports(
  modules: { file: string; source: string }[],
): string[] {
  const problems: string[] = [];
  for (const { file, source } of modules) {
    for (const specifier of moduleSpecifiers(source)) {
      if (ALLOWED_PACKAGES.has(specifier)) continue;
      if (specifier.startsWith(".")) {
        const target = path.resolve(path.dirname(file), specifier);
        const inside =
          target.startsWith(RECIPES + path.sep) ||
          target === UTILS.replace(/\.ts$/, "");
        if (inside) continue;
      }
      problems.push(`${path.relative(RECIPES, file)}: ${specifier}`);
    }
  }
  return problems;
}

const recipeFiles = () =>
  fs
    .readdirSync(RECIPES)
    .filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts"))
    .map((name) => path.join(RECIPES, name));
const read = (file: string) => ({
  file,
  source: fs.readFileSync(file, "utf8"),
});

describe("recipes are framework-free", () => {
  it("reads every recipe module, and `../utils`", () => {
    const names = recipeFiles().map((file) => path.basename(file));
    expect(names).toEqual(
      expect.arrayContaining(["button.ts", "index.ts", "spinner-arc.ts"]),
    );
  });

  it("imports only class-variance-authority, clsx, tailwind-merge and each other", () => {
    expect(forbiddenImports([...recipeFiles(), UTILS].map(read))).toEqual([]);
  });

  it("names React, Radix, a relative escape and a type import as forbidden", () => {
    const planted = {
      file: path.join(RECIPES, "planted.ts"),
      source: [
        'import React from "react";',
        'import { Slot } from "@radix-ui/react-slot";',
        'import { Button } from "../components/Button/Button";',
        'type T = import("react-dom").Root;',
        'import { cva } from "class-variance-authority";',
        'import { cn } from "../utils";',
        'export * from "./button";',
      ].join("\n"),
    };
    expect(forbiddenImports([planted])).toEqual([
      "planted.ts: react",
      "planted.ts: @radix-ui/react-slot",
      "planted.ts: ../components/Button/Button",
      "planted.ts: react-dom",
    ]);
  });
});
