// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import { Bell01, HelpCircle, SearchMd } from "@kozmos-ds/icons";
import {
  Bell01 as VueBell01,
  HelpCircle as VueHelpCircle,
  SearchMd as VueSearchMd,
} from "@kozmos-ds/icons/vue";
import { createApp, h, type App } from "vue";
import {
  KozmosAnalyticsProvider,
  KozmosIcon,
  KozmosIconButton,
  KozmosThemeProvider,
  type KozmosAnalyticsEvent,
} from "../../src/index";
import { normalizeHtml } from "./normalize-html";
import { renderBoth, type Drawn } from "./render";
import { element, slotted } from "./slotted";

/**
 * What the stories parity check cannot draw from React's args, drawn in
 * both: every story, since each draws an icon in the button. Then the edges
 * React's tests cover (IconButton.test.tsx): each size squared, the counter
 * read with a name from aria-label, from the content and from
 * aria-labelledby, in the product's words and with its separator, and an
 * app's attributes. Then, mounted: a press reports React's Button's
 * `button_clicked`, and a disabled one reports nothing and hears nothing.
 */
const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});
const both = (tree: Drawn) => renderBoth(inTheme(tree));
const icon = (props: Record<string, unknown>): Drawn => ({
  react: KozmosReact.Icon,
  vue: KozmosIcon,
  props,
});
const glyph = (
  react: React.ElementType,
  vue: Drawn["vue"],
  className = "h-5 w-5",
): Drawn => ({
  react,
  vue,
  props: { "aria-hidden": "true", className },
  vueProps: { "aria-hidden": "true", class: className },
});
const search = glyph(SearchMd, VueSearchMd, "h-4 w-4");
const iconButton = (
  props: Record<string, unknown>,
  children: (Drawn | string)[] = [search],
) => {
  const { className, ...rest } = props;
  return slotted(
    KozmosReact.IconButton,
    KozmosIconButton,
    props,
    { default: children },
    className === undefined ? rest : { ...rest, class: className },
  );
};
const toursLeft = (count: number) => `${count} tours left`;

describe("KozmosIconButton draws what React's IconButton draws", () => {
  it("Default: draws what React's story draws", async () => {
    const { react, vue } = await both(
      iconButton({ "aria-label": "Search", variant: "ghost", size: "icon" }, [
        icon({ name: "search-md", size: "sm" }),
      ]),
    );
    expect(react).toContain('aria-label="Search"');
    expect(vue).toBe(react);
  });

  it("Variants: draws what React's story draws", async () => {
    const { react, vue } = await both(
      element(
        "div",
        { className: "flex items-center gap-4" },
        (
          [
            ["default", "Default"],
            ["secondary", "Secondary"],
            ["outline", "Outline"],
            ["ghost", "Ghost"],
            ["destructive", "Destructive"],
          ] as const
        ).map(([variant, label]) =>
          iconButton({ variant, "aria-label": label }, [
            icon({ name: "search-md", size: "sm" }),
          ]),
        ),
      ),
    );
    expect(react).toContain("kozmos-button-destructive");
    expect(vue).toBe(react);
  });

  it("Sizes: draws what React's story draws", async () => {
    const { react, vue } = await both(
      element(
        "div",
        { className: "flex items-center gap-4" },
        (
          [
            ["sm", "Small", "xs"],
            ["default", "Default", "sm"],
            ["lg", "Large", "md"],
          ] as const
        ).map(([size, label, iconSize]) =>
          iconButton({ size, variant: "outline", "aria-label": label }, [
            icon({ name: "search-md", size: iconSize }),
          ]),
        ),
      ),
    );
    expect(react).toContain("h-icon-control-lg");
    expect(vue).toBe(react);
  });

  it("Counter: draws what React's story draws", async () => {
    const { react, vue } = await both(
      element("div", { className: "flex items-center gap-4" }, [
        ...(["sm", "icon", "lg"] as const).map((size) =>
          iconButton(
            {
              "aria-label": "Help",
              counter: 3,
              counterLabel: toursLeft,
              size,
              variant: "outline",
            },
            [glyph(HelpCircle, VueHelpCircle)],
          ),
        ),
        iconButton({ "aria-label": "Notices", counter: 12, variant: "ghost" }, [
          glyph(Bell01, VueBell01),
        ]),
      ]),
    );
    expect(react).toContain('aria-label="Help, 3 tours left"');
    expect(react).toContain("kozmos-icon-button-counter");
    expect(vue).toBe(react);
  });

  it("draws what React's IconButton draws", async () => {
    const { react, vue } = await both(iconButton({ "aria-label": "Search" }));
    expect(vue).toBe(react);
  });

  it.each([
    ["ghost at the icon size, by default", {}],
    ["small", { size: "sm" }],
    ["default", { size: "default" }],
    ["large", { size: "lg" }],
    ["an emotion", { variant: "default", emotion: "danger" }],
    ["loading", { isLoading: true }],
    ["disabled", { disabled: true }],
    ["a class over the recipe's", { className: "px-2 kozmos-parity" }],
    ["an app's type", { type: "submit" }],
  ] as const)("a button: %s", async (_name, props) => {
    const { react, vue } = await both(
      iconButton({ "aria-label": "Search", ...props }),
    );
    expect(vue).toBe(react);
  });

  it.each([
    ["named by aria-label", { "aria-label": "Help", counter: 3 }, []],
    [
      "in the product's words",
      {
        "aria-label": "Ayuda",
        counter: 2,
        counterLabel: (count: number) => `${count} recorridos pendientes`,
      },
      [],
    ],
    [
      "with the product's separator",
      { "aria-label": "ヘルプ", counter: 3, counterSeparator: "、" },
      [],
    ],
    [
      "named by its content",
      { counter: 5 },
      [element("span", { className: "sr-only" }, ["Notices"])],
    ],
    [
      "named by its content, with the product's separator",
      { counter: 5, counterSeparator: "、" },
      [element("span", { className: "sr-only" }, ["お知らせ"])],
    ],
    [
      "named by aria-labelledby",
      {
        "aria-labelledby": "help-name",
        counter: 3,
        counterLabel: toursLeft,
      },
      [],
    ],
    [
      "named by aria-labelledby and aria-label",
      { "aria-labelledby": "help-name", "aria-label": "Help", counter: 3 },
      [],
    ],
    ["a count of 0", { "aria-label": "Help", counter: 0 }, []],
    [
      "a count read as nothing",
      { "aria-label": "Help", counter: 4, counterLabel: () => "" },
      [],
    ],
    ["no count", { "aria-label": "Help", counter: undefined }, []],
  ] as const)("its counter: %s", async (_name, props, extra) => {
    const { react, vue } = await both(
      element("div", {}, [
        element("span", { id: "help-name" }, ["Help"]),
        iconButton({ ...props }, [search, ...extra]),
      ]),
    );
    expect(vue).toBe(react);
  });

  it("reads the count from a hidden line its name joins, as React's does", async () => {
    const { react, vue } = await renderBoth(
      inTheme(iconButton({ "aria-labelledby": "help-name", counter: 3 })),
      { keepIds: ["help-name"] },
    );
    // aria-labelledby names the hidden line after the caller's element.
    expect(react).toContain('aria-labelledby="help-name id-1"');
    expect(react).toContain('<span class="sr-only" id="id-1">');
    expect(vue).toBe(react);
  });
});

