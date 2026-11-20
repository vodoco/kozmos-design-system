import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import ts from "typescript";
import * as KozmosReact from "@kozmos-ds/react";
import * as KozmosVue from "../src/index";
import * as KozmosBridge from "../src/react-bridge/index";
import {
  COMPOSABLES,
  LEAVING_BRIDGE,
  PORTS,
  REACT_SOURCE,
  type Port,
} from "./ports";
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
 * One name is one component (`src/react-bridge/index.ts`): a part leaves
 * the bridge when its Vue port lands in the main entry, so an app that
 * imports `KozmosBadge` from either gets the same part. A port whose bridge
 * entry is still to be taken out is named in `LEAVING_BRIDGE`, with why;
 * a name there that is not both native and bridged fails, so the list
 * never outlives what it excuses.
 */
describe("the bridge exports no part the main entry exports", () => {
  const both = () => exported(KozmosVue).filter((name) => name in KozmosBridge);

  it("exports each native part from the main entry only", () => {
    expect(both().filter((name) => !(name in LEAVING_BRIDGE))).toEqual([]);
  });

  it("names in LEAVING_BRIDGE only native parts still in the bridge", () => {
    expect(Object.keys(LEAVING_BRIDGE).sort()).toEqual(
      Object.keys(LEAVING_BRIDGE)
        .filter((name) => both().includes(name))
        .sort(),
    );
    for (const reason of Object.values(LEAVING_BRIDGE))
      expect(reason.trim().length).toBeGreaterThan(20);
  });
});

/**
 * A spec, relative to test/, that exists and draws the part in both: it
 * imports the Vue part from the package's source and uses it, and it uses
 * React's part from `@kozmos-ds/react`. A comment or a string naming either
 * is not a drawing of it.
 */
function drawsIn(spec: string, port: Port) {
  const file = path.join(TEST, spec);
  expect(fs.existsSync(file), `${spec} does not exist`).toBe(true);
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  let vueImported = false;
  let vueUsed = false;
  let reactNamespace: string | null = null;
  let reactNamed = false;
  let reactUsed = false;
  for (const statement of source.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    )
      continue;
    const from = statement.moduleSpecifier.text;
    const bindings = statement.importClause?.namedBindings;
    if (!bindings) continue;
    if (
      /(^|\/)src\/index$|^\.\.\/\.\.\/index$/.test(from) &&
      ts.isNamedImports(bindings)
    )
      vueImported ||= bindings.elements.some((e) => e.name.text === port.vue);
    if (from === "@kozmos-ds/react") {
      if (ts.isNamespaceImport(bindings)) reactNamespace = bindings.name.text;
      else
        reactNamed ||= bindings.elements.some(
          (e) => e.name.text === port.react,
        );
    }
  }
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node)) return;
    if (ts.isIdentifier(node) && node.text === port.vue) vueUsed = true;
    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === reactNamespace &&
      node.name.text === port.react
    )
      reactUsed = true;
    if (reactNamed && ts.isIdentifier(node) && node.text === port.react)
      reactUsed = true;
    ts.forEachChild(node, visit);
  };
  visit(source);
  expect(
    vueImported,
    `${spec} does not import ${port.vue} from the source`,
  ).toBe(true);
  expect(vueUsed, `${spec} imports ${port.vue} but never uses it`).toBe(true);
  expect(reactUsed, `${spec} never draws React's ${port.react}`).toBe(true);
  return source;
}

/**
 * Whether a spec listens for an event on the part itself: a handler prop of
 * that name in the props of `h(<the Vue part>, { … })`.
 */
function listensOn(source: ts.SourceFile, vue: string, handler: string) {
  let found = false;
  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "h" &&
      node.arguments.length > 1 &&
      ts.isIdentifier(node.arguments[0]) &&
      node.arguments[0].text === vue &&
      ts.isObjectLiteralExpression(node.arguments[1])
    )
      found ||= node.arguments[1].properties.some(
        (p) =>
          ts.isPropertyAssignment(p) &&
          (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) &&
          p.name.text === handler,
      );
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

describe("every React story of a ported part is drawn in both", () => {
  for (const port of PORTS)
    it(port.vue, () => {
      if (!port.stories) {
        expect(
          port.drawnIn,
          `${port.vue} has no stories: name drawnIn`,
        ).toBeTruthy();
        drawsIn(port.drawnIn!, port);
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
        drawsIn(spec, port);
      // With no args story drawn, stories.parity.spec.ts draws only its
      // attributes.
      if (!stories.some((story) => !story.unread.length)) {
        expect(
          port.drawnIn,
          `${port.stories} has no args story drawn: name drawnIn`,
        ).toBeTruthy();
        drawsIn(port.drawnIn!, port);
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
        const source = drawsIn(spec, port);
        // The spec listens for it on the part, by the handler prop Vue's
        // types give it.
        const handler = `on${event[0].toUpperCase()}${event.slice(1)}`;
        const listens = listensOn(source, port.vue, handler);
        expect(listens, `${spec} never listens for ${event} (${handler})`).toBe(
          true,
        );
      }
    });
});
