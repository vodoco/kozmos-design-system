import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdaptiveMapShell } from "./AdaptiveMapShell";

// GAP-265: before its first measure the shell laid its panel out at width
// 0, and WebKit can keep a grid's auto row at the height that layout gave
// it once the panel widens (RouteSummary's actions row did, by 134 px,
// #543). The first layout, the one the markup is drawn with before any
// measure, puts the panel at the host's width, out of sight, never at 0.
describe("AdaptiveMapShell's first layout (GAP-265)", () => {
  for (const presentation of ["bottom", "side"] as const)
    it(`lays the ${presentation} panel out at the host's width before it measures`, () => {
      const markup = renderToStaticMarkup(
        <AdaptiveMapShell
          map={<div />}
          panel={<div>Place details</div>}
          panelPresentation={presentation}
        />,
      );
      const aside = markup.match(/<aside[^>]*>/)?.[0] ?? "";
      expect(aside, "no panel").not.toBe("");
      expect(aside).not.toMatch(/width:0(px)?[;"]/);
      expect(aside).toMatch(/width:100%/);
      expect(aside).toMatch(/visibility:hidden/);
    });
});
