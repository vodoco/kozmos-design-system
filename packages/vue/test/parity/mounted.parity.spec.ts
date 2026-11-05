// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import {
  computed,
  createApp,
  defineComponent,
  h,
  nextTick,
  provide,
  ref,
  type App,
} from "vue";
import { KozmosThemeProvider, useTheme } from "../../src/index";
import { MotionKey } from "../../src/theme/injection";
import { normalizeHtml } from "./normalize-html";

/**
 * What a ThemeProvider does once mounted, which a server render never shows:
 * its portal in the body, the system scheme it follows, and the stored
 * preference it reads. Each runs in React and in Vue, in the same document,
 * and the marks each leaves are compared.
 */
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let reactRoot: Root | undefined;
let vueApp: App | undefined;
afterEach(() => {
  act(() => reactRoot?.unmount());
  vueApp?.unmount();
  reactRoot = undefined;
  vueApp = undefined;
  document.body.replaceChildren();
  localStorage.clear();
});

/** A controllable `prefers-color-scheme: dark`. */
let dark = false;
const listeners = new Set<() => void>();
beforeEach(() => {
  dark = false;
  listeners.clear();
  window.matchMedia = ((query: string) => ({
    get matches() {
      return query.includes("dark") ? dark : false;
    },
    media: query,
    addEventListener: (_: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) =>
      listeners.delete(listener),
  })) as unknown as typeof window.matchMedia;
});
const setScheme = async (next: boolean) => {
  dark = next;
  await act(async () => {
    for (const listener of [...listeners]) listener();
  });
  await nextTick();
};

function host() {
  const element = document.createElement("div");
  document.body.append(element);
  return element;
}
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
const portals = (ignore: string[] = []) =>
  [...document.body.querySelectorAll("[data-kozmos-portal]")].map((portal) =>
    normalizeHtml(portal.outerHTML, { ignore }),
  );
const rootMarks = (element: Element) => {
  const root = element.querySelector("[data-kozmos-root]")!;
  return normalizeHtml(
    root.cloneNode(false) instanceof Element
      ? (root.cloneNode(false) as Element).outerHTML
      : "",
  );
};

describe("the portal", () => {
  it("is drawn in the body with the scope's marks, as React's", async () => {
    const props = {
      theme: "dark",
      dir: "rtl",
      density: "compact",
      tokens: { "--kz-test": "1px" },
    } as const;
    await mountReact(
      React.createElement(KozmosReact.ThemeProvider, props, "x"),
    );
    const react = portals();
    act(() => reactRoot!.unmount());
    reactRoot = undefined;
    document.body.replaceChildren();
    await mountVue(() => h(KozmosThemeProvider, props, () => "x"));
    expect(portals()).toEqual(react);
    expect(react).toHaveLength(1);
  });

  it("carries reduced motion, as React's under a reduced design config", async () => {
    await mountReact(
      React.createElement(
        KozmosReact.DesignConfigProvider,
        { config: { motion: "reduced" } },
        React.createElement(KozmosReact.ThemeProvider, null, "x"),
      ),
    );
    // React's design config also hands its design tokens to the provider, as
    // a style; Vue has no design config yet, so the marks are compared
    // without the style.
    const react = portals(["style"]);
    act(() => reactRoot!.unmount());
    reactRoot = undefined;
    document.body.replaceChildren();
    // Vue has no design-config provider yet: what it will provide is MotionKey.
    const Reduced = defineComponent({
      setup(_, { slots }) {
        provide(
          MotionKey,
          computed(() => "reduced" as const),
        );
        return () => slots.default?.();
      },
    });
    await mountVue(() =>
      h(Reduced, null, () => h(KozmosThemeProvider, null, () => "x")),
    );
    const [vue] = portals(["style"]);
    expect(vue).toContain('data-kozmos-motion="reduced"');
    expect(react).toContain(vue);
  });
});

describe("the system scheme", () => {
  it("is followed as React follows it, and its changes too", async () => {
    dark = true;
    const reactHost = await mountReact(
      React.createElement(KozmosReact.ThemeProvider, null, "x"),
    );
    const vueHost = await mountVue(() =>
      h(KozmosThemeProvider, null, () => "x"),
    );
    expect(rootMarks(vueHost)).toBe(rootMarks(reactHost));
    expect(rootMarks(vueHost)).toContain('data-theme="dark"');
    await setScheme(false);
    expect(rootMarks(vueHost)).toBe(rootMarks(reactHost));
    expect(rootMarks(vueHost)).toContain('data-theme="light"');
  });
});

