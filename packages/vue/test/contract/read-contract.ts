import fs from "node:fs";
import path from "node:path";
import { camelize, capitalize, type Component } from "vue";
import ts from "typescript";
import {
  describeComponent,
  readPublishedApi,
} from "../../../../scripts/skills/claude-design-api.mjs";
import {
  COMPONENTS,
  defaultsOf,
  exportOwners,
  readModules,
} from "../../../../scripts/skills/claude-design-source.mjs";
import { COMPOSABLES, PORTS, REPOSITORY, VUE_DIST, type Port } from "../ports";

/**
 * The API contract of Vue 3 Phase 0 (P0.4): what each Vue part takes, read
 * from what ships, against what its React part takes, read the way the
 * Claude Design cards read it (`scripts/skills/claude-design-api.mjs`).
 *
 * React's side is its built declarations: the props Kozmos and Radix declare,
 * and `children`. React's DOM attributes, which every element of that kind
 * takes, are not listed: the parity check draws each part with attributes
 * added, and they must land where React's land.
 *
 * How one says the other (`planOf` decides it once, for both the names and
 * the types):
 * - a value prop is a prop of the same name, of the same type (the compiler
 *   decides, `null` and `undefined` aside), required in both or neither, with
 *   the same default;
 * - a controlled prop, one with an `on…Change` (or `value` with Kozmos's own
 *   `onChange`), is a `v-model` (decision 160): Vue emits `update:<prop>` with
 *   what React's callback passes, the new value first (compared position by
 *   position, so a union of callbacks is one event), and no other event for
 *   it. A controlled `value` is `modelValue`, as `v-model` names it; a
 *   `value` nothing controls (a tab's, an item's) keeps its name;
 * - a form field (React's element an input, textarea or select) takes
 *   `v-model` for its `value`, though React's `value` is an attribute, with
 *   Kozmos's own change callback (NumberInput's) as its change if it has
 *   one; a DOM attribute's wide type may be narrowed (`within`);
 * - any other callback `onPress` (a function, as the compiler reads it) is
 *   an event (`press`), declared in camelCase so that Vue's types give its
 *   handler React's name, with the same arguments. A DOM event (`click`)
 *   is not declared: it falls through to the element, as React's does;
 * - `children` is the default slot (not for an input or a textarea, whose
 *   `children` is only React's attribute), and any other prop that takes a
 *   node is a slot of its own name, required alike. Vue's slots are always
 *   typed, so a slot React lacks is seen. A render prop's slot props are a
 *   decision for its port, recorded as an exception;
 * - a DOM attribute Vue reads as a prop (Button's `disabled`) takes the
 *   attribute's type and React's default, if React's parameter list gives one.
 * Vue may take no prop, event or slot React lacks. Whether an event fires is
 * not a matter of types: `coverage.spec.ts` asks each for the spec that
 * fires it.
 */

export interface ReactMember {
  name: string;
  required: boolean;
  /** As the declarations write it. */
  type: string;
  origin: string;
  /** React's default from the part's parameter list, as source text. */
  default: string | null;
  /** A function, as the compiler reads the prop's type. */
  callable: boolean;
  /** A function that returns a node. */
  returnsNode: boolean;
}

export interface VueProp {
  name: string;
  required: boolean;
  /** The `default` the options state; `hasDefault` false when there is none. */
  hasDefault: boolean;
  default: unknown;
  isBoolean: boolean;
}

export interface PortContract {
  port: Port;
  react: ReactMember[];
  /** React's DOM attributes, by name, which Vue forwards to its element. */
  reactAttributes: string[];
  /** The element React's ref reaches (`HTMLInputElement`), or null. */
  reactElement: string | null;
  /** React's parameter-list defaults, DOM attributes' included (`type`). */
  reactDefaults: Map<string, string>;
  vueProps: VueProp[];
  vueEmits: string[];
  /** Vue's slots, or null when its slots are untyped. */
  vueSlots: { name: string; required: boolean }[] | null;
}

/** A failed rule: `id` names it for an exception, `message` says what differs. */
export interface Finding {
  id: string;
  message: string;
}

