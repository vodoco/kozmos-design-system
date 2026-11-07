#!/usr/bin/env node
/**
 * Which `on…` props each React part the bridge mounts takes, and which of
 * its props are booleans, read from @kozmos-ds/react's built declarations
 * (`packages/react/dist/index.d.ts`), written to
 * `src/react-bridge/part-takes.ts`. The bridge sends a listener to the part
 * when the part takes its prop, and binds it natively on the wrapper's own
 * box when it does not; and it gives a boolean prop's bare attribute
 * (`<KozmosNavigationItem disabled>`, which Vue gives as "") to React as
 * `true` (react-adapter.ts).
 *
 *   pnpm --filter @kozmos-ds/vue bridge:takes          writes the file
 *   pnpm --filter @kozmos-ds/vue bridge:takes --check  fails when it is stale
 *
 * The parts are those `src/react-bridge/index.ts` imports from
 * @kozmos-ds/react, and the adapters it defines (ADAPTERS, below).
 * `Listeners.spec.ts` and `Booleans.spec.ts` compute the same tables and
 * fail when the file differs. React's own types decide: a part whose props
 * carry React's DOM attributes takes every React DOM event (`dom`), but any
 * it omits (`except`), and its other `on…` props are listed (`own`); its
 * props whose type is `boolean` are its `flags`, and those boolean in a
 * union with other types (`error: boolean | string`) its `unions`.
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

/** A type @types/react declares, by its name: `DOMAttributes`, `ReactNode`. */
function reactType(api, name) {
  const react = api.program
    .getSourceFiles()
    .find((file) =>
      /[/\\]@types[/\\]react[/\\]index\.d\.ts$/.test(file.fileName),
    );
  if (!react) throw new Error("@types/react is not among the program's files");
  const module = api.checker.getSymbolAtLocation(react);
  const symbol = api.checker
    .getExportsOfModule(module)
    .find((exported) => exported.name === name);
  if (!symbol) throw new Error(`@types/react declares no ${name}`);
  return api.checker.getDeclaredTypeOfSymbol(symbol);
}

/** React's DOM event props (`onClick`, `onClickCapture`), from `DOMAttributes`. */
function domProps(api) {
  return new Set(
    api.checker
      .getPropertiesOfType(reactType(api, "DOMAttributes"))
      .map((symbol) => symbol.name)
      .filter(isHandler),
  );
}

/** A prop's name in kebab-case, as Vue's `hyphenate` writes it: `read-only`. */
export const hyphenate = (name) =>
  name.replace(/\B([A-Z])/g, "-$1").toLowerCase();

/**
 * The spellings Vue may give a prop's attribute under, which the bridge
 * reads as the prop: React's name (`readOnly`, an SFC's), in small letters
 * (`readonly`, an in-DOM template's, which the browser lowercases), and in
 * kebab-case (`read-only`).
 */
export const spellingsOf = (prop) => [
  ...new Set([prop, prop.toLowerCase(), hyphenate(prop)]),
];

/**
 * The boolean props of the props types `types`, read together: `flags`,
 * each prop whose type is `boolean` (or `true`), and `unions`, each whose
 * type is boolean in a union with other types (`error: boolean | string`,
 * `aria-checked: boolean | "true" | "false" | "mixed"`). A union's members
 * (`RowProps | ListProps`) are read together, as React reads them: a prop is
 * what every member that declares it takes (`multiple: true` in one and
 * `multiple?: false` in another is a flag). Neither is a prop that takes any
 * ReactNode (`children`, `label`, `icon`): it is a slot, whose `boolean` is
 * React's "draw nothing"; nor one that takes `false` but never `true`
 * (DynamicIsland's `dragConstraints`), which no bare attribute can mean.
 * `props` is every prop the types declare.
 */
function booleansOf(api, types) {
  const { checker } = api;
  const slot = checker.getNonNullableType(reactType(api, "ReactNode"));
  const read = new Map();
  for (const type of types)
    for (const member of type.isUnion() ? type.types : [type])
      for (const symbol of checker.getPropertiesOfType(member)) {
        const value = checker.getNonNullableType(
          checker.getTypeOfSymbolAtLocation(symbol, api.dts),
        );
        const seen = read.get(symbol.name) ?? {
          takesTrue: false,
          other: false,
          slot: false,
        };
        if (checker.isTypeAssignableTo(slot, value)) seen.slot = true;
        for (const part of value.isUnion() ? value.types : [value])
          if (part.flags & ts.TypeFlags.BooleanLiteral) {
            if (checker.typeToString(part) === "true") seen.takesTrue = true;
          } else seen.other = true;
        read.set(symbol.name, seen);
      }
  const flags = [];
  const unions = [];
  for (const [name, seen] of read)
    if (seen.takesTrue && !seen.slot) (seen.other ? unions : flags).push(name);
  return {
    flags: flags.sort(),
    unions: unions.sort(),
    props: [...read.keys()],
  };
}

/**
 * The boolean props of the components `targets` hand theirs to (`name`'s
 * own, or an adapter's parts). Each spelling of one (spellingsOf) must name
 * it alone: one that is another boolean's, or another prop's own name, would
 * give React the wrong prop, so generation fails and a person decides.
 */