describe("the stored preference", () => {
  it("is read again when the key changes and when the theme stops being controlled, as React reads it", async () => {
    localStorage.setItem("a", "dark");
    localStorage.setItem("b", "light");
    const state = ref<{ storageKey: string; theme?: "light" | "dark" }>({
      storageKey: "a",
    });
    const reactHost = host();
    reactRoot = createRoot(reactHost);
    const renderReact = async () =>
      act(async () =>
        reactRoot!.render(
          React.createElement(
            KozmosReact.ThemeProvider,
            { ...state.value },
            "x",
          ),
        ),
      );
    await renderReact();
    const vueHost = await mountVue(() =>
      h(KozmosThemeProvider, { ...state.value }, () => "x"),
    );
    const step = async (next: typeof state.value) => {
      state.value = next;
      await renderReact();
      await nextTick();
      await nextTick();
      return [rootMarks(reactHost), rootMarks(vueHost)];
    };
    expect(rootMarks(vueHost)).toBe(rootMarks(reactHost));
    expect(rootMarks(vueHost)).toContain('data-theme="dark"');
    // Another key: its preference is read.
    const [r1, v1] = await step({ storageKey: "b" });
    expect(v1).toBe(r1);
    expect(v1).toContain('data-theme="light"');
    // Controlled: the prop wins. Then released: the stored one is read again.
    const [r2, v2] = await step({ storageKey: "a", theme: "light" });
    expect(v2).toBe(r2);
    const [r3, v3] = await step({ storageKey: "a" });
    expect(v3).toBe(r3);
    expect(v3).toContain('data-theme="dark"');
  });
});

describe("useTheme().setTheme, as ThemeProvider's Default story calls it", () => {
  it("changes the theme, reports it and stores it, as React's", async () => {
    type Theme = "light" | "dark" | "system";
    const reported = { react: [] as string[], vue: [] as string[] };
    const updated: string[] = [];
    let setReact: ((theme: Theme) => void) | undefined;
    let setVue: ((theme: Theme) => void) | undefined;
    // What each hook says the theme is: React's on every render, Vue's a ref.
    let readReact: { theme: string; resolvedTheme: string } | undefined;
    let readVue: ReturnType<typeof useTheme> | undefined;
    const ReactProbe = () => {
      const state = KozmosReact.useTheme();
      setReact = state.setTheme;
      readReact = state;
      return null;
    };
    const VueProbe = defineComponent({
      setup() {
        readVue = useTheme();
        setVue = readVue.setTheme;
        return () => null;
      },
    });
    const read = () => ({
      react: [readReact!.theme, readReact!.resolvedTheme],
      vue: [readVue!.theme.value, readVue!.resolvedTheme.value],
    });
    // Each its own key: both run in one document and one storage.
    const reactHost = await mountReact(
      React.createElement(
        KozmosReact.ThemeProvider,
        {
          storageKey: "react",
          onThemeChange: (theme: string) => reported.react.push(theme),
        },
        React.createElement(ReactProbe),
      ),
    );
    const vueHost = await mountVue(() =>
      h(
        KozmosThemeProvider,
        {
          storageKey: "vue",
          onThemeChange: (theme: string) => reported.vue.push(theme),
          // v-model:theme's half: React's one callback is both.
          "onUpdate:theme": (theme: string) => updated.push(theme),
        },
        () => [h(VueProbe)],
      ),
    );
    expect(rootMarks(vueHost)).toBe(rootMarks(reactHost));
    expect(read().vue).toEqual(read().react);
    await act(async () => setReact!("dark"));
    setVue!("dark");
    await nextTick();
    expect(rootMarks(vueHost)).toBe(rootMarks(reactHost));
    expect(rootMarks(vueHost)).toContain('data-theme="dark"');
    // The composable's refs follow, as React's hook re-reads.
    expect(read().vue).toEqual(read().react);
    expect(read().vue).toEqual(["dark", "dark"]);
    expect(reported.vue).toEqual(reported.react);
    expect(reported.vue).toEqual(["dark"]);
    expect(updated).toEqual(reported.react);
    expect(localStorage.getItem("vue")).toBe(localStorage.getItem("react"));
    expect(localStorage.getItem("vue")).toBe("dark");
  });
});
