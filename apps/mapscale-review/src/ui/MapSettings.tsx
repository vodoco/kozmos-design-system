import { Help, Transparency } from "./icons";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Slider,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@kozmos-ds/react";
import type { MapPrefs } from "../map/PointrMap";

export type MapPrefsState = MapPrefs;

const BASE_MAPS: { value: MapPrefs["basemap"]; label: string; src: string }[] =
  [
    { value: "vector", label: "Vector", src: "/basemap-vector.png" },
    { value: "satellite", label: "Satellite", src: "/basemap-satellite.png" },
  ];

const SECTION_HEAD: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: 1,
  color: "#9AA0A6",
  fontWeight: 600,
  margin: "12px 0 2px",
};

/**
 * A preference row: **name on the left, switch on the right** (Olcay, 2026-08-16: *"the toggles
 * should be on the right side not left"*).
 *
 * ⚠️ The DS `Switch`'s own `label` prop renders the label *after* the control, so it is deliberately
 * not used — this is the app's own row with the DS switch dropped into its right-hand end. Patching
 * the DS component was the alternative and is the wrong lever: its order is a house convention for
 * every product built on it, and one screen's preference is not grounds for changing that.
 *
 * The same shape as the properties panel's boolean fields, so the two agree.
 */
function PrefRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  const id = `pref-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <label
        htmlFor={id}
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "var(--review-ink)",
          cursor: "pointer",
          minWidth: 0,
        }}
      >
        {label}
      </label>
      {/* ⚠️ A span, because the DS wrapper is `w-full` and `wrapperClassName` cannot undo it —
          this app runs no Tailwind over its own source, so an invented class is never compiled.
          Shrink-to-fit resolves the inner `width: 100%` against the switch's own max-content. */}
      <span style={{ display: "inline-flex", flex: "0 0 auto" }}>
        <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      </span>
    </div>
  );
}

/**
 * v9's "Map View Preferences" popover — every control here drives the live map.
 *
 * The FOCUS section is review-only. Greying out unchanged features and hiding POI labels are both
 * ways of getting noise out from between you and the diff; on a screen where you are simply looking
 * at a level there is no diff, so the controls would do nothing but confuse. Pass `focus` on the
 * review screens — the ones that actually draw a diff.
 */
export function MapSettings({
  prefs,
  onChange,
  focus = false,
}: {
  prefs: MapPrefs;
  onChange: (p: MapPrefs) => void;
  /**
   * Show the FOCUS section. Set by the screens that draw a **diff** — Manual Review, and S1 for
   * its diff-drawing panes (§3: focus follows the diff, not the screen). A screen with no diff
   * would only be offering to grey out nothing.
   */
  focus?: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          title="Map settings"
          style={{
            position: "absolute",
            left: 16,
            bottom: 16,
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "#fff",
            border: "1px solid #E7E9EE",
            boxShadow: "0 2px 6px rgba(0,0,0,.16)",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
        >
          {/*
            v9's settings-04 sliders (node 19452:255828) — the trigger briefly wore settings-01's
            gear, which is the wrong glyph. @kozmos-ds/icons only ships settings-01, so this is a
            Figma export like the ai-* sparkles (DS gap D9: raise settings-04 with the icon set).
          */}
          <img
            src="/icons/settings-04.svg"
            alt=""
            width={20}
            height={16}
            style={{ display: "block" }}
          />
        </button>
      </PopoverTrigger>
      {/* 280 matches the v9 component (widened 2026-08-18 to give the in-row slider real travel —
          at 268 each 5% step was ~3px of thumb movement, coarse for a pointer). */}
      <PopoverContent side="top" align="start" style={{ width: 280 }}>
        <div style={{ fontWeight: 600, color: "var(--review-ink)" }}>
          Map View Preferences
        </div>

        {focus && (
          <>
            <div style={SECTION_HEAD}>FOCUS</div>
            <PrefRow
              label="Grey out unchanged"
              checked={prefs.greyscale}
              onCheckedChange={(v) => onChange({ ...prefs, greyscale: v })}
            />
            <PrefRow
              label="Hide POI labels"
              checked={prefs.hidePoiLabels}
              onCheckedChange={(v) => onChange({ ...prefs, hidePoiLabels: v })}
            />
          </>
        )}

        {/*
         * ⚠️ No FLOOR SOURCE section any more (Olcay, 2026-08-18: "Draw floor from GeoJSON doesn't
         * make sense… in our product we show the original floor plan as PNG"). The A/B switch was
         * a prototype diagnostic, never a product control. `MapPrefs.geojsonFloor` SURVIVES as
         * plumbing — the render swap still honours a posted value and still defaults to on — so
         * the diagnostic can be driven from code; it just no longer wears a row in a
         * product-shaped popover.
         */}
        <div style={SECTION_HEAD}>FLOOR-PLAN OVERLAY</div>
        {/*
         * One row, and the slider lives BEHIND a transparency symbol (Olcay, 2026-08-18: "Can we
         * not add a transparency symbol and transparency slider would be in a tooltip?"). The row
         * keeps the uniform label (?) …… switch shape; the ◐ glyph sits with the switch at the
         * control end and opens a small floating card holding the slider and its "N% transparent"
         * readout. Mechanically that card is a nested DS Popover, not a hover Tooltip — a hover
         * tooltip dismisses the moment a drag commits, which would close the control mid-gesture.
         * Everything decided before survives: no "Transparency" label, double-click returns to the
         * 50% default, shown only while the overlay is on.
         *
         * Both symbols on this row are live Pointr Icon Library instances (see `./icons`):
         * `transparency` — the checkerboard — and `help-circle` for the (?).
         *
         * ⚠️ **The checkerboard is 24px and the help-circle beside it is 14. That is deliberate**,
         * and it is the ruling from 2026-08-24: at 16px the checker's cells are 6px and it
         * collapses into a filled square with a notch, so *"the fix is the button, not the mark"*.
         * A lighter one-quadrant variant was tried and rejected — at 16px it reads as Cut-out.
         * Shrinking this to match its neighbour re-opens a question that was already closed.
         */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label
            htmlFor="pref-show-floor-plan"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--review-ink)",
              cursor: "pointer",
              flex: "0 0 auto",
            }}
          >
            Show Floor-plan
          </label>
          {/* `help-circle` from the Pointr Icon Library (see `./icons`) — this comment used to
              claim it was an inline SVG for want of a glyph, which stopped being true when the
              library was actually searched. */}
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label="What is the floor-plan overlay?"
                  style={{
                    width: 16,
                    height: 16,
                    padding: 0,
                    border: "none",
                    background: "none",
                    cursor: "help",
                    flex: "0 0 auto",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Help
                    size={14}
                    style={{ color: "var(--primitives-colors-background-600)" }}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                The original floor-plan drawing, shown over the map.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {/* Spacer, not auto-margins — the switch keeps its right edge whether or not the
              transparency glyph is rendered. */}
          <span style={{ flex: 1 }} />
          {prefs.floorplan && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  aria-label="Floor-plan transparency"
                  style={{
                    width: 24,
                    height: 24,
                    padding: 0,
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    flex: "0 0 auto",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {/* `transparency` from the Pointr Icon Library — drawn into it for this very
                      control (2026-08-24), published 2026-08-25. 24px, not 14: see the note above.

                      ⚠️ The Figma instance binds `Colors/foreground/800`; that token resolves to
                      #c7cad1 in the CSS ramp, which is near-invisible on white, so this keeps the
                      row's own muted ink and matches the (?) beside it. Worth reconciling — the
                      two ramps disagree about which end of `foreground` is dark. */}
                  <Transparency
                    size={24}
                    style={{ color: "var(--primitives-colors-background-600)" }}
                  />
                </button>
              </PopoverTrigger>
              {/* Below the symbol and centred on it (Olcay, 2026-08-18) — the card hangs off its
                  anchor like a tooltip would, instead of jumping to the panel's corner. Radix
                  flips it above by itself when the map's bottom edge is too close. No pointer
                  arrow: the DS Popover doesn't re-export Radix's PopoverArrow — noted in
                  KOZMOS_DS_IMPROVEMENTS.md rather than reached around. */}
              <PopoverContent
                side="bottom"
                align="center"
                sideOffset={6}
                style={{
                  width: 216,
                  padding: "8px 14px 12px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  gap: 6,
                }}
              >
                {/*
                 * "Opacity", top-left (Olcay, 2026-08-18) — and the title changes what the number
                 * must mean: under an Opacity heading the slider reads as OPACITY, right = more
                 * visible, value = 1 − transparency. Only this UI boundary inverts; the pref stays
                 * `floorplanTransparency` and the shell's fpOpacity() is untouched, so the 50%
                 * midpoint (the overlay's historical look) is the same position in both readings.
                 */}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--review-ink)",
                    alignSelf: "flex-start",
                  }}
                >
                  Opacity
                </span>
                <span
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  {/* Double-click returns to the default — 50%, the overlay's historical look.
                      The lightest form of v9's own "Revert changes" idiom. */}
                  <span
                    style={{ flex: 1, minWidth: 0, display: "block" }}
                    onDoubleClick={() =>
                      onChange({ ...prefs, floorplanTransparency: 0.5 })
                    }
                  >
                    <Slider
                      min={0}
                      max={1}
                      step={0.05}
                      value={[1 - (prefs.floorplanTransparency ?? 0.5)]}
                      onValueChange={([v]) =>
                        onChange({ ...prefs, floorplanTransparency: 1 - v })
                      }
                      aria-label="Floor-plan opacity"
                    />
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--primitives-colors-background-600)",
                      flex: "0 0 auto",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {Math.round(
                      (1 - (prefs.floorplanTransparency ?? 0.5)) * 100,
                    )}
                    %
                  </span>
                </span>
              </PopoverContent>
            </Popover>
          )}
          <span style={{ display: "inline-flex", flex: "0 0 auto" }}>
            <Switch
              id="pref-show-floor-plan"
              checked={prefs.floorplan}
              onCheckedChange={(v) => onChange({ ...prefs, floorplan: v })}
            />
          </span>
        </div>

        <div style={SECTION_HEAD}>BASE MAP</div>
        <div style={{ display: "flex", gap: 10 }}>
          {BASE_MAPS.map((b) => {
            const selected = prefs.basemap === b.value;
            return (
              <button
                key={b.value}
                onClick={() => onChange({ ...prefs, basemap: b.value })}
                aria-pressed={selected}
                style={{
                  /**
                   * A fixed 80px tile, not a flexed half of the popover (Olcay, 2026-08-12).
                   * `flex: 1` made the thumbnail as big as the panel allowed — two large pictures
                   * dominating a preferences popover whose actual subject is one switch and a
                   * choice. A thumbnail only has to be recognisable.
                   */
                  flex: "0 0 80px",
                  padding: 0,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <img
                  src={b.src}
                  alt=""
                  style={{
                    /**
                     * **Square** (Olcay, 2026-08-11 — the same note as the floor-plan thumbs).
                     * It was `height: 56` against a flexed width, so the tile's shape depended on
                     * how wide the popover happened to be: a landscape box next to a square one
                     * elsewhere in the same app. `aspectRatio` keeps it square at any width.
                     */
                    width: 80,
                    height: 80,
                    display: "block",
                    objectFit: "cover",
                    borderRadius: 8,
                    /* theme-500, the DS's active blue — v9's own selected-thumbnail ring.
                       This was --review-ink, the one selection in the popover speaking
                       near-black while everything else selected speaks blue. */
                    border: `2px solid ${selected ? "var(--primitives-colors-theme-500)" : "#E7E9EE"}`,
                  }}
                />
                <div
                  style={{
                    fontSize: 12,
                    marginTop: 4,
                    fontWeight: selected ? 600 : 400,
                  }}
                >
                  {b.label}
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
