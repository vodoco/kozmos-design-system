/**
 * Starts a Vue port of a React part (PORTING.md, step 2):
 *
 *   pnpm --filter @kozmos-ds/vue port <Name>            writes the skeleton
 *   pnpm --filter @kozmos-ds/vue port <Name> --dry-run  prints what it would write
 *
 * `<Name>` is React's export (`Badge`). It reads what React's part takes
 * from @kozmos-ds/react's built declarations, through the API contract's own
 * reader (`test/contract/read-contract.ts`), so the skeleton's props, events,
 * `v-model`s and slots are named as the contract names them; and it reads
 * React's stories through the parity check's reader. It writes:
 *
 * - `src/components/<Name>/<Name>.ts`: the part, its API declared and its
 *   drawing left to the porter (`TODO(port)`);
 * - `src/components/<Name>/<Name>.stories.ts`: React's args stories, with the
 *   same names and args, under `Vue/<React's title>`;
 * - its export in `src/index.ts`, and its entry in `test/ports.ts`;
 * - `test/parity/<name>.parity.spec.ts` when React has a story the parity
 *   check cannot draw from its args, or an event to see fire: a test per
 *   story or event that fails until the porter draws it in both.
 *
 * It refuses a part that is already native, a name React does not export,
 * and any file that already exists: it never overwrites. Build React first
 * (`pnpm --filter "@kozmos-ds/react..." build`): it reads React's `dist`.
 */
import fs from "node:fs";
import path from "node:path";
import prettier from "prettier";
import { camelize } from "vue";
import {
  isNode,
  planOf,
  reactSides,
  type ReactMember,
} from "../test/contract/read-contract";
import { readStoryArgs, type StoryCase } from "../test/parity/story-args";

const PACKAGE = path.resolve(__dirname, "..");
const REPOSITORY = path.resolve(PACKAGE, "../..");
const REACT_SOURCE = path.join(REPOSITORY, "packages/react/src");

/** The tag React's ref reaches, by its element type. */
const TAGS: Record<string, string> = {
  HTMLAnchorElement: "a",
  HTMLButtonElement: "button",
  HTMLDivElement: "div",
  HTMLHeadingElement: "h2",
  HTMLImageElement: "img",
  HTMLInputElement: "input",
  HTMLLabelElement: "label",
  HTMLLIElement: "li",
  HTMLNavElement: "nav",
  HTMLOListElement: "ol",
  HTMLParagraphElement: "p",
  HTMLSelectElement: "select",
  HTMLSpanElement: "span",
  HTMLTableElement: "table",
  HTMLTextAreaElement: "textarea",
  HTMLUListElement: "ul",
};

export interface PortFile {
  /** Relative to the package. */
  file: string;
  /** The whole file, for a new one; for an existing one, what it becomes. */
  content: string;
  /** Whether the file exists and is edited, rather than created. */
  edit: boolean;
}

export interface PortPlan {
  react: string;
  vue: string;
  files: PortFile[];
  /** What the porter does by hand, in PORTING.md's order. */
  next: string[];
}

export class PortRefusal extends Error {}

/** The members of a type at its top level, without null and undefined. */
function members(type: string): string[] {
  const found: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < type.length; i++) {
    const c = type[i];
    if ("<([{".includes(c)) depth++;
    else if (">)]}".includes(c) && type[i - 1] !== "=") depth--;
    else if (c === "|" && depth === 0) {
      found.push(type.slice(start, i).trim());
      start = i + 1;
    }
  }
  found.push(type.slice(start).trim());
  return found.filter((t) => t && t !== "null" && t !== "undefined");
}

/**
 * A Vue prop's options for a React value member: its runtime type, its
 * PropType when that says more, and React's default when it is a literal.
 * A type the skeleton cannot say is `unknown` and marked TODO.
 */
