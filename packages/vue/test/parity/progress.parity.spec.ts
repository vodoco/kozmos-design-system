// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
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
  KozmosProgress,
  KozmosProgressTrack,
  KozmosThemeProvider,
} from "../../src/index";
import { normalizeHtml } from "./normalize-html";

/**
 * React's Progress stories that draw with their own render, drawn in both
 * as each render draws it, with the element React's Box, Stack and Text draw
 * where the Vue story draws it (none is ported yet); ProgressTrack's
 * SelectedSection and LivePosition; and the ring's and the bar's edges
 * React's tests cover. Mounted: a waiting bar says its words once, bars
 * that wait together share one announcement, and AnimatedUpdate's value
 * moves alike.
 */
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const e = React.createElement;
const TEXT = "kozmos-reset kozmos-text kozmos-text-start";
const text = (size: string, weight: string, color: string) =>
  `${TEXT.replace("kozmos-text-start", `kozmos-text-${size} kozmos-text-${weight} kozmos-text-start kozmos-text-${color}`)}`;
const STACK_ROW = "flex flex-row items-center justify-start flex-wrap gap-4";
const TONES = [
  "themed",
  "neutral",
  "success",
  "informative",
  "alert",
  "danger",
] as const;

/** A React tree and a Vue render, each in its ThemeProvider, server-rendered and normalised. */
async function both(react: React.ReactNode, vue: () => VNode | VNode[]) {
  const reactHtml = reactToString(e(KozmosReact.ThemeProvider, null, react));
  const vueHtml = await vueToString(
    createSSRApp({ render: () => h(KozmosThemeProvider, null, vue) }),
  );
  return { react: normalizeHtml(reactHtml), vue: normalizeHtml(vueHtml) };
}

