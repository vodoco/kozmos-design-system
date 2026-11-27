// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString as reactToString } from "react-dom/server";
import * as KozmosReact from "@kozmos-ds/react";
import {
  createApp,
  createSSRApp,
  h,
  nextTick,
  ref,
  type App,
  type VNode,
} from "vue";
import { renderToString as vueToString } from "vue/server-renderer";
import {
  KozmosAnalyticsProvider,
  KozmosLabel,
  KozmosSelect,
  KozmosSelectContent,
  KozmosSelectGroup,
  KozmosSelectItem,
  KozmosSelectLabel,
  KozmosSelectScrollDownButton,
  KozmosSelectScrollUpButton,
  KozmosSelectSeparator,
  KozmosSelectTrigger,
  KozmosSelectValue,
  KozmosThemeProvider,
  type KozmosAnalyticsEvent,
} from "../../src/index";
import { normalizeHtml } from "./normalize-html";

/**
 * Select and its nine parts, which every React story draws by hand, drawn
 * in both from one description (`Spec`): each story closed, as a server
 * renders it, then the edges React's tests cover (Select.test.tsx): the
 * ghost trigger, a boolean and a string error, the form's select (name,
 * required, autocomplete, form), a writing direction, an app's class and
 * attributes on the trigger and its field, a mixed field and its reset,
 * the value's own words, counts named with their words.
 *
 * Then, mounted, open and closed: the chosen item's words in the trigger,
 * the open list in the theme's portal, carrying the density, and its rows,
 * its groups, labels, separators and counts ("1,284", "POI, 96"), compared
 * with Radix's and Reka's own names for the same things made one (`alike`);
 * the keyboard opening the list and choosing, v-model and v-model:open
 * hearing what onValueChange and onOpenChange hear, `select_value_changed`
 * reported; Escape and a press outside closing it, with the content's
 * escapeKeyDown, pointerDownOutside and closeAutoFocus; a mixed field's
 * choice and its reset; and a form told of each choice by its select.
 */

type Props = Record<string, unknown>;
type Node =
  | { item: string; words: string; count?: number; disabled?: boolean }
  | { group: string; items: [string, string][] }
  | { separator: true }
  | { scroll: "up" | "down" };
interface Spec {
  root?: Props;
  trigger?: Props;
  /** The value's placeholder, or its own words (`children`). */
  placeholder?: string;
  valueWords?: string;
  content?: Props;
  nodes: Node[];
}
type Listeners = { root?: Props; content?: Props };

const e = React.createElement;

/** React's tree, as a story writes it. */
function reactTree(spec: Spec, listeners: Listeners = {}): React.ReactElement {
  const node = (n: Node, i: number): React.ReactElement =>
    "item" in n
      ? e(
          KozmosReact.SelectItem,
          {
            key: i,
            value: n.item,
            disabled: n.disabled,
            ...(n.count === undefined ? {} : { count: n.count }),
          },
          n.words,
        )
      : "group" in n
        ? e(
            KozmosReact.SelectGroup,
            { key: i },
            e(KozmosReact.SelectLabel, null, n.group),
            ...n.items.map(([value, words]) =>
              e(KozmosReact.SelectItem, { key: value, value }, words),
            ),
          )
        : "separator" in n
          ? e(KozmosReact.SelectSeparator, { key: i })
          : n.scroll === "up"
            ? e(KozmosReact.SelectScrollUpButton, { key: i })
            : e(KozmosReact.SelectScrollDownButton, { key: i });
  return e(
    KozmosReact.Select,
    { ...spec.root, ...listeners.root },
    e(
      KozmosReact.SelectTrigger,
      spec.trigger ?? {},
      e(
        KozmosReact.SelectValue,
        spec.placeholder === undefined
          ? null
          : { placeholder: spec.placeholder },
        spec.valueWords,
      ),
    ),
    e(
      KozmosReact.SelectContent,
      { ...spec.content, ...listeners.content },
      ...spec.nodes.map(node),
    ),
  );
}

/** A part's props as Vue writes them: `className` is `class`. */
const asVue = ({ className, ...rest }: Props = {}) => ({
  ...rest,
  ...(className === undefined ? {} : { class: className }),
});

