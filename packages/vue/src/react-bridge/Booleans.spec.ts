// @vitest-environment jsdom
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { defineComponent, h, type Component } from "vue";
import React from "react";
import * as KozmosReact from "@kozmos-ds/react";
import { KozmosButton } from "../index";
import * as Bridge from "./index";
import { ADAPTER_BOOLEANS, PART_BOOLEANS } from "./part-takes";
import {
  bridgeOf,
  createVueWrapper,
  withBooleans,
  type Booleans,
} from "./react-adapter";
import {
  REPOSITORY,
  computeTakes,
  hyphenate,
  spellingsOf,
} from "../../scripts/bridge-takes.mjs";
import {
  $,
  bridgedParts,
  mount,
  settle,
  unmount,
} from "../../test/react-bridge-harness";

// Boolean props through the React bridge (react-adapter.ts). A bare
// attribute in a template (`<KozmosNavigationItem disabled>`) reaches the
// wrapper as `disabled: ""`, and React reads "" as false: the part was not
// disabled. A boolean prop now follows Vue's rule for a declared Boolean
// prop: absent, React is not given it, so React's default applies; bare, or
// with its own name as its value (`disabled="disabled"`), it is true; bound
// (`:disabled="false"`), React is given the value as it is. A prop boolean
// in a union with other types (`error: boolean | string`) is true bare, and
// keeps its strings, its name too. Which props are boolean is read from
// React's types (part-takes.ts, scripts/bridge-takes.mjs).

const fruit = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
];
const noop = () => {};

const page = (template: string) =>
  defineComponent({
    components: { ...(Bridge as Record<string, Component>), KozmosButton },
    setup: () => ({ fruit }),
    template,
  });

/** What React was last given as the props of `part`, while `run` drew it. */
async function propsOf(part: unknown, run: () => void) {
  const created = vi.spyOn(React, "createElement");
  run();
  await settle();
  const calls = created.mock.calls.filter(([type]) => type === part);
  created.mockRestore();
  const props = calls.at(-1)?.[1] as Record<string, unknown> | undefined;
  if (!props) throw new Error("the part was never drawn");
  return props;
}

// --------------------------------------------------------------------------
// A sample of parts, drawn: what each attribute makes of the part.
// --------------------------------------------------------------------------

interface Case {
  /** The wrapper, and the React part it mounts. */
  name: string;
  part: unknown;
  /** React's prop, and the attribute a template writes for it. */
  prop: string;
  attribute: string;
  /** The template, with the attribute in it. */
  template: (attribute: string) => string;
  /** Whether the part drew the prop as true. */
  drawn: () => boolean;
  /** React's own default for it: what an absent attribute leaves. */
  byDefault: boolean;
  /** Boolean in a union with other types: its name as its value is kept. */
  union?: boolean;
  /** A string its type takes, which reaches React as it is. */
  text?: string;
}

