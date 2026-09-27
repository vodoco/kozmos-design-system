/**
 * Every state the geometry toolbar has, side by side, over a stand-in for the map — MAP-566.
 * See `toolbar-preview.html` for why this exists. Nothing in the app imports it.
 */
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@kozmos-ds/react";
import "@kozmos-ds/react/dist/style.css";
import "../src/index.css";
import { GeometryToolbar, type GeomState } from "../src/ui/GeometryToolbar";
import { SavedNotice } from "../src/ui/SavedNotice";
import { MapSettings } from "../src/ui/MapSettings";
import type { MapPrefs } from "../src/map/PointrMap";
import { FeaturePanel, mergeForEditing } from "../src/ui/FeaturePanel";

/**
 * The real panel, with a realistic property bag — for measuring the header's alignment
 * (Olcay, 2026-08-16: *"alignent issue at the feature header"*). Rendered twice: once with an icon
 * the size `TypeIcon` produces, and once with none, because the title is a flex row with a `gap`
 * and an absent icon still gets gapped away from the block's left edge.
 */
/** The bench does not act on commands; it exists to be looked at. */
const noop = () => {};

const DEMO_PROPS = {
  fid: "a80b5862-1ae5-439c-b408-b0b49c8a3372",
  bid: "51dd37d1-c2bc-4d9e-8e22-2ea1a15a626c",
  sid: "c1126cb8-a192-4bd3-90f5-08fb70278862",
  lvl: -2,
  mainType: "Operational Space",
  name: "Operational Space",
};

/**
 * Three features whose properties partly agree — put through the real `mergeForEditing`, not a
 * hand-written "what it probably produces". The merge is the thing under test.
 */
const DEMO_SELECTION = [
  {
    fid: DEMO_PROPS.fid,
    name: "Operational Space",
    typeLabel: "Operational Space",
  },
  { fid: "b2", name: "Store Room 4", typeLabel: "Operational Space" },
  { fid: "c3", name: "", typeLabel: "Operational Space" },
];
/** The same three, after a Combine: one kept, one joined into it, one wall taken off the map. */
const COMBINED_SELECTION = [
  {
    fid: DEMO_PROPS.fid,
    name: "Operational Space",
    typeLabel: "Operational Space",
  },
  {
    fid: "b2",
    name: "Store Room 4",
    typeLabel: "Operational Space",
    fate: "joined" as const,
  },
  { fid: "w9", name: "", typeLabel: "Wall", fate: "removed" as const },
];
const MERGED = mergeForEditing([
  { ...DEMO_PROPS, description: "Back of house", hasAssistance: true },
  { ...DEMO_PROPS, fid: "b2", name: "Store Room 4", description: "Deliveries" },
  { ...DEMO_PROPS, fid: "c3", name: "", hasAssistance: true },
]);

function HeaderBench() {
  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      {[
        {
          k: "with icon",
          icon: (
            <span
              style={{
                width: 16,
                height: 16,
                flex: "0 0 auto",
                display: "block",
                background: "#c9d3e6",
                borderRadius: 3,
              }}
            />
          ),
        },
        { k: "no icon", icon: undefined },
        /**
         * ⚠️ **Several features selected** — the count strip, and every field the selection
         * disagrees about reading *Multiple values* rather than one feature's answer. This is the
         * case the bench exists for: it is the only place to see that a merged panel still reads as
         * one coherent form rather than a page of empty boxes.
         */
        { k: "3 selected", icon: undefined, multi: true },
        /**
         * ⚠️ **After a Combine** — one feature left, and the strip reporting what became of the
         * others. The three fates have to be legible in one reading: what you still have, what
         * went into it, and what it took off the floor.
         */
        { k: "after combine", icon: undefined, multi: true, combined: true },
      ].map(({ k, icon, multi, combined }) => (
        <div
          key={k}
          style={{
            position: "relative",
            width: 400,
            height: 340,
            borderRadius: 12,
            background: "#dfe4ec",
            border: "1px solid #d3d9e3",
            overflow: "hidden",
          }}
          data-case={k}
        >
          <div
            style={{
              font: "11px/1.4 system-ui",
              color: "#5d626f",
              padding: 4,
            }}
          >
            {k}
          </div>
          <FeaturePanel
            /* After a combine ONE feature survives, so its own bag is what the panel holds —
               a merged bag there would be the bug that put the sentinel in the title. */
            props={combined ? DEMO_PROPS : multi ? MERGED : DEMO_PROPS}
            selection={
              combined ? COMBINED_SELECTION : multi ? DEMO_SELECTION : undefined
            }
            /* The combine is still a composition here, so a joined row can be taken back out. */
            recomposable={combined}
            icon={icon}
            onClose={() => {}}
          />
        </div>
      ))}
    </div>
  );
}

