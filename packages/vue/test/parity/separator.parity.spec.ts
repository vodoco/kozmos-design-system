import { describe, expect, it } from "vitest";
import * as KozmosReact from "@kozmos-ds/react";
import { KozmosThemeProvider, KozmosSeparator } from "../../src/index";
import { renderBoth, type Drawn } from "./render";

/**
 * React's Separator stories draw with their own render, so the stories
 * parity check cannot draw them from args: here are its Default story, as
 * its render draws it, and each orientation, decorative and not, drawn in
 * both. React's is Radix's Separator, Vue's Reka UI's: the same element,
 * role, `aria-orientation` and `data-orientation`.
 */
const separator = (
  props: Record<string, unknown> = {},
  vueProps?: Record<string, unknown>,
): Drawn => ({
  react: KozmosReact.Separator,
  vue: KozmosSeparator,
  props,
  vueProps,
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
const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});

describe("KozmosSeparator draws what React's Separator draws", () => {
  it("Default: draws what React's story draws", async () => {
    const vertical = () =>
      separator({ orientation: "vertical" }, { orientation: "vertical" });
    const { react, vue } = await renderBoth(
      inTheme(
        element("div", "space-y-1", [
          element("h4", "text-sm font-medium leading-none", [
            "Radix Primitives",
          ]),
          element("p", "text-sm text-muted-foreground", [
            "An open-source UI component library.",
          ]),
          separator({ className: "my-4" }, { class: "my-4" }),
          element("div", "flex h-5 items-center space-x-4 text-sm", [
            element("div", "", ["Blog"]),
            vertical(),
            element("div", "", ["Docs"]),
            vertical(),
            element("div", "", ["Source"]),
          ]),
        ]),
      ),
    );
    expect(react).toContain('role="none"');
    expect(react).toContain('data-orientation="vertical"');
    expect(vue).toBe(react);
  });

  it.each([
    ["horizontal and decorative, by default", {}],
    ["vertical", { orientation: "vertical" }],
    ["a separator assistive technology reads", { decorative: false }],
    [
      "a vertical one it reads, with aria-orientation",
      { orientation: "vertical", decorative: false },
    ],
    ["a class over the recipe's", { className: "h-0.5 bg-primary" }],
  ] as const)("%s", async (_name, props) => {
    const { className, ...rest } = props as Record<string, unknown>;
    const { react, vue } = await renderBoth(
      inTheme(
        separator(
          props,
          className === undefined ? rest : { ...rest, class: className },
        ),
      ),
    );
    expect(vue).toBe(react);
  });
});