const CASES: Case[] = [
  {
    name: "KozmosIconButton",
    part: KozmosReact.IconButton,
    prop: "disabled",
    attribute: "disabled",
    template: (a) =>
      `<KozmosIconButton aria-label="Go" ${a}>x</KozmosIconButton>`,
    drawn: () => $<HTMLButtonElement>("button")!.disabled,
    byDefault: false,
  },
  {
    name: "KozmosIconButton",
    part: KozmosReact.IconButton,
    prop: "isLoading",
    attribute: "is-loading",
    template: (a) =>
      `<KozmosIconButton aria-label="Go" ${a}>x</KozmosIconButton>`,
    drawn: () => $(".kozmos-button-loader") !== null,
    byDefault: false,
  },
  {
    name: "KozmosNavigationItem",
    part: KozmosReact.NavigationItem,
    prop: "disabled",
    attribute: "disabled",
    template: (a) => `<KozmosNavigationItem ${a}>Gates</KozmosNavigationItem>`,
    drawn: () => $("button")!.getAttribute("aria-disabled") === "true",
    byDefault: false,
  },
  {
    name: "KozmosNavigationItem",
    part: KozmosReact.NavigationItem,
    prop: "selected",
    attribute: "selected",
    template: (a) => `<KozmosNavigationItem ${a}>Gates</KozmosNavigationItem>`,
    drawn: () => $("button")!.hasAttribute("data-selected"),
    byDefault: false,
  },
  {
    name: "KozmosCheckbox",
    part: KozmosReact.Checkbox,
    prop: "disabled",
    attribute: "disabled",
    template: (a) => `<KozmosCheckbox aria-label="Accept" ${a} />`,
    drawn: () => $<HTMLButtonElement>("[role=checkbox]")!.disabled,
    byDefault: false,
  },
  {
    name: "KozmosCheckbox",
    part: KozmosReact.Checkbox,
    prop: "required",
    attribute: "required",
    template: (a) => `<KozmosCheckbox aria-label="Accept" ${a} />`,
    drawn: () => $("[role=checkbox]")!.getAttribute("aria-required") === "true",
    byDefault: false,
  },
  {
    // `checked` is `v-model:checked`'s (RADIX_MODELS), read from the
    // attributes. Its type is boolean | "indeterminate".
    name: "KozmosCheckbox",
    part: KozmosReact.Checkbox,
    prop: "checked",
    attribute: "checked",
    template: (a) => `<KozmosCheckbox aria-label="Accept" ${a} />`,
    drawn: () => $("[role=checkbox]")!.getAttribute("aria-checked") === "true",
    byDefault: false,
    union: true,
  },
  {
    name: "KozmosCheckbox",
    part: KozmosReact.Checkbox,
    prop: "error",
    attribute: "error",
    template: (a) => `<KozmosCheckbox aria-label="Accept" ${a} />`,
    drawn: () => $("[role=checkbox]")!.getAttribute("aria-invalid") === "true",
    byDefault: false,
    union: true,
    text: "Required",
  },
  {
    name: "KozmosInput",
    part: KozmosReact.Input,
    prop: "error",
    attribute: "error",
    template: (a) => `<KozmosInput aria-label="Gate" ${a} />`,
    drawn: () => $("input")!.getAttribute("aria-invalid") === "true",
    byDefault: false,
    union: true,
    text: "Required",
  },
  {
    name: "KozmosInput",
    part: KozmosReact.Input,
    prop: "required",
    attribute: "required",
    template: (a) => `<KozmosInput aria-label="Gate" ${a} />`,
    drawn: () => $<HTMLInputElement>("input")!.required,
    byDefault: false,
  },
  {
    name: "KozmosInput",
    part: KozmosReact.Input,
    prop: "readOnly",
    attribute: "read-only",
    template: (a) => `<KozmosInput aria-label="Gate" ${a} />`,
    drawn: () => $<HTMLInputElement>("input")!.readOnly,
    byDefault: false,
  },
  {
    // Clearable unless told otherwise: an absent attribute leaves it so.
    name: "KozmosCombobox",
    part: KozmosReact.Combobox,
    prop: "clearable",
    attribute: "clearable",
    template: (a) =>
      `<KozmosCombobox :options="fruit" label="Fruit" model-value="apple" ${a} />`,
    drawn: () => $("[aria-label='Clear selection']") !== null,
    byDefault: true,
  },
  {
    name: "KozmosSwitch",
    part: KozmosReact.Switch,
    prop: "disabled",
    attribute: "disabled",
    template: (a) => `<KozmosSwitch aria-label="Wi-Fi" ${a} />`,
    drawn: () => $<HTMLButtonElement>("[role=switch]")!.disabled,
    byDefault: false,
  },
  {
    // `v-model:checked`'s, read from the attributes: a boolean here.
    name: "KozmosSwitch",
    part: KozmosReact.Switch,
    prop: "checked",
    attribute: "checked",
    template: (a) => `<KozmosSwitch aria-label="Wi-Fi" ${a} />`,
    drawn: () => $("[role=switch]")!.getAttribute("aria-checked") === "true",
    byDefault: false,
  },
  {
    // Its toggle is drawn unless told otherwise.
    name: "KozmosPasswordInput",
    part: KozmosReact.PasswordInput,
    prop: "showToggle",
    attribute: "show-toggle",
    template: (a) => `<KozmosPasswordInput aria-label="Password" ${a} />`,
    drawn: () => $("[aria-label='Show password']") !== null,
    byDefault: true,
  },
];