const BASE: GeomState = {
  editing: true,
  fid: "demo",
  mode: "vertices",
  snap: true,
  canUndo: false,
  canRedo: false,
  dirty: false,
  pieces: 1,
};

/* The two refusals the map shell actually posts, verbatim — the bench is where their LENGTH gets
   judged, and a paraphrase here would be judging the wrong string. */
const COMBINE_ALONE =
  "Shift-click another feature on the map to combine this one with it.";
const COMBINE_FAR =
  "Too far apart. Combine bridges gaps up to 0.6 m — a wall's width — and these fall into 2 separate groups.";

const CASES: { title: string; state: GeomState; notice?: string }[] = [
  { title: "Points — as it opens, nothing done yet", state: BASE },
  {
    title:
      "Transform — the box with its rotate knob is on the map, not in the bar",
    state: {
      ...BASE,
      mode: "transform",
      snap: false,
      canUndo: true,
      dirty: true,
    },
  },
  {
    title: "Split armed — waiting for the first click",
    state: { ...BASE, mode: "split" },
  },
  {
    title: "Split — first click landed, waiting for the far side",
    state: { ...BASE, mode: "split", cutting: true },
  },
  {
    title: "Cut refused — the longest string this bar can be asked to hold",
    state: { ...BASE, mode: "split", canUndo: true },
    notice: "that cut runs along an edge — move it a little and try again",
  },
  {
    title: "After a split — three pieces, undo and redo both live",
    state: { ...BASE, canUndo: true, canRedo: true, dirty: true, pieces: 3 },
  },
  {
    title:
      "Nothing else selected — Combine is dark, and hovering it says what to do",
    state: { ...BASE, combinable: false, combineWhy: COMBINE_ALONE },
  },
  {
    title:
      "Three features selected and adjacent — the toast counts them and Combine lights up",
    state: { ...BASE, picked: 2, combinable: true },
  },
  {
    title:
      "Three selected but scattered — Combine stays dark, and the tooltip says why (hover it)",
    state: { ...BASE, picked: 2, combinable: false, combineWhy: COMBINE_FAR },
  },
  {
    title: "Combine refused after the fact — the map's own words",
    state: { ...BASE, picked: 2, combinable: true },
    notice: "nothing was close enough to join — they must be within 0.6 m",
  },
  {
    title:
      "After a combine — the shape holds three features, and says so without claiming they are gone",
    state: { ...BASE, canUndo: true, dirty: true, absorbed: 2 },
  },
  {
    title:
      "Corners marquee-selected — drag moves them together, Delete removes them",
    state: { ...BASE, selected: 4, canUndo: true, dirty: true },
  },
  {
    title:
      "A POINT feature — no outline, so Reshape / Transform / Split / Combine / Straighten all go",
    state: { ...BASE, kind: "point" },
  },
  /**
   * US5-4-3: Split leaves while several features are selected. Combine does the opposite — it is
   * the one tool that requires more than one — so the pair swaps roles as the selection grows.
   */
  {
    title:
      "Several selected — Split is GONE (a cut has no defined subject across a selection) and Combine is live",
    state: { ...BASE, picked: 2, combinable: true },
  },
  /**
   * The network cases. They are here because the ruling of 2026-08-20 is otherwise invisible from
   * a terminal: the toolbar had been showing all six ring tools on a graph, and the only way to see
   * that it no longer does — and that the separators do not double up where the Divide group used
   * to be — is to look at it.
   */
  {
    title:
      "A NETWORK — no ring, so Transform / Split / Combine / Straighten / Simplify go. Reshape stays: dragging the nodes IS network editing",
    state: { ...BASE, kind: "network", nodes: 926 },
  },
  {
    title:
      "A network, pointer resting on one of its edges — Delete would unlink those two nodes",
    state: { ...BASE, kind: "network", nodes: 926, onEdge: true },
  },
  {
    title:
      "Two of a network's edges selected — dragging moves both ends of each",
    state: {
      ...BASE,
      kind: "network",
      nodes: 926,
      selected: 4,
      selectedEdges: 2,
      canUndo: true,
      dirty: true,
    },
  },
];

