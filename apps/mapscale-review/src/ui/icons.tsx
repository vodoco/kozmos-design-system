/**
 * The app's symbols, taken from the **Pointr Icon Library**
 * (Figma `PpbQbvpNTMvwqCx9dD4efJ`, page `181:128951` *Line icons*, 1,175 icons at 24×24).
 *
 * ⚠️ **Why these live here and not in `@kozmos-ds/icons`.** The DS package exposes **38 of the
 * 1,175** — and each of its entries records the library's own `figmaName` and `figmaNodeId` while
 * rendering a **`lucide-react`** component, so code and Figma ship *different drawings under the
 * same names*. Until that is resolved at the DS (`KOZMOS_DS_IMPROVEMENTS.md` §P3), this module is
 * the honest middle: the geometry is the library's own, exported from it, and every icon records
 * the node it came from — so the eventual swap to a real DS import is mechanical, not a redraw.
 *
 * **Do not hand-draw a symbol.** Search the library first, and search it **by category** — the
 * transparency glyph was recorded as "does not exist anywhere" for two days while `contrast-02`
 * sat in *Editor*. Four genuinely did not exist and were drawn into the library on 2026-08-20:
 * `combine`, `snap`, `straighten`, `square-up`.
 *
 * **The convention, read off the library's own components rather than assumed:** 24×24 viewBox,
 * stroke 2, round cap and join, no fills.
 *
 * ⚠️ **Stroke does not hold its weight as these shrink.** The library is drawn for 24px, so a
 * `size={12}` icon renders its 2px stroke at 1px on screen. The glyphs this replaced were drawn on
 * their own small viewBoxes at 1.6–1.9, i.e. visually heavier. That is the library's own behaviour
 * and it is deliberate here, but it is why the small marks read lighter than they used to.
 */
import type { CSSProperties } from "react";

type IconProps = {
  /** Rendered px. The 24-grid scales to it, stroke included — see the note above. */
  size?: number;
  className?: string;
  style?: CSSProperties;
  /** Set when the icon carries meaning on its own; omit to leave it decorative. */
  label?: string;
};

/**
 * A path that is **filled** rather than stroked.
 *
 * Almost every library glyph is a stroked outline and the plain `string` form covers it. A few are
 * not — `transparency` is two solid checker cells inside a stroked square — and rendering those
 * with the shared `fill="none"` would turn a solid cell into an empty box.
 */
type IconPath =
  | string
  | { d: string; filled: true }
  /** A dashed run — `split`'s cut line is dotted in the library and must stay dotted here. */
  | { d: string; dash: string };

/**
 * One wrapper for every icon, so the convention cannot drift glyph by glyph. `currentColor` is the
 * whole colour story: nothing here names a colour, and every caller tints by setting `color`.
 */
function icon(
  libraryName: string,
  node: string,
  paths: IconPath[],
  /** Square-cornered glyphs need a mitre; the round default softens a checkerboard's corners. */
  opts?: { linejoin?: "round" | "miter" },
) {
  const Icon = ({ size = 24, className, style, label }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin={opts?.linejoin ?? "round"}
      className={className}
      style={style}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {paths.map((p) =>
        typeof p === "string" ? (
          <path key={p} d={p} />
        ) : "filled" in p ? (
          <path key={p.d} d={p.d} fill="currentColor" stroke="none" />
        ) : (
          <path key={p.d} d={p.d} strokeDasharray={p.dash} />
        ),
      )}
    </svg>
  );
  Icon.displayName = libraryName;
  /** The library component this was exported from — the address for the eventual DS import. */
  Icon.library = { name: libraryName, node };
  return Icon;
}

/* ── the geometry editor's toolbar ─────────────────────────────────────────────────────────── */

