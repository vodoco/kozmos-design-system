// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { act } from "react";
import { renderToString as reactToString } from "react-dom/server";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import {
  createApp,
  createSSRApp,
  defineComponent,
  h,
  inject,
  nextTick,
  type App,
} from "vue";
import { renderToString as vueToString } from "vue/server-renderer";
import {
  KozmosButton,
  KozmosDesignConfigProvider,
  KozmosThemeProvider,
  useDesignConfig,
  useTheme,
  type KozmosDesignConfig,
} from "../../src/index";
import { MotionKey } from "../../src/theme/injection";
import { normalizeHtml } from "./normalize-html";

/**
 * GAP-291: Vue's KozmosDesignConfigProvider applies a config as React's
 * DesignConfigProvider does, from the one recipe both draw with
 * (packages/react/src/recipes/design-config.ts): the same custom properties
 * on the same element, the same scope and SVG filters, the same reduced
 * motion carried to every portal, the same spotlight following the pointer,
 * and the same events. Each framework names the provider's id its own way;
 * it is renamed `DESIGN` in both before they are compared.
 */
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

type Props = Record<string, unknown>;

/** The provider's id in a render, from its scope's mark. */
const designId = (html: string) =>
  html.match(/data-kozmos-design-scope="([^"]+)"/)?.[1];
/** Every occurrence of each id named `DESIGN`, then the HTML normalised. */
function canonical(html: string) {
  let out = html;
  const ids = new Set(
    [...html.matchAll(/data-kozmos-design-scope="([^"]+)"/g)].map((m) => m[1]),
  );
  [...ids].forEach((id, n) => {
    out = out.split(id).join(`DESIGN-${n + 1}`);
  });
  return normalizeHtml(out);
}

async function serverRenders(props: Props, text = "Configured") {
  const react = reactToString(
    React.createElement(KozmosReact.DesignConfigProvider, props, text),
  );
  const vue = await vueToString(
    createSSRApp({
      render: () => h(KozmosDesignConfigProvider, props, () => text),
    }),
  );
  return { react, vue };
}

/** The custom properties on the provider's root, by name. */
function customProperties(html: string) {
  const parsed = new DOMParser().parseFromString(
    `<body>${html}</body>`,
    "text/html",
  );
  const root = parsed.querySelector("[data-kozmos-root]")!;
  const id = designId(html)!;
  const properties: Record<string, string> = {};
  // No value the config sets holds a `;` (the noise image is URI-encoded).
  for (const declaration of (root.getAttribute("style") ?? "").split(";")) {
    const colon = declaration.indexOf(":");
    const name = declaration.slice(0, colon).trim();
    if (!name.startsWith("--")) continue;
    properties[name] = declaration
      .slice(colon + 1)
      .trim()
      .split(id)
      .join("DESIGN");
  }
  return properties;
}

/** The configs every comparison is drawn with. */
const CONFIGS: [string, Props][] = [
  ["the defaults", {}],
  ["glass off", { config: { glass: { enabled: false } } }],
  [
    "reduced transparency",
    { config: { accessibility: { reduceTransparency: true } } },
  ],
  ["reduced motion", { config: { motion: "reduced" } }],
  [
    "accessibility's reduced motion",
    { config: { accessibility: { reduceMotion: true } } },
  ],
  ["snappy motion", { config: { motion: "snappy" } }],
  ["no noise", { config: { noise: false } }],
  ["no spotlight", { config: { spotlight: false } }],
  ["a hard shadow", { config: { shadow: "hard" } }],
  ["no shadow", { config: { shadow: "none" } }],
  ["no surface texture", { config: { glass: { surfaceScale: 0 } } }],
  [
    "every glass control",
    {
      initialConfig: {
        roundness: 1.5,
        glass: {
          refraction: 80,
          dispersion: 55,
          depth: 70,
          frost: 35,
          specular: 90,
          surfaceScale: 12,
        },
      },
    },
  ],
  [
    "out-of-range input, clamped",
    { config: { roundness: 9, glass: { frost: -4 }, motion: "warp" } },
  ],
  ["touch density", { density: "touch" }],
  ["compact density", { density: "compact" }],
  ["a dark theme, right to left", { theme: "dark", dir: "rtl" }],
  [
    "runtime tokens",
    {
      tokens: { "colors-background-0": "red", "--kz-own": "1px", empty: "" },
    },
  ],
];