describe("KozmosProgress draws what React's Progress draws", () => {
  it("TopOfPage: draws what React's story draws", async () => {
    const { react, vue } = await both(
      e(
        KozmosReact.Box,
        { className: "p-6" },
        e(KozmosReact.Progress, { placement: "top", label: "Loading the map" }),
        e(KozmosReact.Text, null, "Map content loads under the bar."),
      ),
      () =>
        h("div", { class: "p-6" }, [
          h(
            KozmosProgress,
            { placement: "top" },
            { label: () => "Loading the map" },
          ),
          h("p", { class: text("base", "normal", "default") }, [
            "Map content loads under the bar.",
          ]),
        ]),
    );
    expect(react).toContain("kozmos-progress-top");
    expect(react).toContain('aria-label="Loading the map"');
    expect(vue).toBe(react);
  });

  it("CircularSizes: draws what React's story draws", async () => {
    const { react, vue } = await both(
      e(
        KozmosReact.Stack,
        { direction: "row", gap: 4, align: "center", wrap: "wrap" },
        e(KozmosReact.Progress, {
          shape: "circular",
          size: "sm",
          value: 25,
          "aria-label": "Small",
        }),
        e(KozmosReact.Progress, {
          shape: "circular",
          size: "md",
          value: 50,
          label: "50%",
          "aria-label": "Medium",
        }),
        e(KozmosReact.Progress, {
          shape: "circular",
          size: "lg",
          value: 75,
          label: "75%",
          "aria-label": "Large",
        }),
      ),
      () =>
        h("div", { class: STACK_ROW }, [
          h(KozmosProgress, {
            shape: "circular",
            size: "sm",
            value: 25,
            "aria-label": "Small",
          }),
          h(
            KozmosProgress,
            {
              shape: "circular",
              size: "md",
              value: 50,
              "aria-label": "Medium",
            },
            { label: () => "50%" },
          ),
          h(
            KozmosProgress,
            {
              shape: "circular",
              size: "lg",
              value: 75,
              "aria-label": "Large",
            },
            { label: () => "75%" },
          ),
        ]),
    );
    expect(react).toContain('width="128"');
    expect(react).toContain("aria-describedby");
    expect(vue).toBe(react);
  });

  for (const [name, value] of [
    ["CircularComplete", 100],
    ["Tones", 75],
  ] as const)
    it(`${name}: draws what React's story draws`, async () => {
      const label = (tone: string) =>
        `${tone} ${name === "Tones" ? "progress" : "upload"}`;
      const { react, vue } = await both(
        e(
          KozmosReact.Stack,
          { direction: "row", gap: 4, align: "center", wrap: "wrap" },
          ...TONES.map((tone) =>
            e(KozmosReact.Progress, {
              key: tone,
              shape: "circular",
              size: "sm",
              tone,
              value,
              "aria-label": label(tone),
            }),
          ),
        ),
        () =>
          h(
            "div",
            { class: STACK_ROW },
            TONES.map((tone) =>
              h(KozmosProgress, {
                key: tone,
                shape: "circular",
                size: "sm",
                tone,
                value,
                "aria-label": label(tone),
              }),
            ),
          ),
      );
      expect(react).toContain('data-tone="danger"');
      if (value === 100) expect(react).toContain("kozmos-progress-ring-done");
      expect(vue).toBe(react);
    });

  it("LevelsAdded: draws what React's story draws", async () => {
    const getValueLabel = (value: number, max: number) => `${value} of ${max}`;
    const { react, vue } = await both(
      e(KozmosReact.Progress, {
        shape: "circular",
        size: "lg",
        value: 11,
        max: 15,
        labelPlacement: "end",
        getValueLabel,
        label: e(
          React.Fragment,
          null,
          e(KozmosReact.Text, { size: "xl", weight: "bold" }, "11 Levels"),
          e(KozmosReact.Text, { size: "xs", color: "muted" }, "Added in total"),
        ),
      }),
      () =>
        h(
          KozmosProgress,
          {
            shape: "circular",
            size: "lg",
            value: 11,
            max: 15,
            labelPlacement: "end",
            getValueLabel,
          },
          {
            label: () => [
              h("p", { class: text("xl", "bold", "default") }, ["11 Levels"]),
              h("p", { class: text("xs", "normal", "muted") }, [
                "Added in total",
              ]),
            ],
          },
        ),
    );
    expect(react).toContain('aria-valuetext="11 of 15"');
    expect(react).toContain('data-label-placement="end"');
    expect(vue).toBe(react);
  });

  it("SelectedSection: draws what React's story draws", async () => {
    const { react, vue } = await both(
      e(
        KozmosReact.Box,
        { role: "img", "aria-label": "Selected section from 20 to 60 percent" },
        e(KozmosReact.ProgressTrack, {
          activeRange: { start: 0.2, end: 0.6 },
          value: null,
          positionMode: "static",
          appearance: "gradient",
          motion: "directional",
        }),
      ),
      () =>
        h(
          "div",
          {
            class: "",
            role: "img",
            "aria-label": "Selected section from 20 to 60 percent",
          },
          [
            h(KozmosProgressTrack, {
              activeRange: { start: 0.2, end: 0.6 },
              value: null,
              positionMode: "static",
              appearance: "gradient",
              motion: "directional",
            }),
          ],
        ),
    );
    expect(react).toContain('data-testid="progress-active-range"');
    expect(react).toContain('data-testid="progress-directional-flow"');
    expect(vue).toBe(react);
  });

  it("LivePosition: draws what React's story draws", async () => {
    const box = {
      role: "progressbar",
      "aria-label": "Journey progress",
      "aria-valuemin": 0,
      "aria-valuemax": 100,
      "aria-valuenow": 30,
    };
    const track = {
      activeRange: { start: 0.2, end: 0.6 },
      value: 0.3,
      appearance: "gradient",
      motion: "directional",
    } as const;
    const { react, vue } = await both(
      e(KozmosReact.Box, box, e(KozmosReact.ProgressTrack, track)),
      () => h("div", { class: "", ...box }, [h(KozmosProgressTrack, track)]),
    );
    expect(react).toContain("inset-inline-start:30%");
    expect(vue).toBe(react);
  });

  it("AnimatedUpdate: draws what React's story draws first", async () => {
    const props = { "aria-label": "Download progress", value: 13 };
    const { react, vue } = await both(
      e(KozmosReact.Progress, { ...props, className: "w-3/5" }),
      () => h(KozmosProgress, { ...props, class: "w-3/5" }),
    );
    expect(react).toContain("width:13%");
    expect(vue).toBe(react);
  });

  it.each([
    ["a value over the total, full", { value: 16, max: 15 }],
    ["a value under zero, empty", { value: -4 }],
    ["a total that is no number", { value: 40, max: 0 }],
    ["complete", { value: 100 }],
    ["named by aria-labelledby while waiting", { "aria-labelledby": "x" }],
    ["a ring with no value", { shape: "circular" }],
    [
      "a ring of an unknown tone",
      { shape: "circular", tone: "loud", value: 5 },
    ],
    [
      "a whole sm ring named by the app",
      { shape: "circular", size: "sm", value: 100, "aria-label": "Done" },
    ],
    [
      "a whole sm ring with no name",
      { shape: "circular", size: "sm", value: 8, max: 8 },
    ],
    [
      "a ring named by aria-labelledby, described by its label",
      {
        shape: "circular",
        value: 30,
        "aria-labelledby": "x",
        "aria-describedby": "y",
      },
      "30%",
    ],
    ["a ring named by its label", { shape: "circular", value: 30 }, "30%"],
  ] as const)("%s", async (_name, props, label?: string) => {
    const { react, vue } = await both(
      e(KozmosReact.Progress, { ...props, label }),
      () =>
        h(
          KozmosProgress,
          { ...props },
          label ? { label: () => label } : undefined,
        ),
    );
    expect(vue).toBe(react);
  });
});

