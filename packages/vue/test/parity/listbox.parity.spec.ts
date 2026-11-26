// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import { createApp, h, nextTick, ref, type App } from "vue";
import { KozmosListbox, KozmosThemeProvider } from "../../src/index";
import { normalizeHtml } from "./normalize-html";
import { renderBoth, type Drawn } from "./render";

/**
 * What the stories parity check cannot draw from React's args, drawn in
 * both: Single, Multiple and Grouped, whose options are named constants.
 * Then the edges React's tests cover (Listbox.test.tsx, Listbox.active,
 * Listbox.embedded, option-groups, selection-regressions): rows with a
 * description, an Avatar, trailing words and a disabled row, a disabled
 * and an embedded list, a product's active option, and an app's class and
 * attributes. Then, mounted: the arrows skip what cannot be chosen, Home and
 * End, Enter and Space choose, a press focuses the list and chooses, a
 * multiple list toggles, v-model and v-model:active-value hear what
 * onValueChange and onActiveValueChange hear, new options move the active
 * one (GAP-231), and the keyboard's ring follows the hand.
 */
const options = [
  { value: "nearby", label: "Nearby", description: "Closest locations first" },
  { value: "popular", label: "Popular", description: "Highest engagement" },
  { value: "recent", label: "Recent", description: "Newest activity" },
];
const contentTypes = [
  { value: "office-desk", label: "Office Desk", group: "Interior Asset" },
  { value: "reception-desk", label: "Reception Desk", group: "POI" },
  { value: "hot-desk", label: "Hot Desk", group: "Interior Asset" },
];
const plain = [
  { value: "alpha", label: "Alpha" },
  { value: "beta", label: "Beta", disabled: true },
  { value: "gamma", label: "Gamma" },
  { value: "delta", label: "Delta" },
];

const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});
const listbox = (props: Record<string, unknown>): Drawn => {
  const { className, value, tabIndex, ...rest } = props;
  return {
    react: KozmosReact.Listbox,
    vue: KozmosListbox,
    props,
    vueProps: {
      ...rest,
      ...(value === undefined ? {} : { modelValue: value }),
      ...(className === undefined ? {} : { class: className }),
      // An app writes the attribute as Vue spells it.
      ...(tabIndex === undefined ? {} : { tabindex: tabIndex }),
    },
  };
};
const both = (props: Record<string, unknown>) =>
  renderBoth(inTheme(listbox(props)));

describe("KozmosListbox draws what React's Listbox draws", () => {
  it("Single: draws what React's story draws", async () => {
    const { react, vue } = await both({
      "aria-label": "Sort locations",
      defaultValue: "nearby",
      options,
    });
    expect(react).toContain('role="listbox"');
    expect(react).toContain('aria-selected="true"');
    expect(vue).toBe(react);
  });

  it("Multiple: draws what React's story draws", async () => {
    const { react, vue } = await both({
      "aria-label": "Sort locations",
      multiple: true,
      defaultValue: ["nearby", "recent"],
      options,
    });
    expect(react).toContain('aria-multiselectable="true"');
    expect(vue).toBe(react);
  });

  it("Grouped: draws what React's story draws", async () => {
    const { react, vue } = await both({
      "aria-label": "Content type",
      defaultValue: "hot-desk",
      options: contentTypes,
    });
    expect(react).toContain('role="group"');
    expect(react).toContain("kozmos-option-group-label");
    expect(vue).toBe(react);
  });

  it.each([
    ["no choice", { options: plain }],
    ["a disabled row first", { options: [...plain].reverse() }],
    ["a choice past a disabled row", { options: plain, defaultValue: "gamma" }],
    ["disabled", { options: plain, disabled: true }],
    ["embedded (GAP-271)", { options, embedded: true }],
    ["controlled", { options: plain, value: "delta" }],
    [
      "controlled, multiple",
      { options: plain, multiple: true, value: ["alpha", "delta"] },
    ],
    [
      "a product's active option (GAP-260)",
      { options: plain, activeValue: "gamma" },
    ],
    ["no active option", { options: plain, activeValue: null }],
    [
      "rows with media and trailing words",
      {
        options: [
          { value: "acme", label: "Acme Corp", media: { src: "/logo.png" } },
          {
            value: "pointr",
            label: "Pointr Cloud",
            media: {},
            trailing: "Admin",
          },
          {
            value: "own",
            label: "Own",
            media: { initials: "OW" },
            trailing: 12,
          },
        ],
      },
    ],
    ["its own id", { options: plain, id: "routes" }],
    ["an app's class", { options: plain, className: "w-80 kozmos-parity" }],
    [
      "an app's role and tabindex",
      { options: plain, role: "menu", tabIndex: -1 },
    ],
  ] as const)("a list: %s", async (_name, props) => {
    const { react, vue } = await both({ "aria-label": "Routes", ...props });
    expect(vue).toBe(react);
  });
});