/** A type's members at its top level: `A | (B | C)[] | D` → A, (B | C)[], D. */
function topLevelMembers(type: string): string[] {
  const members: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < type.length; i++) {
    const c = type[i];
    if ("<([{".includes(c)) depth++;
    else if (">)]}".includes(c) && type[i - 1] !== "=") depth--;
    else if (c === "|" && depth === 0) {
      members.push(type.slice(start, i).trim());
      start = i + 1;
    }
  }
  members.push(type.slice(start).trim());
  return members.filter(Boolean);
}
const NODE_TYPE =
  /^(?:React\.)?(?:ReactNode|ReactElement(?:<.*>)?|ReactPortal)$|^JSX\.Element$/;
/** A callback: `onPress`, a function as the compiler reads it. */
const isCallback = (member: ReactMember) =>
  /^on[A-Z]/.test(member.name) && member.callable;
/**
 * A node: `children`, or a prop that takes one at its top level. A node
 * inside data (`items: { icon: ReactNode }[]`) is data, and compared as a
 * value: a Vue port that takes it otherwise is a decision to record.
 */
export const isNode = (member: ReactMember) =>
  member.name === "children" ||
  topLevelMembers(member.type).some((t) => NODE_TYPE.test(t));
/**
 * A render prop: a function, not a callback, written inline, that returns a
 * node (`renderIcon: (category) => ReactNode`). A component type
 * (Icon's `icon: KozmosIconComponent`) is a value: a Vue port takes a Vue
 * component there, a decision its exception records.
 */
const isRenderProp = (member: ReactMember) =>
  !isCallback(member) &&
  member.returnsNode &&
  topLevelMembers(member.type).some((t) => /=>/.test(t));

/**
 * The handler prop Vue's types give an event: `on` and the name, capitalised
 * and nothing more (`EmitsToProps`). `themeChange` is typed `onThemeChange`,
 * React's spelling; `theme-change` is typed `onTheme-change`, which a render
 * function or TSX cannot write as React's, though templates and the runtime
 * accept either. So an event is declared in camelCase, as Reka's are.
 */
export const handlerOf = (event: string) => `on${capitalize(event)}`;
/** The handler the runtime also finds for a kebab-case event. */
const runtimeHandlerOf = (event: string) => `on${capitalize(camelize(event))}`;
/** Elements whose `value` is a form value, which Vue binds with `v-model`. */
const FORM_FIELD = /^HTML(?:Input|TextArea|Select)Element$/;
/** Elements whose `children` is only React's attribute: they draw none. */
const CHILDLESS = /^HTML(?:Input|TextArea)Element$/;

/** A v-model: React's prop, Vue's name for it, and React's change callback. */
export interface Model {
  react: string;
  vue: string;
  /** React's callback for its change, or null when it is the DOM's. */
  change: string | null;
}

/**
 * How a port's React props are said in Vue, decided once for the names
 * rules and the type checks alike.
 */
export function planOf(contract: PortContract) {
  const own = new Map(contract.react.map((m) => [m.name, m]));
  const callbackOwn = (name: string) => {
    const member = own.get(name);
    return !!member && isCallback(member);
  };
  const models = new Map<string, Model>();
  for (const member of contract.react) {
    if (isCallback(member) || isNode(member) || isRenderProp(member)) continue;
    const change =
      [`on${capitalize(member.name)}Change`].find(callbackOwn) ??
      (member.name === "value" && callbackOwn("onChange") ? "onChange" : null);
    if (change)
      models.set(member.name, {
        react: member.name,
        vue: member.name === "value" ? "modelValue" : member.name,
        change,
      });
  }
  // A form field's value is an attribute in React, and v-model in Vue; its
  // change is Kozmos's own callback when it has one (NumberInput's
  // onValueChange), else the DOM's.
  if (
    !own.has("value") &&
    contract.reactElement !== null &&
    FORM_FIELD.test(contract.reactElement) &&
    contract.reactAttributes.includes("value")
  )
    models.set("value", {
      react: "value",
      vue: "modelValue",
      change: ["onValueChange", "onChange"].find(callbackOwn) ?? null,
    });
  const changes = new Set(
    [...models.values()].map((m) => m.change).filter(Boolean),
  );
  return {
    models,
    /** React's callbacks that are not a model's change. */
    callbacks: contract.react.filter(
      (m) => isCallback(m) && !changes.has(m.name),
    ),
    /** React's change callbacks, by name, with their model. */
    changes: new Map(
      [...models.values()].filter((m) => m.change).map((m) => [m.change!, m]),
    ),
    // A kebab-case prop React's part declares itself (TooltipContent's own
    // `aria-label`) is camelCase in Vue's props, as Vue normalises it; a DOM
    // attribute (`aria-describedby`, `data-*`) stays as it is written.
    vueName: (react: string) =>
      models.get(react)?.vue ?? (own.has(react) ? camelize(react) : react),
    reactName: (vue: string) =>
      [...models.values()].find((m) => m.vue === vue)?.react ??
      [...own.keys()].find((name) => camelize(name) === vue) ??
      vue,
  };
}

