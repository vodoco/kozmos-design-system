// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import * as React from "react";
import * as KozmosReact from "@kozmos-ds/react";
import { defineComponent, h } from "vue";
import { KozmosThemeProvider, KozmosCounter } from "../../src/index";
import { renderBoth, type Drawn } from "./render";
import { element } from "./slotted";

/**
 * What the stories parity check cannot draw from React's args, drawn in
 * both: the Emotions story. Then the edges React's tests cover
 * (Counter.test.tsx): each tone and size, each emotion over a tone, the
 * count's parentheses taken off, a count that is not text alone drawn as
 * it is, and an app's class and style over the recipe's.
 */
const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});
const counter = (props: Record<string, unknown>, count = "3"): Drawn => {
  const { className, style, ...rest } = props;
  return {
    react: KozmosReact.Counter,
    vue: KozmosCounter,
    props,
    vueProps: {
      ...rest,
      ...(className === undefined ? {} : { class: className }),
      ...(style === undefined ? {} : { style }),
    },
    children: [count],
  };
};
const both = (tree: Drawn) => renderBoth(inTheme(tree));

describe("KozmosCounter draws what React's Counter draws", () => {
  it("Emotions: draws what React's story draws", async () => {
    const { react, vue } = await both(
      element(
        "div",
        { className: "flex items-center gap-2" },
        (
          [
            ["neutral", "8"],
            ["themed", "12"],
            ["success", "3"],
            ["danger", "99"],
            ["informative", "5"],
            ["alert", "41"],
          ] as const
        ).map(([emotion, count]) => counter({ emotion }, count)),
      ),
    );
    expect(react).toContain("--kz-emotion-surface");
    expect(vue).toBe(react);
  });

  it.each([
    ["neutral, by default", {}],
    ["brand", { tone: "brand" }],
    ["destructive", { tone: "destructive" }],
    ["inverse", { tone: "inverse" }],
    ["small", { size: "sm" }],
    ["an emotion over a tone", { tone: "brand", emotion: "danger" }],
    ["an emotion, small", { emotion: "alert", size: "sm" }],
    ["a class over the recipe's", { className: "px-0 kozmos-parity" }],
    [
      "an app's style over the emotion's",
      {
        emotion: "success",
        style: { "--kz-emotion-surface": "red", color: "blue" },
      },
    ],
    ["an app's style without an emotion", { style: { color: "blue" } }],
    ["an app's data-slot", { "data-slot": "mine" }],
  ] as const)("a counter: %s", async (_name, props) => {
    const { react, vue } = await both(counter({ ...props }));
    expect(vue).toBe(react);
  });

  it.each([
    ["(3)", "3"],
    [" ( 12 ) ", "12"],
    ["99+", "99+"],
  ])("writes %j as %j, as React's does", async (count, shown) => {
    const { react, vue, raw } = await both(counter({}, count));
    expect(raw.react).toContain(`>${shown}</span>`);
    expect(vue).toBe(react);
  });

  it("draws a count that is not text alone as it is", async () => {
    const { react, vue, raw } = await both({
      react: () =>
        React.createElement(
          KozmosReact.Counter,
          null,
          React.createElement("b", null, "(3)"),
        ),
      vue: defineComponent({
        setup: () => () =>
          h(KozmosCounter, null, { default: () => [h("b", null, "(3)")] }),
      }),
    });
    expect(raw.react).toContain("<b>(3)</b>");
    expect(vue).toBe(react);
  });
});
