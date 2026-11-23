import { describe, expect, it } from "vitest";
import * as KozmosReact from "@kozmos-ds/react";
import { KozmosThemeProvider, KozmosKbd, KozmosText } from "../../src/index";
import { renderBoth, type Drawn } from "./render";

/**
 * React's InAHint story draws with its own render, so the stories parity
 * check cannot draw it from args: here it is, drawn in both, and each of
 * Kbd's own rules beside it: a key read by its name only where the name
 * differs from what is drawn, a combination's caps joined by "+", one key
 * given as `keys`, and `label` read instead of the keys' names.
 */
const kbd = (
  props: Record<string, unknown>,
  key?: string,
  vueProps?: Record<string, unknown>,
): Drawn => ({
  react: KozmosReact.Kbd,
  vue: KozmosKbd,
  props,
  vueProps,
  children: key === undefined ? [] : [key],
});
const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});

describe("KozmosKbd draws what React's Kbd draws", () => {
  it("InAHint: draws what React's story draws", async () => {
    const { react, vue } = await renderBoth(
      inTheme({
        react: KozmosReact.Text,
        vue: KozmosText,
        props: { size: "sm", color: "muted" },
        children: [
          "Press ",
          kbd({}, "Esc"),
          " to clear the selection, or ",
          kbd({ keys: ["⌘", "A"] }),
          " ",
          "to select every feature.",
        ],
      }),
    );
    expect(react).toContain("Escape");
    expect(react).toContain("Command");
    expect(vue).toBe(react);
  });

  it.each([
    ["a key whose name is what it draws", {}, "K"],
    ["a glyph read by its name", {}, "⌘"],
    ["a short name read in full, whatever its case", {}, "PGUP"],
    ["a key Kozmos has no name for", {}, "F7"],
    ["one key given as keys", { keys: ["Esc"] }, undefined],
    ["a combination", { keys: ["Ctrl", "Shift", "P"] }, undefined],
    [
      "a combination read in the product's words",
      { keys: ["Ctrl", "C"], label: "Control plus C" },
      undefined,
    ],
    ["one key read in the product's words", { label: "Escape key" }, "Esc"],
    ["no key at all", {}, undefined],
  ] as const)("%s", async (_name, props, key) => {
    const { react, vue } = await renderBoth(inTheme(kbd({ ...props }, key)));
    expect(vue).toBe(react);
  });

  it.each([
    ["one key", {}, "Esc"],
    ["a combination", { keys: ["Alt", "F4"] }, undefined],
  ] as const)(
    "merges a class over %s's recipe, as React's className",
    async (_name, props, key) => {
      const { react, vue } = await renderBoth(
        inTheme(
          kbd({ ...props, className: "ms-2" }, key, {
            ...props,
            class: "ms-2",
          }),
        ),
      );
      expect(vue).toBe(react);
    },
  );
});