function booleansOfParts(api, name, targets) {
  const types = targets.map((target) => {
    const entry = api.entries.get(target);
    if (!entry?.component)
      throw new Error(
        `${target} is not a component export of @kozmos-ds/react`,
      );
    return entry.component.propsType;
  });
  const { flags, unions, props } = booleansOf(api, types);
  const named = new Set(props);
  const spelt = new Map();
  for (const prop of [...flags, ...unions])
    for (const spelling of spellingsOf(prop)) {
      const other =
        spelt.get(spelling) ??
        (spelling !== prop && named.has(spelling) ? spelling : undefined);
      if (other !== undefined && other !== prop)
        throw new Error(
          `${name}: the attribute ${spelling} would be its boolean ${prop} and its prop ${other}. Which one a template means cannot be read from it, so a person decides: rename one.`,
        );
      spelt.set(spelling, prop);
    }
  return { flags, unions };
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
 * The tables: each React part `index.ts` imports that is a component, and
 * each adapter, with the `on…` props it takes (`parts`, `adapters`), and its
 * boolean props (`booleans`). `booleans.html` is React's `HTMLAttributes`'
 * own, which most parts take: the file writes them once.
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
  const html = booleansOf(api, [reactType(api, "HTMLAttributes")]);
  const booleans = {
    html: { flags: html.flags, unions: html.unions },
    parts: {},
    adapters: {},
  };
  for (const name of partNames ?? importedParts(root)) {
    const own = handlersOf(api, name, dom);
    parts[name] = compress(own, dom);
    handlers[name] = [...own].sort();
    booleans.parts[name] = booleansOfParts(api, name, [name]);
  }
  const adapters = {};
  for (const [adapter, targets] of Object.entries(adapterTargets)) {
    const all = new Set();
    for (const target of targets)
      for (const handler of handlersOf(api, target, dom)) all.add(handler);
    adapters[adapter] = compress(all, dom);
    handlers[adapter] = [...all].sort();
    booleans.adapters[adapter] = booleansOfParts(api, adapter, targets);
  }
  return { parts, adapters, handlers, domProps: [...dom].sort(), booleans };
}

/**
 * The booleans' part of the file: each part's and adapter's entry, as
 * `html(flags, unions)` when it has React's `HTMLAttributes`' booleans and
 * those of its own, else as its lists; an entry more than one has, once.
 */
function booleansSource({ html, parts, adapters }) {
  const covers = (list, base) => base.every((name) => list.includes(name));
  const less = (list, base) => list.filter((name) => !base.includes(name));
  const list = (names) => JSON.stringify(names);
  const entry = ({ flags, unions }) => {
    if (!covers(flags, html.flags) || !covers(unions, html.unions))
      return `{ flags: ${list(flags)}, unions: ${list(unions)} }`;
    const ownFlags = less(flags, html.flags);
    const ownUnions = less(unions, html.unions);
    const own = ownUnions.length
      ? [ownFlags, ownUnions]
      : ownFlags.length
        ? [ownFlags]
        : [];
    return `html(${own.map(list).join(", ")})`;
  };
  const uses = new Map();
  for (const booleans of [...Object.values(parts), ...Object.values(adapters)])
    uses.set(entry(booleans), (uses.get(entry(booleans)) ?? 0) + 1);
  const shared = new Map([["html()", "H"]]);
  for (const [name, booleans] of Object.entries(parts)) {
    const text = entry(booleans);
    if (uses.get(text) > 1 && !shared.has(text))
      shared.set(text, `${name[0].toLowerCase()}${name.slice(1)}Booleans`);
  }
  const ref = (booleans) => shared.get(entry(booleans)) ?? entry(booleans);
  return `/**
 * React's \`HTMLAttributes\`' boolean props, which most parts take: \`flags\`,
 * whose type is \`boolean\`, and \`unions\`, boolean in a union with others.
 */
const HTML: Booleans = { flags: ${list(html.flags)}, unions: ${list(html.unions)} };
/** A part's booleans: React's \`HTMLAttributes\`', and its own. */
const html = (flags: readonly string[] = [], unions: readonly string[] = []): Booleans => ({
  flags: [...HTML.flags, ...flags],
  unions: [...HTML.unions, ...unions],
});

/** React's \`HTMLAttributes\`' booleans, and none of its own: most parts. */
const H = html();
${[...shared]
  .filter(([, constant]) => constant !== "H")
  .map(([text, constant]) => `const ${constant} = ${text};`)
  .join("\n")}

/** By React part. */
export const PART_BOOLEANS: ReadonlyMap<unknown, Booleans> = new Map<unknown, Booleans>([
${Object.entries(parts)
  .map(([name, booleans]) => `  [${name}, ${ref(booleans)}],`)
  .join("\n")}
]);

/** By the adapter in index.ts that hands its props on to React parts. */
export const ADAPTER_BOOLEANS: Readonly<Record<string, Booleans>> = {
${Object.entries(adapters)
  .map(([adapter, booleans]) => `  ${adapter}: ${ref(booleans)},`)
  .join("\n")}
};
`;
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
// not edit: Listeners.spec.ts and Booleans.spec.ts fail when this differs
// from what React's types say. The stylesheet's Tailwind does not read it.
//
// The \`on…\` props each React part the bridge mounts takes. \`dom\`: every
// React DOM event (\`onClick\`, \`onClickCapture\`), but those in \`except\`;
// \`own\`: its other \`on…\` props. A listener whose prop the part takes is the
// part's; any other is a native listener on the wrapper's own box.
//
// And its boolean props. \`flags\`: those whose type is \`boolean\`; \`unions\`:
// those boolean in a union with other types (\`error: boolean | string\`). A
// bare attribute of either (\`<KozmosInput error>\`, which Vue gives as "")
// is \`true\` to React; so is a flag's name as its value (\`disabled="disabled"\`).
// A prop that takes any ReactNode is a slot, and neither.
import {
${names.map((name) => `  ${name},`).join("\n")}
} from "@kozmos-ds/react";
import type { Booleans, Takes } from "./react-adapter";

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

${booleansSource(table.booleans)}`;
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