describe("KozmosIconButton, mounted, as React's", () => {
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
  const read = (events: KozmosAnalyticsEvent[]) =>
    events.map(({ timestamp: _timestamp, ...event }) => event);

  async function draw(props: Record<string, unknown>) {
    const heard = {
      react: { events: [] as KozmosAnalyticsEvent[], clicks: 0 },
      vue: { events: [] as KozmosAnalyticsEvent[], clicks: 0 },
    };
    const reactHost = host();
    reactRoot = createRoot(reactHost);
    await act(async () =>
      reactRoot!.render(
        React.createElement(
          KozmosReact.AnalyticsProvider,
          {
            batchDelayMs: 0,
            onDispatch: (events) => heard.react.events.push(...events),
          },
          React.createElement(
            KozmosReact.IconButton,
            {
              "aria-label": "Help",
              counter: 3,
              ...props,
              onClick: () => heard.react.clicks++,
            },
            React.createElement(SearchMd, { "aria-hidden": "true" }),
          ),
        ),
      ),
    );
    const vueHost = host();
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
            h(
              KozmosIconButton,
              {
                "aria-label": "Help",
                counter: 3,
                ...props,
                onClick: () => heard.vue.clicks++,
              },
              () => [h(VueSearchMd, { "aria-hidden": "true" })],
            ),
          ],
        ),
    });
    vueApp.mount(vueHost);
    return { heard, reactHost, vueHost };
  }

  it("a press reports React's Button's button_clicked, and reaches the app's listener", async () => {
    const { heard, reactHost, vueHost } = await draw({ variant: "outline" });
    expect(normalizeHtml(vueHost.innerHTML)).toBe(
      normalizeHtml(reactHost.innerHTML),
    );
    await act(async () => {
      reactHost.querySelector("button")!.click();
      vueHost.querySelector("button")!.click();
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(read(heard.react.events)).toEqual([
      {
        component: "Button",
        eventName: "button_clicked",
        properties: { variant: "outline", emotion: null },
      },
    ]);
    expect(read(heard.vue.events)).toEqual(read(heard.react.events));
    expect(heard.react.clicks).toBe(1);
    expect(heard.vue.clicks).toBe(heard.react.clicks);
  });

  it("a disabled button is not pressed, in either", async () => {
    const { heard, reactHost, vueHost } = await draw({ disabled: true });
    await act(async () => {
      reactHost.querySelector("button")!.click();
      vueHost.querySelector("button")!.click();
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(heard.react).toEqual({ events: [], clicks: 0 });
    expect(heard.vue).toEqual(heard.react);
  });
});
