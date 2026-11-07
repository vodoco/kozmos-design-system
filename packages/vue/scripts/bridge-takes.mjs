#!/usr/bin/env node
/**
 * Which `on…` props each React part the bridge mounts takes, read from
 * @kozmos-ds/react's built declarations (`packages/react/dist/index.d.ts`),
 * written to `src/react-bridge/part-takes.ts`. The bridge sends a listener to
 * the part when the part takes its prop, and binds it natively on the
 * wrapper's own box when it does not (react-adapter.ts).
 *
 *   pnpm --filter @kozmos-ds/vue bridge:takes          writes the file
 *   pnpm --filter @kozmos-ds/vue bridge:takes --check  fails when it is stale
 *
 * The parts are those `src/react-bridge/index.ts` imports from
 * @kozmos-ds/react, and the adapters it defines (ADAPTERS, below).
 * `Listeners.spec.ts` computes the same table and fails when the file
 * differs. React's own types decide: a part whose props carry React's DOM
 * attributes takes every React DOM event (`dom`), but any it omits
 * (`except`), and its other `on…` props are listed (`own`).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import prettier from "prettier";
import { readPublishedApi } from "../../../scripts/skills/claude-design-api.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPOSITORY = path.resolve(HERE, "../../..");
const BRIDGE = "packages/vue/src/react-bridge";
export const TABLE = path.join(REPOSITORY, BRIDGE, "part-takes.ts");

/**
 * The adapters `index.ts` defines, by name, with the React parts each hands
 * its props to: their own props are typed `any`. AnchoredPopover gives
 * `onOpenChange` to Popover and the rest to PopoverContent.
 */
export const ADAPTERS = {
  AvatarAdapter: ["Avatar"],
  AlertAdapter: ["Alert"],
  BackdropAdapter: ["Backdrop"],
  TourStepAdapter: ["TourStep"],
  AnchoredPopoverAdapter: ["Popover", "PopoverContent"],
};

/**
 * The parts `index.ts` imports from @kozmos-ds/react, in its order: each
 * value it imports by a component's name (`Badge`, not `orderPanelDetents`,
 * `DEFAULT_PANEL_DETENTS` or a type).
 */
function importedParts(root) {
  const file = path.join(root, BRIDGE, "index.ts");
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const names = [];
  for (const node of source.statements)
    if (
      ts.isImportDeclaration(node) &&
      !node.importClause?.isTypeOnly &&
      node.moduleSpecifier.text === "@kozmos-ds/react" &&
      node.importClause?.namedBindings &&
      ts.isNamedImports(node.importClause.namedBindings)
    )
      for (const element of node.importClause.namedBindings.elements) {
        const name = (element.propertyName ?? element.name).text;
        if (
          !element.isTypeOnly &&
          /^[A-Z]/.test(name) &&
          !/^[A-Z0-9_]+$/.test(name)
        )
          names.push(name);
      }
  return names;
}

const isHandler = (name) => /^on[A-Z]/.test(name);

/** React's DOM event props (`onClick`, `onClickCapture`), from `DOMAttributes`. */
function domProps(api) {
  const react = api.program
    .getSourceFiles()
    .find((file) =>
      /[/\\]@types[/\\]react[/\\]index\.d\.ts$/.test(file.fileName),
    );
  if (!react) throw new Error("@types/react is not among the program's files");
  const module = api.checker.getSymbolAtLocation(react);
  const attributes = api.checker
    .getExportsOfModule(module)
    .find((symbol) => symbol.name === "DOMAttributes");
  if (!attributes) throw new Error("@types/react declares no DOMAttributes");
  return new Set(
    api.checker
      .getPropertiesOfType(api.checker.getDeclaredTypeOfSymbol(attributes))
      .map((symbol) => symbol.name)
      .filter(isHandler),
  );
}

/**
 * Every `on…` prop a part's props take that is a function. A part whose
 * props are a union may have members that disagree on one:
 * - on a React DOM event prop (`onClick`), whether the listener is the
 *   part's or the wrapper's box changes what runs it, so generation fails
 *   and a person decides;
 * - on a callback of the part's own (RouteSummary's `onStartNavigation`,
 *   which its estimate layout has and its navigation layout has not), it is
 *   taken if any member declares it: a box listener for a name no DOM event
 *   has can never run, so the part is the only place it can be heard.
 */
function handlersOf(api, name, dom) {
  const entry = api.entries.get(name);
  if (!entry?.component)
    throw new Error(`${name} is not a component export of @kozmos-ds/react`);
  const { checker } = api;
  const props = entry.component.propsType;
  const members = props.isUnion() ? props.types : [props];
  const sets = members.map((member) => {
    const names = new Set();
    for (const symbol of checker.getPropertiesOfType(member)) {
      if (!isHandler(symbol.name)) continue;
      const type = checker.getNonNullableType(
        checker.getTypeOfSymbolAtLocation(symbol, api.dts),
      );
      if (type.getCallSignatures().length > 0) names.add(symbol.name);
    }
    return names;
  });
  const all = new Set(sets.flatMap((set) => [...set]));
  const disputed = [...all]
    .filter((handler) => dom.has(handler))
    .filter((handler) => sets.some((set) => !set.has(handler)))
    .sort();
  if (disputed.length)
    throw new Error(
      `${name}: its props are a union whose members disagree on ${disputed.length} React DOM event prop(s) (${disputed.slice(0, 5).join(", ")}${disputed.length > 5 ? ", …" : ""}). Whether a listener of one is the part's or the wrapper's box changes what runs it, so a person decides: give the part one props type for them. A disagreement on a callback of the part's own is taken if any member declares it.`,
    );
  return all;
}

