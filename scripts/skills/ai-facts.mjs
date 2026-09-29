/**
 * What @kozmos-ds publishes, as facts an assistant can be told: each public
 * package's exports, and each component's props with the values each one
 * accepts. `pnpm skills:build` writes them into
 * `.ai-skills/component-inventory.md`, and `pnpm skills:check` holds every
 * example in `.ai-skills` to them (scripts/skills/ai-snippets.mjs).
 *
 * Both used to read the component source with regular expressions that
 * assumed how it was laid out: four spaces before a cva axis and six before
 * its values, a union spelled inline or named in the same file. Badge and
 * Tag, whose cva call is wrapped, had no axes at all; Button's `emotion`,
 * read through `(typeof BUTTON_EMOTIONS)[number]`, and Tag's, imported from
 * utils/emotion, were never seen. Generation and validation shared the blind
 * spot, so each agreed with the other while both were wrong (the review's
 * T2).
 *
 * These come from the TypeScript checker over the built declarations, which
 * are what an app compiles against. A prop's values are what the compiler
 * resolves through cva's VariantProps, indexed-access and imported unions,
 * `extends`, `Omit` and aliases, however the source happens to be written.
 * A type the checker cannot resolve is reported as unknown, and never as a
 * prop, or a component, without values.
 */
import fs from "node:fs";
import path from "node:path";
import {
  declarationsOf,
  originOf,
  readPublishedApi,
} from "./claude-design-api.mjs";
import {
  COMPONENTS,
  exportOwners,
  readModules,
} from "./claude-design-source.mjs";
import {
  compilerOptions,
  exampleDirectory,
  hostWith,
  ts,
} from "./claude-design-typescript.mjs";

/** The props a component is described by: its own and Radix's, not React's DOM attributes. */
export const AXIS_ORIGINS = new Set(["kozmos", "radix"]);

/** The names the checker gives a type it could not resolve. */
const UNRESOLVED = new Set(["error", "unresolved"]);

/**
 * What a value of `type` may be, as the checker sees it: the string, number
 * and boolean literals it takes; whether it takes any string or any number
 * (an `open` side); the other kinds of value it takes, as text; and, when
 * part of it did not resolve, why it is unknown.
 */
export function acceptedValues(checker, type) {
  const accepted = {
    strings: [],
    numbers: [],
    booleans: [],
    openStrings: false,
    openNumbers: false,
    others: [],
    unknown: null,
  };
  const text = (t) =>
    checker.typeToString(t, undefined, ts.TypeFormatFlags.NoTruncation);
  const seen = new Set();
  const visit = (t) => {
    if (seen.has(t)) return;
    seen.add(t);
    const flags = t.flags;
    if (flags & ts.TypeFlags.Any) {
      if (UNRESOLVED.has(t.intrinsicName))
        accepted.unknown = "its type does not resolve";
      else {
        accepted.openStrings = accepted.openNumbers = true;
        accepted.others.push("any");
      }
      return;
    }
    if (flags & ts.TypeFlags.Unknown) {
      accepted.openStrings = accepted.openNumbers = true;
      accepted.others.push("unknown");
      return;
    }
    if (
      flags &
      (ts.TypeFlags.Undefined |
        ts.TypeFlags.Null |
        ts.TypeFlags.Void |
        ts.TypeFlags.Never)
    )
      return;
    if (t.isUnion()) return t.types.forEach(visit);
    if (flags & ts.TypeFlags.StringLiteral)
      return accepted.strings.push(t.value);
    if (flags & ts.TypeFlags.NumberLiteral)
      return accepted.numbers.push(t.value);
    if (flags & ts.TypeFlags.BooleanLiteral)
      return accepted.booleans.push(t.intrinsicName === "true");
    if (
      flags &
      (ts.TypeFlags.String |
        ts.TypeFlags.TemplateLiteral |
        ts.TypeFlags.StringMapping)
    )
      return void (accepted.openStrings = true);
    if (flags & ts.TypeFlags.Number) return void (accepted.openNumbers = true);
    if (flags & ts.TypeFlags.TypeParameter) {
      const constraint = checker.getBaseConstraintOfType(t);
      if (constraint && constraint !== t) return visit(constraint);
      accepted.openStrings = accepted.openNumbers = true;
      return accepted.others.push(text(t));
    }
    if (t.isIntersection()) {
      // `string & {}`, the idiom that keeps a union's literals as suggestions,
      // takes any string at all.
      if (t.types.some((m) => m.flags & ts.TypeFlags.StringLike))
        accepted.openStrings = true;
      else if (t.types.some((m) => m.flags & ts.TypeFlags.NumberLike))
        accepted.openNumbers = true;
      else accepted.others.push(text(t));
      return;
    }
    // `{}` and `Object` take a string or a number as well as an object.
    if (
      flags & ts.TypeFlags.Object &&
      checker.getPropertiesOfType(t).length === 0 &&
      t.getCallSignatures().length === 0 &&
      t.getConstructSignatures().length === 0
    )
      accepted.openStrings = accepted.openNumbers = true;
    accepted.others.push(text(t));
  };
  visit(type);
  accepted.strings = [...new Set(accepted.strings)].sort();
  accepted.numbers = [...new Set(accepted.numbers)].sort((a, b) => a - b);
  accepted.booleans = [...new Set(accepted.booleans)].sort();
  accepted.others = [...new Set(accepted.others)];
  return accepted;
}

