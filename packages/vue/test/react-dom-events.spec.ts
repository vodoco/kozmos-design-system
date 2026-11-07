// @vitest-environment jsdom
import path from "node:path";
import { describe, expect, it } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync, version as reactDomVersion } from "react-dom";
import ts from "typescript";
import {
  REACT_19_EVENTS,
  REACT_DOM_EVENTS,
  REACT_UNTYPED_EVENTS,
} from "../src/react-bridge/react-adapter";
import { heard } from "./react-bridge-harness";

// The bridge's event tables against the react-dom installed, whichever of
// its peers' two majors it is (packages/vue/package.json: React 18 or 19).
// src/react-bridge/Listeners.spec.ts holds them to react-dom 19 alone ("...
// lists every DOM event react-dom 19 synthesises", which fails on any other
// React by design); this is its counterpart for the react-dom that runs,
// so under React 18 (the Vue Storybook's, apps/docs/package.json) it says
// what 18 synthesises: REACT_DOM_EVENTS and REACT_UNTYPED_EVENTS, and none
// of REACT_19_EVENTS, which is why the bridge never gives a part one.

/** The keys of a type, as the compiler reads `text`'s `Keys` with lib.dom. */
function typeKeys(text: string) {
  const file = path.join(__dirname, "react-dom-events.probe.ts");
  const options: ts.CompilerOptions = {
    moduleResolution: ts.ModuleResolutionKind.Node10,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    lib: ["lib.esnext.d.ts", "lib.dom.d.ts"],
    strict: true,
    skipLibCheck: true,
    noEmit: true,
  };
  const host = ts.createCompilerHost(options);
  const read = host.getSourceFile.bind(host);
  host.getSourceFile = (name, version, ...rest) =>
    name === file
      ? ts.createSourceFile(name, text, version)
      : read(name, version, ...rest);
  host.fileExists = (
    (exists) => (name: string) =>
      name === file || exists(name)
  )(host.fileExists.bind(host));
  const program = ts.createProgram({ rootNames: [file], options, host });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(file)!;
  const alias = source.statements.find(ts.isTypeAliasDeclaration)!;
  const keys = checker.getTypeAtLocation(alias.type);
  return (keys.isUnion() ? keys.types : [keys]).map(
    (type) => (type as ts.StringLiteralType).value,
  );
}

/** Every DOM event TypeScript's lib.dom names, on elements, media, the document and the window. */
const libDomEvents = () =>
  typeKeys(
    `export type Keys = keyof HTMLElementEventMap | keyof HTMLMediaElementEventMap | keyof HTMLVideoElementEventMap | keyof SVGElementEventMap | keyof DocumentEventMap | keyof WindowEventMap;\n`,
  );

/**
 * The React name the installed react-dom gives each DOM event it
 * synthesises, as its development build reads a misspelt prop: `onkeydown`
 * is "Did you mean `onKeyDown`?", and a name it does not know is "Unknown
 * event handler property". react-dom 18 and 19 word it alike.
 */
function reactDomKnows(events: Iterable<string>) {
  const container = document.createElement("div");
  const root = createRoot(container);
  const known: Record<string, string> = {};
  heard();
  for (const event of events) {
    flushSync(() =>
      root.render(React.createElement("div", { [`on${event}`]: () => {} })),
    );
    const said = heard().join(" ");
    const suggested = /Did you mean `%s`\?\S*\s+\S+\s+(on\w+)/.exec(said)?.[1];
    if (suggested) known[event] = suggested;
  }
  root.unmount();
  // React's own `focusin` and `focusout` are its onFocus and onBlur.
  delete known.focusin;
  delete known.focusout;
  return known;
}

/** The DOM events react-dom `major` synthesises, by the bridge's tables, each with React's name. */
function listedFor(major: number) {
  const tables =
    major === 19
      ? { ...REACT_DOM_EVENTS, ...REACT_UNTYPED_EVENTS, ...REACT_19_EVENTS }
      : { ...REACT_DOM_EVENTS, ...REACT_UNTYPED_EVENTS };
  return Object.fromEntries(
    Object.entries(tables).map(([react, dom]) => [dom, react]),
  );
}

describe("the bridge's event tables, against the installed react-dom", () => {
  it(`react-dom ${reactDomVersion} synthesises its major's table: 18 REACT_DOM_EVENTS and REACT_UNTYPED_EVENTS, 19 REACT_19_EVENTS too`, () => {
    const major = Number(reactDomVersion.split(".")[0]);
    expect(
      [18, 19],
      `react-dom ${reactDomVersion}: the bridge keeps tables for 18 and 19`,
    ).toContain(major);
    // Every event lib.dom names and every one the tables name, React 19's
    // included, so a table that lists too few or too many fails.
    const known = reactDomKnows(
      new Set([
        ...libDomEvents(),
        ...Object.values(REACT_DOM_EVENTS),
        ...Object.values(REACT_UNTYPED_EVENTS),
        ...Object.values(REACT_19_EVENTS),
      ]),
    );
    expect(Object.keys(known).length).toBeGreaterThan(80);
    expect(known).toEqual(listedFor(major));
    if (major === 18)
      for (const dom of Object.values(REACT_19_EVENTS))
        expect(known[dom], `react-dom 18 synthesises ${dom}`).toBeUndefined();
  });
});