/**
 * React's defaults, from each part's parameter list, by the module that
 * declares it. Only the parameter list's: a cva recipe's defaultVariants are
 * the shared recipe's, drawn by both and compared by the parity check. Every
 * default is read, however long: one left out would read as none.
 */
function reactDefaultsReader(api: { entries: Map<string, unknown> }) {
  const componentNames = fs
    .readdirSync(path.join(REPOSITORY, COMPONENTS))
    .filter((dir: string) =>
      fs.existsSync(path.join(REPOSITORY, COMPONENTS, dir, `${dir}.tsx`)),
    );
  const { declarer } = exportOwners(
    readModules(REPOSITORY, componentNames),
    new Set(api.entries.keys()),
  );
  return (name: string): Map<string, string> => {
    const module = declarer.get(name);
    return module
      ? defaultsOf(module, name, null, { maxLength: Infinity })
      : new Map();
  };
}

/** React's side of a port's contract. */
export type ReactSide = Pick<
  PortContract,
  "react" | "reactAttributes" | "reactElement" | "reactDefaults"
>;

let readSides: ((name: string) => ReactSide) | undefined;
/** What React's part takes, as the contract reads it, by export name; read once per run. */
export function reactSides(): (name: string) => ReactSide {
  if (readSides) return readSides;
  const api = readPublishedApi(REPOSITORY);
  const reactDefaults = reactDefaultsReader(api);
  const checker = api.checker as ts.TypeChecker;
  /** Whether a prop is a function, and one that returns a node, as the compiler reads it. */
  const signature = (node: ts.Node | null, type: string) => {
    if (!node)
      return {
        callable: /=>/.test(type),
        returnsNode: topLevelMembers(type).some((t) =>
          /=>\s*(?:React\.)?(?:ReactNode|ReactElement|JSX\.Element)/.test(t),
        ),
      };
    const signatures = checker
      .getNonNullableType(checker.getTypeAtLocation(node))
      .getCallSignatures();
    return {
      callable: signatures.length > 0,
      returnsNode: signatures.some((s) =>
        /\b(?:ReactNode|ReactElement|JSX\.Element|ReactPortal)\b/.test(
          checker.typeToString(s.getReturnType()),
        ),
      ),
    };
  };
  const read = (name: string): ReactSide => {
    const defaults = reactDefaults(name);
    const described = describeComponent(api, name, defaults);
    const element: string | null = described.ref ?? null;
    // Kozmos's and Radix's props, and `children`: what the card lists. An
    // input's or a textarea's `children` is only React's attribute.
    const react: ReactMember[] = described.props
      .filter(
        (p: { name: string; origin: string }) =>
          !(
            p.name === "children" &&
            p.origin === "react" &&
            element &&
            CHILDLESS.test(element)
          ),
      )
      .map(
        (
          p: Omit<ReactMember, "callable" | "returnsNode"> & {
            node: ts.Node | null;
          },
        ) => ({
          name: p.name,
          required: p.required,
          type: p.type,
          origin: p.origin,
          default: p.default,
          ...signature(p.node, p.type),
        }),
      );
    return {
      react,
      reactAttributes: described.summarised.react as string[],
      reactElement: element,
      reactDefaults: defaults,
    };
  };
  readSides = read;
  return read;
}

/**
 * What each port takes, in React (its declarations and parameter lists) and
 * in Vue (its options, and its declarations for slots), with every type the
 * contract compares already decided by the compiler.
 */
