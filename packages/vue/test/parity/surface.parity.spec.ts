import { describe, expect, it } from "vitest";
import * as KozmosReact from "@kozmos-ds/react";
import { KozmosThemeProvider, KozmosSurface } from "../../src/index";
import { renderBoth, type Drawn } from "./render";

/**
 * React's Surface stories are drawn by its meta's render, on a frame for
 * glass to show through, so the stories parity check cannot draw them from
 * args: here is each story's Surface in that frame, as React's draws it.
 * The frame's line of Text is left out of both: Vue's story draws it with
 * the bridge's KozmosText, which mounts React after a server render, so no
 * server render of Vue's shows it.
 */
const BACKGROUND =
  "linear-gradient(135deg, var(--primitives-colors-theme-500) 0%, var(--primitives-colors-theme-200) 45%, var(--primitives-colors-background-300) 100%)";
const STORY_CLASS = "rounded-container p-4 text-foreground shadow-floating";

const inFrame = (props: Record<string, unknown>, text: string): Drawn => {
  const { className, ...rest } = props;
  return {
    react: KozmosReact.ThemeProvider,
    vue: KozmosThemeProvider,
    children: [
      {
        react: "div",
        vue: "div",
        props: {
          className: "relative min-h-[280px] rounded-panel p-6",
          style: { backgroundImage: BACKGROUND },
        },
        vueProps: {
          class: "relative min-h-[280px] rounded-panel p-6",
          style: { backgroundImage: BACKGROUND },
        },
        children: [
          {
            react: KozmosReact.Surface,
            vue: KozmosSurface,
            props,
            vueProps: { ...rest, class: className },
            children: [text],
          },
        ],
      },
    ],
  };
};

describe("KozmosSurface draws what React's Surface draws", () => {
  it("Solid: draws what React's story draws", async () => {
    const { react, vue } = await renderBoth(
      inFrame({ className: STORY_CLASS }, "A card over the map."),
    );
    expect(react).toContain("kozmos-surface-solid");
    expect(vue).toBe(react);
  });

  it("Glass: draws what React's story draws", async () => {
    const { react, vue } = await renderBoth(
      inFrame(
        { variant: "glass", className: STORY_CLASS },
        "A card over the map, on the glass surface role.",
      ),
    );
    expect(react).toContain("kozmos-surface-glass");
    expect(vue).toBe(react);
  });

  it("GlassPanel: draws what React's story draws", async () => {
    const { react, vue } = await renderBoth(
      inFrame(
        {
          variant: "glass",
          className: "rounded-panel p-6 text-foreground shadow-overlay",
        },
        "A panel, radius Panel, elevation Overlay.",
      ),
    );
    expect(react).toContain("shadow-overlay");
    expect(vue).toBe(react);
  });

  it("solid by default, with no class of the app's", async () => {
    const { react, vue } = await renderBoth(inFrame({}, "Plain"));
    expect(react).toContain('class="kozmos-reset kozmos-surface-solid"');
    expect(vue).toBe(react);
  });
});