describe("a boolean prop's attribute, as Vue reads a declared Boolean prop", () => {
  it.each(CASES.map((c) => [`${c.name} ${c.attribute}`, c] as const))(
    '%s: bare is true, absent is React\'s default and not given, :x="false" is false, its name is true (a union keeps it)',
    async (_, c) => {
      const draw = async (attribute: string) => {
        const given = await propsOf(c.part, () =>
          mount(page(c.template(attribute))),
        );
        const drawn = c.drawn();
        const text = document.body.textContent;
        unmount();
        return { given, drawn, text };
      };

      const bare = await draw(c.attribute);
      expect(bare.given[c.prop]).toBe(true);
      expect(bare.drawn).toBe(true);

      // Never false: React's own default decides.
      const absent = await draw("");
      expect(c.prop in absent.given).toBe(false);
      expect(absent.drawn).toBe(c.byDefault);

      const off = await draw(`:${c.attribute}="false"`);
      expect(off.given[c.prop]).toBe(false);
      expect(off.drawn).toBe(false);

      const on = await draw(`:${c.attribute}="true"`);
      expect(on.given[c.prop]).toBe(true);

      const named = await draw(`${c.attribute}="${hyphenate(c.prop)}"`);
      // A union's strings are its own: its name is one of them.
      expect(named.given[c.prop]).toBe(c.union ? hyphenate(c.prop) : true);
      if (!c.union) expect(named.drawn).toBe(true);

      if (c.text) {
        const text = await draw(`${c.attribute}="${c.text}"`);
        expect(text.given[c.prop]).toBe(c.text);
        expect(text.drawn).toBe(true);
        expect(text.text).toContain(c.text);
      }
      // No spelling of the prop but React's reaches React.
      for (const { given } of [bare, off, named])
        expect(
          Object.keys(given).filter(
            (key) => key !== c.prop && spellingsOf(c.prop).includes(key),
          ),
        ).toEqual([]);
    },
  );
});

describe("a boolean prop's attribute, in any spelling a template gives it", () => {
  // Vue keeps an attribute as the template spells it: an SFC's `readOnly`,
  // a kebab-case `read-only`, and an in-DOM template's `readonly`, which the
  // browser writes in small letters. Each is React's `readOnly`.
  it.each(["readOnly", "read-only", "readonly"])(
    "KozmosCombobox %s is React's readOnly: no clear button",
    async (attribute) => {
      const given = await propsOf(KozmosReact.Combobox, () =>
        mount(
          page(
            `<KozmosCombobox :options="fruit" label="Fruit" model-value="apple" ${attribute} />`,
          ),
        ),
      );
      expect(given.readOnly).toBe(true);
      expect(
        Object.keys(given).filter((key) => /^read-?only$/i.test(key)),
      ).toEqual(["readOnly"]);
      expect($("[aria-label='Clear selection']")).toBeNull();
      expect($<HTMLInputElement>("input")!.readOnly).toBe(true);
    },
  );

  it.each(["isLoading", "is-loading", "isloading"])(
    "KozmosIconButton %s is React's isLoading",
    async (attribute) => {
      const given = await propsOf(KozmosReact.IconButton, () =>
        mount(
          page(
            `<KozmosIconButton aria-label="Go" ${attribute}>x</KozmosIconButton>`,
          ),
        ),
      );
      expect(given.isLoading).toBe(true);
      expect(
        Object.keys(given).filter((key) => /^is-?loading$/i.test(key)),
      ).toEqual(["isLoading"]);
      expect($(".kozmos-button-loader")).not.toBeNull();
    },
  );

  it("React's own spelling wins over another given beside it", async () => {
    const given = await propsOf(KozmosReact.Input, () =>
      mount(() =>
        h(Bridge.KozmosInput, {
          "aria-label": "Gate",
          "read-only": "",
          readOnly: false,
        }),
      ),
    );
    expect(given.readOnly).toBe(false);
    expect("read-only" in given).toBe(false);
  });
});