export function readContract(
  vueExports: Record<string, unknown>,
  ports: Port[] = PORTS,
): {
  contracts: PortContract[];
  typeFindings: Finding[];
  composableFindings: Finding[];
} {
  const side = reactSides();
  const contracts = ports.map((port): PortContract => {
    const { react, reactAttributes, reactElement, reactDefaults } = side(
      port.react,
    );
    const component = vueExports[port.vue] as Component & {
      props?: Record<string, unknown> | string[];
      emits?: string[] | Record<string, unknown>;
    };
    if (!component) throw new Error(`@kozmos-ds/vue exports no ${port.vue}`);
    // Array props (`props: ["a"]`) name a prop with no options.
    const declared = Array.isArray(component.props)
      ? Object.fromEntries(component.props.map((name: string) => [name, {}]))
      : (component.props ?? {});
    const vueProps = Object.entries(declared).map(([name, raw]): VueProp => {
      const options =
        typeof raw === "function" || Array.isArray(raw)
          ? { type: raw }
          : ((raw ?? {}) as Record<string, unknown>);
      const types = [options.type].flat();
      const hasDefault = Object.prototype.hasOwnProperty.call(
        options,
        "default",
      );
      // A factory makes an Object or Array default; a Function prop's
      // default is the function itself.
      const value =
        typeof options.default === "function" && !types.includes(Function)
          ? (options.default as () => unknown)()
          : options.default;
      return {
        name,
        required: options.required === true,
        hasDefault,
        default: value,
        isBoolean: types.includes(Boolean),
      };
    });
    const vueEmits = Array.isArray(component.emits)
      ? component.emits
      : Object.keys(component.emits ?? {});
    return {
      port,
      react,
      reactAttributes,
      reactElement,
      reactDefaults,
      vueProps,
      vueEmits,
      vueSlots: null,
    };
  });
  const types = compareTypes(contracts);
  contracts.forEach((contract, n) => {
    contract.vueSlots = types.vueSlots[n];
  });
  return {
    contracts,
    typeFindings: types.findings,
    composableFindings: types.composableFindings,
  };
}

/* ----------------------------------------------------------------------- */
/* Types, decided by the compiler                                          */
/* ----------------------------------------------------------------------- */

const CONTRACT_FILE = path.join(__dirname, "__contract__.ts");

interface TypeCheck {
  id: string;
  /** The two sides, as type expressions over V_<n> and R_<n>. */
  vue: string;
  react: string;
  /**
   * `equal` (the default), or `within`: Vue's may be narrower than React's,
   * for a DOM attribute's wide type (`value: string | number | readonly
   * string[]`) a Vue port narrows to what its element takes.
   */
  relation?: "equal" | "within";
}

const compilerOptions: ts.CompilerOptions = {
  strict: true,
  noEmit: true,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  target: ts.ScriptTarget.ES2022,
  lib: ["lib.es2022.d.ts", "lib.dom.d.ts"],
  skipLibCheck: true,
  types: [],
};

function program(text: string) {
  const host = ts.createCompilerHost(compilerOptions, true);
  const { readFile, fileExists, getSourceFile } = host;
  host.fileExists = (file) =>
    file === CONTRACT_FILE || fileExists.call(host, file);
  host.readFile = (file) =>
    file === CONTRACT_FILE ? text : readFile.call(host, file);
  host.getSourceFile = (file, language, onError, create) =>
    file === CONTRACT_FILE
      ? ts.createSourceFile(file, text, language, true, ts.ScriptKind.TS)
      : getSourceFile.call(host, file, language, onError, create);
  return ts.createProgram({
    rootNames: [CONTRACT_FILE],
    options: compilerOptions,
    host,
  });
}

const VUE_ENTRY = path
  .relative(path.dirname(CONTRACT_FILE), path.join(VUE_DIST, "index"))
  .split(path.sep)
  .join("/");

// `PropOf` reads a prop of a union of props (Accordion's single or multiple)
// from every member that has it; `NotRefs` names a composable's values that
// are neither refs nor functions.
const IMPORTS = `
import type { ComponentProps } from "react";
import type { Ref, UnwrapRef } from "vue";
import type * as R from "@kozmos-ds/react";
import type * as V from "${VUE_ENTRY}";
`;

