import { describe, expect, it } from "vitest";
import * as KozmosReact from "@kozmos-ds/react";
import {
  KozmosButton,
  KozmosDensityScope,
  KozmosThemeProvider,
} from "../../src/index";
import { renderBoth, type Drawn } from "./render";

/**
 * Vue's Button draws the element React's draws (Vue 3 Phase 0): for the
 * emotion matrix the Emotions story draws, and for what each framework spells
 * its own way, React's and Vue's server renders inside a ThemeProvider
 * normalise to the same tree. Button's args stories are drawn in both by
 * `stories.parity.spec.ts`, as every port's are.
 */

const theme = (
  props: Record<string, unknown>,
  ...children: Drawn[]
): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  props,
  children,
});

/** A Button drawn from story args: `children` is its content in both. */
const button = ({ children, ...props }: Record<string, unknown>): Drawn => ({
  react: KozmosReact.Button,
  vue: KozmosButton,
  props,
  children: children === undefined ? [] : [String(children)],
});

describe("KozmosButton draws React's Button", () => {
  // What the Emotions story draws: each variant it shows, in every emotion.
  // glass is in the recipe too, and takes no emotion; it is drawn here so a
  // change to that rule shows up in both.
  for (const variant of ["default", "outline", "ghost", "glass"] as const) {
    for (const emotion of KozmosReact.BUTTON_EMOTIONS) {
      it(`Emotions: ${variant}, ${emotion}`, async () => {
        const { react, vue } = await renderBoth(
          theme({}, button({ variant, emotion, children: emotion })),
        );
        expect(vue).toBe(react);
      });
    }
  }

  // Each framework's own way to say the same thing: React's className and a
  // style object, Vue's class and a style string.
  const pairs: [string, Record<string, unknown>, Record<string, unknown>][] = [
    ["sm", { size: "sm" }, { size: "sm" }],
    ["lg", { size: "lg" }, { size: "lg" }],
    [
      "icon, named",
      { size: "icon", "aria-label": "Close" },
      { size: "icon", "aria-label": "Close" },
    ],
    // tailwind-merge resolves a caller's padding against the recipe's.
    [
      "a caller's class merged with the recipe's",
      { className: "px-8 extra" },
      { class: "px-8 extra" },
    ],
    [
      "native attributes",
      { type: "submit", name: "save", value: "1" },
      { type: "submit", name: "save", value: "1" },
    ],
    [
      "an emotion with a caller's style",
      { emotion: "danger", style: { marginTop: "4px" } },
      { emotion: "danger", style: "margin-top: 4px" },
    ],
    [
      "loading and not disabled",
      { isLoading: true, disabled: false },
      { isLoading: true, disabled: false },
    ],
  ];
  for (const [name, reactProps, vueProps] of pairs) {
    it(name, async () => {
      const { react, vue } = await renderBoth(
        theme(
          {},
          {
            react: KozmosReact.Button,
            vue: KozmosButton,
            props: reactProps,
            vueProps,
            children: [name],
          },
        ),
      );
      expect(vue).toBe(react);
    });
  }
});

describe("KozmosThemeProvider and KozmosDensityScope draw React's", () => {
  const cases: [string, Drawn][] = [
    ["defaults", theme({}, button({ children: "A" }))],
    [
      "dark, right to left, compact",
      theme(
        { theme: "dark", dir: "rtl", density: "compact" },
        button({ children: "B" }),
      ),
    ],
    [
      "a system theme falls back to defaultSystemTheme",
      theme(
        { defaultTheme: "system", defaultSystemTheme: "dark" },
        button({ children: "C" }),
      ),
    ],
    [
      "one token set",
      theme(
        { tokens: { "--kz-test": "1px", "--kz-number": 2 } },
        button({ children: "D" }),
      ),
    ],
    [
      "a set per theme",
      theme(
        {
          theme: "dark",
          tokens: { light: { "--kz-light": "1" }, dark: { "--kz-dark": "2" } },
        },
        button({ children: "E" }),
      ),
    ],
    [
      "a nested provider inherits density, direction and tokens",
      theme(
        { density: "compact", dir: "rtl", tokens: { "--kz-outer": "1" } },
        theme(
          { theme: "dark", tokens: { "--kz-inner": "2" } },
          button({ children: "F" }),
        ),
      ),
    ],
    [
      "a DensityScope adds its element",
      theme(
        {},
        {
          react: KozmosReact.DensityScope,
          vue: KozmosDensityScope,
          props: { density: "compact" },
          children: [button({ children: "G" })],
        },
      ),
    ],
    [
      "a DensityScope as the child marks the child",
      theme(
        {},
        {
          react: KozmosReact.DensityScope,
          vue: KozmosDensityScope,
          props: { density: "compact", asChild: true },
          children: [button({ children: "H" })],
        },
      ),
    ],
    [
      "a DensityScope as the child of two children adds its element",
      theme(
        {},
        {
          react: KozmosReact.DensityScope,
          vue: KozmosDensityScope,
          props: { density: "compact", asChild: true },
          children: [button({ children: "I" }), button({ children: "J" })],
        },
      ),
    ],
    [
      "a provider inside a DensityScope takes its density",
      theme(
        {},
        {
          react: KozmosReact.DensityScope,
          vue: KozmosDensityScope,
          props: { density: "compact" },
          children: [theme({}, button({ children: "K" }))],
        },
      ),
    ],
  ];
  for (const [name, tree] of cases) {
    it(name, async () => {
      const { react, vue } = await renderBoth(tree);
      expect(vue).toBe(react);
    });
  }
});