describe("Button", () => {
  // A part of a consumer's own has no types at runtime: its wrapper names
  // its boolean props, and reads each as Vue's own KozmosButton, which
  // declares them as Boolean props, does.
  const MyButton = createVueWrapper(
    KozmosReact.Button,
    {},
    { booleans: { flags: ["disabled", "isLoading"] } },
  );
  const drawn = () => ({
    disabled: $<HTMLButtonElement>("button")!.disabled,
    loading: $(".kozmos-button-loader") !== null,
  });

  it("a consumer's createVueWrapper(Button) that names its booleans draws each as Vue's KozmosButton does; one that names none passes them on as Vue gives them", async () => {
    for (const [attribute, expected] of [
      ["disabled", { disabled: true }],
      ["", {}],
      [':disabled="false"', { disabled: false }],
      ['disabled="disabled"', { disabled: true }],
      ["is-loading", { isLoading: true }],
      ['is-loading="is-loading"', { isLoading: true }],
      [':is-loading="false"', { isLoading: false }],
    ] as const) {
      mount(page(`<KozmosButton ${attribute}>Go</KozmosButton>`));
      await settle();
      const vue = drawn();
      unmount();
      const given = await propsOf(KozmosReact.Button, () =>
        mount(
          defineComponent({
            components: { MyButton },
            template: `<MyButton ${attribute}>Go</MyButton>`,
          }),
        ),
      );
      expect(
        Object.fromEntries(
          Object.entries(given).filter(([key]) =>
            /^(disabled|is-?loading)$/i.test(key),
          ),
        ),
        attribute,
      ).toEqual(expected);
      expect(drawn(), attribute).toEqual(vue);
      unmount();
    }

    const Plain = createVueWrapper(KozmosReact.Button);
    const given = await propsOf(KozmosReact.Button, () =>
      mount(() => h(Plain, { disabled: "" }, () => "Go")),
    );
    expect(given.disabled).toBe("");
    expect(bridgeOf(Plain)!.booleans).toEqual({ flags: [], unions: [] });
    expect(bridgeOf(MyButton)!.booleans).toEqual({
      flags: ["disabled", "isLoading"],
      unions: [],
    });
  });
});

describe("a model is its model's", () => {
  // The models whose React prop is a boolean. A declared one (each
  // wrapper's own) is a Vue prop: its value is the model's, read as before,
  // never an attribute. `open` and `checked` (RADIX_MODELS) are not
  // declared, so they arrive as attributes, and are read as one.
  const booleanModels = () =>
    bridgedParts().flatMap(({ name, bridge }) =>
      Object.entries(bridge!.models)
        .filter(([, binding]) =>
          [...bridge!.booleans.flags, ...bridge!.booleans.unions].includes(
            binding.prop,
          ),
        )
        .map(([model, binding]) => `${name} ${model} → ${binding.prop}`),
    );

  it("the declared models whose React prop is a boolean, each given its model's value", async () => {
    expect(booleanModels()).toEqual([
      "KozmosToggleButton pressed → pressed",
      "KozmosMapControlsGroup stepFree → stepFree",
      "KozmosCheckbox modelValue → checked",
      "KozmosSwitch modelValue → checked",
      "KozmosPasswordInput visible → visible",
    ]);
    for (const [name, model] of [
      ["KozmosToggleButton", "pressed"],
      ["KozmosMapControlsGroup", "stepFree"],
      ["KozmosCheckbox", "modelValue"],
      ["KozmosSwitch", "modelValue"],
      ["KozmosPasswordInput", "visible"],
    ] as const)
      for (const value of [false, true]) {
        const component = Bridge[name] as Component;
        const bridge = bridgeOf(component)!;
        const given = await propsOf(bridge.part, () =>
          mount(() =>
            h(component, {
              "aria-label": "Part",
              [model]: value,
              [`onUpdate:${model}`]: noop,
            }),
          ),
        );
        expect(given[bridge.models[model].prop], `${name} ${model}`).toBe(
          value,
        );
        unmount();
      }
  });
});