function propOptions(member: ReactMember): { text: string; todo: boolean } {
  const types = members(member.type);
  const literal = (t: string) => /^(["']).*\1$/.test(t);
  let runtime: string;
  let propType: string | null = null;
  let todo = false;
  if (
    types.length &&
    types.every((t) => t === "boolean" || t === "true" || t === "false")
  )
    runtime = "Boolean";
  else if (types.every((t) => t === "string" || literal(t))) {
    runtime = "String";
    if (types.some(literal)) propType = types.join(" | ");
  } else if (types.every((t) => t === "number" || /^-?\d/.test(t))) {
    runtime = "Number";
    if (types.some((t) => t !== "number")) propType = types.join(" | ");
  } else if (
    types.length &&
    types.every((t) =>
      ["boolean", "true", "false", "string", "number"].includes(t),
    )
  ) {
    // Boolean first, so a bare attribute is true, as React's `true`.
    const order = ["Boolean", "String", "Number"].filter((c) =>
      types.some((t) =>
        c === "Boolean"
          ? ["boolean", "true", "false"].includes(t)
          : t === c.toLowerCase(),
      ),
    );
    runtime = `[${order.join(", ")}]`;
    propType = [
      ...new Set(
        types.map((t) => (t === "true" || t === "false" ? "boolean" : t)),
      ),
    ].join(" | ");
  } else {
    runtime = "null as unknown";
    propType = "unknown";
    todo = true;
  }
  const fallback = member.default;
  const isLiteral =
    fallback !== null &&
    /^(?:true|false|-?\d+(?:\.\d+)?|(["'`])[^"'`]*\1)$/.test(fallback);
  const parts = [
    `type: ${propType ? `${runtime} as PropType<${propType}>` : runtime}`,
  ];
  if (member.required) parts.push("required: true");
  else
    parts.push(
      `default: ${isLiteral ? fallback!.replace(/^'(.*)'$/, '"$1"') : "undefined"}`,
    );
  if (fallback !== null && !isLiteral) todo = true;
  const comment = todo
    ? ` // TODO(port): React's type is ${member.type}${fallback ? `, its default ${fallback}` : ""}`
    : "";
  return { text: `{ ${parts.join(", ")} },${comment}`, todo };
}

/**
 * An event's validator parameters from React's callback type, when it is a
 * plain arrow of named parameters whose types say nothing of React
 * (\`(open: boolean) => void\` is \`_open: boolean\`); otherwise null, and the
 * porter writes them.
 */
function validatorParams(type: string): string | null {
  const arrow = type
    .replace(/\s*\|\s*undefined$/, "")
    .match(/^\(\((.*)\) => void\)$|^\((.*)\) => void$/);
  if (!arrow) return null;
  const list = (arrow[1] ?? arrow[2]).trim();
  if (!list) return "";
  if (/React|=>|[<{]/.test(list)) return null;
  const params =
    members(list.replace(/,/g, "|")).length &&
    list.split(/,(?![^<([{]*[>)\]}])/);
  if (!params) return null;
  const out: string[] = [];
  for (const param of params) {
    const match = param.trim().match(/^([A-Za-z_$][\w$]*)(\??):\s*(.+)$/);
    // Only types that need no import: primitives, literals, their arrays.
    if (
      !match ||
      !/^(?:boolean|string|number|null|undefined|"[^"]*"|'[^']*'|readonly|\[\]|\||\s)+$/.test(
        match[3].trim(),
      )
    )
      return null;
    out.push(`_${match[1]}${match[2]}: ${match[3].trim()}`);
  }
  return out.join(", ");
}

/** The Vue browser suites' story register, relative to the package. */
const REGISTER = "../../scripts/vue/coverage.mjs";

/** A title's or a story name's part of a Storybook id, as Storybook writes it. */
const storyId = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const kebab = (name: string) =>
  name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

/**
 * A story's export name as Storybook writes it in the story's id, which
 * splits words as lodash's startCase does: `InAHint` is `in-a-hint`, a
 * capital before a capitalised word its own word (Kbd's InAHint was
 * registered `in-ahint`, which no built story is).
 */
export const storyNameId = (name: string) =>
  storyId(
    name
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2"),
  );

/** React's stories file for a part, relative to its source, or null. */
function storiesFile(react: string): string | null {
  const file = `components/${react}/${react}.stories.tsx`;
  return fs.existsSync(path.join(REACT_SOURCE, file)) ? file : null;
}

function storiesTitle(file: string | null, react: string): string {
  if (!file) return `Vue/Core/${react}`;
  const source = fs.readFileSync(path.join(REACT_SOURCE, file), "utf8");
  const title = source.match(/\btitle:\s*["'`]([^"'`]+)["'`]/)?.[1];
  return `Vue/${title ?? `Core/${react}`}`;
}

/** Plans a port; `root` is the package to write into (tests pass a copy). */
export function planPort(react: string, root = PACKAGE): PortPlan {
  if (!/^[A-Z][A-Za-z0-9]*$/.test(react))
    throw new PortRefusal(
      `"${react}" is not a React export's name: give it as React exports it (Badge).`,
    );
  const vue = `Kozmos${react}`;
  const index = fs.readFileSync(path.join(root, "src/index.ts"), "utf8");
  if (new RegExp(`\\b${vue}\\b`).test(index))
    throw new PortRefusal(
      `${vue} is already native: src/index.ts exports it. Change its port by hand.`,
    );
  const ports = fs.readFileSync(path.join(root, "test/ports.ts"), "utf8");
  const register = fs.readFileSync(path.join(root, REGISTER), "utf8");
  if (ports.includes(`vue: "${vue}"`))
    throw new PortRefusal(`${vue} is already in test/ports.ts.`);

  const missing = new PortRefusal(
    `@kozmos-ds/react's built declarations have no part ${react}: build React, and give React's export name.`,
  );
  let side: ReturnType<ReturnType<typeof reactSides>>;
  try {
    side = reactSides()(react);
  } catch {
    throw missing;
  }
  if (!side.react.length && !side.reactElement) throw missing;
  const contract = {
    port: { vue, react, stories: null },
    vueProps: [],
    vueEmits: [],
    vueSlots: [],
    ...side,
  };
  const plan = planOf(contract);
  const stories = storiesFile(react);
  const title = storiesTitle(stories, react);
  const read = stories
    ? readStoryArgs(path.join(REACT_SOURCE, stories))
    : { stories: [] as StoryCase[], rendered: [] as string[] };
  const drawable = read.stories.filter((s) => !s.unread.length);
  const elsewhere = [
    ...read.rendered,
    ...read.stories.filter((s) => s.unread.length).map((s) => s.name),
  ];
  const spec = `parity/${kebab(react)}.parity.spec.ts`;

  // The API, as the contract says it.
  const nodes = side.react.filter(isNode);
  const models = [...plan.models.values()];
  const changes = new Set(models.map((m) => m.change));
  const values = side.react.filter(
    (m) =>
      !isNode(m) &&
      !plan.callbacks.includes(m) &&
      !changes.has(m.name) &&
      !(/^on[A-Z]/.test(m.name) && m.callable),
  );
  const typeOf = (name: string | null) =>
    side.react.find((m) => m.name === name)?.type;
  const events = [
    ...models.map((m) => ({
      name: `update:${m.vue}`,
      from: m.change ?? "the DOM's change",
      type: typeOf(m.change),
    })),
    ...plan.callbacks.map((m) => ({
      name: camelize(
        m.name.replace(/^on/, "").replace(/^./, (c) => c.toLowerCase()),
      ),
      from: m.name,
      type: m.type,
    })),
  ];
  const tag = (side.reactElement && TAGS[side.reactElement]) ?? "div";

  const propLines = values.map((m) => {
    const { text } = propOptions(m);
    return `    ${/^[A-Za-z_$][\w$]*$/.test(plan.vueName(m.name)) ? plan.vueName(m.name) : JSON.stringify(plan.vueName(m.name))}: ${text}`;
  });
  const emitLines = events.map((e) => {
    const params = e.type ? validatorParams(e.type) : null;
    return params === null
      ? `    // TODO(port): the arguments React's ${e.from} passes${e.type ? `: ${e.type}` : ""}\n    ${JSON.stringify(e.name)}: (..._args: unknown[]) => true,`
      : `    // React's ${e.from}: ${e.type}\n    ${JSON.stringify(e.name)}: (${params}) => true,`;
  });
  const slotLines = nodes.map((m) => {
    const name = m.name === "children" ? "default" : m.name;
    return `    ${name}${m.required ? "" : "?"}: () => VNode[];`;
  });
  const usesPropType = propLines.some((l) => l.includes("PropType"));

  const component = `import {
  defineComponent,
  h,
  normalizeClass,${usesPropType ? "\n  type PropType," : ""}
  type SlotsType,
  type VNode,
} from "vue";
import { cn } from "#kozmos-recipes";

/**
 * Vue's counterpart of React's ${react}: TODO(port) say what it is, as
 * React's doc comment does, and how it draws the element React draws.
 * Generated by \`pnpm --filter @kozmos-ds/vue port ${react}\`; PORTING.md
 * says how to finish it.
 */
export const ${vue} = defineComponent({
  name: "${vue}",
  inheritAttrs: false,
  props: {
${propLines.join("\n")}
  },${emitLines.length ? `\n  emits: {\n${emitLines.join("\n")}\n  },` : ""}
  slots: Object as SlotsType<{
${slotLines.join("\n") || "    // React's part takes no node."}
  }>,
  // TODO(port): \`props\`, and \`emit\` for the events, once it draws them.
  setup(_props, { attrs${nodes.some((m) => m.name === "children") ? ", slots" : ""} }) {
    return () => {
      const { class: className, ...rest } = attrs;
      // TODO(port): draw the <${tag}> React's ${react} draws, from its recipe
      // in packages/react/src/recipes (move it there first: PORTING.md, step 1).
      return h(
        "${tag}",
        { class: cn(normalizeClass(className)), ...rest },
        ${nodes.some((m) => m.name === "children") ? "slots.default?.()" : "[]"},
      );
    };
  },
});
`;

  const storyLines = drawable.map((s) => {
    const args = JSON.stringify(s.args, null, 2).replace(/\n/g, "\n");
    return `export const ${s.name}: Story = { args: ${args} };`;
  });
  const storiesSource = `import type { Meta, StoryObj } from "@storybook/vue3";
import { h } from "vue";
import { ${vue} } from "../../index";

/**
 * Vue's ${react}: the stories React's has, with the same names and args,
 * each inside the KozmosThemeProvider the Storybook's decorator gives every
 * story. test/parity draws each of React's in both and holds Vue's render to
 * React's. Generated by \`port ${react}\`.
 */
type Args = Record<string, unknown>;
const SLOTS = ${JSON.stringify(nodes.map((m) => m.name))};

const meta: Meta<Args> = {
  title: "${title}",
  component: ${vue},
  // React's node props are Vue's slots: \`children\` the default slot, the
  // rest slots of their own names, each drawing its arg's text.
  render: (args) => ({
    setup: () => () => {
      const props: Args = {};
      const slots: Record<string, () => string> = {};
      for (const [key, value] of Object.entries(args)) {
        if (!SLOTS.includes(key)) props[key] = value;
        else if (value !== undefined && value !== null)
          slots[key === "children" ? "default" : key] = () => String(value);
      }
      return h(${vue}, props, slots);
    },
  }),
};

export default meta;
type Story = StoryObj<Args>;
${[
  ...storyLines,
  ...elsewhere.map(
    (name) =>
      `// TODO(port): React's ${name} is not drawn from its args (its own render, or JSX\n// args): draw what it draws, from Kozmos parts only, as React's story does.\nexport const ${name}: Story = { args: {} };`,
  ),
]
  .map((story) => `\n${story}\n`)
  .join("")}`;

  // ports.ts
  const needsSpec =
    elsewhere.length > 0 || events.length > 0 || !drawable.length;
  const entry = [
    "  {",
    `    vue: "${vue}",`,
    `    react: "${react}",`,
    `    stories: ${stories ? JSON.stringify(stories) : "null"},`,
    ...(elsewhere.length
      ? [
          "    elsewhere: {",
          ...elsewhere.map((name) => `      ${name}: "${spec}",`),
          "    },",
        ]
      : []),
    ...(!drawable.length
      ? [
          `    drawnIn: "${spec}",`,
          "    // TODO(port): the args to draw it with, to see where attributes land.",
          "    sample: {},",
        ]
      : []),
    ...(events.length
      ? [
          "    events: {",
          ...events.map((e) => `      ${JSON.stringify(e.name)}: "${spec}",`),
          "    },",
        ]
      : []),
    "  },",
  ].join("\n");
  const portsAt = ports.indexOf("\n];", ports.indexOf("export const PORTS"));
  if (portsAt < 0)
    throw new PortRefusal("test/ports.ts has no PORTS list to add to.");
  const newPorts = `${ports.slice(0, portsAt)}\n${entry}${ports.slice(portsAt)}`;

  // src/index.ts: after the last part's export.
  const exportLine = `export { ${vue} } from "./components/${react}/${react}";`;
  const lines = index.split("\n");
  let last = -1;
  lines.forEach((line, i) => {
    if (/^export \{ Kozmos\w+ \} from "\.\/components\//.test(line)) last = i;
  });
  lines.splice(last + 1, 0, exportLine);
  const newIndex = lines.join("\n");

  // scripts/vue/coverage.mjs: each new story, for the Vue browser suites.
  const storyIds = [...drawable.map((s) => s.name), ...elsewhere].map(
    (name) => `${storyId(title)}--${storyNameId(name)}`,
  );
  const registerAt = register.indexOf(
    "\n};",
    register.indexOf("export const VUE_STORIES"),
  );
  if (registerAt < 0)
    throw new PortRefusal(`${REGISTER} has no VUE_STORIES register to add to.`);
  const newRegister = `${register.slice(0, registerAt)}\n${storyIds
    .map(
      (id) =>
        `  ${JSON.stringify(id)}: {\n    interaction: null,\n    exempt: {\n      interactions:\n        "TODO(port): name its interaction (scripts/check-vue-interactions.mjs), or say why it takes no input",\n    },\n  },`,
    )
    .join("\n")}${register.slice(registerAt)}`;

  const files: PortFile[] = [
    {
      file: `src/components/${react}/${react}.ts`,
      content: component,
      edit: false,
    },
    {
      file: `src/components/${react}/${react}.stories.ts`,
      content: storiesSource,
      edit: false,
    },
    { file: "src/index.ts", content: newIndex, edit: true },
    { file: "test/ports.ts", content: newPorts, edit: true },
    { file: REGISTER, content: newRegister, edit: true },
  ];
  if (needsSpec) {
    const cases = [
      ...elsewhere.map((name) => ({
        title: `${name}: draws what React's story draws`,
        todo: `draw React's ${name} story in both, inside a ThemeProvider (renderBoth), and expect(vue).toBe(react)`,
      })),
      ...(!drawable.length
        ? [
            {
              title: `draws what React's ${react} draws`,
              todo: `draw ${react} in both with its sample args (renderBoth)`,
            },
          ]
        : []),
      ...events.map((e) => ({
        title: `${e.name} fires as React's ${e.from}`,
        todo: `mount both, listen with h(${vue}, { ${JSON.stringify(`on${e.name[0].toUpperCase()}${e.name.slice(1)}`)}: … }), act, and compare what each heard`,
      })),
    ];
    files.push({
      file: `test/${spec}`,
      content: `// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import * as KozmosReact from "@kozmos-ds/react";
import { KozmosThemeProvider, ${vue} } from "../../src/index";
import { renderBoth } from "./render";

/**
 * What the stories parity check cannot draw from React's args, drawn in
 * both: generated by \`port ${react}\`, each test failing until it draws
 * what it names (PORTING.md, step 6).
 */
describe("${vue} draws what React's ${react} draws", () => {
  // The first drawing, to start from: React's and Vue's part in their
  // providers, compared after normalising (normalize-html.ts).
  const both = (props: Record<string, unknown>) =>
    renderBoth({
      react: KozmosReact.ThemeProvider,
      vue: KozmosThemeProvider,
      children: [{ react: KozmosReact.${react}, vue: ${vue}, props }],
    });

${cases
  .map(
    (c) => `  it(${JSON.stringify(c.title)}, async () => {
    // TODO(port): ${c.todo}.
    const { react, vue } = await both({});
    expect(vue).toBe(react);
    throw new Error(${JSON.stringify(`TODO(port): ${c.title}`)});
  });`,
  )
  .join("\n\n")}
});
`,
      edit: false,
    });
  }

  for (const f of files)
    if (!f.edit && fs.existsSync(path.join(root, f.file)))
      throw new PortRefusal(`${f.file} exists: the scaffold never overwrites.`);

  const bridge = path.join(PACKAGE, "src/react-bridge/index.ts");
  const bridgeLine = fs
    .readFileSync(bridge, "utf8")
    .split("\n")
    .findIndex((l) => l.startsWith(`export const ${vue} =`));
  const next = [
    `1. Move React's recipe for ${react} into packages/react/src/recipes (React's dist/index.d.ts and style.css must not change).`,
    `2. Draw the element in src/components/${react}/${react}.ts from that recipe, and fix every TODO(port).`,
    ...(elsewhere.length
      ? [
          `3. Write the stories React draws by hand (${elsewhere.join(", ")}) in the stories file and in test/${spec}.`,
        ]
      : []),
    ...(bridgeLine >= 0
      ? [
          `4. Take ${vue} out of the bridge: src/react-bridge/index.ts:${bridgeLine + 1} and its import, its cases in the bridge's specs, then bridge:takes. (while another session owns the bridge, name it in test/ports.ts' LEAVING_BRIDGE, with why, instead)`,
        ]
      : []),
    `5. Point the Vue tab of packages/react/src/components/${react}/${react}.mdx at "@kozmos-ds/vue".`,
    "6. pnpm --filter @kozmos-ds/vue build && pnpm --filter @kozmos-ds/vue test: the contract, parity and coverage checks name what is left.",
    "Then PORTING.md's checklist.",
  ];
  return { react, vue, files, next };
}

