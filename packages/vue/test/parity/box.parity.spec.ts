import { describe, expect, it } from "vitest";
import * as KozmosReact from "@kozmos-ds/react";
import { KozmosThemeProvider, KozmosBox } from "../../src/index";
import { renderBoth, type Drawn } from "./render";

/**
 * What the stories parity check cannot draw from React's args, drawn in
 * both: React's AsChild story, whose child is JSX, and the edges of
 * `asChild`. React's Box draws through Radix's Slot, Vue's through Reka
 * UI's: the Box's classes before the child's, its attributes on the child.
 */
const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});
const box = (
  props: Record<string, unknown>,
  children: (Drawn | string)[],
  vueProps?: Record<string, unknown>,
): Drawn => ({
  react: KozmosReact.Box,
  vue: KozmosBox,
  props,
  vueProps,
  children,
});
const span = (className: string, text: string): Drawn => ({
  react: "span",
  vue: "span",
  props: { className },
  vueProps: { class: className },
  children: [text],
});

describe("KozmosBox draws what React's Box draws", () => {
  it("AsChild: draws what React's story draws", async () => {
    const { react, vue } = await renderBoth(
      inTheme(
        box({ asChild: true }, [
          span(
            "p-4 bg-secondary text-secondary-foreground rounded-control",
            "This is a Span rendered via Box asChild",
          ),
        ]),
      ),
    );
    // The span is the Box: no div around it.
    expect(react).toContain("<span");
    expect(react).not.toContain("<div class=");
    expect(vue).toBe(react);
  });

  it.each([
    ["a div with no class of its own", {}, {}],
    [
      "as-child: the Box's class before the child's, its attributes on the child",
      { asChild: true, className: "p-2", id: "box", "data-part": "box" },
      { asChild: true, class: "p-2", id: "box", "data-part": "box" },
    ],
    [
      "an app's role and title on the div",
      { role: "region", title: "Area", className: "flex" },
      { role: "region", title: "Area", class: "flex" },
    ],
  ] as const)("%s", async (_name, props, vueProps) => {
    const { react, vue } = await renderBoth(
      inTheme(
        box({ ...props }, [span("text-sm", "Inside")], {
          ...vueProps,
        }),
      ),
      { keepIds: ["box"] },
    );
    expect(vue).toBe(react);
  });
});