// --------------------------------------------------------------------------
// The table: part-takes.ts's booleans, generated from React's built
// declarations by scripts/bridge-takes.mjs.
// --------------------------------------------------------------------------

describe("which props of each part are booleans", () => {
  const table = computeTakes();
  const sorted = ({ flags, unions }: Booleans) => ({
    flags: [...flags].sort(),
    unions: [...unions].sort(),
  });
  /** The runtime table's entry for each React export the computed table names, sorted. */
  const byName = () =>
    Object.fromEntries(
      Object.keys(table.booleans.parts).map((name) => {
        const entry = PART_BOOLEANS.get(
          KozmosReact[name as keyof typeof KozmosReact],
        );
        return [name, entry && sorted(entry)];
      }),
    );

  it("part-takes.ts's booleans are what React's types say (else run pnpm --filter @kozmos-ds/vue bridge:takes)", () => {
    expect(Object.keys(table.booleans.parts).length).toBeGreaterThan(100);
    expect(byName()).toEqual(table.booleans.parts);
    expect(
      Object.fromEntries(
        Object.entries(ADAPTER_BOOLEANS).map(([name, entry]) => [
          name,
          sorted(entry),
        ]),
      ),
    ).toEqual(table.booleans.adapters);
    // Nothing is listed twice, nor as both kinds.
    for (const entry of [
      ...PART_BOOLEANS.values(),
      ...Object.values(ADAPTER_BOOLEANS),
    ]) {
      const all = [...entry.flags, ...entry.unions];
      expect(new Set(all).size).toBe(all.length);
    }
  }, 60_000);

  it("is exact both ways: every spelling of each boolean is it, read by its kind, and an attribute that spells none is passed on as it is", () => {
    const wrong: string[] = [];
    const entries: [string, Booleans, Booleans][] = [
      ...Object.entries(table.booleans.parts).map(
        ([name, computed]) =>
          [
            name,
            computed,
            PART_BOOLEANS.get(KozmosReact[name as keyof typeof KozmosReact])!,
          ] as [string, Booleans, Booleans],
      ),
      ...Object.entries(table.booleans.adapters).map(
        ([name, computed]) =>
          [name, computed, ADAPTER_BOOLEANS[name]] as [
            string,
            Booleans,
            Booleans,
          ],
      ),
    ];
    const every = new Set(
      entries.flatMap(([, { flags, unions }]) => [...flags, ...unions]),
    );
    for (const name of ["value", "label", "children", "variant", "class"])
      every.add(name);
    for (const [name, computed, runtime] of entries) {
      const kinds = new Map<string, [string, boolean]>();
      for (const [props, union] of [
        [computed.flags, false],
        [computed.unions, true],
      ] as const)
        for (const prop of props)
          for (const spelling of spellingsOf(prop))
            kinds.set(spelling, [prop, union]);
      const check = (key: string, value: unknown, expected: object) => {
        const read = withBooleans({ [key]: value }, runtime);
        if (JSON.stringify(read) !== JSON.stringify(expected))
          wrong.push(
            `${name} ${key}=${JSON.stringify(value)}: ${JSON.stringify(read)}`,
          );
      };
      for (const prop of every)
        for (const key of spellingsOf(prop)) {
          const kind = kinds.get(key);
          if (!kind) {
            check(key, "", { [key]: "" });
            continue;
          }
          const [boolean, union] = kind;
          check(key, "", { [boolean]: true });
          check(key, false, { [boolean]: false });
          check(key, true, { [boolean]: true });
          check(key, hyphenate(boolean), {
            [boolean]: union ? hyphenate(boolean) : true,
          });
          check(key, "maybe", { [boolean]: "maybe" });
        }
    }
    expect(entries.length).toBeGreaterThan(100);
    expect(wrong).toEqual([]);
  }, 60_000);

  it("describes every Kozmos* export's part", () => {
    const parts = bridgedParts();
    expect(parts.length).toBeGreaterThan(90);
    const undescribed = parts
      .filter(({ bridge }) => {
        const part = bridge?.part as { name?: string } | undefined;
        return (
          bridge?.booleans !== PART_BOOLEANS.get(part) &&
          bridge?.booleans !== ADAPTER_BOOLEANS[part?.name ?? ""]
        );
      })
      .map(({ name }) => name);
    expect(undescribed).toEqual([]);
  });

  it("no spelling of a boolean is a listener's key, which would never reach it", () => {
    const listeners = [
      ...PART_BOOLEANS.values(),
      ...Object.values(ADAPTER_BOOLEANS),
    ]
      .flatMap(({ flags, unions }) => [...flags, ...unions])
      .flatMap(spellingsOf)
      .filter((key) => /^on[^a-z]/.test(key));
    expect(listeners).toEqual([]);
  });

  // React's types decide, however a part writes its props: a union of
  // props types, an Omit<>, an intersection, a forwardRef. A slot (a prop
  // that takes any ReactNode) and a prop that takes `false` but never `true`
  // are not booleans; two props one attribute would name fail generation.
  const FIXTURE = path.join(
    REPOSITORY,
    "packages/react/dist/bridge-booleans.fixture.d.ts",
  );
  const fixture = `import type * as React from "react";
interface RowProps { kind: "row"; multiple: true; dense?: boolean; onPick?: () => void }
interface ListProps { kind: "list"; multiple?: false; caption?: string }
export declare const Rows: (props: RowProps | ListProps) => React.ReactElement | null;
interface BaseProps { loading?: boolean; error?: boolean | string; label?: React.ReactNode; tone?: "calm" | "loud"; constraints?: false | { top: number }; forceMount?: true }
export declare const Trimmed: (props: Omit<BaseProps, "loading"> & { open?: boolean }) => React.ReactElement | null;
export declare const Forwarded: React.ForwardRefExoticComponent<BaseProps & React.RefAttributes<HTMLButtonElement>>;
export declare const Clash: (props: { readOnly?: boolean; readonly?: string }) => React.ReactElement | null;
`;
  const fromFixture = (parts: string[]) =>
    computeTakes(REPOSITORY, {
      declarations: FIXTURE,
      virtual: new Map([[FIXTURE, fixture]]),
      parts,
      adapters: {},
    }).booleans.parts;

  it("reads a union of props types, an Omit<>, an intersection and a forwardRef from their types", () => {
    expect(fromFixture(["Rows", "Trimmed", "Forwarded"])).toEqual({
      // `multiple: true` beside `multiple?: false` is a boolean.
      Rows: { flags: ["dense", "multiple"], unions: [] },
      Trimmed: { flags: ["forceMount", "open"], unions: ["error"] },
      Forwarded: { flags: ["forceMount", "loading"], unions: ["error"] },
    });
  }, 60_000);

  it("fails generation when one attribute would name two props, naming the part", () => {
    expect(() => fromFixture(["Clash"])).toThrow(
      /^Clash: the attribute readonly would be its boolean readOnly and its prop readonly\./,
    );
  }, 60_000);

  it("React's HTMLAttributes' booleans are the file's HTML, and the unions among them are those it lists", () => {
    // Listed in the pull request that brought them: what a bare attribute
    // of each now gives React.
    expect(table.booleans.html).toEqual({
      flags: [
        "autoFocus",
        "defaultChecked",
        "hidden",
        "itemScope",
        "suppressContentEditableWarning",
        "suppressHydrationWarning",
      ],
      unions: [
        "aria-atomic",
        "aria-busy",
        "aria-checked",
        "aria-current",
        "aria-disabled",
        "aria-expanded",
        "aria-grabbed",
        "aria-haspopup",
        "aria-hidden",
        "aria-invalid",
        "aria-modal",
        "aria-multiline",
        "aria-multiselectable",
        "aria-pressed",
        "aria-readonly",
        "aria-required",
        "aria-selected",
        "contentEditable",
        "draggable",
        "spellCheck",
      ],
    });
  });
});
