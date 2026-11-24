import { describe, expect, it } from "vitest";
import * as KozmosReact from "@kozmos-ds/react";
import { KozmosThemeProvider, KozmosBox, KozmosStack } from "../../src/index";
import { renderBoth, type Drawn } from "./render";

/**
 * React's Stack stories draw their items as JSX children, so the stories
 * parity check cannot draw them from args: here are its Default and
 * Horizontal, as React's draws them, with the items React's BoxItem draws,
 * and each of the recipe's axes drawn in both.
 */
const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});
// React's BoxItem: `p-4 rounded ${foreground} ${fill}`.
const item = (fill: string, foreground: string, text: string): Drawn => {
  const className = `p-4 rounded ${foreground} ${fill}`;
  return {
    react: KozmosReact.Box,
    vue: KozmosBox,
    props: { className },
    vueProps: { class: className },
    children: [text],
  };
};
const items = () => [
  item("bg-theme-fill", "text-theme-fill-foreground", "Item 1"),
  item("bg-secondary", "text-secondary-foreground", "Item 2"),
  item("bg-accent", "text-accent-foreground", "Item 3"),
];
const stack = (
  props: Record<string, unknown>,
  children: (Drawn | string)[] = items(),
  vueProps?: Record<string, unknown>,
): Drawn => ({
  react: KozmosReact.Stack,
  vue: KozmosStack,
  props,
  vueProps,
  children,
});

describe("KozmosStack draws what React's Stack draws", () => {
  it("Default: draws what React's story draws", async () => {
    const { react, vue } = await renderBoth(inTheme(stack({})));
    expect(react).toContain("flex flex-col items-stretch");
    expect(vue).toBe(react);
  });

  it("Horizontal: draws what React's story draws", async () => {
    const { react, vue } = await renderBoth(
      inTheme(stack({ direction: "row", gap: 4 })),
    );
    expect(react).toContain("flex-row");
    expect(react).toContain("gap-4");
    expect(vue).toBe(react);
  });

  it.each([
    [
      "row-reverse, centred, between",
      { direction: "row-reverse", align: "center", justify: "between" },
    ],
    [
      "column-reverse, at the end, around",
      { direction: "column-reverse", align: "end", justify: "around" },
    ],
    ["baseline, wrapped, no gap", { align: "baseline", wrap: "wrap", gap: 0 }],
    ["wrap-reverse, the widest gap", { wrap: "wrap-reverse", gap: 8 }],
  ] as const)("%s", async (_name, props) => {
    const { react, vue } = await renderBoth(inTheme(stack({ ...props })));
    expect(vue).toBe(react);
  });

  it("an app's class over the recipe's, merged as React's", async () => {
    const { react, vue } = await renderBoth(
      inTheme(
        stack({ className: "gap-10 flex-row" }, ["Merged"], {
          class: "gap-10 flex-row",
        }),
      ),
    );
    expect(react).not.toContain("gap-2");
    expect(vue).toBe(react);
  });

  it("as-child: the stack's classes on its one child", async () => {
    const child: Drawn = {
      react: "section",
      vue: "section",
      props: { className: "p-1" },
      vueProps: { class: "p-1" },
      children: ["Section"],
    };
    const { react, vue } = await renderBoth(
      inTheme(stack({ asChild: true, gap: 4 }, [child])),
    );
    expect(react).toContain("<section");
    expect(vue).toBe(react);
  });
});