/**
 * The Map View Preferences popover with the floor-plan transparency slider (Olcay, 2026-08-18 — a
 * customer request on the v9 Map Settings component). The popover otherwise renders only behind
 * sign-in, and this bench is the app's own answer to that (PROTOTYPE_PLATFORM §6.13). The stage is
 * tall because the popover opens UPWARD from its bottom-left trigger.
 */
function MapSettingsBench() {
  const [prefs, setPrefs] = useState<MapPrefs>({
    greyscale: false,
    hidePoiLabels: false,
    floorplan: true,
    basemap: "vector",
    geojsonFloor: true,
  });
  return (
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          font: "12px/1.4 system-ui",
          color: "#5d626f",
          marginBottom: 6,
        }}
      >
        Map View Preferences — the transparency slider lives WITH the
        floor-plan, indented under its toggle (click the settings button)
      </div>
      <div
        style={{
          position: "relative",
          height: 560,
          borderRadius: 12,
          background:
            "repeating-linear-gradient(45deg,#dfe4ec 0 10px,#e7ebf2 10px 20px)",
          border: "1px solid #d3d9e3",
        }}
      >
        {/* `focus` so the bench shows the whole product popover — the FOCUS pair included. */}
        <MapSettings prefs={prefs} onChange={setPrefs} focus />
      </div>
    </div>
  );
}