describe("KozmosDesignConfigProvider sets what React's DesignConfigProvider sets", () => {
  for (const [name, props] of CONFIGS)
    it(`for ${name}`, async () => {
      const { react, vue } = await serverRenders(props);
      // The same custom properties, in the same order, on the root…
      expect(Object.entries(customProperties(vue))).toEqual(
        Object.entries(customProperties(react)),
      );
      // …and the same element, scope and SVG filters around what it holds.
      expect(canonical(vue)).toBe(canonical(react));
    });

  it("reads every config the comparison draws, not one", async () => {
    const drawn = new Set<string>();
    for (const [, props] of CONFIGS)
      drawn.add(
        JSON.stringify(customProperties((await serverRenders(props)).react)),
      );
    // Density, theme and direction set no design property of their own;
    // glass off draws as reduced transparency does, and accessibility's
    // reduced motion as the reduced motion setting.
    expect(drawn.size).toBe(CONFIGS.length - 5);
  });

  it("draws its glass filters only while glass is on", async () => {
    const on = await serverRenders({});
    const off = await serverRenders({
      config: { accessibility: { reduceTransparency: true } },
    });
    expect(on.vue).toContain("<filter");
    expect(off.vue).not.toContain("<filter");
    expect(customProperties(on.vue)["--glass-surface-filter"]).toBe(
      'url("#DESIGN-surface")',
    );
  });

  it("gives each provider its own id", async () => {
    const vue = await vueToString(
      createSSRApp({
        render: () => [
          h(KozmosDesignConfigProvider, null, () => "A"),
          h(KozmosDesignConfigProvider, null, () => "B"),
        ],
      }),
    );
    const ids = [...vue.matchAll(/<filter id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it("draws a glass Button inside it as React's does", async () => {
    const react = reactToString(
      React.createElement(
        KozmosReact.DesignConfigProvider,
        { theme: "dark" },
        React.createElement(KozmosReact.Button, { variant: "glass" }, "Glass"),
      ),
    );
    const vue = await vueToString(
      createSSRApp({
        render: () =>
          h(KozmosDesignConfigProvider, { theme: "dark" }, () =>
            h(KozmosButton, { variant: "glass" }, () => "Glass"),
          ),
      }),
    );
    expect(canonical(vue)).toBe(canonical(react));
  });
});

/* ----------------------------------------------------------------------- */
/* Mounted                                                                 */
/* ----------------------------------------------------------------------- */

let reactRoot: Root | undefined;
let vueApp: App | undefined;
const originalComputedStyle = window.getComputedStyle;
beforeEach(() => {
  localStorage.clear();
  // jsdom inherits no custom property: read one as the cascade would, from
  // the nearest inline style that sets it (where every provider sets its own).
  window.getComputedStyle = ((element: Element, pseudo?: string | null) => {
    const style = originalComputedStyle.call(window, element, pseudo);
    return new Proxy(style, {
      get(target, key) {
        if (key === "getPropertyValue")
          return (name: string) => {
            if (!name.startsWith("--")) return target.getPropertyValue(name);
            for (let at: Element | null = element; at; at = at.parentElement) {
              const value = (at as HTMLElement).style?.getPropertyValue(name);
              if (value) return value;
            }
            return "";
          };
        const value = Reflect.get(target, key, target);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
  }) as typeof window.getComputedStyle;
});
afterEach(() => {
  act(() => reactRoot?.unmount());
  vueApp?.unmount();
  reactRoot = undefined;
  vueApp = undefined;
  document.body.replaceChildren();
  window.getComputedStyle = originalComputedStyle;
  localStorage.clear();
  vi.restoreAllMocks();
});

const host = () => document.body.appendChild(document.createElement("div"));
async function mountReact(node: React.ReactNode) {
  const element = host();
  reactRoot = createRoot(element);
  await act(async () => reactRoot!.render(node));
  return element;
}
async function mountVue(render: () => ReturnType<typeof h>) {
  const element = host();
  vueApp = createApp({ render });
  vueApp.mount(element);
  await nextTick();
  await nextTick();
  return element;
}
async function unmountReact() {
  act(() => reactRoot!.unmount());
  reactRoot = undefined;
  document.body.replaceChildren();
}
const motionOf = (element: Element | null) =>
  element?.getAttribute("data-kozmos-motion") ?? null;
/** The design ids of the document, `DESIGN-n` in order of first appearance. */
function documentHtml() {
  const html = document.body.innerHTML;
  const ids = [
    ...new Set(
      [...html.matchAll(/--kozmos-design-id:\s*([^;"]+)/g)].map((m) =>
        m[1].trim(),
      ),
    ),
  ];
  let out = html;
  ids.forEach((id, n) => {
    out = out.split(id).join(`DESIGN-${n + 1}`);
  });
  return normalizeHtml(out, { ignore: ["data-v-app"] });
}

describe("reduced motion, mounted (MotionKey)", () => {
  /** Reduced outside, a ThemeProvider and a fluid provider inside it. */
  async function nested(framework: "react" | "vue") {
    if (framework === "react")
      return mountReact(
        React.createElement(
          KozmosReact.DesignConfigProvider,
          { config: { motion: "reduced" } },
          React.createElement(KozmosReact.ThemeProvider, { theme: "light" }, [
            React.createElement("span", { key: "a" }, "theme"),
          ]),
          React.createElement(
            KozmosReact.DesignConfigProvider,
            { config: { motion: "fluid" } },
            React.createElement("span", { "data-testid": "inner" }, "inner"),
          ),
        ),
      );
    return mountVue(() =>
      h(KozmosDesignConfigProvider, { config: { motion: "reduced" } }, () => [
        h(KozmosThemeProvider, { theme: "light" }, () => [h("span", "theme")]),
        h(KozmosDesignConfigProvider, { config: { motion: "fluid" } }, () =>
          h("span", { "data-testid": "inner" }, "inner"),
        ),
      ]),
    );
  }

  it("marks every portal inside a reduced provider, as React's, and a fluid provider inside cannot turn it back on", async () => {
    await nested("react");
    const react = documentHtml();
    const reactMarks = [
      ...document.querySelectorAll("[data-kozmos-portal]"),
    ].map(motionOf);
    await unmountReact();
    await nested("vue");
    const vueMarks = [...document.querySelectorAll("[data-kozmos-portal]")].map(
      motionOf,
    );
    expect(vueMarks).toEqual(["reduced", "reduced", "reduced"]);
    expect(vueMarks).toEqual(reactMarks);
    const inner = document.querySelector('[data-testid="inner"]')!;
    expect(
      (
        inner.closest("[data-kozmos-root]") as HTMLElement
      ).style.getPropertyValue("--semantics-motion-duration-scale"),
    ).toBe("0.001");
    // The whole document as React's: scopes, portals, marks and properties.
    expect(documentHtml()).toBe(react);
  });

  it("provides MotionKey: reduced under a reduced config, undefined under a fluid one", async () => {
    const seen: unknown[] = [];
    const Reader = defineComponent({
      setup() {
        const motion = inject(MotionKey, undefined);
        return () => {
          seen.push(motion?.value);
          return h("span", String(motion?.value));
        };
      },
    });
    await mountVue(() =>
      h("div", [
        h(KozmosDesignConfigProvider, { config: { motion: "reduced" } }, () =>
          h(Reader),
        ),
        h(KozmosDesignConfigProvider, null, () => h(Reader)),
        h(
          KozmosDesignConfigProvider,
          { config: { accessibility: { reduceMotion: true } } },
          () => h(Reader),
        ),
      ]),
    );
    expect(seen).toEqual(["reduced", undefined, "reduced"]);
  });

  it("follows the config as it changes", async () => {
    let update: ((motion: KozmosDesignConfig["motion"]) => void) | undefined;
    const Toggle = defineComponent({
      setup() {
        const { updateConfig } = useDesignConfig();
        update = (motion) => updateConfig({ motion });
        return () => null;
      },
    });
    await mountVue(() => h(KozmosDesignConfigProvider, null, () => h(Toggle)));
    const marks = () =>
      [...document.querySelectorAll("[data-kozmos-portal]")].map(motionOf);
    expect(marks()).toEqual([null]);
    update!("reduced");
    await nextTick();
    expect(marks()).toEqual(["reduced"]);
    expect(
      document
        .querySelector("[data-kozmos-design-scope]")!
        .getAttribute("data-kozmos-motion"),
    ).toBe("reduced");
    update!("fluid");
    await nextTick();
    expect(marks()).toEqual([null]);
  });
});

describe("the glass spotlight follows the pointer, as React's", () => {
  /** A glass surface 200 × 100 at (10, 20), drawn at 1.25× by glass. */
  function place(surface: HTMLElement) {
    surface.getBoundingClientRect = () =>
      ({ left: 10, top: 20, width: 250, height: 125 }) as DOMRect;
    Object.defineProperty(surface, "offsetWidth", { value: 200 });
    Object.defineProperty(surface, "offsetHeight", { value: 100 });
  }
  const move = (target: Element, x: number, y: number) =>
    target.dispatchEvent(
      new MouseEvent("pointermove", {
        bubbles: true,
        clientX: x,
        clientY: y,
      }) as PointerEvent,
    );
  const out = (target: Element, relatedTarget: Element | null) =>
    target.dispatchEvent(
      new MouseEvent("pointerout", { bubbles: true, relatedTarget }),
    );

  /** What each step leaves on the surfaces, in one framework. */
  async function run(
    framework: "react" | "vue",
    props: Props,
  ): Promise<string[]> {
    const surface = (testid: string) =>
      framework === "react"
        ? React.createElement(
            "div",
            { className: "glass-spotlight", "data-testid": testid },
            React.createElement("span", { "data-testid": `${testid}-inner` }),
          )
        : h("div", { class: "glass-spotlight", "data-testid": testid }, [
            h("span", { "data-testid": `${testid}-inner` }),
          ]);
    if (framework === "react")
      await mountReact(
        React.createElement(
          KozmosReact.DesignConfigProvider,
          props,
          surface("outer"),
          React.createElement(
            KozmosReact.DesignConfigProvider,
            null,
            surface("nested"),
          ),
        ),
      );
    else
      await mountVue(() =>
        h(KozmosDesignConfigProvider, props, () => [
          surface("outer"),
          h(KozmosDesignConfigProvider, null, () => surface("nested")),
        ]),
      );
    const get = (id: string) =>
      document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
    place(get("outer"));
    place(get("nested"));
    const read = () =>
      ["outer", "nested"]
        .map(
          (id) =>
            `${id}: ${get(id).style.getPropertyValue("--spotlight-x")} ${get(id).style.getPropertyValue("--spotlight-y")}`,
        )
        .join(", ");
    const steps: string[] = [];
    move(get("outer-inner"), 110, 70);
    steps.push(read());
    // Leaving for its own child keeps the spotlight.
    out(get("outer"), get("outer-inner"));
    steps.push(read());
    // A nested provider's surface is that provider's, not this one's.
    move(get("nested-inner"), 60, 45);
    steps.push(read());
    out(get("outer"), document.body);
    steps.push(read());
    return steps;
  }

  for (const [name, props] of [
    ["with the defaults", {}],
    ["with no spotlight", { config: { spotlight: false } }],
    ["with reduced motion", { config: { motion: "reduced" } }],
    ["with glass off", { config: { glass: { enabled: false } } }],
  ] as [string, Props][])
    it(name, async () => {
      const react = await run("react", props);
      await unmountReact();
      const vue = await run("vue", props);
      expect(vue).toEqual(react);
      if (name === "with the defaults")
        expect(vue).toEqual([
          "outer: 80px 40px, nested:  ",
          "outer: 80px 40px, nested:  ",
          "outer: 80px 40px, nested: 40px 20px",
          "outer:  , nested: 40px 20px",
        ]);
      else expect(vue[0]).toBe("outer:  , nested:  ");
    });

  it("follows a surface in its ThemeProvider's portal", async () => {
    await mountVue(() => h(KozmosDesignConfigProvider, null, () => "x"));
    const portal = document.querySelector("[data-kozmos-portal]")!;
    const surface = document.createElement("div");
    surface.className = "glass-edge-spotlight";
    portal.append(surface);
    place(surface);
    move(surface, 35, 45);
    expect(surface.style.getPropertyValue("--spotlight-x")).toBe("20px");
    expect(surface.style.getPropertyValue("--spotlight-y")).toBe("20px");
  });
});

describe("events and useDesignConfig, as React's", () => {
  it("update:config reports each change as React's onConfigChange, controlled or not", async () => {
    const heard = { react: [] as unknown[], vue: [] as unknown[] };
    function ReactControls() {
      const { config, updateGlassConfig, updateConfig, resetConfig } =
        KozmosReact.useDesignConfig();
      return React.createElement(
        "div",
        null,
        React.createElement("output", null, JSON.stringify(config)),
        React.createElement(
          "button",
          {
            "data-act": "frost",
            onClick: () => updateGlassConfig({ frost: 50 }),
          },
          "f",
        ),
        React.createElement(
          "button",
          {
            "data-act": "fn",
            onClick: () =>
              updateConfig((previous) => ({
                roundness: previous.roundness + 0.5,
              })),
          },
          "r",
        ),
        React.createElement(
          "button",
          { "data-act": "reset", onClick: () => resetConfig() },
          "x",
        ),
      );
    }
    const VueControls = defineComponent({
      setup() {
        const { config, updateGlassConfig, updateConfig, resetConfig } =
          useDesignConfig();
        return () =>
          h("div", [
            h("output", JSON.stringify(config.value)),
            h(
              "button",
              {
                "data-act": "frost",
                onClick: () => updateGlassConfig({ frost: 50 }),
              },
              "f",
            ),
            h(
              "button",
              {
                "data-act": "fn",
                onClick: () =>
                  updateConfig((previous) => ({
                    roundness: previous.roundness + 0.5,
                  })),
              },
              "r",
            ),
            h(
              "button",
              { "data-act": "reset", onClick: () => resetConfig() },
              "x",
            ),
          ]);
      },
    });
    const press = async (name: string) => {
      await act(async () => {
        document.querySelector<HTMLElement>(`[data-act="${name}"]`)!.click();
      });
      await nextTick();
    };
    const shown = () =>
      JSON.parse(document.querySelector("output")!.textContent!);
    for (const controlled of [false, true]) {
      heard.react = [];
      heard.vue = [];
      const props = controlled ? { config: { noise: false } } : {};
      await mountReact(
        React.createElement(
          KozmosReact.DesignConfigProvider,
          { ...props, onConfigChange: (c: unknown) => heard.react.push(c) },
          React.createElement(ReactControls),
        ),
      );
      const reactShown: unknown[] = [];
      for (const step of ["frost", "fn", "reset"]) {
        await press(step);
        reactShown.push(shown());
      }
      await unmountReact();
      await mountVue(() =>
        h(
          KozmosDesignConfigProvider,
          {
            ...props,
            "onUpdate:config": (c: unknown) => heard.vue.push(c),
          },
          () => h(VueControls),
        ),
      );
      const vueShown: unknown[] = [];
      for (const step of ["frost", "fn", "reset"]) {
        await press(step);
        vueShown.push(shown());
      }
      vueApp!.unmount();
      vueApp = undefined;
      document.body.replaceChildren();
      expect(heard.vue).toHaveLength(3);
      expect(heard.vue).toEqual(heard.react);
      // Controlled, what it shows stays the caller's.
      expect(vueShown).toEqual(reactShown);
    }
  });

  it("update:theme reports a theme request, and sets the enclosing provider's preference when it names none", async () => {
    const heard = { react: [] as unknown[], vue: [] as unknown[] };
    function ReactReader() {
      const { theme, setTheme } = KozmosReact.useTheme();
      return React.createElement(
        "button",
        { onClick: () => setTheme("light") },
        theme,
      );
    }
    const VueReader = defineComponent({
      setup() {
        const { theme, setTheme } = useTheme();
        return () =>
          h("button", { onClick: () => setTheme("light") }, theme.value);
      },
    });
    const themes = () =>
      [...document.querySelectorAll("[data-kozmos-root]")].map((node) =>
        node.getAttribute("data-theme"),
      );
    await mountReact(
      React.createElement(
        KozmosReact.ThemeProvider,
        { defaultTheme: "dark" },
        React.createElement(
          KozmosReact.DesignConfigProvider,
          { onThemeChange: (t: unknown) => heard.react.push(t) },
          React.createElement(ReactReader),
        ),
      ),
    );
    const reactBefore = themes();
    await act(async () => document.querySelector("button")!.click());
    const reactAfter = [
      document.querySelector("button")!.textContent,
      themes(),
    ];
    await unmountReact();
    await mountVue(() =>
      h(KozmosThemeProvider, { defaultTheme: "dark" }, () =>
        h(
          KozmosDesignConfigProvider,
          { "onUpdate:theme": (t: unknown) => heard.vue.push(t) },
          () => h(VueReader),
        ),
      ),
    );
    const vueBefore = themes();
    document.querySelector("button")!.click();
    await nextTick();
    const vueAfter = [document.querySelector("button")!.textContent, themes()];
    expect(heard.vue).toEqual(["light"]);
    expect(heard.vue).toEqual(heard.react);
    expect(vueBefore).toEqual(reactBefore);
    expect(vueAfter).toEqual(reactAfter);
  });

  it("restores a persisted config once mounted, validated, and writes changes back", async () => {
    localStorage.setItem(
      "module",
      JSON.stringify({ glass: { frost: 70 }, roundness: 999, motion: "warp" }),
    );
    let state: ReturnType<typeof useDesignConfig> | undefined;
    const Reader = defineComponent({
      setup() {
        state = useDesignConfig();
        return () => null;
      },
    });
    const html = await vueToString(
      createSSRApp({
        render: () =>
          h(
            KozmosDesignConfigProvider,
            { persistKey: "module", initialConfig: { noise: false } },
            () => h(Reader),
          ),
      }),
    );
    // A server render reads no storage: the initial config.
    expect(html).toContain("--glass-blur:22px");
    await mountVue(() =>
      h(
        KozmosDesignConfigProvider,
        { persistKey: "module", initialConfig: { noise: false } },
        () => h(Reader),
      ),
    );
    expect(state!.config.value.glass.frost).toBe(70);
    expect(state!.config.value.roundness).toBe(2);
    expect(state!.config.value.motion).toBe("fluid");
    expect(state!.config.value.noise).toBe(false);
    state!.updateGlassConfig({ depth: 40 });
    await nextTick();
    expect(JSON.parse(localStorage.getItem("module")!).glass).toMatchObject({
      frost: 70,
      depth: 40,
    });
  });

  it("uses no storage without a persist key, and tolerates denied storage", async () => {
    const get = vi.spyOn(Storage.prototype, "getItem");
    const set = vi.spyOn(Storage.prototype, "setItem");
    let state: ReturnType<typeof useDesignConfig> | undefined;
    const Reader = defineComponent({
      setup() {
        state = useDesignConfig();
        return () => null;
      },
    });
    await mountVue(() => h(KozmosDesignConfigProvider, null, () => h(Reader)));
    state!.updateGlassConfig({ frost: 50 });
    await nextTick();
    expect(get).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
    vueApp!.unmount();
    vueApp = undefined;
    get.mockImplementation(() => {
      throw new Error("denied");
    });
    set.mockImplementation(() => {
      throw new Error("denied");
    });
    await mountVue(() =>
      h(KozmosDesignConfigProvider, { persistKey: "module" }, () => h(Reader)),
    );
    state!.updateGlassConfig({ frost: 50 });
    await nextTick();
    expect(state!.config.value.glass.frost).toBe(50);
  });

  it("isolates its config from a listener that mutates what it hears, and keeps updates made in one tick", async () => {
    let state: ReturnType<typeof useDesignConfig> | undefined;
    const Reader = defineComponent({
      setup() {
        state = useDesignConfig();
        return () => null;
      },
    });
    await mountVue(() =>
      h(
        KozmosDesignConfigProvider,
        {
          "onUpdate:config": (next: KozmosDesignConfig) => {
            next.glass.frost = 999;
          },
        },
        () => h(Reader),
      ),
    );
    state!.updateGlassConfig({ frost: 50 });
    state!.updateConfig({ accessibility: { reduceMotion: true } });
    await nextTick();
    expect(state!.config.value.glass.frost).toBe(50);
    expect(state!.config.value.accessibility.reduceMotion).toBe(true);
  });

  it("merges runtime tokens, and an empty value removes one", async () => {
    let state: ReturnType<typeof useDesignConfig> | undefined;
    const Reader = defineComponent({
      setup() {
        state = useDesignConfig();
        return () => null;
      },
    });
    await mountVue(() => h(KozmosDesignConfigProvider, null, () => h(Reader)));
    const root = () =>
      document.querySelector<HTMLElement>("[data-kozmos-root]")!.style;
    state!.injectRuntimeTokens({ "colors-background-0": "red" });
    await nextTick();
    expect(root().getPropertyValue("--primitives-colors-background-0")).toBe(
      "red",
    );
    state!.injectRuntimeTokens({ "colors-background-0": "" });
    await nextTick();
    expect(root().getPropertyValue("--primitives-colors-background-0")).toBe(
      "",
    );
  });

  it("throws outside a provider, as React's", () => {
    const Reader = defineComponent({
      setup() {
        useDesignConfig();
        return () => null;
      },
    });
    const app = createApp(Reader);
    app.config.warnHandler = () => {};
    let error: unknown;
    app.config.errorHandler = (e) => {
      error = e;
    };
    app.mount(host());
    app.unmount();
    expect(String(error)).toContain(
      "useDesignConfig must be used within a KozmosDesignConfigProvider",
    );
  });
});