/** Vue's tree, from the same description. */
function vueTree(spec: Spec, listeners: Listeners = {}): VNode {
  const node = (n: Node): VNode =>
    "item" in n
      ? h(
          KozmosSelectItem,
          { value: n.item, disabled: n.disabled },
          n.count === undefined
            ? { default: () => n.words }
            : { default: () => n.words, count: () => String(n.count) },
        )
      : "group" in n
        ? h(KozmosSelectGroup, null, () => [
            h(KozmosSelectLabel, null, () => n.group),
            ...n.items.map(([value, words]) =>
              h(KozmosSelectItem, { value }, () => words),
            ),
          ])
        : "separator" in n
          ? h(KozmosSelectSeparator)
          : n.scroll === "up"
            ? h(KozmosSelectScrollUpButton)
            : h(KozmosSelectScrollDownButton);
  const root = { ...spec.root };
  delete root.value;
  return h(
    KozmosSelect,
    {
      ...root,
      ...(spec.root && "value" in spec.root
        ? { modelValue: spec.root.value }
        : {}),
      ...listeners.root,
    },
    () => [
      h(KozmosSelectTrigger, asVue(spec.trigger), () => [
        h(
          KozmosSelectValue,
          null,
          spec.placeholder === undefined && spec.valueWords === undefined
            ? {}
            : {
                ...(spec.placeholder === undefined
                  ? {}
                  : { placeholder: () => spec.placeholder }),
                ...(spec.valueWords === undefined
                  ? {}
                  : { default: () => spec.valueWords }),
              },
        ),
      ]),
      h(
        KozmosSelectContent,
        { ...asVue(spec.content), ...listeners.content },
        () => spec.nodes.map(node),
      ),
    ],
  );
}

const reactInTheme = (tree: React.ReactElement) =>
  e(KozmosReact.ThemeProvider, null, tree);
const vueInTheme = (tree: () => VNode | VNode[]) =>
  h(KozmosThemeProvider, null, { default: tree });

async function serverBoth(
  react: React.ReactElement,
  vue: () => VNode | VNode[],
) {
  const reactHtml = reactToString(reactInTheme(react));
  const vueHtml = await vueToString(
    createSSRApp({ render: () => vueInTheme(vue) }),
  );
  return { react: normalizeHtml(reactHtml), vue: normalizeHtml(vueHtml) };
}
const both = (spec: Spec) => serverBoth(reactTree(spec), () => vueTree(spec));

const fruit: Node[] = [
  { item: "apple", words: "Apple" },
  { item: "banana", words: "Banana" },
];
const fruitTrigger = { className: "w-44", "aria-label": "Fruit" };
const counts = (all: number): Node[] => [
  { item: "everything", words: "All Content", count: all },
  { item: "poi", words: "POI", count: 96 },
  { item: "featured", words: "Featured POIs", count: 12 },
  { item: "interior", words: "Interior asset", count: 32 },
];
const timezones: Node[] = [
  { scroll: "up" },
  {
    group: "North America",
    items: [
      ["est", "Eastern Standard Time (EST)"],
      ["cst", "Central Standard Time (CST)"],
    ],
  },
  { separator: true },
  {
    group: "Europe",
    items: [
      ["gmt", "Greenwich Mean Time (GMT)"],
      ["cet", "Central European Time (CET)"],
    ],
  },
  { scroll: "down" },
];

/** React's MixedValue story's field, as its first render draws it. */
const mixedField = (label: string, edited?: string) => ({
  react: e(
    "div",
    { className: "grid gap-1.5" },
    e(KozmosReact.Label, { htmlFor: label }, label),
    reactTree({
      root: {
        mixed: edited === undefined,
        value: edited,
        onValueChange: () => {},
        onResetMixed: () => {},
      },
      trigger: { id: label },
      placeholder: "Choose a type",
      nodes: [
        { item: "poi", words: "POI" },
        { item: "interior-asset", words: "Interior asset" },
        { item: "structural", words: "Structural" },
      ],
    }),
  ),
  vue: () =>
    h("div", { class: "grid gap-1.5" }, [
      h(KozmosLabel, { for: label }, () => label),
      vueTree({
        root: {
          mixed: edited === undefined,
          value: edited,
          "onUpdate:modelValue": () => {},
          onResetMixed: () => {},
        },
        trigger: { id: label },
        placeholder: "Choose a type",
        nodes: [
          { item: "poi", words: "POI" },
          { item: "interior-asset", words: "Interior asset" },
          { item: "structural", words: "Structural" },
        ],
      }),
    ]),
});

