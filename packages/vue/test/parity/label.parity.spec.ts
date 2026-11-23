import { describe, expect, it } from "vitest";
import * as KozmosReact from "@kozmos-ds/react";
import { KozmosThemeProvider, KozmosLabel } from "../../src/index";
import { renderBoth, type Drawn } from "./render";

/**
 * React's WithInput story draws with its own render, so the stories parity
 * check cannot draw it from args. Its Input is not ported yet: Vue's story
 * draws the bridge's KozmosInput, which mounts React's and cannot be server
 * rendered here, so this draws the story's grid and its Label, `for` the
 * field's id, in both; the Input joins the comparison when it is ported.
 * React's Label is Radix's, Vue's Reka UI's: the same `<label>`.
 */
const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});

describe("KozmosLabel draws what React's Label draws", () => {
  it("WithInput: draws what React's story draws, its label for the field", async () => {
    const { react, vue } = await renderBoth(
      inTheme({
        react: "div",
        vue: "div",
        props: {
          style: {
            display: "grid",
            gap: "0.5rem",
            width: "100%",
            maxWidth: "20rem",
          },
        },
        vueProps: {
          style: {
            display: "grid",
            gap: "0.5rem",
            width: "100%",
            maxWidth: "20rem",
          },
        },
        children: [
          {
            react: KozmosReact.Label,
            vue: KozmosLabel,
            props: { htmlFor: "label-email" },
            vueProps: { for: "label-email" },
            children: ["Email"],
          },
        ],
      }),
      { keepIds: ["label-email"] },
    );
    expect(react).toContain('for="label-email"');
    expect(vue).toBe(react);
  });

  it("merges a class over the recipe's, as React's className", async () => {
    const { react, vue } = await renderBoth(
      inTheme({
        react: KozmosReact.Label,
        vue: KozmosLabel,
        props: { className: "text-muted-foreground" },
        vueProps: { class: "text-muted-foreground" },
        children: ["Floor"],
      }),
    );
    expect(vue).toBe(react);
  });

  it("draws the recipe on its one child with as-child", async () => {
    const { react, vue } = await renderBoth(
      inTheme({
        react: KozmosReact.Label,
        vue: KozmosLabel,
        props: { asChild: true },
        children: [
          {
            react: "span",
            vue: "span",
            props: { className: "block" },
            vueProps: { class: "block" },
            children: ["Floor"],
          },
        ],
      }),
    );
    expect(react).not.toContain("<label");
    expect(vue).toBe(react);
  });
});