/**
 * Reshape — drawn into the library 2026-08-20 as `polygon-points`.
 *
 * ⚠️ **It replaced `bezier-curve-02` because Reshape and Transform were the SAME DEVICE**: a ring
 * with four corner marks beside a box with four corner marks. At 22px that is one idea drawn twice
 * — and these are the two *mutually exclusive modes*, the pair that most needs telling apart
 * (Olcay, 2026-08-20). Two lesser faults went with it: the ring is a circle and rooms are not, and
 * "bezier" says curves when this editor is strictly polygonal.
 *
 * ⚠️ **The cursor DOES fit, and the earlier note here said it did not.** Two attempts on 2026-08-20
 * failed because the pointer and the path collided; the version that works — Olcay's own reference,
 * 2026-08-23 — **breaks the path where the cursor crosses it**, so the two never touch. That one
 * trick is the whole difference, and it is why "there is no room" was the wrong conclusion rather
 * than a true one.
 *
 * What it now shows is the act rather than the affordance: two anchors, the path between them, and
 * the pointer dragging it. Against Transform's regular box with four identical handles there is no
 * longer anything to confuse.
 */
export const Reshape = icon("edit-path", "2074:53", [
  "M2.6 3.4H6.8V7.6H2.6ZM17.2 3.4H21.4V7.6H17.2Z" +
    "M4.7 8.6C5.4 10.6 6.6 11.9 8.2 12.7M19.3 8.6C18.8 10.3 17.9 11.4 16.6 12.2" +
    "M10 10.2L10 20.6L12.5 18.2L14.4 22L16.2 21.1L14.4 17.4L17.6 17Z",
]);
/**
 * Move — repositioning a POINT (Olcay, 2026-08-23). Four arrows from a centre: the one thing you
 * can do to a single coordinate.
 *
 * ⚠️ **Not the same word as Transform, deliberately.** Transform moves, scales AND rotates, which
 * is why it stopped being called Move. A point has no size and no orientation, so scale and rotate
 * are meaningless on it — calling its mode Transform would promise two things that cannot happen.
 */
export const Move = icon("move", "1007:11360", [
  "M5 15L2 12L5 9M2 12H22M15 5L12 2L9 5M12 2V22M9 19L12 22L15 19M19 15L22 12L19 9",
]);

export const Transform = icon("transform", "1007:11468", [
  "M19 7V17M5 7V17M17 5L7 5M17 19H7M4.6 7H5.4C5.96 7 6.24 7 6.45 6.89C6.64 6.8 6.8 6.64 6.89 6.45C7 6.24 7 5.96 7 5.4V4.6C7 4.04 7 3.76 6.89 3.55C6.8 3.36 6.64 3.2 6.45 3.11C6.24 3 5.96 3 5.4 3H4.6C4.04 3 3.76 3 3.55 3.11C3.36 3.2 3.2 3.36 3.11 3.55C3 3.76 3 4.04 3 4.6V5.4C3 5.96 3 6.24 3.11 6.45C3.2 6.64 3.36 6.8 3.55 6.89C3.76 7 4.04 7 4.6 7ZM4.6 21H5.4C5.96 21 6.24 21 6.45 20.89C6.64 20.8 6.8 20.64 6.89 20.45C7 20.24 7 19.96 7 19.4V18.6C7 18.04 7 17.76 6.89 17.55C6.8 17.36 6.64 17.2 6.45 17.11C6.24 17 5.96 17 5.4 17H4.6C4.04 17 3.76 17 3.55 17.11C3.36 17.2 3.2 17.36 3.11 17.55C3 17.76 3 18.04 3 18.6V19.4C3 19.96 3 20.24 3.11 20.45C3.2 20.64 3.36 20.8 3.55 20.89C3.76 21 4.04 21 4.6 21ZM18.6 7H19.4C19.96 7 20.24 7 20.45 6.89C20.64 6.8 20.8 6.64 20.89 6.45C21 6.24 21 5.96 21 5.4V4.6C21 4.04 21 3.76 20.89 3.55C20.8 3.36 20.64 3.2 20.45 3.11C20.24 3 19.96 3 19.4 3H18.6C18.04 3 17.76 3 17.55 3.11C17.36 3.2 17.2 3.36 17.11 3.55C17 3.76 17 4.04 17 4.6V5.4C17 5.96 17 6.24 17.11 6.45C17.2 6.64 17.36 6.8 17.55 6.89C17.76 7 18.04 7 18.6 7ZM18.6 21H19.4C19.96 21 20.24 21 20.45 20.89C20.64 20.8 20.8 20.64 20.89 20.45C21 20.24 21 19.96 21 19.4V18.6C21 18.04 21 17.76 20.89 17.55C20.8 17.36 20.64 17.2 20.45 17.11C20.24 17 19.96 17 19.4 17H18.6C18.04 17 17.76 17 17.55 17.11C17.36 17.2 17.2 17.36 17.11 17.55C17 17.76 17 18.04 17 18.6V19.4C17 19.96 17 20.24 17.11 20.45C17.2 20.64 17.36 20.8 17.55 20.89C17.76 21 18.04 21 18.6 21Z",
]);