describe("KozmosSelect draws what React's Select draws, closed", () => {
  it("Default: draws what React's story draws", async () => {
    const { react, vue } = await both({
      trigger: fruitTrigger,
      placeholder: "Select a fruit",
      nodes: [
        {
          group: "Fruits",
          items: [
            ["apple", "Apple"],
            ["banana", "Banana"],
            ["blueberry", "Blueberry"],
          ],
        },
      ],
    });
    expect(react).toContain('role="combobox"');
    expect(react).toContain("Select a fruit");
    expect(vue).toBe(react);
  });

  it("WithScroll: draws what React's story draws", async () => {
    const { react, vue } = await both({
      trigger: { className: "w-72", "aria-label": "Timezone" },
      placeholder: "Select a timezone",
      nodes: timezones,
    });
    expect(vue).toBe(react);
  });

  it("Disabled: draws what React's story draws", async () => {
    const { react, vue } = await both({
      root: { disabled: true },
      trigger: fruitTrigger,
      placeholder: "Select a fruit",
      nodes: fruit,
    });
    expect(react).toContain("disabled");
    expect(vue).toBe(react);
  });

  it("WithError: draws what React's story draws", async () => {
    const { react, vue } = await both({
      trigger: { ...fruitTrigger, error: "Please select a fruit." },
      placeholder: "Select a fruit",
      nodes: fruit,
    });
    expect(react).toContain('aria-invalid="true"');
    expect(react).toContain("Please select a fruit.");
    expect(vue).toBe(react);
  });

  it("OptionCounts: draws what React's story draws", async () => {
    const { react, vue } = await both({
      root: { defaultValue: "everything" },
      trigger: { className: "w-56", "aria-label": "Content" },
      nodes: counts(128),
    });
    expect(vue).toBe(react);
  });

  it("OptionCountsOpen: draws what React's story draws (a server draws no list)", async () => {
    const spec: Spec = {
      root: { defaultOpen: true, defaultValue: "poi" },
      trigger: { className: "w-56", "aria-label": "Content" },
      nodes: counts(1284),
    };
    const { react, vue } = await serverBoth(
      e("div", { style: { height: 280 } }, reactTree(spec)),
      () => h("div", { style: { height: "280px" } }, [vueTree(spec)]),
    );
    expect(react).toContain('aria-expanded="true"');
    expect(vue).toBe(react);
  });

  it("MixedValue: draws what React's story draws", async () => {
    const type = mixedField("Type");
    const category = mixedField("Category", "structural");
    const { react, vue } = await serverBoth(
      e("div", { className: "grid w-80 gap-4" }, type.react, category.react),
      () =>
        h("div", { class: "grid w-80 gap-4" }, [type.vue(), category.vue()]),
    );
    expect(react).toContain("Multiple values");
    expect(react).toContain("Reset to multiple values");
    expect(vue).toBe(react);
  });

  it.each([
    ["ghost", { trigger: { variant: "ghost", "aria-label": "Level" } }],
    ["a boolean error", { trigger: { error: true, "aria-label": "Fruit" } }],
    [
      "an app's class, id and description",
      {
        trigger: {
          className: "w-72 px-4",
          id: "fruit",
          "aria-describedby": "fruit-note",
          "data-parity": "trigger",
          wrapperClassName: "kozmos-parity",
        },
      },
    ],
    ["a disabled trigger", { trigger: { disabled: true } }],
    [
      "the form's select",
      {
        root: {
          name: "fruit",
          required: true,
          autoComplete: "off",
          form: "order",
        },
      },
    ],
    ["right to left", { root: { dir: "rtl" } }],
    ["a controlled value", { root: { value: "banana" } }],
    ["the empty value", { root: { value: "" } }],
    ["the value's own words", { root: { value: "apple" }, valueWords: "A" }],
    ["mixed, with no reset", { root: { mixed: true } }],
    [
      "not mixed, its own label",
      { root: { mixed: false, mixedLabel: "Several", value: "apple" } },
    ],
    ["mixed, its own label", { root: { mixed: true, mixedLabel: "Several" } }],
  ] as const)("a select: %s", async (_name, spec) => {
    const { react, vue } = await both({
      trigger: fruitTrigger,
      placeholder: "Select a fruit",
      nodes: fruit,
      ...(spec as Partial<Spec>),
    });
    expect(vue).toBe(react);
  });

  it("draws the reset with its own words, and none while disabled", async () => {
    for (const root of [
      { mixed: false, value: "apple", resetMixedLabel: "Back to mixed" },
      { mixed: false, value: "apple", disabled: true },
    ])
      for (const trigger of [
        fruitTrigger,
        { ...fruitTrigger, disabled: true },
      ]) {
        const { react, vue } = await serverBoth(
          reactTree({
            root: { ...root, onResetMixed: () => {} },
            trigger,
            nodes: fruit,
          }),
          () =>
            vueTree({
              root: { ...root, onResetMixed: () => {} },
              trigger,
              nodes: fruit,
            }),
        );
        expect(vue).toBe(react);
      }
  });
});

