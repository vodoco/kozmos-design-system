// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import * as ReactIcons from "@kozmos-ds/icons";
import * as VueIcons from "@kozmos-ds/icons/vue";
import { createApp, h, nextTick, ref, type App } from "vue";
import {
  KozmosChip,
  KozmosChipGroup,
  KozmosThemeProvider,
} from "../../src/index";
import { normalizeHtml } from "./normalize-html";
import { renderBoth, type Drawn } from "./render";
import { slotted } from "./slotted";

/**
 * Chip and ChipGroup, drawn in both: React's Chip stories (each its own
 * render of a group and its chips), then the edges React's tests cover
 * (Chip.test.tsx): a plain chip, a toggle and its pressed state, the
 * legacy `active`, a removable chip and its remove's name, a disabled
 * one, each emotion at rest and selected with a caller's style, a chip
 * with a keydown listener, an app's class and attributes; a group of
 * toggles, and a single-choice group, chosen and not, disabled, right to
 * left, inside a form.
 *
 * Then, mounted: a toggle's click is heard on its press area; the remove
 * emits `remove` and keeps the chip's click unheard; a single-choice group
 * is one Tab stop on the chosen chip, the arrows move the choice (passing
 * a disabled chip, the way the text reads, right to left too), a second
 * press does not empty it, and v-model hears what onValueChange hears.
 */
type Props = Record<string, unknown>;
const inTheme = (...children: (Drawn | string)[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});
/** React's props as Vue writes them: `className` is `class`, a group's `value` the model. */
const asVue = (props: Props, isGroup = false) => {
  const { className, value, onRemove, ...rest } = props;
  return {
    ...rest,
    ...(className === undefined ? {} : { class: className }),
    ...(value === undefined ? {} : isGroup ? { modelValue: value } : { value }),
    ...(onRemove === undefined ? {} : { onRemove }),
  };
};
const chip = (props: Props, label: string, icon?: string): Drawn =>
  icon
    ? slotted(
        KozmosReact.Chip,
        KozmosChip,
        props,
        {
          icon: [
            {
              react: (ReactIcons as Record<string, React.ElementType>)[icon],
              vue: (VueIcons as Record<string, Drawn["vue"]>)[icon],
            },
          ],
          default: [label],
        },
        asVue(props),
      )
    : {
        react: KozmosReact.Chip,
        vue: KozmosChip,
        props,
        vueProps: asVue(props),
        children: [label],
      };
const group = (props: Props, chips: Drawn[]): Drawn => ({
  react: KozmosReact.ChipGroup,
  vue: KozmosChipGroup,
  props,
  vueProps: asVue(props, true),
  children: chips,
});
const both = (tree: Drawn) => renderBoth(inTheme(tree));
const noop = () => {};

describe("KozmosChip draws React's Chip stories", () => {
  it("Default", async () => {
    const filter = (selected: boolean, label: string, icon?: string) =>
      chip({ selected, onClick: noop }, label, icon);
    const { react, vue } = await both(
      group({ className: "max-w-[460px]" }, [
        filter(true, "All"),
        filter(false, "Food & Drink", "Utensils"),
        filter(false, "Coffee", "Utensils"),
        filter(false, "Retail", "ShoppingBag01"),
        filter(false, "Places", "MarkerPin01"),
        chip({ onRemove: noop, variant: "brand" }, "Open now"),
      ]),
    );
    expect(react).toContain('aria-pressed="true"');
    expect(react).toContain('aria-label="Remove Open now"');
    expect(vue).toBe(react);
  });

  it("Sizes", async () => {
    const { react, vue } = await both(
      group({}, [
        chip({ size: "sm" }, "Small"),
        chip({}, "Default"),
        chip({ size: "lg" }, "Large"),
      ]),
    );
    expect(vue).toBe(react);
  });

  it("Variants", async () => {
    const { react, vue } = await both(
      group({}, [
        chip({ variant: "neutral" }, "Neutral"),
        chip({ variant: "brand" }, "Brand"),
        chip({ variant: "destructive" }, "Destructive"),
        chip({ selected: true }, "Selected"),
        chip(
          { variant: "destructive", selected: true },
          "Selected destructive",
        ),
        chip({ disabled: true }, "Disabled"),
      ]),
    );
    expect(vue).toBe(react);
  });

  it("OneChoice", async () => {
    const { react, vue } = await both(
      group(
        {
          "aria-label": "Search in",
          selectionMode: "single",
          value: "airport",
          onValueChange: noop,
        },
        [
          chip({ value: "airport" }, "Whole airport"),
          chip({ value: "t2" }, "Terminal 2"),
        ],
      ),
    );
    expect(react).toContain('role="radiogroup"');
    expect(vue).toBe(react);
  });
});