/**
 * Split — the shape, and the dotted line parting it.
 *
 * ⚠️ **`scissors-cut-01` was a stand-in and is gone** (found by the 2026-08-26 audit of the design
 * record against this file). A purpose-drawn `split` was added to the Pointr Icon Library and both
 * design files have specified it since; the app was the half that never caught up — the same shape
 * of drift as `contrast-02` standing in for `transparency`.
 *
 * The scissors were wrong twice over: they name the *implement* rather than the act, and at 24px a
 * pair of scissors beside `cut-out` says "cut" twice with nothing to tell them apart. This says
 * what Split does — one shape, one line through it, two pieces.
 *
 * Geometry read back off the library (node `2142:28`): a 16×16 square at (4,4) and a dotted run
 * from (1,12) to (23,12), dash 1/4.
 */
export const Split = icon("split", "2142:28", [
  "M4 4H20V20H4Z",
  { d: "M1 12H23", dash: "1 4" },
]);

/** Drawn into the library 2026-08-20 — a union, which `intersect-square` is not. */
export const Combine = icon("combine", "2064:33", [
  "M4 4H15V9H20V20H9V15H4V4Z",
]);

/** Drawn into the library 2026-08-20 — nothing existed; `ruler` means measure. */
export const Straighten = icon("straighten", "2064:45", [
  "M5 15H9V19M5 5V19H19L5 5Z",
]);

/**
 * Simplify — drawn into the library 2026-08-20. A corner-heavy edge above, a plain one below.
 *
 * ⚠️ **This took three rounds, and the failures are worth keeping.** Simplify drops corners that
 * *already sit on the line between their neighbours*, so by definition the shape does not change:
 * there is no before/after to draw, and the only honest subject is the POINT — which at 24px on a
 * 2px stroke merges into the line it sits on. Rejected: `pen-tool-minus` (reads "pen"), collinear
 * dots (a barbell), a struck corner (one big ×), a line over a line (an equals sign), a peak over
 * its chord (**a house**), ends-only (a dumbbell), and an asymmetric bend (a paper plane).
 * What works is showing complexity against plainness, with no apex and no symmetry.
 */
export const Simplify = icon("simplify", "2074:49", [
  "M3 9H8V5H13V10H18V6H21M3 18H21",
]);

/** Drawn into the library 2026-08-20 — there is no `magnet`, and `target-04` says "aim". */
export const Snap = icon("snap", "2064:37", [
  "M4 10V4H10M20 14V20H14M10.9 10.9H13.1V13.1H10.9V10.9Z",
]);

export const Undo = icon("flip-backward", "1007:9436", [
  "M3 9H16.5C18.99 9 21 11.01 21 13.5C21 15.99 18.99 18 16.5 18H12M7 13L3 9L7 5",
]);

export const Redo = icon("flip-forward", "1007:9439", [
  "M21 9H7.5C5.01 9 3 11.01 3 13.5C3 15.99 5.01 18 7.5 18H12M17 13L21 9L17 5",
]);

/**
 * Reset — back to the published outline. `clock-rewind` and not `refresh-ccw-*`: a circular arrow
 * is the ROTATE idiom, and the one control that throws your work away must not look like the one
 * that nudges it 15°.
 */
export const Reset = icon("clock-rewind", "1007:11560", [
  "M22.7 13.5L20.7 11.5L18.7 13.5M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C15.3 3 18.19 4.78 19.75 7.43M12 7V12L15 14",
]);

