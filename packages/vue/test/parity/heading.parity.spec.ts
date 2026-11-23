import { describe, expect, it } from "vitest";
import * as KozmosReact from "@kozmos-ds/react";
import { KozmosThemeProvider, KozmosHeading } from "../../src/index";
import { renderBoth, type Drawn } from "./render";

/**
 * React's AllLevels story draws with its own render, so the stories parity
 * check cannot draw it from args: here it is, drawn in both, and each of
 * Heading's own rules: a level's size and tag, `as` over the level's tag,
 * `level={null}` at the body's size, the display size over the level's,
 * and Text's props passed through.
 */
const heading = (
  props: Record<string, unknown>,
  text: string,
  vueProps?: Record<string, unknown>,
): Drawn => ({
  react: KozmosReact.Heading,
  vue: KozmosHeading,
  props,
  vueProps,
  children: [text],
});
const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});

describe("KozmosHeading draws what React's Heading draws", () => {
  it("AllLevels: draws what React's story draws", async () => {
    const { react, vue } = await renderBoth(
      inTheme({
        react: "div",
        vue: "div",
        props: { className: "space-y-4" },
        vueProps: { class: "space-y-4" },
        children: ([1, 2, 3, 4, 5, 6] as const).map((level) =>
          heading({ level }, `Heading ${level}`),
        ),
      }),
    );
    expect(react).toContain("<h6");
    expect(react).toContain("kozmos-text-4xl");
    expect(vue).toBe(react);
  });

  it.each([
    ["the first level by default", {}],
    ["another tag at the level's size", { level: 2, as: "h4" }],
    ["the body's size with no level", { level: null }],
    ["the display size over the level's", { level: 1, size: "display" }],
    [
      "Text's colour, alignment and truncation",
      { level: 3, color: "muted", align: "center", truncate: true },
    ],
  ] as const)("%s", async (_name, props) => {
    const { react, vue } = await renderBoth(
      inTheme(heading({ ...props }, "Gate 4")),
    );
    expect(vue).toBe(react);
  });

  it("merges a class over the recipe's, as React's className", async () => {
    const { react, vue } = await renderBoth(
      inTheme(
        heading({ className: "text-primary mt-2" }, "Gate 4", {
          class: "text-primary mt-2",
        }),
      ),
    );
    expect(vue).toBe(react);
  });

  it("draws the recipe on its one child with as-child", async () => {
    const child = (): Drawn => ({
      react: "a",
      vue: "a",
      props: { href: "#gate-4", className: "underline" },
      vueProps: { href: "#gate-4", class: "underline" },
      children: ["Gate 4"],
    });
    const { react, vue } = await renderBoth(
      inTheme({
        react: KozmosReact.Heading,
        vue: KozmosHeading,
        props: { level: 2, asChild: true },
        children: [child()],
      }),
    );
    expect(react).toContain("<a");
    expect(react).not.toContain("<h2");
    expect(vue).toBe(react);
  });
});