/**
 * An axis is a prop that takes a closed set of literal values and nothing
 * else: some strings or numbers (and perhaps true and false), never any
 * string, any number or a value of another kind. A plain boolean is not one.
 */
export const isAxis = (accepted) =>
  !accepted.unknown &&
  !accepted.openStrings &&
  !accepted.openNumbers &&
  accepted.others.length === 0 &&
  accepted.strings.length + accepted.numbers.length > 0;

/** An axis's values: its strings, then its numbers, then its booleans. */
export const axisValues = (accepted) => [
  ...accepted.strings,
  ...accepted.numbers,
  ...accepted.booleans,
];

function merge(into, from) {
  for (const key of ["strings", "numbers", "booleans", "others"])
    into[key] = [...new Set([...into[key], ...from[key]])];
  into.strings.sort();
  into.numbers.sort((a, b) => a - b);
  into.booleans.sort();
  into.openStrings ||= from.openStrings;
  into.openNumbers ||= from.openNumbers;
  into.unknown ??= from.unknown;
  return into;
}

/**
 * A component export's facts: every prop it takes, from every member of a
 * union of props (Radix's Accordion takes `collapsible` only when `type` is
 * "single"), with where the prop comes from and what it accepts.
 */
export function componentFacts(api, entry) {
  const { checker, dts } = api;
  const propsType = entry.component.propsType;
  const facts = {
    name: entry.name,
    unknown: null,
    props: new Map(),
    indexed: false,
  };
  if (propsType.flags & ts.TypeFlags.Any) {
    facts.unknown = UNRESOLVED.has(propsType.intrinsicName)
      ? "its props type does not resolve"
      : "its props are typed `any`, so nothing about them can be known";
    return facts;
  }
  const members = propsType.isUnion() ? propsType.types : [propsType];
  for (const member of members) {
    if (checker.getIndexInfosOfType(member).length) facts.indexed = true;
    for (const symbol of checker.getPropertiesOfType(member)) {
      const declarations = symbol.declarations?.length
        ? symbol.declarations
        : declarationsOf(checker, member, symbol.name);
      const own =
        declarations.find(
          (d) => originOf(d.getSourceFile().fileName) === "kozmos",
        ) ?? declarations[0];
      // A prop that cannot be traced to a declaration is not assumed to be
      // Kozmos's: what React's DOM types add changes with their version, and
      // a generated fact must not.
      const origin = own ? originOf(own.getSourceFile().fileName) : "unknown";
      const accepted = acceptedValues(
        checker,
        checker.getTypeOfSymbolAtLocation(symbol, dts),
      );
      if (!own) accepted.unknown ??= "where it is declared cannot be found";
      const known = facts.props.get(symbol.name);
      if (known) merge(known.accepted, accepted);
      else
        facts.props.set(symbol.name, { name: symbol.name, origin, accepted });
    }
  }
  return facts;
}

/** The public packages of the workspace, from their manifests. */
export function publicPackages(root) {
  const packages = new Map();
  const base = path.join(root, "packages");
  for (const dir of fs.readdirSync(base).sort()) {
    const file = path.join(base, dir, "package.json");
    if (!fs.existsSync(file)) continue;
    const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
    if (manifest.name && !manifest.private)
      packages.set(manifest.name, { dir: `packages/${dir}`, manifest });
  }
  return packages;
}

/**
 * Each public package's exports, as an app resolves the package: through
 * its manifest's `exports`, from a module that sits in packages/react. A
 * package that does not resolve has unknown exports, and says why.
 */
export function readPackageExports(root) {
  const packages = publicPackages(root);
  const names = [...packages.keys()];
  const file = path.join(exampleDirectory(root), "__kozmos-packages.ts");
  const source = `${names.map((name, i) => `import * as p${i} from ${JSON.stringify(name)};`).join("\n")}\nexport {};\n`;
  const program = ts.createProgram({
    rootNames: [file],
    options: compilerOptions,
    host: hostWith(new Map([[file, source]])),
  });
  const checker = program.getTypeChecker();
  const imports = program
    .getSourceFile(file)
    .statements.filter(ts.isImportDeclaration);
  const result = new Map();
  imports.forEach((statement, i) => {
    const symbol = checker.getSymbolAtLocation(statement.moduleSpecifier);
    result.set(names[i], {
      ...packages.get(names[i]),
      exports: symbol
        ? new Set(checker.getExportsOfModule(symbol).map((s) => s.name))
        : null,
      unknown: symbol
        ? null
        : `${names[i]} does not resolve from packages/react; build it first`,
    });
  });
  return result;
}