/* ── everywhere else ───────────────────────────────────────────────────────────────────────── */

export const Help = icon("help-circle", "1007:10248", [
  "M9.09 9C9.33 8.33 9.79 7.77 10.4 7.41C11.01 7.05 11.73 6.92 12.43 7.04C13.13 7.16 13.76 7.52 14.22 8.06C14.67 8.61 14.92 9.29 14.92 10C14.92 12 11.92 13 11.92 13M12 17H12.01M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z",
]);

/**
 * The checkerboard that opens the floor-plan opacity card.
 *
 * ⚠️ **This is the glyph that was DRAWN INTO the library for this control** (2026-08-24) and
 * published on 2026-08-25 — the library genuinely had no transparency mark before that. Its
 * geometry is the library's own, read back off `transparency` (node `2171:24`): two solid 9×9
 * checker cells at (3,3) and (12,12), inside a stroked 18×18 square. Square corners, hence the
 * mitre.
 *
 * ⚠️ **It must be drawn at 24px.** At 16 the cells are 6px and it collapses into a filled square
 * with a notch — that was found when it was drawn, and the ruling was *"the fix is the button, not
 * the mark"*. A lighter one-quadrant variant was tried and rejected: at 16px it reads as Cut-out.
 * So the button is 24px even though the help-circle beside it is a hairline 14. Do not shrink this
 * to match its neighbour; that trade was already made in the other direction, deliberately.
 *
 * It replaced `contrast-02` (`1007:11252`), which was a stand-in adopted while the library had
 * nothing — and which means *contrast*, not transparency.
 */
export const Transparency = icon(
  "transparency",
  "2171:24",
  [
    { d: "M3 3H12V12H3Z", filled: true },
    { d: "M12 12H21V21H12Z", filled: true },
    "M3 3H21V21H3Z",
  ],
  { linejoin: "miter" },
);

export const Ellipsis = icon("dots-horizontal", "1007:9867", [
  "M12 13C12.55 13 13 12.55 13 12C13 11.45 12.55 11 12 11C11.45 11 11 11.45 11 12C11 12.55 11.45 13 12 13Z",
  "M19 13C19.55 13 20 12.55 20 12C20 11.45 19.55 11 19 11C18.45 11 18 11.45 18 12C18 12.55 18.45 13 19 13Z",
  "M5 13C5.55 13 6 12.55 6 12C6 11.45 5.55 11 5 11C4.45 11 4 11.45 4 12C4 12.55 4.45 13 5 13Z",
]);

const STAR_D =
  "M11.28 3.45C11.51 2.99 11.63 2.75 11.78 2.68C11.92 2.61 12.08 2.61 12.22 2.68C12.37 2.75 12.49 2.99 12.72 3.45L14.9 7.88C14.97 8.02 15.01 8.09 15.06 8.14C15.1 8.19 15.15 8.23 15.21 8.26C15.28 8.29 15.35 8.3 15.51 8.32L20.4 9.04C20.91 9.11 21.17 9.15 21.29 9.27C21.39 9.38 21.44 9.53 21.42 9.68C21.4 9.86 21.21 10.04 20.84 10.4L17.3 13.85C17.19 13.95 17.14 14.01 17.1 14.07C17.07 14.13 17.05 14.19 17.04 14.25C17.03 14.33 17.05 14.4 17.07 14.55L17.91 19.42C17.99 19.94 18.04 20.19 17.96 20.34C17.88 20.48 17.76 20.57 17.61 20.6C17.44 20.63 17.21 20.51 16.75 20.27L12.37 17.97C12.24 17.89 12.17 17.86 12.1 17.84C12.03 17.83 11.97 17.83 11.9 17.84C11.83 17.86 11.76 17.89 11.63 17.97L7.25 20.27C6.79 20.51 6.56 20.63 6.39 20.6C6.24 20.57 6.12 20.48 6.04 20.34C5.96 20.19 6.01 19.94 6.09 19.42L6.93 14.55C6.95 14.4 6.97 14.33 6.96 14.25C6.95 14.19 6.93 14.13 6.9 14.07C6.86 14.01 6.81 13.95 6.7 13.85L3.16 10.4C2.79 10.04 2.6 9.86 2.58 9.68C2.56 9.53 2.61 9.38 2.71 9.27C2.83 9.15 3.09 9.11 3.6 9.04L8.49 8.32C8.65 8.3 8.72 8.29 8.79 8.26C8.85 8.23 8.9 8.19 8.94 8.14C8.99 8.09 9.03 8.02 9.1 7.88L11.28 3.45Z";