/** The helper types every comparison is written in, needing no import. */
const HELPERS = `
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type VueProps<C> = C extends abstract new (...args: any) => { $props: infer P } ? P : never;
type VueSlots<C> = C extends abstract new (...args: any) => { $slots: infer S } ? S : never;
type PropOf<P, K extends PropertyKey> = P extends unknown ? (K extends keyof P ? P[K] : never) : never;
type Payload<F> = F extends (...args: infer A) => any ? A : never;
type Extends<A, B> = [A] extends [B] ? true : false;
// Arguments compared position by position: a union of callbacks (Accordion's
// single or multiple onValueChange) passes [string] | [string[]], which one
// Vue event says as [string | string[]].
type Len<T> = T extends readonly unknown[] ? T["length"] : never;
type At<T, I extends number> = T extends readonly unknown[] ? (I extends keyof T ? T[I] : never) : never;
type Args<T> = [Len<T>, At<T, 0>, At<T, 1>, At<T, 2>, At<T, 3>];
`;

/** The helpers a composable's comparison needs, which read Vue's refs. */
const VUE_HELPERS = `
type Unwrapped<T> = { [K in keyof T]: UnwrapRef<T[K]> };
type NotRefs<T> = { [K in keyof T]: T[K] extends Ref<any> | ((...args: any) => any) ? never : K }[keyof T];
`;

const PRELUDE = IMPORTS + HELPERS + VUE_HELPERS;

/**
 * Whether each pair of types agrees as a check would decide (`equal`, or
 * Vue's `within` React's), written in the helper types: how the helpers
 * themselves are held (rules.spec.ts). One program for every pair, over the
 * helpers alone, so it costs a compile without React's or Vue's types.
 */
export function typesAgree(
  pairs: { vue: string; react: string; relation?: "equal" | "within" }[],
): boolean[] {
  const lines = pairs.map(
    ({ vue, react, relation }, i) =>
      `export const agrees_${i}: ${relation === "within" ? "Extends" : "Equal"}<${vue}, ${react}> = true;`,
  );
  const built = program(`${HELPERS}\n${lines.join("\n")}\n`);
  const source = built.getSourceFile(CONTRACT_FILE)!;
  const failed = new Set<number>();
  for (const diagnostic of ts.getPreEmitDiagnostics(built, source)) {
    const at = diagnostic.start ?? -1;
    const statement = source.statements.find(
      (s) => s.getStart() <= at && at < s.getEnd(),
    );
    const name =
      statement && ts.isVariableStatement(statement)
        ? statement.declarationList.declarations[0].name.getText()
        : "";
    const match = name.match(/^agrees_(\d+)$/);
    // An error outside the pairs is a broken helper: no pair agrees then.
    if (!match) return pairs.map(() => false);
    failed.add(Number(match[1]));
  }
  return pairs.map((_, i) => !failed.has(i));
}

const key = (name: string) => JSON.stringify(name);

/**
 * Reads Vue's slot names from its declarations, and decides every type the
 * contract compares: each pair is an `Equal<…>` the compiler must accept.
 * Only what both sides have is compared; a missing one is the names rules'
 * finding, and an Equal over a missing key would not compile.
 */
