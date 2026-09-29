/**
 * The component facts `.ai-skills` is generated and checked from (the review's
 * T2).
 *
 * Every expected value here is written out by hand from the component source,
 * or asked of the compiler directly: an extractor agreeing with its own output
 * proves nothing, which is how Badge and Tag lost every axis and Button lost
 * `emotion` while the inventory and its checker both passed.
 *
 * They read the built declarations: `pnpm --filter "@kozmos-ds/react..." build`.
 */
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { describeComponent } from "./claude-design-api.mjs";
import { compileModules } from "./claude-design-typescript.mjs";
import {
  axesOf,
  factsFromSources,
  readKozmosFacts,
  unknownsOf,
} from "./ai-facts.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const facts = readKozmosFacts(root);

/** Axes with their values sorted, so order is not part of the claim. */
const sorted = (axes) =>
  axes &&
  Object.fromEntries(
    Object.entries(axes)
      .map(([axis, values]) => [axis, [...values].map(String).sort()])
      .sort(([a], [b]) => a.localeCompare(b)),
  );

const expect = (axes) => sorted(axes);

// Button.tsx: BUTTON_EMOTIONS, an `as const` array read through
// `(typeof BUTTON_EMOTIONS)[number]`.
const EMOTIONS = [
  "themed",
  "neutral",
  "success",
  "danger",
  "informative",
  "alert",
];

test("Badge's axes are the six variants and four sizes its cva declares", () => {
  assert.deepEqual(
    sorted(axesOf(facts, "Badge")),
    expect({
      variant: [
        "default",
        "destructive",
        "outline",
        "secondary",
        "ghost",
        "link",
      ],
      size: ["default", "sm", "lg", "icon"],
    }),
  );
});

test("Tag's axes are its four variants and the emotion it imports from utils/emotion", () => {
  assert.deepEqual(
    sorted(axesOf(facts, "Tag")),
    expect({
      variant: ["default", "secondary", "destructive", "outline"],
      emotion: EMOTIONS,
    }),
  );
});

test("Button's axes include emotion, an indexed-access union", () => {
  assert.deepEqual(
    sorted(axesOf(facts, "Button")),
    expect({
      variant: [
        "default",
        "destructive",
        "outline",
        "secondary",
        "ghost",
        "link",
        "glass",
      ],
      size: ["default", "sm", "lg", "icon"],
      emotion: EMOTIONS,
    }),
  );
  // IconButtonProps = ButtonProps: every one of them, emotion included.
  assert.deepEqual(axesOf(facts, "IconButton"), axesOf(facts, "Button"));
});

test("a part of a compound component has its own facts", () => {
  // DrawerContent's `side` comes from a cva in Drawer.tsx; it is not a
  // component directory of its own, and was never in the inventory.
  assert.deepEqual(sorted(axesOf(facts, "DrawerContent")).side, [
    "bottom",
    "left",
    "right",
    "top",
  ]);
  // Accordion's props are a union (Radix's single | multiple): `type` takes both.
  assert.deepEqual(sorted(axesOf(facts, "Accordion")).type, [
    "multiple",
    "single",
  ]);
});

// ---------------------------------------------------------------- fixtures

const CVA = `import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";`;
const COMPONENT = (name) =>
  `export const ${name} = React.forwardRef<HTMLDivElement, ${name}Props>((props, ref) => <div ref={ref} {...props} />);`;

/** One recipe, written three ways: wrapped, on one line, and re-indented. */
const recipes = new Map([
  [
    "Wrapped.tsx",
    `${CVA}
const wrappedVariants = cva(
  "base",
  {
    variants: {
      variant: {
        default:
          "a",
        destructive: "b",
        "outline": "c",
      },
      size: {
        sm: "s",
        lg: "l",
      },
    },
  },
);
export interface WrappedProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof wrappedVariants> {}
${COMPONENT("Wrapped")}
`,
  ],
  [
    "OneLine.tsx",
    `${CVA}
const oneLineVariants = cva("base", { variants: { variant: { default: "a", destructive: "b", outline: "c" }, size: { sm: "s", lg: "l" } } });
export interface OneLineProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof oneLineVariants> {}
${COMPONENT("OneLine")}
`,
  ],
  [
    "Reindented.tsx",
    `${CVA}
const reindentedVariants = cva('base', {
\tvariants: {
\t\tsize: { 'lg': 'l', 'sm': 's' },
\t\tvariant: {
\t\t\toutline: 'c', destructive: 'b',
\t\t\tdefault: 'a' },
\t} });
export type ReindentedProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof reindentedVariants>;
${COMPONENT("Reindented")}
`,
  ],
  [
    "index.ts",
    `export * from "./Wrapped";\nexport * from "./OneLine";\nexport * from "./Reindented";\n`,
  ],
]);