/** Writes a plan's files, formatted as the repository's Prettier formats them. */
export async function writePort(plan: PortPlan, root = PACKAGE) {
  for (const f of plan.files) {
    const file = path.join(root, f.file);
    const options =
      (await prettier.resolveConfig(path.join(PACKAGE, f.file))) ?? {};
    const content = await prettier.format(f.content, {
      ...options,
      filepath: file,
    });
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, f.edit ? undefined : { flag: "wx" });
  }
}

async function main(argv: string[]) {
  const dry = argv.includes("--dry-run");
  const names = argv.filter((a) => !a.startsWith("--"));
  if (names.length !== 1) {
    console.error(
      "Usage: pnpm --filter @kozmos-ds/vue port <ReactName> [--dry-run]",
    );
    return 2;
  }
  try {
    const plan = planPort(names[0]);
    if (dry)
      for (const f of plan.files)
        console.log(`--- ${f.edit ? "edit" : "new"} ${f.file}\n${f.content}`);
    else await writePort(plan);
    console.log(
      `${dry ? "Would write" : "Wrote"} ${plan.vue}:\n${plan.files.map((f) => `  ${f.edit ? "edited" : "new   "} packages/vue/${f.file}`).join("\n")}\n\nNext:\n${plan.next.map((l) => `  ${l}`).join("\n")}`,
    );
    return 0;
  } catch (error) {
    if (error instanceof PortRefusal) {
      console.error(`port: ${error.message}`);
      return 1;
    }
    throw error;
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename)
)
  void main(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