function factsFromApi(root, api, packages) {
  const components = new Map();
  for (const entry of api.entries.values())
    if (entry.component) components.set(entry.name, componentFacts(api, entry));
  return { root, api, packages, components };
}

/**
 * The facts of the built packages. Needs `pnpm --filter "@kozmos-ds/react..."
 * build`, and says so without it.
 */
export function readKozmosFacts(root) {
  return factsFromApi(root, readPublishedApi(root), readPackageExports(root));
}

/**
 * The facts of sources the tests write: `files` (name → text, with an
 * `index.ts` that exports what they declare) is compiled to declarations in
 * memory, and those are read the way the built package's are.
 */
export function factsFromSources(root, files) {
  const dir = path.join(root, "packages/react/.ai-facts-fixture");
  const virtual = new Map(
    [...files].map(([name, text]) => [path.join(dir, name), text]),
  );
  const options = {
    ...compilerOptions,
    noEmit: false,
    noUnusedLocals: false,
    declaration: true,
    emitDeclarationOnly: true,
  };
  const program = ts.createProgram({
    rootNames: [...virtual.keys()],
    options,
    host: hostWith(virtual, options),
  });
  const emitted = new Map();
  program.emit(undefined, (file, text) =>
    emitted.set(path.normalize(file), text),
  );
  const declarations = path.join(dir, "index.d.ts");
  if (!emitted.has(declarations))
    throw new Error(
      `the fixture emitted no index.d.ts, only ${[...emitted.keys()].join(", ")}`,
    );
  return factsFromApi(
    root,
    readPublishedApi(root, { declarations, virtual: emitted }),
    new Map(),
  );
}

/**
 * A component's axes, `{ prop: values }`, from its own props and Radix's; or
 * null when it has no facts to give (see unknownsOf).
 */
export function axesOf(facts, name) {
  const component = facts.components.get(name);
  if (!component || component.unknown) return null;
  const axes = {};
  for (const [prop, { origin, accepted }] of component.props)
    if (AXIS_ORIGINS.has(origin) && isAxis(accepted))
      axes[prop] = axisValues(accepted);
  return axes;
}

/**
 * Every fact the checker could not establish, as `Component: why` or
 * `Component.prop: why`. `pnpm skills:check` fails on any: an unknown is a
 * gap in what an assistant is told, to be fixed, not shipped as "none".
 */
export function unknownFacts(facts) {
  const found = [];
  for (const [name, component] of facts.components) {
    if (component.unknown) found.push(`${name}: ${component.unknown}`);
    else
      for (const [prop, { accepted }] of component.props)
        if (accepted.unknown)
          found.push(`${name}.${prop}: ${accepted.unknown}`);
  }
  for (const [name, pkg] of facts.packages)
    if (pkg.unknown) found.push(`${name}: ${pkg.unknown}`);
  return found;
}

/** Why a component's facts, or some of its props', are unknown. */
export function unknownsOf(facts, name) {
  const component = facts.components.get(name);
  if (!component)
    return {
      component: `${name} is not a component the package exports`,
      props: {},
    };
  if (component.unknown) return { component: component.unknown, props: {} };
  return {
    component: null,
    props: Object.fromEntries(
      [...component.props]
        .filter(([, p]) => p.accepted.unknown)
        .map(([prop, p]) => [prop, p.accepted.unknown]),
    ),
  };
}

/**
 * What an axis-like prop accepts, as a reader writes it: `a | b | c`, then
 * what else it takes when that is not only literals.
 */
export function describeAccepted(accepted) {
  const values = axisValues(accepted).map(String);
  const also = [];
  if (accepted.openStrings) also.push("any string");
  if (accepted.openNumbers) also.push("any number");
  also.push(...accepted.others);
  return { values, also };
}

/**
 * The component directories and the component exports each owns, the main
 * one first: the one named like the directory, else the first it declares.
 * A directory that owns none is listed with no parts, which the inventory
 * says rather than hide.
 */
export function componentDirectories(root, facts) {
  const base = path.join(root, COMPONENTS);
  const names = fs
    .readdirSync(base)
    .filter((c) => fs.existsSync(path.join(base, c, `${c}.tsx`)))
    .sort();
  const modules = readModules(root, names).filter(
    (m) => m.kind === "component",
  );
  const { ownedBy } = exportOwners(modules, new Set(facts.api.entries.keys()));
  return modules.map((module) => {
    const parts = ownedBy(module).filter((name) => facts.components.has(name));
    const main = parts.includes(module.name) ? module.name : parts[0];
    return {
      name: module.name,
      main: main ?? null,
      parts: main ? [main, ...parts.filter((p) => p !== main)] : [],
    };
  });
}