test("the axes of a cva recipe do not depend on how its call is laid out", () => {
  const fixture = factsFromSources(root, recipes);
  const expected = expect({
    variant: ["default", "destructive", "outline"],
    size: ["sm", "lg"],
  });
  for (const name of ["Wrapped", "OneLine", "Reindented"])
    assert.deepEqual(sorted(axesOf(fixture, name)), expected, name);
});

test("a union imported from another module, or read through an index, is resolved", () => {
  const fixture = factsFromSources(
    root,
    new Map([
      [
        "emotion.ts",
        `export const MOODS = ["calm", "alarm"] as const;\nexport type Mood = (typeof MOODS)[number];\n`,
      ],
      ["sizes.ts", `export type Size = "s" | "m" | "l";\n`],
      [
        "Imported.tsx",
        `import * as React from "react";
import type { Mood } from "./emotion";
import { type Size } from "./sizes";
export interface ImportedProps { mood?: Mood; size?: Size; label: string }
export function Imported(props: ImportedProps) { return <div>{props.label}</div>; }
`,
      ],
      ["index.ts", `export * from "./Imported";\n`],
    ]),
  );
  assert.deepEqual(
    sorted(axesOf(fixture, "Imported")),
    expect({ mood: ["calm", "alarm"], size: ["s", "m", "l"] }),
  );
});

test("props inherited through extends, Omit and an alias are the component's own", () => {
  const fixture = factsFromSources(
    root,
    new Map([
      [
        "Base.tsx",
        `import * as React from "react";
export interface BaseProps { variant?: "solid" | "ghost"; size?: "s" | "l"; label: string }
export function Base(props: BaseProps) { return <div>{props.label}</div>; }
`,
      ],
      [
        "Derived.tsx",
        `import * as React from "react";
import type { BaseProps } from "./Base";
export interface DerivedProps extends Omit<BaseProps, "size"> {
  tone?: "warm" | "cool";
}
export function Derived(props: DerivedProps) { return <div>{props.label}</div>; }
`,
      ],
      [
        "Aliased.tsx",
        `import * as React from "react";
import type { BaseProps } from "./Base";
export type AliasedProps = BaseProps;
export function Aliased(props: AliasedProps) { return <div>{props.label}</div>; }
`,
      ],
      [
        "index.ts",
        `export * from "./Base";\nexport * from "./Derived";\nexport * from "./Aliased";\n`,
      ],
    ]),
  );
  assert.deepEqual(
    sorted(axesOf(fixture, "Derived")),
    expect({ variant: ["solid", "ghost"], tone: ["warm", "cool"] }),
    "Omit<BaseProps, 'size'> keeps variant and drops size",
  );
  assert.deepEqual(
    sorted(axesOf(fixture, "Aliased")),
    expect({ variant: ["solid", "ghost"], size: ["s", "l"] }),
  );
});

test("an open type is not an axis, and one that does not resolve is unknown", () => {
  const fixture = factsFromSources(
    root,
    new Map([
      [
        "Negatives.tsx",
        `import * as React from "react";
import type { Missing } from "./does-not-exist";
export interface NegativesProps {
  label?: string;
  count?: number;
  open?: boolean;
  size?: "sm" | "md" | (string & {});
  detent?: "low" | "high" | { fraction: number };
  broken?: Missing;
  level?: 1 | 2 | 3;
}
export function Negatives(props: NegativesProps) { return <div>{props.label}</div>; }
export const Untyped = (props: any) => <div>{String(props)}</div>;
`,
      ],
      ["index.ts", `export * from "./Negatives";\n`],
    ]),
  );
  // Only `level` is a closed set of values; `size` takes any string too, and
  // `detent` an object.
  assert.deepEqual(
    sorted(axesOf(fixture, "Negatives")),
    expect({ level: [1, 2, 3] }),
  );
  const unknown = unknownsOf(fixture, "Negatives");
  assert.equal(unknown.component, null);
  assert.deepEqual(Object.keys(unknown.props), ["broken"]);
  assert.match(unknown.props.broken, /resolve/);
  // A component whose props are `any` has no facts to give: unknown, not "none".
  assert.equal(axesOf(fixture, "Untyped"), null);
  assert.match(unknownsOf(fixture, "Untyped").component, /any/);
});

