import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

export const platforms = ["react", "vue", "swift", "kotlin"];

// Read the actual JSX attributes, including escaped template characters. Never
// evaluate documentation as JavaScript or accept interpolated/runtime examples.
export function extractSnippets(source, file = "example.mdx") {
  const snippets = [];
  let section = 0;
  for (const match of source.matchAll(/<PlatformSnippets\b/g)) {
    section++;
    const scanner = ts.createScanner(ts.ScriptTarget.Latest, true);
    scanner.setText(source.slice(match.index));
    let depth = 0;
    let end;
    for (
      let token = scanner.scan();
      token !== ts.SyntaxKind.EndOfFileToken;
      token = scanner.scan()
    ) {
      if (token === ts.SyntaxKind.OpenBraceToken) depth++;
      if (token === ts.SyntaxKind.CloseBraceToken) depth--;
      if (token === ts.SyntaxKind.TemplateHead)
        throw new Error(
          `${file}: section ${section}: interpolated examples are not supported`,
        );
      if (token === ts.SyntaxKind.GreaterThanToken && depth === 0) {
        end = match.index + scanner.getTextPos();
        break;
      }
    }
    if (!end) throw new Error(`${file}: unclosed PlatformSnippets`);
    const tag = source.slice(match.index, end);
    const ast = ts.createSourceFile(
      "snippet.tsx",
      `const example = (${tag});`,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    if (ast.parseDiagnostics.length)
      throw new Error(`${file}: malformed PlatformSnippets section ${section}`);
    const element =
      ast.statements[0]?.declarationList?.declarations[0]?.initializer
        ?.expression;
    if (!element || !ts.isJsxSelfClosingElement(element))
      throw new Error(`${file}: PlatformSnippets must be self-closing`);
    const seen = new Set();
    for (const attr of element.attributes.properties) {
      if (!ts.isJsxAttribute(attr) || !platforms.includes(attr.name.text))
        throw new Error(`${file}: unknown or spread snippet attribute`);
      const platform = attr.name.text;
      if (seen.has(platform))
        throw new Error(`${file}: duplicate ${platform} snippet`);
      seen.add(platform);
      const value = attr.initializer;
      const literal =
        value && ts.isJsxExpression(value) ? value.expression : value;
      if (
        !literal ||
        !(
          ts.isNoSubstitutionTemplateLiteral(literal) ||
          ts.isStringLiteral(literal)
        )
      )
        throw new Error(`${file}: ${platform} example must be a static string`);
      if (!literal.text.trim())
        throw new Error(`${file}: empty ${platform} example`);
      snippets.push({
        file,
        section,
        platform,
        code: literal.text,
        line: source.slice(0, match.index).split("\n").length,
      });
    }
    if (!seen.size) throw new Error(`${file}: empty PlatformSnippets section`);
  }
  return snippets;
}

export function collectSnippets(root) {
  const snippets = [];
  function walk(dir) {
    for (const entry of fs
      .readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.name.endsWith(".mdx"))
        snippets.push(
          ...extractSnippets(
            fs.readFileSync(file, "utf8"),
            path.relative(root, file),
          ),
        );
    }
  }
  walk(path.join(root, "packages/react/src/components"));
  if (!snippets.length) throw new Error("No documentation snippets found");
  return snippets;
}

export function writeReactSnippetFixtures(app, snippets) {
  const dir = path.join(app, "doc-snippets");
  fs.mkdirSync(dir);
  const react = snippets.filter((s) => s.platform === "react");
  if (!react.length) throw new Error("No React documentation snippets found");
  const mapping = {};
  for (const snippet of react) {
    const name = `${path.basename(snippet.file, ".mdx")}-${snippet.section}.tsx`;
    if (mapping[name]) throw new Error(`Duplicate fixture name: ${name}`);
    // No injected imports, ambient application state, suppression comments,
    // source aliases, or JSX rewriting. Compile exactly what users can copy.
    if (/@ts-(?:ignore|nocheck|expect-error)\b/.test(snippet.code))
      throw new Error(
        `${snippet.file}: compiler suppression in documented recipe`,
      );
    fs.writeFileSync(path.join(dir, name), snippet.code);
    mapping[name] = `${snippet.file}:${snippet.line}`;
  }
  fs.writeFileSync(
    path.join(app, "doc-snippets-map.json"),
    JSON.stringify(mapping, null, 2),
  );
  fs.writeFileSync(
    path.join(app, "tsconfig.doc-snippets.json"),
    JSON.stringify(
      {
        compilerOptions: {
          strict: true,
          noEmit: true,
          jsx: "react-jsx",
          module: "nodenext",
          moduleResolution: "nodenext",
          target: "es2022",
          skipLibCheck: false,
          types: ["react", "react-dom"],
        },
        include: ["doc-snippets/*.tsx"],
      },
      null,
      2,
    ),
  );
  return mapping;
}

// The negative control proves the same installed compiler catches the three
// mistakes this rollout found: missing exports, invalid props and missing state.
export function writeSnippetNegativeControl(app) {
  const dir = path.join(app, "doc-snippets-negative");
  fs.mkdirSync(dir);
  fs.writeFileSync(
    path.join(dir, "invalid.tsx"),
    `
import { Button, DefinitelyNotAKozmosExport } from "@kozmos-ds/react";
export const invalidProps = <Button emotion="not-a-supported-emotion">Save</Button>;
export const missingState = undocumentedApplicationState;
`,
  );
  fs.writeFileSync(
    path.join(app, "tsconfig.doc-snippets-negative.json"),
    JSON.stringify(
      {
        extends: "./tsconfig.doc-snippets.json",
        include: ["doc-snippets-negative/*.tsx"],
      },
      null,
      2,
    ),
  );
}