describe("KozmosListbox, mounted, as React's", () => {
  let reactRoot: Root | undefined;
  let vueApp: App | undefined;
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  afterEach(() => {
    act(() => reactRoot?.unmount());
    vueApp?.unmount();
    reactRoot = undefined;
    vueApp = undefined;
    document.body.replaceChildren();
  });
  const host = () => document.body.appendChild(document.createElement("div"));
  const snapshot = (root: HTMLElement) => normalizeHtml(root.innerHTML);
  // Read when focus is not where the step left it: the ring left out.
  const unfocused = (root: HTMLElement) =>
    normalizeHtml(root.innerHTML, { ignore: ["data-modality"] });
  const list = (root: HTMLElement) =>
    root.querySelector<HTMLElement>('[role="listbox"]')!;
  const rows = (root: HTMLElement) => [
    ...root.querySelectorAll<HTMLElement>('[role="option"]'),
  ];
  let shots = { react: "", vue: "" };
  const activeLabel = (root: HTMLElement) => {
    const id = list(root).getAttribute("aria-activedescendant");
    return id ? document.getElementById(id)?.textContent : null;
  };

  /**
   * Both, each owning its value and, when asked, its active option, as an
   * app would: React's in state, Vue's in refs bound with v-model. What each
   * heard.
   */
  async function drawBoth(
    props: Record<string, unknown>,
    {
      value,
      active,
    }: { value?: string | string[]; active?: string | null } = {},
  ) {
    const heard = {
      react: { values: [] as unknown[][], actives: [] as unknown[] },
      vue: { values: [] as unknown[][], actives: [] as unknown[] },
    };
    let setReactOptions: (next: unknown) => void = () => {};
    function Owner() {
      const [current, setCurrent] = React.useState(value);
      const [activeValue, setActive] = React.useState(active);
      const [given, setGiven] = React.useState(props.options);
      setReactOptions = setGiven;
      return React.createElement(KozmosReact.Listbox, {
        "aria-label": "Routes",
        ...props,
        options: given,
        ...(value === undefined ? {} : { value: current }),
        ...(active === undefined ? {} : { activeValue }),
        onValueChange: (...args: unknown[]) => {
          heard.react.values.push(args);
          setCurrent(args[0] as string);
        },
        onActiveValueChange: (next: unknown) => {
          heard.react.actives.push(next);
          setActive(next as string | null);
        },
      } as never);
    }
    const reactHost = host();
    reactRoot = createRoot(reactHost);
    await act(async () => reactRoot!.render(React.createElement(Owner)));
    const current = ref(value);
    const activeValue = ref(active);
    const given = ref(props.options);
    const vueHost = host();
    vueApp = createApp({
      render: () =>
        h(KozmosListbox, {
          "aria-label": "Routes",
          ...props,
          options: given.value,
          ...(value === undefined ? {} : { modelValue: current.value }),
          ...(active === undefined ? {} : { activeValue: activeValue.value }),
          "onUpdate:modelValue": (...args: unknown[]) => {
            heard.vue.values.push(args);
            current.value = args[0] as string;
          },
          "onUpdate:activeValue": (next: unknown) => {
            heard.vue.actives.push(next);
            activeValue.value = next as string | null;
          },
        }),
    });
    vueApp.mount(vueHost);
    await nextTick();
    const setOptions = async (next: unknown) => {
      await act(async () => setReactOptions(next));
      given.value = next;
      await nextTick();
      shots = { react: unfocused(reactHost), vue: unfocused(vueHost) };
    };
    shots = { react: snapshot(reactHost), vue: snapshot(vueHost) };
    return { heard, reactHost, vueHost, setOptions };
  }
  type Drawn2 = Awaited<ReturnType<typeof drawBoth>>;
  // Focus is one document's: each is read right after its own step, while
  // its own list has it.
  const inBoth = async (drawn: Drawn2, fn: (root: HTMLElement) => void) => {
    await act(async () => fn(drawn.reactHost));
    const react = snapshot(drawn.reactHost);
    fn(drawn.vueHost);
    await nextTick();
    shots = { react, vue: snapshot(drawn.vueHost) };
  };
  const press = (key: string) => (root: HTMLElement) => {
    list(root).focus();
    list(root).dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
    );
  };
  const same = (_drawn?: Drawn2) => expect(shots.vue).toBe(shots.react);

  it("the arrows skip what cannot be chosen, Home and End go to the ends, and Enter and Space choose", async () => {
    const drawn = await drawBoth({ options: plain });
    same(drawn);
    for (const [key, label] of [
      ["ArrowDown", "Gamma"],
      ["ArrowDown", "Delta"],
      ["ArrowDown", "Alpha"],
      ["ArrowUp", "Delta"],
      ["Home", "Alpha"],
      ["End", "Delta"],
      ["Enter", "Delta"],
      ["ArrowUp", "Gamma"],
      [" ", "Gamma"],
    ] as const) {
      await inBoth(drawn, press(key));
      expect(activeLabel(drawn.reactHost)).toBe(label);
      same(drawn);
    }
    expect(drawn.heard.react.values.map(([v]) => v)).toEqual([
      "delta",
      "gamma",
    ]);
    expect(drawn.heard.vue.values).toEqual(drawn.heard.react.values);
    expect(drawn.heard.vue.actives).toEqual(drawn.heard.react.actives);
    expect(drawn.heard.react.actives.length).toBeGreaterThan(4);
  });

  it("a press focuses the list and chooses; a disabled row and a disabled list take none", async () => {
    const drawn = await drawBoth({ options: plain }, { value: "" });
    await inBoth(drawn, (root) => rows(root)[2].click());
    expect(document.activeElement).toBe(list(drawn.vueHost));
    await inBoth(drawn, (root) => rows(root)[1].click());
    // The disabled row takes no focus: each list keeps what the other's step
    // left it, so the ring is left out.
    expect(unfocused(drawn.vueHost)).toBe(unfocused(drawn.reactHost));
    expect(drawn.heard.react.values.map(([v]) => v)).toEqual(["gamma"]);
    expect(drawn.heard.vue.values).toEqual(drawn.heard.react.values);

    const off = await drawBoth({ options: plain, disabled: true });
    await inBoth(off, (root) => rows(root)[0].click());
    await inBoth(off, press("Enter"));
    expect(off.heard.react.values).toEqual([]);
    expect(off.heard.vue.values).toEqual([]);
  });

  it("a multiple list toggles each choice in and out of its values", async () => {
    const drawn = await drawBoth(
      { options: plain, multiple: true },
      { value: ["alpha"] },
    );
    await inBoth(drawn, (root) => rows(root)[2].click());
    await inBoth(drawn, (root) => rows(root)[0].click());
    same(drawn);
    expect(drawn.heard.react.values.map(([v]) => v)).toEqual([
      ["alpha", "gamma"],
      ["gamma"],
    ]);
    expect(drawn.heard.vue.values).toEqual(drawn.heard.react.values);
  });

  it("holds its own choice from default-value when nothing is bound", async () => {
    const drawn = await drawBoth({ options: plain, defaultValue: "delta" });
    same(drawn);
    await inBoth(drawn, (root) => rows(root)[0].click());
    same(drawn);
    expect(rows(drawn.vueHost)[0].getAttribute("aria-selected")).toBe("true");
  });

  it("a product's active option wins: the list only asks for a move (GAP-260)", async () => {
    const drawn = await drawBoth({ options: plain }, { active: "gamma" });
    expect(activeLabel(drawn.vueHost)).toBe("Gamma");
    await inBoth(drawn, press("ArrowDown"));
    expect(activeLabel(drawn.reactHost)).toBe("Delta");
    same(drawn);
    await inBoth(drawn, (root) =>
      rows(root)[0].dispatchEvent(
        new MouseEvent("mouseover", { bubbles: true }),
      ),
    );
    // React's onMouseEnter is its mouseover; Vue's is mouseenter.
    rows(drawn.vueHost)[0].dispatchEvent(new MouseEvent("mouseenter"));
    await nextTick();
    shots = {
      react: unfocused(drawn.reactHost),
      vue: unfocused(drawn.vueHost),
    };
    same(drawn);
    expect(drawn.heard.react.actives).toEqual(["delta", "alpha"]);
    expect(drawn.heard.vue.actives).toEqual(drawn.heard.react.actives);
  });

  it("new options move the active one to where the list starts, and a disabled one gives way (GAP-231)", async () => {
    const drawn = await drawBoth({ options: plain });
    await inBoth(drawn, press("End"));
    expect(activeLabel(drawn.vueHost)).toBe("Delta");
    await drawn.setOptions([
      { value: "epsilon", label: "Epsilon", disabled: true },
      { value: "zeta", label: "Zeta" },
    ]);
    expect(activeLabel(drawn.reactHost)).toBe("Zeta");
    same(drawn);
    // The same values anew move nothing.
    await inBoth(drawn, press("ArrowDown"));
    await drawn.setOptions([
      { value: "epsilon", label: "Epsilon", disabled: true },
      { value: "zeta", label: "Zeta" },
    ]);
    same(drawn);
    // The active one made disabled: the next enabled one takes over.
    await drawn.setOptions([
      { value: "epsilon", label: "Epsilon" },
      { value: "zeta", label: "Zeta", disabled: true },
    ]);
    expect(activeLabel(drawn.reactHost)).toBe("Epsilon");
    same(drawn);
  });

  it("draws the keyboard's ring only while the list has focus, after a key", async () => {
    const drawn = await drawBoth({ options: plain });
    expect(list(drawn.vueHost).hasAttribute("data-modality")).toBe(false);
    await inBoth(drawn, press("ArrowDown"));
    same(drawn);
    expect(list(drawn.vueHost).getAttribute("data-modality")).toBe("keyboard");
    await inBoth(drawn, (root) => list(root).blur());
    same(drawn);
  });
});
