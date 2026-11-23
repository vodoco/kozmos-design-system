import { describe, expect, it } from "vitest";
import * as React from "react";
import { renderToString } from "react-dom/server";
import * as Icons from "@kozmos-ds/icons";
import { createSSRApp } from "vue";
import { renderToString as vueToString } from "vue/server-renderer";
import { GLYPHS, glyph, type GlyphName } from "../../src/components/glyphs";
import { normalizeHtml } from "./normalize-html";

/**
 * The glyphs Vue's native parts draw inline (`src/components/glyphs.ts`)
 * are `@kozmos-ds/icons`' own: each, with the attributes a part gives it,
 * draws what the package's React icon draws. A glyph the package redraws
 * fails here before any part's parity spec.
 */
describe("Vue's inline glyphs are the icon package's", () => {
  it.each(Object.keys(GLYPHS) as GlyphName[])("%s", async (name) => {
    const Icon = Icons[name] as React.ElementType;
    const react = renderToString(
      React.createElement(Icon, {
        "aria-hidden": "true",
        className: "h-4 w-4",
      }),
    );
    const vue = await vueToString(
      createSSRApp({
        render: () => glyph(name, { "aria-hidden": "true", class: "h-4 w-4" }),
      }),
    );
    expect(normalizeHtml(vue)).toBe(normalizeHtml(react));
  });
});
