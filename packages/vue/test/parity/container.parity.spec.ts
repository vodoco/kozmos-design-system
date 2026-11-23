import { describe, expect, it } from "vitest";
import * as KozmosReact from "@kozmos-ds/react";
import { KozmosThemeProvider, KozmosContainer } from "../../src/index";
import { renderBoth, type Drawn } from "./render";

/**
 * React's Container stories draw their content as JSX, and two with their
 * own render, so the stories parity check cannot draw them from args: here
 * is each, as React's draws it, and the block inset's edges.
 */
const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});
const element = (
  tag: string,
  className: string,
  children: (Drawn | string)[],
): Drawn => ({
  react: tag,
  vue: tag,
  props: { className },
  vueProps: { class: className },
  children,
});
const container = (
  props: Record<string, unknown>,
  children: (Drawn | string)[],
): Drawn => ({
  react: KozmosReact.Container,
  vue: KozmosContainer,
  props,
  children,
});
const content = (text: string) =>
  element("div", "bg-muted p-4 border border-dashed text-center", [text]);
const dashed = (text: string) =>
  element("div", "border border-dashed bg-muted p-4 text-center", [text]);

describe("KozmosContainer draws what React's Container draws", () => {
  it("Default: draws what React's story draws", async () => {
    const { react, vue } = await renderBoth(
      inTheme(container({}, [content("Container Content (Max Width 7xl)")])),
    );
    expect(react).toContain("mx-auto max-w-7xl");
    expect(vue).toBe(react);
  });

  it("Fluid: draws what React's story draws", async () => {
    const { react, vue } = await renderBoth(
      inTheme(
        container({ centered: false }, [
          content("Fluid Container (Full Width)"),
        ]),
      ),
    );
    expect(react).not.toContain("max-w-7xl");
    expect(vue).toBe(react);
  });

  it("InAPanel: draws what React's story draws", async () => {
    const { react, vue } = await renderBoth(
      inTheme(
        element("div", "flex flex-wrap gap-6 p-6", [
          element("div", "min-w-0 flex-1 basis-[280px]", [
            element("p", "mb-2 text-xs text-muted-foreground", [
              'inset="window" (the default)',
            ]),
            container({ centered: false }, [dashed("Page content")]),
          ]),
          element("div", "w-[390px] max-w-full rounded-container border", [
            element("p", "mb-2 p-2 text-xs text-muted-foreground", [
              'inset="panel"',
            ]),
            container({ centered: false, inset: "panel" }, [
              dashed("Panel content"),
            ]),
          ]),
        ]),
      ),
    );
    expect(react).toContain("lg:px-8");
    expect(vue).toBe(react);
  });

  it("BlockInset: draws what React's story draws", async () => {
    const framed = (block: unknown, text: string) =>
      element("div", "rounded-container border", [
        container({ centered: false, inset: "panel", block }, [dashed(text)]),
      ]);
    const { react, vue } = await renderBoth(
      inTheme(
        element("div", "flex flex-col gap-6 p-6", [
          ...(["sm", "md", "lg"] as const).map((block) =>
            framed(block, `block="${block}"`),
          ),
          framed(
            { start: "lg", end: "md" },
            'block={{ start: "lg", end: "md" }}',
          ),
        ]),
      ),
    );
    expect(react).toContain("pt-8 pb-6");
    expect(vue).toBe(react);
  });

  it.each([
    ["only a top inset", { block: { start: "sm" } }],
    ["only a bottom inset", { block: { end: "lg" } }],
    ["no inset at either edge", { block: "none" }],
    [
      "an app's padding over the recipe's",
      { className: "px-0 pt-1", block: "md" },
    ],
  ] as const)("%s", async (_name, props) => {
    const { className, ...rest } = props as Record<string, unknown>;
    const { react, vue } = await renderBoth(
      inTheme({
        react: KozmosReact.Container,
        vue: KozmosContainer,
        props,
        vueProps:
          className === undefined ? rest : { ...rest, class: className },
        children: ["Region"],
      }),
    );
    expect(vue).toBe(react);
  });
});