export const Star = icon("star-01", "1007:10447", [STAR_D]);

/**
 * The default-level star, which has two states rather than one. The library ships the outline only,
 * so "default" fills the same path — same silhouette, no second glyph, and the pair reads as one
 * control in two states instead of two marks that happen to look alike.
 */
export function StarFilled({ size = 24, label }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={STAR_D} />
    </svg>
  );
}
StarFilled.library = { name: "star-01", node: "1007:10447" };

export const Check = icon("check", "1007:9795", ["M20 6L9 17L4 12"]);

export const Warning = icon("alert-triangle", "1007:10328", [
  "M12 9V13M12 17H12.01M10.62 3.89L2.39 18.1C1.93 18.89 1.71 19.28 1.74 19.6C1.77 19.89 1.92 20.14 2.15 20.31C2.41 20.5 2.86 20.5 3.77 20.5H20.22C21.14 20.5 21.59 20.5 21.85 20.31C22.08 20.14 22.23 19.89 22.26 19.6C22.29 19.28 22.07 18.89 21.61 18.1L13.38 3.89C12.93 3.11 12.7 2.71 12.41 2.58C12.15 2.47 11.85 2.47 11.59 2.58C11.3 2.71 11.07 3.11 10.62 3.89Z",
]);

export const Pencil = icon("edit-02", "1007:10182", [
  "M18 10L14 6M2.5 21.5L5.88 21.12C6.3 21.08 6.5 21.06 6.7 20.99C6.87 20.94 7.03 20.86 7.18 20.76C7.35 20.65 7.5 20.5 7.79 20.21L21 7C22.1 5.9 22.1 4.1 21 3C19.9 1.9 18.1 1.9 17 3L3.79 16.21C3.5 16.5 3.35 16.65 3.24 16.82C3.14 16.97 3.06 17.13 3.01 17.3C2.94 17.5 2.92 17.7 2.88 18.12L2.5 21.5Z",
]);

export const Copy = icon("copy-01", "1007:9834", [
  "M5 15C4.07 15 3.6 15 3.23 14.85C2.74 14.64 2.36 14.26 2.15 13.77C2 13.4 2 12.93 2 12V5.2C2 4.08 2 3.52 2.22 3.09C2.41 2.72 2.72 2.41 3.09 2.22C3.52 2 4.08 2 5.2 2H12C12.93 2 13.4 2 13.77 2.15C14.26 2.36 14.64 2.74 14.85 3.23C15 3.6 15 4.07 15 5M12.2 22H18.8C19.92 22 20.48 22 20.91 21.78C21.28 21.59 21.59 21.28 21.78 20.91C22 20.48 22 19.92 22 18.8V12.2C22 11.08 22 10.52 21.78 10.09C21.59 9.72 21.28 9.41 20.91 9.22C20.48 9 19.92 9 18.8 9H12.2C11.08 9 10.52 9 10.09 9.22C9.72 9.41 9.41 9.72 9.22 10.09C9 10.52 9 11.08 9 12.2V18.8C9 19.92 9 20.48 9.22 20.91C9.41 21.28 9.72 21.59 10.09 21.78C10.52 22 11.08 22 12.2 22Z",
]);

export const ChevronDown = icon("chevron-down", "1007:9364", [
  "M6 9L12 15L18 9",
]);
export const ChevronLeft = icon("chevron-left", "1007:9370", [
  "M15 18L9 12L15 6",
]);
export const ChevronRight = icon("chevron-right", "1007:9376", [
  "M9 18L15 12L9 6",
]);