/** One part's entry: React's DOM events but `except`, and `own`; or `own` alone. */
function compress(handlers, dom) {
  const taken = [...dom].filter((name) => handlers.has(name));
  const own = [...handlers].filter((name) => !dom.has(name)).sort();
  if (taken.length * 2 < dom.size)
    return { dom: false, own: [...handlers].sort() };
  const except = [...dom].filter((name) => !handlers.has(name)).sort();
  return except.length ? { dom: true, except, own } : { dom: true, own };
}

/**
 * The table: each React part `index.ts` imports that is a component, and
 * each adapter, with the `on…` props it takes.
 */
export function computeTakes(
  root = REPOSITORY,
  {
    // A declarations file and the parts to read from it, for a test's
    // fixture; by default React's built declarations and index.ts's parts.
    declarations,
    virtual,
    parts: partNames,
    adapters: adapterTargets = ADAPTERS,
  } = {},
) {
  const api = readPublishedApi(
    root,
    declarations ? { declarations, virtual } : {},
  );
  const dom = domProps(api);
  const parts = {};
  /** Each part's and adapter's `on…` props, as a sorted list: what `parts` and `adapters` compress. */
  const handlers = {};
  for (const name of partNames ?? importedParts(root)) {
    const own = handlersOf(api, name, dom);
    parts[name] = compress(own, dom);
    handlers[name] = [...own].sort();
  }
  const adapters = {};
  for (const [adapter, targets] of Object.entries(adapterTargets)) {
    const all = new Set();
    for (const target of targets)
      for (const handler of handlersOf(api, target, dom)) all.add(handler);
    adapters[adapter] = compress(all, dom);
    handlers[adapter] = [...all].sort();
  }
  return { parts, adapters, handlers, domProps: [...dom].sort() };
}

/** The file `computeTakes()` writes. */
export async function renderTakes(table = computeTakes()) {
  const names = Object.keys(table.parts);
  const key = (takes) => JSON.stringify(takes);
  // An entry more than one part or adapter has is written once.
  const uses = new Map();
  for (const takes of [
    ...Object.values(table.parts),
    ...Object.values(table.adapters),
  ])
    uses.set(key(takes), (uses.get(key(takes)) ?? 0) + 1);
  const plain = key({ dom: true, own: [] });
  const shared = new Map([[plain, "D"]]);
  for (const name of names) {
    const entry = key(table.parts[name]);
    if (uses.get(entry) > 1 && !shared.has(entry))
      shared.set(entry, `${name[0].toLowerCase()}${name.slice(1)}Takes`);
  }
  const ref = (takes) => shared.get(key(takes)) ?? key(takes);
  const text = `// Generated by \`pnpm --filter @kozmos-ds/vue bridge:takes\`
// (scripts/bridge-takes.mjs) from @kozmos-ds/react's built declarations. Do
// not edit: Listeners.spec.ts fails when this differs from what React's
// types say. The stylesheet's Tailwind does not read it.
//
// The \`on…\` props each React part the bridge mounts takes. \`dom\`: every
// React DOM event (\`onClick\`, \`onClickCapture\`), but those in \`except\`;
// \`own\`: its other \`on…\` props. A listener whose prop the part takes is the
// part's; any other is a native listener on the wrapper's own box.
import {
${names.map((name) => `  ${name},`).join("\n")}
} from "@kozmos-ds/react";
import type { Takes } from "./react-adapter";

/** Every React DOM event, and nothing of its own: most parts. */
const D: Takes = ${plain};
${[...shared]
  .filter(([, constant]) => constant !== "D")
  .map(([entry, constant]) => `const ${constant}: Takes = ${entry};`)
  .join("\n")}

/** By React part. */
export const PART_TAKES: ReadonlyMap<unknown, Takes> = new Map<unknown, Takes>([
${names.map((name) => `  [${name}, ${ref(table.parts[name])}],`).join("\n")}
]);

/** By the adapter in index.ts that hands its props on to React parts. */
export const ADAPTER_TAKES: Readonly<Record<string, Takes>> = {
${Object.entries(table.adapters)
  .map(([adapter, takes]) => `  ${adapter}: ${ref(takes)},`)
  .join("\n")}
};
`;
  const options = (await prettier.resolveConfig(TABLE)) ?? {};
  return prettier.format(text, { ...options, filepath: TABLE });
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const text = await renderTakes();
  if (process.argv.includes("--check")) {
    const current = fs.existsSync(TABLE) ? fs.readFileSync(TABLE, "utf8") : "";
    if (current !== text) {
      console.error(
        `${path.relative(REPOSITORY, TABLE)} is stale: run pnpm --filter @kozmos-ds/vue bridge:takes`,
      );
      process.exit(1);
    }
    console.log(`${path.relative(REPOSITORY, TABLE)} matches React's types.`);
  } else {
    fs.writeFileSync(TABLE, text);
    console.log(`wrote ${path.relative(REPOSITORY, TABLE)}`);
  }
}