describe("KozmosChip draws what React's Chip draws", () => {
  it.each([
    ["plain", {}],
    ["a toggle", { onClick: noop }],
    ["a selected toggle", { onClick: noop, selected: true }],
    ["the legacy active", { onClick: noop, active: true }],
    ["selected beats active", { onClick: noop, active: true, selected: false }],
    ["removable", { onRemove: noop }],
    ["removable, its own words", { onRemove: noop, removeLabel: "Drop it" }],
    ["removable and selected", { onRemove: noop, selected: true }],
    [
      "removable, selected and destructive",
      { onRemove: noop, selected: true, variant: "destructive" },
    ],
    ["removable and brand", { onRemove: noop, variant: "brand", size: "lg" }],
    ["removable and disabled", { onRemove: noop, disabled: true }],
    ["a disabled toggle", { onClick: noop, disabled: true }],
    ["a keydown listener", { onKeyDown: noop }],
    ["a keydown listener, disabled", { onKeyDown: noop, disabled: true }],
    [
      "an app's class and attributes",
      { className: "px-6", id: "chip", title: "A chip", "data-x": "1" },
    ],
    ["a value outside a group", { value: "x", onClick: noop }],
  ] as const)("a chip: %s", async (_name, props) => {
    const vueProps: Props = { ...asVue(props as Props) };
    if ("onKeyDown" in props) {
      delete vueProps.onKeyDown;
      vueProps.onKeydown = noop;
    }
    const { react, vue } = await both({
      react: KozmosReact.Chip,
      vue: KozmosChip,
      props: props as Props,
      vueProps,
      children: ["Coffee"],
    });
    expect(vue).toBe(react);
  });

  it.each(["neutral", "themed", "success", "danger", "informative", "alert"])(
    "the %s emotion, at rest, selected and removable, under a caller's style",
    async (emotion) => {
      for (const props of [
        { emotion },
        { emotion, selected: true, onClick: noop },
        { emotion, onRemove: noop },
        { emotion, onRemove: noop, selected: true },
        { emotion, variant: "destructive", style: { color: "red" } },
      ]) {
        const { react, vue } = await both(chip(props, "Coffee"));
        expect(vue).toBe(react);
      }
    },
  );

  it("names a remove by 'chip' when its label is not text", async () => {
    const { react, vue } = await both({
      react: KozmosReact.Chip,
      vue: KozmosChip,
      props: { onRemove: noop },
      children: [{ react: "b", vue: "b", children: ["Bold"] }],
    });
    expect(react).toContain('aria-label="Remove chip"');
    expect(vue).toBe(react);
  });
});

describe("KozmosChipGroup draws what React's ChipGroup draws", () => {
  const chips = () => [
    chip({ value: "a" }, "A"),
    chip({ value: "b", disabled: true }, "B"),
    chip({ value: "c", onRemove: noop }, "C"),
  ];
  it.each([
    ["toggles", {}],
    ["toggles, right to left", { dir: "rtl", className: "gap-4" }],
    ["one choice, none chosen", { selectionMode: "single" }],
    ["one choice, by default", { selectionMode: "single", defaultValue: "a" }],
    [
      "one choice, held",
      { selectionMode: "single", value: "c", onValueChange: noop },
    ],
    ["one choice, disabled", { selectionMode: "single", disabled: true }],
    [
      "one choice, right to left",
      { selectionMode: "single", dir: "rtl", "aria-label": "Scope" },
    ],
    [
      "one choice, named and required",
      { selectionMode: "single", name: "scope", required: true },
    ],
  ] as const)("a group: %s", async (_name, props) => {
    const { react, vue } = await both(group(props as Props, chips()));
    expect(vue).toBe(react);
  });
});

