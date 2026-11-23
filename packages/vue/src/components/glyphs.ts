import { h } from "vue";

/**
 * The few `@kozmos-ds/icons` glyphs Vue's native parts draw inside
 * themselves (ListItemStatus's check, Notice's tone marks and its More
 * chevron), drawn as the icons package draws each: its 24 box, a 2 stroke in
 * `currentColor`, round caps and joins. Internal, as React's parts import
 * them internally: the main entry ships no icon package (PORTING.md §3, a
 * part another draws is drawn inline). The parity specs render React's part,
 * with the package's own icon, beside Vue's, so a glyph that drifts from the
 * package fails there.
 */
export const GLYPHS = {
  AlertCircle:
    "M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z",
  AlertTriangle:
    "M11.9998 8.99999V13M11.9998 17H12.0098M10.6151 3.89171L2.39019 18.0983C1.93398 18.8863 1.70588 19.2803 1.73959 19.6037C1.769 19.8857 1.91677 20.142 2.14613 20.3088C2.40908 20.5 2.86435 20.5 3.77487 20.5H20.2246C21.1352 20.5 21.5904 20.5 21.8534 20.3088C22.0827 20.142 22.2305 19.8857 22.2599 19.6037C22.2936 19.2803 22.0655 18.8863 21.6093 18.0983L13.3844 3.89171C12.9299 3.10654 12.7026 2.71396 12.4061 2.58211C12.1474 2.4671 11.8521 2.4671 11.5935 2.58211C11.2969 2.71396 11.0696 3.10655 10.6151 3.89171Z",
  Check: "M20 6L9 17L4 12",
  ChevronDown: "M6 9L12 15L18 9",
  InfoCircle:
    "M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z",
} as const;

export type GlyphName = keyof typeof GLYPHS;

/** One glyph, with the attributes the part gives it after the icon's own. */
export function glyph(name: GlyphName, attrs: Record<string, unknown> = {}) {
  return h(
    "svg",
    {
      fill: "none",
      height: 24,
      stroke: "currentColor",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": 2,
      viewBox: "0 0 24 24",
      width: 24,
      xmlns: "http://www.w3.org/2000/svg",
      ...attrs,
    },
    [h("path", { d: GLYPHS[name] })],
  );
}