// ------------------------------------------------ the compiler as the oracle

test("the compiler agrees with every fact: each closed prop is an axis with exactly its values, and no other prop is", () => {
  // For every prop Kozmos or Radix declares on every component export, the
  // facts' claim — an axis with these values, or not an axis — is written as
  // a type assertion and handed to the compiler, which decides from the
  // built declarations alone whether the prop's type is a closed set of
  // literals and which ones.
  const preamble = [
    `import type { ComponentProps, JSXElementConstructor } from "react";`,
    `import * as K from "@kozmos-ds/react";`,
    `type Props<C> = C extends JSXElementConstructor<any> ? ComponentProps<C> : never;`,
    `type PropOf<C, P extends PropertyKey> = Props<C> extends infer T ? T extends unknown ? P extends keyof T ? T[P] : never : never : never;`,
    `type IsAny<T> = 0 extends 1 & T ? true : false;`,
    `type Closed<T> = IsAny<T> extends true ? false : [NonNullable<T>] extends [never] ? false : [NonNullable<T>] extends [boolean] ? false : [NonNullable<T>] extends [string | number | boolean] ? string extends NonNullable<T> ? false : number extends NonNullable<T> ? false : true : false;`,
    `type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;`,
  ];
  // First, the oracle must refuse claims that are wrong, or its silence below
  // proves nothing: Badge without its link variant, Button's emotion with one
  // too many, a closed prop called open, an open one called closed.
  const control = compileModules(
    root,
    new Map([
      [
        "control",
        [
          ...preamble,
          `export const a: Same<NonNullable<PropOf<typeof K.Badge, "variant">>, "default" | "destructive" | "outline" | "secondary" | "ghost"> = true;`,
          `export const b: Same<NonNullable<PropOf<typeof K.Button, "emotion">>, "themed" | "neutral" | "success" | "danger" | "informative" | "alert" | "calm"> = true;`,
          `export const c: Closed<PropOf<typeof K.Tag, "emotion">> = false;`,
          `export const d: Closed<PropOf<typeof K.Button, "isLoading">> = true;`,
        ].join("\n"),
      ],
    ]),
  ).get("control");
  assert.equal(
    control.filter((d) => /TS2322/.test(d)).length,
    4,
    `the oracle let a wrong claim through:\n${control.join("\n")}`,
  );

  const lines = [...preamble];
  let count = 0;
  for (const entry of facts.api.entries.values()) {
    if (!entry.component) continue;
    const axes = axesOf(facts, entry.name) ?? {};
    const props = describeComponent(facts.api, entry.name).props.filter(
      (p) => p.origin === "kozmos" || p.origin === "radix",
    );
    for (const prop of props) {
      const key = JSON.stringify(prop.name);
      const type = `PropOf<typeof K.${entry.name}, ${key}>`;
      const values = axes[prop.name];
      const id = count++;
      if (values) {
        const union = values
          .map((v) => (typeof v === "string" ? JSON.stringify(v) : String(v)))
          .join(" | ");
        lines.push(
          `// ${entry.name}.${prop.name}`,
          `export const closed${id}: Closed<${type}> = true;`,
          `export const same${id}: Same<NonNullable<${type}>, ${union}> = true;`,
        );
      } else
        lines.push(
          `// ${entry.name}.${prop.name}`,
          `export const open${id}: Closed<${type}> = false;`,
        );
    }
  }
  assert.ok(count > 500, `only ${count} props were asserted`);
  const source = lines.join("\n");
  const diagnostics = compileModules(root, new Map([["oracle", source]])).get(
    "oracle",
  );
  const where = (d) => {
    const line = Number(d.match(/:(\d+):\d+ TS/)?.[1] ?? 0);
    return `${source.split("\n")[line - 2] ?? ""} ${d.replace(/^.*? TS/, "TS")}`;
  };
  assert.deepEqual(diagnostics.map(where), []);
});
