import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { extractSnippets, writeReactSnippetFixtures } from "./doc-snippets.mjs";

test("extracts all platforms and sections, decoding strings as Storybook does", () => {
  const source =
    '<PlatformSnippets react={`const value = "a > b";\\n// \\`quoted\\` and \\${literal}`} vue={`<template><div /></template>`} />\n<PlatformSnippets kotlin={`Text("Hello")`} />';
  const snippets = extractSnippets(source, "Button.mdx");
  assert.equal(snippets.length, 3);
  assert.equal(
    snippets[0].code,
    'const value = "a > b";\n// `quoted` and ${literal}',
  );
  assert.equal(snippets[2].section, 2);
  assert.equal(snippets[2].line, 2);
});

test("rejects dynamic, malformed, duplicate, empty and spread attributes", () => {
  for (const source of [
    "<PlatformSnippets react={`${hidden}`} />",
    "<PlatformSnippets react={someVariable} />",
    "<PlatformSnippets react={`hello`} react={`world`} />",
    "<PlatformSnippets react={``} />",
    "<PlatformSnippets {...props} />",
    "<PlatformSnippets react={`oops}",
    "<PlatformSnippets />",
  ])
    assert.throws(() => extractSnippets(source));
});

test("fixtures preserve exact copied text, isolate modules and enable strict library checks", () => {
  const app = fs.mkdtempSync(path.join(os.tmpdir(), "kozmos-snippet-test-"));
  try {
    const code =
      '\nimport { Button } from "@kozmos-ds/react";\nexport const Example = () => <Button>Save</Button>;\n';
    const mapping = writeReactSnippetFixtures(app, [
      { file: "Button.mdx", section: 2, line: 9, platform: "react", code },
    ]);
    assert.equal(
      fs.readFileSync(path.join(app, "doc-snippets/Button-2.tsx"), "utf8"),
      code,
    );
    assert.deepEqual(mapping, { "Button-2.tsx": "Button.mdx:9" });
    const config = JSON.parse(
      fs.readFileSync(path.join(app, "tsconfig.doc-snippets.json"), "utf8"),
    );
    assert.equal(config.compilerOptions.strict, true);
    assert.equal(config.compilerOptions.skipLibCheck, false);
    assert.equal(config.compilerOptions.paths, undefined);
    assert.deepEqual(config.include, ["doc-snippets/*.tsx"]);
    assert.deepEqual(fs.readdirSync(path.join(app, "doc-snippets")), [
      "Button-2.tsx",
    ]);
  } finally {
    fs.rmSync(app, { recursive: true });
  }
});

test("a documented recipe cannot suppress compiler errors", () => {
  const app = fs.mkdtempSync(path.join(os.tmpdir(), "kozmos-snippet-test-"));
  try {
    assert.throws(
      () =>
        writeReactSnippetFixtures(app, [
          {
            file: "Bad.mdx",
            section: 1,
            platform: "react",
            code: "// @ts-nocheck\nmissing;",
          },
        ]),
      /suppression/,
    );
  } finally {
    fs.rmSync(app, { recursive: true });
  }
});