function Bench() {
  return (
    <div style={{ padding: 28, background: "#eef1f6", minHeight: "100vh" }}>
      <h1 style={{ font: "500 15px/1.4 system-ui", margin: "0 0 4px" }}>
        Geometry toolbar
      </h1>
      <p
        style={{
          font: "13px/1.5 system-ui",
          color: "#5d626f",
          margin: "0 0 24px",
        }}
      >
        Each row is the real component over a stand-in for the map. The bar is
        bottom-centred in the app, so each panel below is a scaled-down map
        area.
      </p>

      {CASES.map((c) => (
        <div key={c.title} style={{ marginBottom: 22 }}>
          <div
            style={{
              font: "12px/1.4 system-ui",
              color: "#5d626f",
              marginBottom: 6,
            }}
          >
            {c.title}
          </div>
          <div
            style={{
              position: "relative",
              // Tall enough for the toast AND the caption AND the bar stacked, plus the tooltip
              // that opens above a disabled control. At 132 the toast was clipped clean off — the
              // bench was hiding the very thing it exists to show.
              height: 210,
              borderRadius: 12,
              // A stand-in for the floor plan: enough texture to judge contrast
              // and the drop shadow against, without pretending to be a map.
              background:
                "repeating-linear-gradient(45deg,#dfe4ec 0 10px,#e7ebf2 10px 20px)",
              border: "1px solid #d3d9e3",
              overflow: "hidden",
            }}
          >
            <GeometryToolbar
              state={c.state}
              notice={c.notice}
              onCommand={noop}
            />
          </div>
        </div>
      ))}

      <div style={{ marginBottom: 22 }}>
        <div
          style={{
            font: "12px/1.4 system-ui",
            color: "#5d626f",
            marginBottom: 6,
          }}
        >
          The feature panel header — title, subtitle and body must share one
          left edge
        </div>
        <HeaderBench />
      </div>

      {/* The bug found by driving the real app, 2026-08-15: the bar is 707px and was centred on the
          whole map, so the properties panel covered its right-hand end. The panel is only ever open
          when the toolbar is, so this was not an edge case — it was the only case. */}
      <div style={{ marginBottom: 22 }}>
        <div
          style={{
            font: "12px/1.4 system-ui",
            color: "#5d626f",
            marginBottom: 6,
          }}
        >
          With the properties panel open — the bar must centre on the map you
          can still see
        </div>
        <div
          style={{
            position: "relative",
            height: 210,
            borderRadius: 12,
            background:
              "repeating-linear-gradient(45deg,#dfe4ec 0 10px,#e7ebf2 10px 20px)",
            border: "1px solid #d3d9e3",
            overflow: "hidden",
          }}
        >
          <GeometryToolbar
            state={BASE}
            padLeft={72}
            padRight={384}
            onCommand={noop}
          />
          {/* Stand-in for FeaturePanel: same width, same inset, same z-order. */}
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              bottom: 12,
              width: 360,
              zIndex: 5,
              borderRadius: 10,
              background: "#fff",
              border: "1px solid #e3e4e8",
              font: "12px/1.4 system-ui",
              color: "#9AA0A6",
              padding: 10,
            }}
          >
            properties panel (360px)
          </div>
        </div>
      </div>

      {/* 3× — the only way to actually judge whether an icon is drawn or merely present. */}
      <div style={{ marginBottom: 22 }}>
        <div
          style={{
            font: "12px/1.4 system-ui",
            color: "#5d626f",
            marginBottom: 6,
          }}
        >
          The same bar at 3×, to check the icons are drawn rather than implied
        </div>
        <div
          style={{
            position: "relative",
            height: 170,
            borderRadius: 12,
            background: "#e7ebf2",
            border: "1px solid #d3d9e3",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: "scale(3.4)",
              // Centred on the transform + history icons — the text needs no proving.
              transformOrigin: "52% 88%",
            }}
          >
            <GeometryToolbar
              state={{ ...BASE, canUndo: true, canRedo: false }}
              onCommand={noop}
            />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 22 }}>
        <div
          style={{
            font: "12px/1.4 system-ui",
            color: "#5d626f",
            marginBottom: 6,
          }}
        >
          The Update confirmation, which replaces the panel it closes
        </div>
        <div
          data-savedbox
          style={{
            position: "relative",
            height: 260,
            borderRadius: 12,
            background:
              "repeating-linear-gradient(45deg,#dfe4ec 0 10px,#e7ebf2 10px 20px)",
            border: "1px solid #d3d9e3",
            overflow: "hidden",
          }}
        >
          <SavedNotice name="Gate A12 Waiting Area" />
          {/* Stand-in for the map page's #zoomctl — right:16 / bottom:16, two 44px buttons with a
              6px gap. The notice has to clear this, not sit on top of it. */}
          <div
            data-zoomctl
            style={{
              position: "absolute",
              right: 16,
              bottom: 16,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {["+", "−"].map((s) => (
              <div
                key={s}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "#fff",
                  boxShadow: "0 2px 6px rgba(0,0,0,.16)",
                  display: "grid",
                  placeItems: "center",
                  font: "20px/1 system-ui",
                }}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>

      <MapSettingsBench />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="mapscale-theme">
      <Bench />
    </ThemeProvider>
  </StrictMode>,
);
