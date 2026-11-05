import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import ts from "typescript";
import * as KozmosReact from "@kozmos-ds/react";
import * as KozmosVue from "../src/index";
import { COMPOSABLES, PORTS, REACT_SOURCE } from "./ports";
import { readStoryArgs } from "./parity/story-args";

/**
 * Vue 3 Phase 0, P0.4: nothing the main entry exports escapes the API
 * contract (`contract/`) or the DOM parity check (`parity/`). Each export
 * answers to a React export; each React story of a ported part is drawn in
 * both, or names the spec that draws what it shows; a part with no args
 * stories names where it is drawn; and each event names the spec that makes
 * it fire.
 */
const TEST = __dirname;
const exported = (module: object) => Object.keys(module).sort();

describe("every Vue export answers to React", () => {
  it("is a port or a composable, each named once", () => {
    const known = [
      ...PORTS.map((port) => port.vue),
      ...COMPOSABLES.map((pair) => pair.vue),
    ];
    expect(new Set(known).size).toBe(known.length);
    expect(exported(KozmosVue)).toEqual([...known].sort());
  });

  it("names a React export that exists", () => {
    const react = new Set(exported(KozmosReact));
    for (const name of [
      ...PORTS.map((port) => port.react),
      ...COMPOSABLES.map((pair) => pair.react),
    ])
      expect(react.has(name), `@kozmos-ds/react exports no ${name}`).toBe(true);
  });
});

/**
 * A spec, relative to test/, that exists, imports the Vue part from the
 * package's source and uses it: a comment or a string naming it is not a
 * drawing of it.
 */
function drawsIn(spec: string, vue: string) {
  const file = path.join(TEST, spec);
  expect(fs.existsSync(file), `${spec} does not exist`).toBe(true);
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  let imported = false;
  let used = false;
  const visit = (node: ts.Node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      /(^|\/)src\/index$|^\.\.\/\.\.\/index$/.test(node.moduleSpecifier.text)
    ) {
      const bindings = node.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings))
        imported ||= bindings.elements.some(
          (element) => element.name.text === vue,
        );
      return;
    }
    if (ts.isIdentifier(node) && node.text === vue) used = true;
    ts.forEachChild(node, visit);
  };
  visit(source);
  expect(imported, `${spec} does not import ${vue} from the source`).toBe(true);
  expect(used, `${spec} imports ${vue} but never uses it`).toBe(true);
  return source;
}

describe("every React story of a ported part is drawn in both", () => {
  for (const port of PORTS)
    it(port.vue, () => {
      if (!port.stories) {
        expect(
          port.drawnIn,
          `${port.vue} has no stories: name drawnIn`,
        ).toBeTruthy();
        drawsIn(port.drawnIn!, port.vue);
        return;
      }
      const file = path.join(REACT_SOURCE, port.stories);
      expect(fs.existsSync(file), `${port.stories} does not exist`).toBe(true);
      const { stories, rendered } = readStoryArgs(file);
      // What stories.parity.spec.ts cannot draw from args, and only that, is
      // named with the spec that draws it: a story with its own render, or
      // with args the reader cannot read.
      const elsewhere = [
        ...rendered,
        ...stories
          .filter((story) => story.unread.length)
          .map((story) => story.name),
      ];
      expect(Object.keys(port.elsewhere ?? {}).sort()).toEqual(
        elsewhere.sort(),
      );
      for (const spec of Object.values(port.elsewhere ?? {}))
        drawsIn(spec, port.vue);
      // With no args story drawn, stories.parity.spec.ts draws only its
      // attributes.
      if (!stories.some((story) => !story.unread.length)) {
        expect(
          port.drawnIn,
          `${port.stories} has no args story drawn: name drawnIn`,
        ).toBeTruthy();
        drawsIn(port.drawnIn!, port.vue);
      }
    });
});

describe("every event a port declares is seen to fire", () => {
  for (const port of PORTS)
    it(port.vue, () => {
      const component = (KozmosVue as Record<string, unknown>)[port.vue] as {
        emits?: string[] | Record<string, unknown>;
      };
      const declared = Array.isArray(component.emits)
        ? component.emits
        : Object.keys(component.emits ?? {});
      expect(Object.keys(port.events ?? {}).sort()).toEqual(
        [...declared].sort(),
      );
      for (const [event, spec] of Object.entries(port.events ?? {})) {
        const source = drawsIn(spec, port.vue);
        // The spec listens for it, by the handler prop Vue's types give it.
        const handler = `on${event[0].toUpperCase()}${event.slice(1)}`;
        let listens = false;
        const visit = (node: ts.Node) => {
          if (
            ts.isPropertyAssignment(node) &&
            (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) &&
            node.name.text === handler
          )
            listens = true;
          ts.forEachChild(node, visit);
        };
        visit(source);
        expect(listens, `${spec} never listens for ${event} (${handler})`).toBe(
          true,
        );
      }
    });
});
