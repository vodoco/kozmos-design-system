import { describe, expect, it } from "vitest";
import * as KozmosReact from "@kozmos-ds/react";
import { KozmosSkeleton, KozmosThemeProvider } from "../../src/index";
import { renderBoth, type Drawn } from "./render";

/**
 * React's Skeleton story draws with its own render: here is Default, as
 * its render draws it, and each shape with and without a size, as React's
 * tests cover them: a line 16 tall unless told, a block only what it is
 * given, a circle 40 unless told, `width` its diameter, and an app's own
 * style over the box.
 */
const skeleton = (
  props: Record<string, unknown>,
  vueProps?: Record<string, unknown>,
): Drawn => ({
  react: KozmosReact.Skeleton,
  vue: KozmosSkeleton,
  props,
  vueProps,
});
const element = (
  className: string,
  children: Drawn[],
  style?: Record<string, unknown>,
): Drawn => ({
  react: "div",
  vue: "div",
  props: { className, ...(style ? { style } : {}) },
  vueProps: { class: className, ...(style ? { style } : {}) },
  children,
});
const inTheme = (...children: Drawn[]) =>
  renderBoth({
    react: KozmosReact.ThemeProvider,
    vue: KozmosThemeProvider,
    children,
  });
const withClass = (className: string) =>
  skeleton({ className }, { class: className });

describe("KozmosSkeleton draws what React's Skeleton draws", () => {
  it("Default: draws what React's story draws", async () => {
    const { react, vue } = await inTheme(
      element(
        "flex w-full items-center gap-4",
        [
          withClass("h-12 w-12 shrink-0 rounded-pill"),
          element("min-w-0 flex-1 space-y-2", [
            withClass("h-4 w-full"),
            withClass("h-4 w-3/4"),
          ]),
        ],
        { maxWidth: "320px" },
      ),
    );
    expect(react).toContain("kozmos-skeleton");
    expect(vue).toBe(react);
  });

  it.each([
    ["a line, by default", {}, {}],
    ["a line of a given width", { width: "60%" }, { width: "60%" }],
    ["a line of a given height", { height: 20 }, { height: 20 }],
    ["a block", { shape: "block", height: 80 }, { shape: "block", height: 80 }],
    ["a circle, 40 by default", { shape: "circle" }, { shape: "circle" }],
    [
      "a circle whose width is its diameter",
      { shape: "circle", width: 24 },
      { shape: "circle", width: 24 },
    ],
    [
      "an app's style over the box",
      { width: 100, style: { width: 50, marginTop: 4 } },
      { width: 100, style: { width: "50px", marginTop: "4px" } },
    ],
    [
      "its children, as React's spreads them",
      { shape: "block", children: "Loading" },
      { shape: "block" },
    ],
  ] as const)("%s", async (_name, props, vueProps) => {
    const { children, ...reactProps } = props as Record<string, unknown>;
    const { react, vue } = await inTheme({
      ...skeleton(reactProps, { ...vueProps }),
      children: children ? [String(children)] : [],
    });
    expect(vue).toBe(react);
  });
});
