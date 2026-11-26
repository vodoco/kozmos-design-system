// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import { createApp, h, nextTick, ref, type App } from "vue";
import {
  KozmosAnalyticsProvider,
  KozmosRating,
  KozmosThemeProvider,
  type KozmosAnalyticsEvent,
} from "../../src/index";
import { normalizeHtml } from "./normalize-html";
import { renderBoth, type Drawn } from "./render";
import { element } from "./slotted";

/**
 * What the stories parity check cannot draw from React's args, drawn in
 * both: Thumbs, ReadOnly and ReadOnlyHalves. Then the edges React's tests
 * cover (Rating.test.tsx): each value on each scale, its own max, words and
 * label, read-only to the nearest half, and an app's class and attributes.
 * Then, mounted: a press chooses and a second clears, v-model hears what
 * onChange hears, `rating_changed` is reported, the arrows move and choose
 * in the writing direction and stop at the ends, Home and End, and hover
 * lights the stars without touching aria-checked.
 */
const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});
const rating = (props: Record<string, unknown>): Drawn => {
  const { className, value, ...rest } = props;
  return {
    react: KozmosReact.Rating,
    vue: KozmosRating,
    props,
    vueProps: {
      ...rest,
      ...(value === undefined ? {} : { modelValue: value }),
      ...(className === undefined ? {} : { class: className }),
    },
  };
};
const both = (tree: Drawn) => renderBoth(inTheme(tree));
const muted = (text: string) =>
  element("p", { className: "text-sm text-muted-foreground" }, [text]);

describe("KozmosRating draws what React's Rating draws", () => {
  it("Thumbs: draws what React's story draws", async () => {
    const { react, vue } = await both(
      element("div", { className: "flex flex-col items-start gap-4" }, [
        rating({ value: 0, variant: "thumbs" }),
        muted("value: 0 (unanswered)"),
      ]),
    );
    expect(react).toContain('aria-label="Poor"');
    expect(vue).toBe(react);
  });

  it("ReadOnly: draws what React's story draws", async () => {
    const { react, vue } = await both(
      element("div", { className: "flex flex-col items-start gap-3" }, [
        rating({ readOnly: true, value: 4 }),
        rating({ readOnly: true, value: 2, variant: "thumbs" }),
        rating({ readOnly: true, value: 0 }),
      ]),
    );
    expect(react).toContain('aria-label="Rated 4 out of 5 stars"');
    expect(react).toContain('aria-label="Rated good"');
    expect(react).toContain('aria-label="Not rated"');
    expect(vue).toBe(react);
  });

  it("ReadOnlyHalves: draws what React's story draws", async () => {
    const { react, vue } = await both(
      element("div", { className: "flex flex-col items-start gap-3" }, [
        ...[4.3, 4.2, 4.25, 0.5, 2.75].map((value) =>
          element("div", { className: "flex items-center gap-3" }, [
            rating({ readOnly: true, value }),
            muted(`value: ${value}`),
          ]),
        ),
        element("div", { dir: "rtl" }, [
          rating({ readOnly: true, value: 3.5 }),
        ]),
      ]),
    );
    expect(react).toContain('aria-label="Rated 4.5 out of 5 stars"');
    expect(react).toContain("data-rating-half");
    expect(vue).toBe(react);
  });

  it.each([
    ["unanswered, by default", {}],
    ["three of five", { value: 3 }],
    ["out of ten", { value: 7, max: 10 }],
    ["thumbs, down", { variant: "thumbs", value: 1 }],
    ["thumbs, up, ignoring max", { variant: "thumbs", value: 2, max: 7 }],
    ["its own label", { label: "Your visit", value: 2 }],
    ["an app's class over the recipe's", { className: "gap-2 kozmos-parity" }],
    ["an app's role", { role: "group" }],
    ["read-only, unrated", { readOnly: true }],
    ["read-only, 4.3 drawn as 4.5", { readOnly: true, value: 4.3 }],
    ["read-only, 4.2 drawn as 4", { readOnly: true, value: 4.2 }],
    ["read-only, out of ten", { readOnly: true, value: 6.5, max: 10 }],
    ["read-only thumbs, down", { readOnly: true, variant: "thumbs", value: 1 }],
    [
      "read-only thumbs, never halved",
      { readOnly: true, variant: "thumbs", value: 1.5 },
    ],
    ["read-only, an app's class", { readOnly: true, className: "gap-2" }],
  ] as const)("a rating: %s", async (_name, props) => {
    const { react, vue } = await both(rating({ ...props }));
    expect(vue).toBe(react);
  });

  it("takes its words from the caller", async () => {
    const itemLabel = (value: number, max: number, variant: string) =>
      `${variant} ${value}/${max}`;
    const valueLabel = (value: number, max: number, variant: string) =>
      `${value} of ${max} ${variant}`;
    for (const props of [
      { value: 2, itemLabel },
      { variant: "thumbs", value: 1, itemLabel },
      { readOnly: true, value: 3.7, valueLabel },
      { readOnly: true, variant: "thumbs", value: 2, valueLabel },
    ]) {
      const { react, vue } = await both(rating(props));
      expect(vue).toBe(react);
    }
  });
});