describe("KozmosChip and KozmosChipGroup, mounted, as React's", () => {
  let reactRoot: Root | undefined;
  let vueApp: App | undefined;
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  beforeAll(() => {
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  });
  afterEach(() => {
    act(() => reactRoot?.unmount());
    vueApp?.unmount();
    reactRoot = undefined;
    vueApp = undefined;
    document.body.replaceChildren();
  });
  const host = () => document.body.appendChild(document.createElement("div"));
  const snapshot = (root: HTMLElement) => normalizeHtml(root.innerHTML);
  const settle = () => new Promise((resolve) => setTimeout(resolve, 20));
  async function mountReact(node: React.ReactNode) {
    const element = host();
    reactRoot = createRoot(element);
    await act(async () =>
      reactRoot!.render(
        React.createElement(KozmosReact.ThemeProvider, null, node),
      ),
    );
    return element;
  }
  async function mountVue(render: () => ReturnType<typeof h>) {
    const element = host();
    vueApp = createApp({
      render: () => h(KozmosThemeProvider, null, () => render()),
    });
    vueApp.mount(element);
    await nextTick();
    return element;
  }
  const act2 = async (fn: () => void) => {
    await act(async () => fn());
    await nextTick();
  };

  it("a toggle's click is heard on its press area; the remove emits remove, and the chip's click is not heard", async () => {
    const heard = {
      react: [] as string[],
      vue: [] as string[],
    };
    const reactHost = await mountReact(
      React.createElement(
        KozmosReact.Chip,
        {
          onClick: (event: React.MouseEvent) =>
            heard.react.push(
              `click:${(event.target as HTMLElement).localName}`,
            ),
          onRemove: () => heard.react.push("remove"),
        },
        "Coffee",
      ),
    );
    const vueHost = await mountVue(() =>
      h(
        KozmosChip,
        {
          onClick: (event: MouseEvent) =>
            heard.vue.push(`click:${(event.target as HTMLElement).localName}`),
          onRemove: () => heard.vue.push("remove"),
        },
        () => "Coffee",
      ),
    );
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    for (const root of [reactHost, vueHost]) {
      const [press, remove] = root.querySelectorAll("button");
      await act2(() => press.click());
      await act2(() => remove.click());
    }
    expect(heard.react).toEqual(["click:button", "remove"]);
    expect(heard.vue).toEqual(heard.react);
  });

  it("a keydown on a plain chip is heard on its focusable content", async () => {
    const heard = { react: [] as string[], vue: [] as string[] };
    const reactHost = await mountReact(
      React.createElement(
        KozmosReact.Chip,
        {
          onKeyDown: (event: React.KeyboardEvent) =>
            heard.react.push(event.key),
        },
        "Coffee",
      ),
    );
    const vueHost = await mountVue(() =>
      h(
        KozmosChip,
        { onKeydown: (event: KeyboardEvent) => heard.vue.push(event.key) },
        () => "Coffee",
      ),
    );
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    for (const root of [reactHost, vueHost]) {
      const target = root.querySelector<HTMLElement>("[tabindex='0']")!;
      await act2(() => {
        target.dispatchEvent(
          new KeyboardEvent("keydown", { key: "x", bubbles: true }),
        );
      });
    }
    expect(heard.react).toEqual(["x"]);
    expect(heard.vue).toEqual(heard.react);
  });

  /** A single-choice group in both, uncontrolled or held, with what each heard. */
  async function choiceBoth(props: Props = {}) {
    const heard = { react: [] as unknown[][], vue: [] as unknown[][] };
    const options = [
      { value: "a", label: "Whole airport" },
      { value: "b", label: "Gate B", disabled: true },
      { value: "c", label: "Terminal 2" },
    ];
    const reactHost = await mountReact(
      React.createElement(
        KozmosReact.ChipGroup,
        {
          "aria-label": "Search in",
          selectionMode: "single",
          ...props,
          onValueChange: (...args: unknown[]) => heard.react.push(args),
        },
        options.map(({ label, ...option }) =>
          React.createElement(
            KozmosReact.Chip,
            { key: option.value, ...option },
            label,
          ),
        ),
      ),
    );
    const vueHost = await mountVue(() =>
      h(
        KozmosChipGroup,
        {
          "aria-label": "Search in",
          selectionMode: "single",
          ...asVue(props, true),
          "onUpdate:modelValue": (...args: unknown[]) => heard.vue.push(args),
        },
        () =>
          options.map(({ label, ...option }) =>
            h(KozmosChip, { key: option.value, ...option }, () => label),
          ),
      ),
    );
    return { heard, reactHost, vueHost };
  }
  const radios = (root: HTMLElement) => [
    ...root.querySelectorAll<HTMLButtonElement>("[role=radio]"),
  ];

  it("draws what React's draws once mounted, its hidden inputs gone", async () => {
    const { reactHost, vueHost } = await choiceBoth({ defaultValue: "a" });
    expect(reactHost.innerHTML).not.toContain("<input");
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });

  it("is one Tab stop on the chosen chip; a press chooses, a second press does not empty it", async () => {
    const { heard, reactHost, vueHost } = await choiceBoth({
      defaultValue: "c",
    });
    for (const root of [reactHost, vueHost]) {
      const radiogroup = root.querySelector<HTMLElement>("[role=radiogroup]")!;
      await act2(() => radiogroup.focus());
      expect(radios(root).indexOf(document.activeElement as never)).toBe(2);
      await act2(() => radios(root)[0].click());
      await act2(() => radios(root)[0].click());
      await act2(() => radios(root)[1].click());
    }
    expect(heard.react).toEqual([["a"]]);
    expect(heard.vue).toEqual(heard.react);
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });

  it.each(["ltr", "rtl"])(
    "the arrows move the choice the way the text reads (%s), passing a chip that cannot be chosen",
    async (dir) => {
      const { heard, reactHost, vueHost } = await choiceBoth({
        defaultValue: "a",
        dir,
      });
      const press = async (root: HTMLElement, key: string) => {
        const target = document.activeElement as HTMLElement;
        await act(async () => {
          target.dispatchEvent(
            new KeyboardEvent("keydown", {
              key,
              bubbles: true,
              cancelable: true,
            }),
          );
        });
        await act(async () => {
          await settle();
        });
        await act(async () => {
          target.dispatchEvent(
            new KeyboardEvent("keyup", { key, bubbles: true }),
          );
        });
        await nextTick();
        return radios(root).indexOf(document.activeElement as never);
      };
      const walk = async (root: HTMLElement) => {
        radios(root)[0].focus();
        const seen = [];
        for (const key of ["ArrowRight", "ArrowRight", "ArrowLeft", "Enter"])
          seen.push(await press(root, key));
        return seen;
      };
      const reactWalk = await walk(reactHost);
      expect(await walk(vueHost)).toEqual(reactWalk);
      expect(heard.vue).toEqual(heard.react);
      expect(heard.react.length).toBeGreaterThan(0);
      expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    },
  );

  it("a held choice waits for its owner, and v-model binds both ways", async () => {
    const heard: unknown[] = [];
    const scope = ref("a");
    const vueHost = await mountVue(() =>
      h(
        KozmosChipGroup,
        {
          selectionMode: "single",
          "aria-label": "Search in",
          modelValue: scope.value,
          "onUpdate:modelValue": (value: string) => {
            heard.push(value);
            scope.value = value;
          },
        },
        () => [
          h(KozmosChip, { value: "a" }, () => "A"),
          h(KozmosChip, { value: "c" }, () => "C"),
        ],
      ),
    );
    await act2(() => radios(vueHost)[1].click());
    expect(heard).toEqual(["c"]);
    expect(radios(vueHost)[1].getAttribute("aria-checked")).toBe("true");
    scope.value = "a";
    await nextTick();
    expect(radios(vueHost)[0].getAttribute("aria-checked")).toBe("true");
  });
});