describe("KozmosSelect, mounted, as React's", () => {
  let reactRoot: Root | undefined;
  let vueApp: App | undefined;
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  beforeAll(() => {
    // What jsdom lacks and both primitives call.
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
    Element.prototype.scrollIntoView ??= function () {};
    Element.prototype.hasPointerCapture ??= () => false;
    Element.prototype.releasePointerCapture ??= () => {};
  });
  afterEach(() => {
    act(() => reactRoot?.unmount());
    vueApp?.unmount();
    reactRoot = undefined;
    vueApp = undefined;
    document.body.replaceChildren();
  });
  const wait = async () => {
    for (let i = 0; i < 4; i++) {
      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  };
  // While React's steps run, each wait is an act of its own, so React 18
  // commits what each key did before the next is pressed.
  let inReact = false;
  const settle = () => (inReact ? act(wait) : wait());
  const asReact = async <T>(run: () => Promise<T>) => {
    inReact = true;
    try {
      return await run();
    } finally {
      inReact = false;
    }
  };

  /**
   * The document as each draws it, with what is Radix's and Reka's own
   * spelling of the same thing made one: their attribute prefixes
   * (`data-radix-*`, `data-reka-*`) and custom properties (`--radix-*`,
   * `--reka-*`, a declaration kept once and the declarations sorted), the
   * viewport's scrollbar `<style>` (Radix's before the rows, Reka's after),
   * Reka's layer mark (`data-dismissable-layer`, which its layers read) and
   * Vue's app mark.
   */
  const alike = (html: string) => {
    const document = new DOMParser().parseFromString(html, "text/html");
    document.querySelectorAll("style").forEach((style) => style.remove());
    for (const element of document.body.querySelectorAll("*")) {
      for (const { name, value } of [...element.attributes]) {
        if (name === "data-v-app" || name === "data-dismissable-layer")
          element.removeAttribute(name);
        else if (name.startsWith("data-reka-")) {
          element.removeAttribute(name);
          element.setAttribute(
            name.replace("data-reka-", "data-radix-"),
            value,
          );
        }
      }
      const style = element.getAttribute("style");
      if (style) {
        const seen = new Set<string>();
        const declarations = style
          .replace(/--reka-/g, "--radix-")
          .split(";")
          .map((part) => part.trim())
          .filter(Boolean)
          .filter((part) => {
            const name = part.slice(0, part.indexOf(":")).trim();
            if (seen.has(name)) return false;
            seen.add(name);
            return true;
          })
          .sort();
        element.setAttribute("style", declarations.join(";"));
      }
    }
    return normalizeHtml(document.body.innerHTML);
  };
  const body = () => alike(document.body.innerHTML);

  /**
   * Each drawn alone in the document, in its theme, with what it heard: the
   * root's and the content's events, and analytics. Each owns its value and
   * its open state as an app would, unless `own` says it holds them.
   */
  async function drawEach(
    spec: Spec,
    { controlled = true, wrap }: { controlled?: boolean; wrap?: string } = {},
  ) {
    const heard = {
      react: {
        root: [] as unknown[][],
        content: [] as string[],
        events: [] as KozmosAnalyticsEvent[],
      },
      vue: {
        root: [] as unknown[][],
        content: [] as string[],
        events: [] as KozmosAnalyticsEvent[],
      },
    };
    const start = spec.root ?? {};
    function Owner() {
      const [value, setValue] = React.useState(
        start.value as string | undefined,
      );
      const [open, setOpen] = React.useState(!!start.defaultOpen);
      const [mixed, setMixed] = React.useState(
        start.mixed as boolean | undefined,
      );
      return reactTree(
        {
          ...spec,
          root: {
            ...start,
            ...(controlled ? { value, open } : {}),
            ...(start.mixed === undefined ? {} : { mixed }),
          },
        },
        {
          root: {
            onValueChange: (next: string) => {
              heard.react.root.push(["value", next]);
              setValue(next);
              if (start.mixed !== undefined) setMixed(false);
            },
            onOpenChange: (next: boolean) => {
              heard.react.root.push(["open", next]);
              setOpen(next);
            },
            ...(start.mixed === undefined
              ? {}
              : {
                  onResetMixed: () => {
                    heard.react.root.push(["reset"]);
                    setValue(undefined);
                    setMixed(true);
                  },
                }),
          },
          content: {
            onEscapeKeyDown: () => heard.react.content.push("escape"),
            onPointerDownOutside: () => heard.react.content.push("outside"),
            onCloseAutoFocus: () => heard.react.content.push("closeAutoFocus"),
          },
        },
      );
    }
    const wrapIn = (child: React.ReactElement) =>
      wrap ? e(wrap, { id: "order" }, child) : child;
    let host = document.body.appendChild(document.createElement("div"));
    reactRoot = createRoot(host);
    await act(async () =>
      reactRoot!.render(
        e(
          KozmosReact.AnalyticsProvider,
          {
            batchDelayMs: 0,
            onDispatch: (events: KozmosAnalyticsEvent[]) =>
              heard.react.events.push(...events),
          },
          reactInTheme(wrapIn(e(Owner))),
        ),
      ),
    );
    await act(wait);
    const reactBody = body();
    const swap = async () => {
      act(() => reactRoot?.unmount());
      reactRoot = undefined;
      document.body.replaceChildren();
      host = document.body.appendChild(document.createElement("div"));
      const value = ref(start.value as string | undefined);
      const open = ref(!!start.defaultOpen);
      const mixed = ref(start.mixed as boolean | undefined);
      vueApp = createApp({
        render: () =>
          h(
            KozmosAnalyticsProvider,
            {
              batchDelayMs: 0,
              onDispatch: (events: KozmosAnalyticsEvent[]) =>
                heard.vue.events.push(...events),
            },
            () =>
              vueInTheme(() => {
                const tree = vueTreeOwned(
                  {
                    ...spec,
                    root: {
                      ...start,
                      ...(controlled
                        ? { value: value.value, open: open.value }
                        : {}),
                      ...(start.mixed === undefined
                        ? {}
                        : { mixed: mixed.value }),
                    },
                  },
                  {
                    "onUpdate:modelValue": (next: string) => {
                      heard.vue.root.push(["value", next]);
                      value.value = next;
                      if (start.mixed !== undefined) mixed.value = false;
                    },
                    "onUpdate:open": (next: boolean) => {
                      heard.vue.root.push(["open", next]);
                      open.value = next;
                    },
                    ...(start.mixed === undefined
                      ? {}
                      : {
                          onResetMixed: () => {
                            heard.vue.root.push(["reset"]);
                            value.value = undefined;
                            mixed.value = true;
                          },
                        }),
                  },
                  {
                    onEscapeKeyDown: () => heard.vue.content.push("escape"),
                    onPointerDownOutside: () =>
                      heard.vue.content.push("outside"),
                    onCloseAutoFocus: () =>
                      heard.vue.content.push("closeAutoFocus"),
                  },
                );
                return wrap ? h(wrap, { id: "order" }, [tree]) : tree;
              }),
          ),
      });
      vueApp.mount(host);
      await settle();
      return body();
    };
    return { heard, reactBody, swap };
  }

  /** Vue's tree with the root's and the content's listeners written where the coverage check reads them. */
  function vueTreeOwned(spec: Spec, root: Props, content: Props) {
    return vueTree(spec, {
      root: h(KozmosSelect, {
        "onUpdate:modelValue": root["onUpdate:modelValue"],
        "onUpdate:open": root["onUpdate:open"],
        onResetMixed: root.onResetMixed,
      }).props as Props,
      content: h(KozmosSelectContent, {
        onEscapeKeyDown: content.onEscapeKeyDown,
        onPointerDownOutside: content.onPointerDownOutside,
        onCloseAutoFocus: content.onCloseAutoFocus,
      }).props as Props,
    });
  }

  const trigger = () =>
    document.querySelector<HTMLButtonElement>("[role=combobox]")!;
  const key = (target: Element, name: string) =>
    target.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: name,
        bubbles: true,
        cancelable: true,
      }),
    );
  const read = (events: KozmosAnalyticsEvent[]) =>
    events.map(({ timestamp: _timestamp, ...event }) => event);

  it("draws the chosen item's words in the closed trigger", async () => {
    const drawn = await drawEach(
      {
        trigger: fruitTrigger,
        placeholder: "Pick",
        nodes: fruit,
        root: { defaultValue: "banana" },
      },
      { controlled: false },
    );
    expect(drawn.reactBody).toContain('"Banana"');
    expect(await drawn.swap()).toBe(drawn.reactBody);
  });

  it("draws the open list in the theme's portal, with its groups, labels, separators and density", async () => {
    const drawn = await drawEach(
      {
        trigger: fruitTrigger,
        placeholder: "Pick",
        nodes: timezones,
        root: { defaultOpen: true, defaultValue: "cet" },
      },
      { controlled: false },
    );
    expect(drawn.reactBody).toContain('role="listbox"');
    expect(drawn.reactBody).toContain("data-kozmos-portal");
    expect(await drawn.swap()).toBe(drawn.reactBody);
  });

  it("Option counts, open: each count in the app's grouping, each row named by its words and count", async () => {
    const drawn = await drawEach(
      {
        trigger: { className: "w-56", "aria-label": "Content" },
        nodes: counts(1284),
        root: { defaultOpen: true, defaultValue: "poi" },
      },
      { controlled: false },
    );
    expect(drawn.reactBody).toContain('"1,284"');
    expect(drawn.reactBody).toContain('aria-label="All Content, 1,284"');
    expect(await drawn.swap()).toBe(drawn.reactBody);
  });

  it("the keyboard opens the list and chooses; v-model and v-model:open hear what React's callbacks hear", async () => {
    const steps = async () => {
      trigger().focus();
      key(trigger(), "Enter");
      await settle();
      const list = document.querySelector("[role=listbox]")!;
      const states = [list?.getAttribute("data-state")];
      key(document.activeElement ?? list, "ArrowDown");
      await settle();
      // The value's row has lost focus: Radix no longer marks it selected.
      const moved = body();
      key(document.activeElement ?? list, "Enter");
      await settle();
      return { states, moved, after: body() };
    };
    const drawn = await drawEach({
      trigger: fruitTrigger,
      placeholder: "Pick",
      nodes: fruit,
      root: { value: "apple" },
    });
    const react = await asReact(steps);
    const reactAfter = body();
    await drawn.swap();
    const vue = await steps();
    expect(react.states).toEqual(["open"]);
    expect(vue.states).toEqual(react.states);
    expect(drawn.heard.react.root).toEqual([
      ["open", true],
      ["value", "banana"],
      ["open", false],
    ]);
    expect(drawn.heard.vue.root).toEqual(drawn.heard.react.root);
    expect(drawn.heard.vue.content).toEqual(drawn.heard.react.content);
    expect(read(drawn.heard.react.events)).toEqual([
      {
        component: "Select",
        eventName: "select_value_changed",
        properties: { value: "banana" },
      },
    ]);
    expect(read(drawn.heard.vue.events)).toEqual(
      read(drawn.heard.react.events),
    );
    expect(vue.moved).toBe(react.moved);
    expect(vue.after).toBe(reactAfter);
  });

  it("an item taken away takes its words out of the trigger and its option out of the form's select", async () => {
    const items = ref(["apple", "banana"]);
    let setItems: (next: string[]) => void = () => {};
    function Owner() {
      const [given, setGiven] = React.useState(["apple", "banana"]);
      setItems = setGiven;
      return reactTree({
        root: { defaultValue: "banana", name: "fruit" },
        trigger: fruitTrigger,
        nodes: given.map((value) => ({ item: value, words: value })),
      });
    }
    let host = document.body.appendChild(document.createElement("form"));
    reactRoot = createRoot(host);
    await act(async () => reactRoot!.render(reactInTheme(e(Owner))));
    await act(wait);
    await act(async () => setItems(["apple"]));
    await act(wait);
    const react = body();
    expect(react).not.toContain('"banana"');
    act(() => reactRoot?.unmount());
    reactRoot = undefined;
    document.body.replaceChildren();
    host = document.body.appendChild(document.createElement("form"));
    vueApp = createApp({
      render: () =>
        vueInTheme(() =>
          vueTree({
            root: { defaultValue: "banana", name: "fruit" },
            trigger: fruitTrigger,
            nodes: items.value.map((value) => ({ item: value, words: value })),
          }),
        ),
    });
    vueApp.mount(host);
    await settle();
    items.value = ["apple"];
    await settle();
    expect(body()).toBe(react);
  });

  it("Escape closes the list, with escapeKeyDown and closeAutoFocus", async () => {
    const steps = async () => {
      const list = document.querySelector("[role=listbox]")!;
      key(document.activeElement ?? list, "Escape");
      await settle();
    };
    const drawn = await drawEach({
      trigger: fruitTrigger,
      placeholder: "Pick",
      nodes: fruit,
      root: { defaultOpen: true },
    });
    await asReact(steps);
    const reactAfter = body();
    await drawn.swap();
    await steps();
    expect(drawn.heard.react.content).toEqual(["escape", "closeAutoFocus"]);
    expect(drawn.heard.vue.content).toEqual(drawn.heard.react.content);
    expect(drawn.heard.vue.root).toEqual(drawn.heard.react.root);
    expect(body()).toBe(reactAfter);
  });

  it("a press outside closes the list, with pointerDownOutside", async () => {
    const steps = async () => {
      document.body.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, button: 0 }),
      );
      await settle();
    };
    const drawn = await drawEach({
      trigger: fruitTrigger,
      placeholder: "Pick",
      nodes: fruit,
      root: { defaultOpen: true },
    });
    await asReact(steps);
    await drawn.swap();
    await steps();
    expect(drawn.heard.react.content).toContain("outside");
    expect(drawn.heard.vue.content).toEqual(drawn.heard.react.content);
    expect(drawn.heard.vue.root).toEqual(drawn.heard.react.root);
  });

  it("a mixed field takes a choice, then its reset takes it back to mixed", async () => {
    const steps = async () => {
      trigger().focus();
      key(trigger(), "Enter");
      await settle();
      key(document.activeElement!, "Enter");
      await settle();
      const shown = body();
      document
        .querySelector<HTMLButtonElement>("[data-slot=reset-mixed]")
        ?.click();
      await settle();
      return { shown, after: body() };
    };
    const drawn = await drawEach({
      trigger: fruitTrigger,
      placeholder: "Pick",
      nodes: fruit,
      root: { mixed: true },
    });
    const react = await asReact(steps);
    expect(react.shown).toContain("Reset to multiple values");
    expect(react.after).toContain("Multiple values");
    await drawn.swap();
    const vue = await steps();
    expect(drawn.heard.react.root.map(([name]) => name)).toContain("reset");
    expect(drawn.heard.vue.root).toEqual(drawn.heard.react.root);
    expect(vue.shown).toBe(react.shown);
    expect(vue.after).toBe(react.after);
  });

  it("in a form, its select lists the items and is told of each choice", async () => {
    const changes: string[] = [];
    const steps = async () => {
      const form = document.querySelector("form")!;
      form.addEventListener("change", (event) =>
        changes.push((event.target as HTMLSelectElement).value),
      );
      trigger().focus();
      key(trigger(), "Enter");
      await settle();
      key(document.activeElement!, "ArrowDown");
      await settle();
      key(document.activeElement!, "Enter");
      await settle();
      return document.querySelector("select")!.outerHTML;
    };
    const drawn = await drawEach(
      {
        trigger: fruitTrigger,
        placeholder: "Pick",
        nodes: fruit,
        root: { name: "fruit", defaultValue: "apple" },
      },
      { controlled: false, wrap: "form" },
    );
    expect(drawn.reactBody).toContain("<select");
    const react = await asReact(steps);
    const reactChanges = changes.splice(0);
    expect(await drawn.swap()).toBe(drawn.reactBody);
    const vue = await steps();
    expect(reactChanges).toEqual(["banana"]);
    expect(changes).toEqual(reactChanges);
    expect(normalizeHtml(vue)).toBe(normalizeHtml(react));
  });
});