describe("KozmosRating, mounted, as React's", () => {
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
  const radios = (root: HTMLElement) => [
    ...root.querySelectorAll<HTMLButtonElement>('[role="radio"]'),
  ];
  const read = (events: KozmosAnalyticsEvent[]) =>
    events.map(({ timestamp: _timestamp, ...event }) => event);
  const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

  /**
   * Both, each owning its value as an app would: React's in state, Vue's in
   * a ref bound with v-model. What each heard, and its analytics.
   */
  async function drawBoth(
    props: Record<string, unknown>,
    start = 0,
    dir?: "rtl",
  ) {
    const heard = {
      react: {
        changes: [] as unknown[][],
        events: [] as KozmosAnalyticsEvent[],
      },
      vue: { changes: [] as unknown[][], events: [] as KozmosAnalyticsEvent[] },
    };
    function Owner() {
      const [value, setValue] = React.useState(start);
      return React.createElement(KozmosReact.Rating, {
        ...props,
        value,
        onChange: (...args: unknown[]) => {
          heard.react.changes.push(args);
          setValue(args[0] as number);
        },
      });
    }
    const reactHost = host();
    if (dir) reactHost.dir = dir;
    reactRoot = createRoot(reactHost);
    await act(async () =>
      reactRoot!.render(
        React.createElement(
          KozmosReact.AnalyticsProvider,
          {
            batchDelayMs: 0,
            onDispatch: (events) => heard.react.events.push(...events),
          },
          React.createElement(Owner),
        ),
      ),
    );
    const value = ref(start);
    const vueHost = host();
    if (dir) vueHost.dir = dir;
    vueApp = createApp({
      render: () =>
        h(
          KozmosAnalyticsProvider,
          {
            batchDelayMs: 0,
            onDispatch: (events: KozmosAnalyticsEvent[]) =>
              heard.vue.events.push(...events),
          },
          () => [
            h(KozmosRating, {
              ...props,
              modelValue: value.value,
              "onUpdate:modelValue": (...args: unknown[]) => {
                heard.vue.changes.push(args);
                value.value = args[0] as number;
              },
            }),
          ],
        ),
    });
    vueApp.mount(vueHost);
    await nextTick();
    return { heard, reactHost, vueHost };
  }
  const inBoth = async (
    hosts: { reactHost: HTMLElement; vueHost: HTMLElement },
    fn: (root: HTMLElement) => void,
  ) => {
    await act(async () => fn(hosts.reactHost));
    await act(async () => fn(hosts.vueHost));
    await nextTick();
  };
  const key = (name: string) => (root: HTMLElement) =>
    (document.activeElement && root.contains(document.activeElement)
      ? (document.activeElement as HTMLElement)
      : radios(root).find((radio) => radio.tabIndex === 0)!
    ).dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true }));

  it("a press chooses, a second press of it clears, and v-model hears what onChange hears", async () => {
    const drawn = await drawBoth({});
    const { heard, reactHost, vueHost } = drawn;
    await inBoth(drawn, (root) => radios(root)[3].click());
    expect(radios(reactHost)[3].getAttribute("aria-checked")).toBe("true");
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    await inBoth(drawn, (root) => radios(root)[3].click());
    await settle();
    expect(heard.react.changes).toEqual([[4], [0]]);
    expect(heard.vue.changes).toEqual(heard.react.changes);
    expect(read(heard.react.events)).toEqual([
      {
        component: "Rating",
        eventName: "rating_changed",
        properties: { value: 4, max: 5, variant: "stars" },
      },
      {
        component: "Rating",
        eventName: "rating_changed",
        properties: { value: 0, max: 5, variant: "stars" },
      },
    ]);
    expect(read(heard.vue.events)).toEqual(read(heard.react.events));
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });

  it("a thumb is chosen, and reported as a thumb", async () => {
    const drawn = await drawBoth({ variant: "thumbs" });
    await inBoth(drawn, (root) => radios(root)[1].click());
    await settle();
    expect(drawn.heard.react.changes).toEqual([[2]]);
    expect(drawn.heard.vue.changes).toEqual(drawn.heard.react.changes);
    expect(read(drawn.heard.vue.events)).toEqual(
      read(drawn.heard.react.events),
    );
    expect(snapshot(drawn.vueHost)).toBe(snapshot(drawn.reactHost));
  });

  it.each([
    ["left to right", undefined, ["ArrowRight", "ArrowRight", "ArrowLeft"]],
    ["right to left", "rtl", ["ArrowLeft", "ArrowLeft", "ArrowRight"]],
  ] as const)(
    "the arrows move and choose, %s, and stop at the ends",
    async (_name, dir, keys) => {
      // jsdom computes no direction from dir: the group's own style says
      // it, which both read through getComputedStyle.
      const drawn = await drawBoth(
        dir ? { style: { direction: "rtl" } } : {},
        2,
        dir,
      );
      const steps = [
        ...keys,
        "ArrowDown",
        "ArrowUp",
        "End",
        "ArrowRight",
        "ArrowDown",
        "Home",
        "ArrowUp",
      ];
      for (const step of steps) {
        await inBoth(drawn, key(step));
        expect(snapshot(drawn.vueHost)).toBe(snapshot(drawn.reactHost));
        const focused = (root: HTMLElement) =>
          radios(root).indexOf(document.activeElement as HTMLButtonElement);
        // Focus is in one document: compare where each last put it.
        expect(focused(drawn.vueHost)).toBe(
          radios(drawn.vueHost).findIndex(
            (radio) => radio.getAttribute("aria-checked") === "true",
          ),
        );
      }
      expect(drawn.heard.vue.changes).toEqual(drawn.heard.react.changes);
      expect(drawn.heard.react.changes.length).toBeGreaterThan(4);
    },
  );

  it("hover lights the stars and leaves aria-checked as it is", async () => {
    const drawn = await drawBoth({}, 2);
    const hover = (index: number) => (root: HTMLElement) =>
      radios(root)[index].dispatchEvent(
        new MouseEvent("mouseover", { bubbles: true, relatedTarget: null }),
      );
    // React's onMouseEnter is its mouseover; Vue's is mouseenter.
    const enter = (index: number) => async () => {
      await act(async () => hover(index)(drawn.reactHost));
      await act(async () =>
        radios(drawn.vueHost)[index].dispatchEvent(
          new MouseEvent("mouseenter"),
        ),
      );
      await nextTick();
    };
    await enter(4)();
    expect(
      radios(drawn.reactHost).map((radio) =>
        radio.getAttribute("aria-checked"),
      ),
    ).toEqual(["false", "true", "false", "false", "false"]);
    expect(snapshot(drawn.vueHost)).toBe(snapshot(drawn.reactHost));
    expect(snapshot(drawn.reactHost).match(/fill-data-yellow/g)).toHaveLength(
      5,
    );
    expect(drawn.heard.vue.changes).toEqual([]);
  });
});