describe("KozmosProgressTrack draws what React's ProgressTrack draws", () => {
  it.each([
    ["live from zero", { activeRange: { start: 0, end: 1 }, value: 0.5 }],
    ["live with no range", { value: 0.5 }],
    [
      "live outside its range",
      { activeRange: { start: 0.2, end: 0.6 }, value: 0.7 },
    ],
    [
      "static with no flow",
      {
        activeRange: { start: 0.1, end: 0.4 },
        value: null,
        positionMode: "static",
      },
    ],
    ["an empty range", { activeRange: { start: 0.5, end: 0.5 }, value: 0.5 }],
  ] as const)("%s", async (_name, props) => {
    const { react, vue } = await both(
      e(KozmosReact.ProgressTrack, { ...props, className: "h-2" }),
      () => h(KozmosProgressTrack, { ...props, class: "h-2" }),
    );
    expect(vue).toBe(react);
  });
});

let reactRoot: Root | undefined;
let vueApp: App | undefined;
afterEach(() => {
  act(() => reactRoot?.unmount());
  vueApp?.unmount();
  reactRoot = undefined;
  vueApp = undefined;
  document.body.replaceChildren();
});
const host = () => document.body.appendChild(document.createElement("div"));
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const statuses = (element: HTMLElement) =>
  [...element.querySelectorAll('[role="status"]')].map((s) => s.textContent);

async function inReact(node: React.ReactNode) {
  const element = host();
  reactRoot = createRoot(element);
  await act(async () => reactRoot!.render(node));
  return element;
}
async function inVue(render: () => VNode | VNode[]) {
  const element = host();
  vueApp = createApp({ render });
  vueApp.mount(element);
  await nextTick();
  return element;
}
/** Each framework's own turn: the wait groups are a minute apart. */
const apart = async () => {
  act(() => reactRoot?.unmount());
  reactRoot = undefined;
  await wait(600);
};

describe("KozmosProgress waits as React's Progress waits", () => {
  it("says a waiting bar's words once, by its label, else its name, else what aria-labelledby names", async () => {
    const reactHost = await inReact(
      e(
        React.Fragment,
        null,
        e("span", { id: "named-by" }, "Uploading plans"),
        e(KozmosReact.Progress, { "aria-labelledby": "named-by" }),
      ),
    );
    const react = statuses(reactHost);
    const reactHtml = normalizeHtml(reactHost.innerHTML);
    await apart();
    const vueHost = await inVue(() => [
      h("span", { id: "named-by" }, "Uploading plans"),
      h(KozmosProgress, { "aria-labelledby": "named-by" }),
    ]);
    expect(react).toEqual(["Uploading plans"]);
    expect(statuses(vueHost)).toEqual(react);
    expect(normalizeHtml(vueHost.innerHTML)).toBe(reactHtml);
  });

  it("gives bars that start waiting together one announcement, the first's", async () => {
    const reactHost = await inReact(
      e(
        React.Fragment,
        null,
        e(KozmosReact.Progress, { label: "Uploading A" }),
        e(KozmosReact.Progress, { label: "Uploading B" }),
        e(KozmosReact.Progress, { "aria-label": "Uploading C" }),
      ),
    );
    const react = statuses(reactHost);
    await apart();
    const vueHost = await inVue(() => [
      h(KozmosProgress, null, { label: () => "Uploading A" }),
      h(KozmosProgress, null, { label: () => "Uploading B" }),
      h(KozmosProgress, { "aria-label": "Uploading C" }),
    ]);
    expect(react).toEqual(["Uploading A", "", ""]);
    expect(statuses(vueHost)).toEqual(react);
  });

  it("stops saying it when the value arrives, and AnimatedUpdate's value moves alike", async () => {
    const value = ref<number | undefined>(undefined);
    let setReact: (value: number | undefined) => void = () => {};
    function Moving() {
      const [current, set] = React.useState<number | undefined>(undefined);
      setReact = set;
      return e(KozmosReact.Progress, {
        "aria-label": "Download progress",
        value: current,
      });
    }
    const reactHost = await inReact(e(Moving));
    const reactWaiting = statuses(reactHost);
    await act(async () => setReact(13));
    const reactAt13 = normalizeHtml(reactHost.innerHTML);
    await act(async () => setReact(66));
    const reactAt66 = normalizeHtml(reactHost.innerHTML);
    await apart();
    const vueHost = await inVue(() =>
      h(KozmosProgress, {
        "aria-label": "Download progress",
        value: value.value,
      }),
    );
    expect(reactWaiting).toEqual(["Download progress"]);
    expect(statuses(vueHost)).toEqual(reactWaiting);
    value.value = 13;
    await nextTick();
    expect(normalizeHtml(vueHost.innerHTML)).toBe(reactAt13);
    value.value = 66;
    await nextTick();
    expect(normalizeHtml(vueHost.innerHTML)).toBe(reactAt66);
    expect(reactAt66).toContain("width:66%");
  });
});
