import { describe, expect, it } from "vitest";
import * as KozmosReact from "@kozmos-ds/react";
import * as IconsReact from "@kozmos-ds/icons";
import * as IconsVue from "@kozmos-ds/icons/vue";
import { KozmosThemeProvider, KozmosIcon } from "../../src/index";
import { renderBoth, type Drawn } from "./render";

/**
 * React's Sizes, Colors and Registry stories draw with their own render, so
 * the stories parity check cannot draw them from args: here each is, drawn
 * in both. React's Icon draws the glyph `@kozmos-ds/icons` draws for React,
 * Vue's the glyph its Vue entry draws: the same `<svg>`, so each comparison
 * also holds the two entries' glyphs equal. Colors hands each its own
 * entry's component, as an app does.
 */
const icon = (
  props: Record<string, unknown>,
  vueProps?: Record<string, unknown>,
): Drawn => ({
  react: KozmosReact.Icon,
  vue: KozmosIcon,
  props,
  vueProps,
});
const box = (className: string, children: (Drawn | string)[]): Drawn => ({
  react: "div",
  vue: "div",
  props: { className },
  vueProps: { class: className },
  children,
});
const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});

describe("KozmosIcon draws what React's Icon draws", () => {
  it("Sizes: draws what React's story draws", async () => {
    const { react, vue } = await renderBoth(
      inTheme(
        box(
          "flex items-end gap-4",
          (["xs", "sm", "md", "lg", "xl"] as const).map((size) =>
            icon({ name: "user-01", size }),
          ),
        ),
      ),
    );
    expect(react).toContain("h-8 w-8");
    expect(vue).toBe(react);
  });

  it("Colors: draws what React's story draws", async () => {
    const { react, vue } = await renderBoth(
      inTheme(
        box(
          "flex items-center gap-4",
          (["default", "muted", "primary", "destructive"] as const).map(
            (color) =>
              icon(
                { icon: IconsReact.Settings01, color },
                { icon: IconsVue.Settings01, color },
              ),
          ),
        ),
      ),
    );
    expect(react).toContain("text-destructive-text");
    expect(vue).toBe(react);
  });

  it("Registry: draws what React's story draws", async () => {
    const { react, vue } = await renderBoth(
      inTheme(
        box(
          "grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6",
          IconsReact.kozmosIconDefinitions.map((definition) =>
            box("flex items-center gap-2 rounded border p-2 text-xs", [
              icon({ name: definition.name, size: "sm" }),
              box("truncate", [definition.name]),
            ]),
          ),
        ),
      ),
    );
    expect(
      IconsVue.kozmosIconDefinitions.map((definition) => definition.name),
    ).toEqual(IconsReact.kozmosIconDefinitions.map((d) => d.name));
    expect(react.match(/<svg/g)?.length).toBe(
      IconsReact.kozmosIconDefinitions.length,
    );
    expect(vue).toBe(react);
  });

  it.each([
    ["a name beyond the library", { name: "walking" }],
    ["an alias", { name: "search" }],
    [
      "named for assistive technology",
      { name: "x-close", "aria-label": "Close" },
    ],
    [
      "labelled by another element",
      { name: "x-close", "aria-labelledby": "t" },
    ],
    [
      "its stroke held as it scales",
      { name: "x-close", absoluteStrokeWidth: true, size: "xl" },
    ],
    ["a stroke weight of its own", { name: "x-close", strokeWidth: 1.5 }],
    ["a name the registry does not have", { name: "not-an-icon" }],
    ["neither a name nor an icon", {}],
  ] as const)("%s", async (_name, props) => {
    const { react, vue } = await renderBoth(inTheme(icon({ ...props })), {
      keepIds: ["t"],
    });
    expect(vue).toBe(react);
  });

  it("merges a class over the recipe's, as React's className", async () => {
    const { react, vue } = await renderBoth(
      inTheme(
        icon(
          { name: "home-line", className: "h-10 w-10 text-primary" },
          { name: "home-line", class: "h-10 w-10 text-primary" },
        ),
      ),
    );
    expect(vue).toBe(react);
  });
});