function compareTypes(contracts: PortContract[]): {
  findings: Finding[];
  vueSlots: ({ name: string; required: boolean }[] | null)[];
  composableFindings: Finding[];
} {
  const checks: TypeCheck[] = [];
  const declarations: string[] = [];
  contracts.forEach((contract, n) => {
    const { port } = contract;
    declarations.push(
      `export type R_${n} = ComponentProps<typeof R.${port.react}>;`,
      `export type V_${n} = VueProps<typeof V.${port.vue}>;`,
      `export type S_${n} = VueSlots<typeof V.${port.vue}>;`,
    );
    const plan = planOf(contract);
    const handlers = new Set(contract.vueEmits.map(handlerOf));
    const react = (name: string) => `NonNullable<PropOf<R_${n}, ${key(name)}>>`;
    const vue = (name: string) => `NonNullable<V_${n}[${key(name)}]>`;
    const payload = (handler: string) =>
      `Payload<NonNullable<V_${n}[${key(handler)}]>>`;
    // Every prop Vue has under a React name: React's own, and the DOM
    // attributes Vue reads as props (Button's `disabled`, a field's `value`).
    const reactNames = new Set([
      ...contract.react.map((m) => m.name),
      ...contract.reactAttributes,
    ]);
    const own = new Set(contract.react.map((m) => m.name));
    for (const member of plan.callbacks)
      if (handlers.has(member.name))
        checks.push({
          id: `${port.vue}.${member.name}:payload`,
          vue: `Args<${payload(member.name)}>`,
          react: `Args<Payload<${react(member.name)}>>`,
        });
    for (const prop of contract.vueProps) {
      const reactName = plan.reactName(prop.name);
      if (!reactNames.has(reactName)) continue;
      checks.push({
        id: `${port.vue}.${prop.name}:type`,
        vue: vue(prop.name),
        react: react(reactName),
        // Kozmos's and Radix's own types are matched; a DOM attribute's may
        // be narrowed.
        relation: own.has(reactName) ? "equal" : "within",
      });
    }
    // update:<prop> carries what React's change callback passes, the new
    // value first (Combobox's passes the option too); a form field's, the
    // value.
    for (const model of plan.models.values()) {
      const handler = handlerOf(`update:${model.vue}`);
      if (!handlers.has(handler)) continue;
      checks.push(
        model.change
          ? {
              id: `${port.vue}.update:${model.vue}:payload`,
              vue: `Args<${payload(handler)}>`,
              react: `Args<Payload<${react(model.change)}>>`,
            }
          : {
              // The DOM's change: what the field reports, within what it takes.
              id: `${port.vue}.update:${model.vue}:payload`,
              vue: payload(handler),
              react: `[${react(model.react)}]`,
              relation: "within",
            },
      );
    }
  });
  const composableChecks: TypeCheck[] = [];
  COMPOSABLES.forEach((pair, n) => {
    declarations.push(
      `export type RH_${n} = ReturnType<typeof R.${pair.react}>;`,
      `export type VR_${n} = ReturnType<typeof V.${pair.vue}>;`,
      `export type VH_${n} = Unwrapped<VR_${n}>;`,
    );
    composableChecks.push(
      { id: `${pair.vue}:keys`, vue: `keyof VH_${n}`, react: `keyof RH_${n}` },
      { id: `${pair.vue}:values`, vue: `VH_${n}`, react: `RH_${n}` },
      // A value React re-reads on each render is a ref in Vue, so it follows.
      { id: `${pair.vue}:refs`, vue: `NotRefs<VR_${n}>`, react: `never` },
    );
  });
  const all = [...checks, ...composableChecks];
  const lines = all.map(
    (check, i) =>
      `export type L_${i} = ${check.vue};\nexport type Rt_${i} = ${check.react};\nexport const check_${i}: ${check.relation === "within" ? "Extends" : "Equal"}<L_${i}, Rt_${i}> = true;`,
  );
  const text = [PRELUDE, ...declarations, ...lines].join("\n");
  const built = program(text);
  const checker = built.getTypeChecker();
  const source = built.getSourceFile(CONTRACT_FILE)!;
  const diagnostics = ts.getPreEmitDiagnostics(built, source);
  const aliases = new Map<string, ts.TypeAliasDeclaration>();
  const failed = new Set<number>();
  const other: string[] = [];
  for (const statement of source.statements)
    if (ts.isTypeAliasDeclaration(statement))
      aliases.set(statement.name.text, statement);
  for (const diagnostic of diagnostics) {
    const at = diagnostic.start ?? -1;
    const statement = source.statements.find(
      (s) => s.getStart() <= at && at < s.getEnd(),
    );
    const name =
      statement && ts.isVariableStatement(statement)
        ? statement.declarationList.declarations[0].name.getText()
        : null;
    const match = name?.match(/^check_(\d+)$/);
    if (match) failed.add(Number(match[1]));
    else
      other.push(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
  }
  if (other.length)
    throw new Error(
      `The contract's types do not compile:\n${other.join("\n")}`,
    );
  const shown = (alias: string) =>
    checker.typeToString(
      checker.getTypeAtLocation(aliases.get(alias)!.name),
      undefined,
      ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.InTypeAlias,
    );
  // Either side read as any compares equal to anything: that is no check.
  for (const [i, check] of all.entries())
    for (const alias of [`L_${i}`, `Rt_${i}`])
      if (
        checker.getTypeAtLocation(aliases.get(alias)!.name).flags &
        ts.TypeFlags.Any
      )
        throw new Error(`${check.id}: ${alias} reads as any`);
  const toFinding = (check: TypeCheck, i: number): Finding => ({
    id: check.id,
    message: `${check.id}: Vue's \`${shown(`L_${i}`)}\` is not ${check.relation === "within" ? "within " : ""}React's \`${shown(`Rt_${i}`)}\``,
  });
  const findings = checks
    .map((check, i) => (failed.has(i) ? toFinding(check, i) : null))
    .filter((f): f is Finding => f !== null);
  const composableFindings = composableChecks
    .map((check, j) =>
      failed.has(checks.length + j)
        ? toFinding(check, checks.length + j)
        : null,
    )
    .filter((f): f is Finding => f !== null);
  const vueSlots = contracts.map((_, n) => {
    const type = checker.getTypeAtLocation(aliases.get(`S_${n}`)!.name);
    if (checker.getIndexInfosOfType(type).length) return null;
    return checker.getPropertiesOfType(type).map((p) => ({
      name: p.name,
      required: !(p.flags & ts.SymbolFlags.Optional),
    }));
  });
  return { findings, vueSlots, composableFindings };
}

/* ----------------------------------------------------------------------- */
/* Names, required and defaults                                            */
/* ----------------------------------------------------------------------- */

/** React's default as a value, or the text when it is not a literal. */
function reactDefault(
  text: string | null,
): { value: unknown } | { unreadable: string } {
  if (text === null || text === "undefined") return { value: undefined };
  try {
    return { value: JSON.parse(text.replace(/^'(.*)'$/, '"$1"')) };
  } catch {
    return { unreadable: text };
  }
}

/** Two defaults are the same value: a function is never React's literal. */
function sameDefault(vue: unknown, react: unknown) {
  if (Object.is(vue, react)) return true;
  if (typeof vue === "function" || typeof react === "function") return false;
  if (vue === undefined || react === undefined) return false;
  return JSON.stringify(vue) === JSON.stringify(react);
}

const shownDefault = (value: unknown) =>
  typeof value === "function"
    ? "a function"
    : (JSON.stringify(value) ?? "undefined");

/** Every rule but the types, for one port. */
export function compareMembers(contract: PortContract): Finding[] {
  const { port, react, vueProps, vueEmits, vueSlots } = contract;
  const plan = planOf(contract);
  const findings: Finding[] = [];
  const add = (id: string, message: string) =>
    findings.push({
      id: `${port.vue}.${id}`,
      message: `${port.vue}.${message}`,
    });
  const props = new Map(vueProps.map((p) => [p.name, p]));
  const handlers = new Set(vueEmits.map(handlerOf));
  const eventOf = (handler: string) =>
    vueEmits.find((event) => handlerOf(event) === handler);
  const usedProps = new Set<string>();
  const usedHandlers = new Set<string>();
  const usedSlots = new Set<string>();

  if (vueSlots === null)
    add(
      "slots",
      "slots: untyped, so the contract cannot see which slots it takes; declare them with SlotsType (`SlotsType<{}>` for none)",
    );

  /** A prop React takes, under the name Vue gives it, compared. */
  const valueProp = (reactName: string, member: ReactMember | null) => {
    const name = plan.vueName(reactName);
    usedProps.add(name);
    const prop = props.get(name);
    if (!prop) {
      add(`${name}:prop`, `${name}: no prop, for React's \`${reactName}\``);
      return;
    }
    const required = member?.required ?? false;
    if (prop.required !== required)
      add(
        `${name}:required`,
        `${name}: ${prop.required ? "required" : "optional"} in Vue, ${required ? "required" : "optional"} in React`,
      );
    const expected = reactDefault(
      member?.default ?? contract.reactDefaults.get(reactName) ?? null,
    );
    if ("unreadable" in expected)
      add(
        `${name}:default`,
        `${name}: React's default \`${expected.unreadable}\` is not a literal the contract can read; state it as an exception`,
      );
    else if (!sameDefault(prop.default, expected.value))
      add(
        `${name}:default`,
        `${name}: defaults to ${shownDefault(prop.default)} in Vue, ${shownDefault(expected.value)} in React`,
      );
  };

  for (const member of react) {
    if (isNode(member) || isRenderProp(member)) {
      const slot = member.name === "children" ? "default" : member.name;
      usedSlots.add(slot);
      if (isRenderProp(member))
        // What the slot's props are is the port's decision: React's render
        // prop passes arguments, a Vue slot one props object.
        add(
          `${slot}:render-prop`,
          `${slot}: React's \`${member.name}\` is a render prop (\`${member.type}\`); its slot's props are not compared, so record what they are as an exception`,
        );
      if (vueSlots === null) continue; // reported once, above
      const found = vueSlots.find((s) => s.name === slot);
      if (!found)
        add(`${slot}:slot`, `${slot}: no slot, for React's \`${member.name}\``);
      else if (found.required !== member.required)
        add(
          `${slot}:required`,
          `${slot}: the slot is ${found.required ? "required" : "optional"} in Vue, React's \`${member.name}\` ${member.required ? "required" : "optional"}`,
        );
      continue;
    }
    if (isCallback(member)) {
      const model = plan.changes.get(member.name);
      if (model) {
        // A model's change is `update:<prop>` alone (decision 160).
        const twice = eventOf(member.name);
        if (twice) {
          usedHandlers.add(member.name);
          add(
            `${twice}:duplicate-event`,
            `${twice}: says what \`update:${model.vue}\` says; a controlled prop's change is \`update:${model.vue}\` alone (decision 160)`,
          );
        }
        continue;
      }
      usedHandlers.add(member.name);
      if (handlers.has(member.name)) continue;
      const kebab = vueEmits.find(
        (event) =>
          event !== camelize(event) && runtimeHandlerOf(event) === member.name,
      );
      add(
        `${member.name}:event`,
        kebab
          ? `${member.name}: the event is declared \`${kebab}\`, which Vue types as \`${handlerOf(kebab)}\`; declare \`${camelize(kebab)}\`, so its handler is React's \`${member.name}\``
          : `${member.name}: no event, for React's \`${member.name}\``,
      );
      if (kebab) usedHandlers.add(handlerOf(kebab));
      continue;
    }
    if (plan.models.has(member.name)) continue; // below, with its event
    valueProp(member.name, member);
  }

  // Each v-model: its prop, and `update:<prop>`.
  for (const model of plan.models.values()) {
    valueProp(model.react, react.find((m) => m.name === model.react) ?? null);
    const update = handlerOf(`update:${model.vue}`);
    usedHandlers.add(update);
    if (!handlers.has(update))
      add(
        `update:${model.vue}:event`,
        `update:${model.vue}: no event, so \`v-model${model.vue === "modelValue" ? "" : `:${model.vue}`}\` cannot control React's \`${model.react}\``,
      );
  }

  for (const prop of vueProps) {
    if (prop.isBoolean && !prop.hasDefault)
      add(
        `${prop.name}:boolean`,
        `${prop.name}: a Boolean prop with no \`default\`, which Vue reads as false when it is left out; React reads undefined. State the default.`,
      );
    if (usedProps.has(prop.name)) continue;
    const reactName = plan.reactName(prop.name);
    if (contract.reactAttributes.includes(reactName)) {
      // A DOM attribute Vue reads as a prop: React's default, if its
      // parameter list gives one (`type = "button"`), else the element's.
      const expected = reactDefault(
        contract.reactDefaults.get(reactName) ?? null,
      );
      if ("unreadable" in expected)
        add(
          `${prop.name}:default`,
          `${prop.name}: React's default \`${expected.unreadable}\` is not a literal the contract can read; state it as an exception`,
        );
      else if (!sameDefault(prop.default, expected.value))
        add(
          `${prop.name}:default`,
          `${prop.name}: defaults to ${shownDefault(prop.default)} in Vue, ${shownDefault(expected.value)} for React's \`${reactName}\``,
        );
      if (prop.required)
        add(
          `${prop.name}:required`,
          `${prop.name}: required in Vue; React's \`${reactName}\` is an optional attribute`,
        );
      continue;
    }
    add(
      `${prop.name}:extra-prop`,
      `${prop.name}: a prop React's ${port.react} does not take`,
    );
  }
  for (const event of vueEmits) {
    const handler = handlerOf(event);
    if (usedHandlers.has(handler)) continue;
    if (contract.reactAttributes.includes(handler))
      add(
        `${event}:dom-event`,
        `${event}: a DOM event declared as the part's own; left undeclared it reaches the element as React's \`${handler}\` does, and a declared one does not`,
      );
    else
      add(
        `${event}:extra-event`,
        `${event}: an event React's ${port.react} has no callback for`,
      );
  }
  for (const { name: slot } of vueSlots ?? [])
    if (!usedSlots.has(slot))
      add(
        `${slot}:extra-slot`,
        `${slot}: a slot React's ${port.react} takes no node for`,
      );
  return findings;
}
