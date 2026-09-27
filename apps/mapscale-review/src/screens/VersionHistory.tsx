import { useCallback, useMemo, useRef, useState } from "react";
import { Button, Text } from "@kozmos-ds/react";
import PointrMap, {
  type MapCamera,
  type PointrMapHandle,
} from "../map/PointrMap";
import { PANEL_WIDTH } from "../ui/Chrome";
import { MapSettings, type MapPrefsState } from "../ui/MapSettings";
import { PANEL_PAD, PanelHeader } from "../ui/PanelHeader";
import { SourcePill } from "../ui/SourcePill";
import {
  magnitudeBand,
  seedChanges,
  versionBadge,
  BAND,
  KIND_LABEL,
  RED_CAUSE_COPY,
  type Change,
  type LevelVersion,
  type VersionState,
} from "../mock/diff";
import type { LevelRef } from "./MapContent";
import { useLevelVersions } from "../mock/useLevelVersions";

/**
 * S1 — Version History, second shape (Olcay, 2026-08-10): a **checkpoint timeline over a live
 * map**. Click a version's checkpoint and the map updates; or flip to Compare and read the
 * published map against the pending one side by side — which quietly absorbs S6's essence.
 * The original frame's vertical event list survives as the selected checkpoint's own story.
 *
 * What the map honestly shows per checkpoint (the prototype has ONE tile set — the published
 * map — so it never pretends otherwise):
 *   · the live version      → the published map, plain (that IS its content)
 *   · the pending newest    → the published map + the diff overlay (what is changing)
 *   · anything older        → the published map + a note that the snapshot isn't rendered here
 * Real per-version rendering arrives with the API. Restore stays in the editor — S1 reads.
 */

const LINE = "#e3e4e8";
const INK = "#082975";
const MUTED = "#5d626f";
const LINK = "#0b369c";

const NO_CHANGES: Change[] = [];

/** Row/checkpoint tones per state — band tones where the state IS a band, quiet elsewhere. */
const PILL: Record<
  VersionState,
  { tint: string; border: string; ink: string }
> = {
  "needs-review": {
    tint: BAND.medium.tint,
    border: BAND.medium.border,
    ink: BAND.medium.ink,
  },
  "needs-decision": {
    tint: BAND.large.tint,
    border: BAND.large.border,
    ink: BAND.large.ink,
  },
  rejected: {
    tint: BAND.large.tint,
    border: BAND.large.border,
    ink: BAND.large.ink,
  },
  published: {
    tint: BAND.minor.tint,
    border: BAND.minor.border,
    ink: BAND.minor.ink,
  },
  created: { tint: "#eef3ff", border: "#cfdcff", ink: LINK },
  "expert-review": { tint: "#fff7e0", border: "#edc759", ink: "#805905" },
  processing: { tint: "#f2f3f5", border: LINE, ink: MUTED },
  failed: { tint: "#f2f3f5", border: LINE, ink: MUTED },
};
const NEUTRAL_PILL = { tint: "#f2f3f5", border: LINE, ink: MUTED };

const DOT = {
  arrival: "#346df1",
  pipeline: "#F5A623",
  published: "#2FBF71",
  decision: "#EF4444",
  created: "#9AA0A6",
};

interface TimelineEvent {
  dot: string;
  title: string;
  meta: string;
  body: string;
}

/** One version's lifecycle, newest event first — the selected checkpoint's own story. */
function eventsForVersion(
  v: LevelVersion,
  isNewest: boolean,
  levelName: string,
): TimelineEvent[] {
  const out: TimelineEvent[] = [];
  switch (v.state) {
    case "needs-review":
      out.push({
        dot: DOT.pipeline,
        title: "Ready for your review (Review & Finalise)",
        meta: `${v.at} · MapScale`,
        body: `+${v.changePct}% change detected. Confirm each change, reject it, or edit it to put your own value in its place.`,
      });
      break;
    case "needs-decision":
      out.push({
        dot: DOT.decision,
        title: "Needs your decision",
        meta: `${v.at} · MapScale`,
        body:
          v.redCause === "cannot-match"
            ? RED_CAUSE_COPY["cannot-match"].detail
            : `${v.changePct}% of floor area changed — never published automatically. Review it, then publish when you're ready.`,
      });
      break;
    case "rejected":
      out.push({
        dot: DOT.decision,
        title: "Rejected — unrealistic change",
        meta: `${v.at} · MapScale · ${v.changePct}% of floor area`,
        body: RED_CAUSE_COPY["large-change"].error,
      });
      break;
    case "failed":
      out.push({
        dot: DOT.decision,
        title: "Processing failed",
        meta: `${v.at} · MapScale`,
        body: RED_CAUSE_COPY["cannot-process"].error,
      });
      break;
    case "expert-review":
      out.push({
        dot: DOT.pipeline,
        title: "Expert Review — Pointr mapping team",
        meta: `${v.at} · Mapping Team`,
        body: "Experts correct the AI result before you see it. You can keep editing — their corrections may override changes you make now.",
      });
      break;
    case "published":
      out.push({
        dot: DOT.published,
        title:
          v.changePct !== undefined && v.changePct < 20
            ? "Auto-published"
            : "Published",
        meta: `${v.at} · Dashboard`,
        body:
          v.changePct !== undefined && v.changePct < 20
            ? `Minor change (+${v.changePct}%) published automatically.`
            : `Published${v.changePct !== undefined ? ` (+${v.changePct}%)` : ""} after review.`,
      });
      break;
  }
  // `rejected` belongs here too: the A-guard fires on the post-expert % (decision 9), so the
  // pipeline genuinely ran before the verdict.
  if (
    isNewest &&
    (v.state === "needs-review" ||
      v.state === "needs-decision" ||
      v.state === "rejected")
  ) {
    out.push({
      dot: DOT.pipeline,
      title: "Expert Review — Pointr mapping team",
      meta: `${v.at} · Mapping Team`,
      body: "Experts corrected the AI result before you saw it — the % shown is theirs.",
    });
    out.push({
      dot: DOT.pipeline,
      title: "MapScale processing",
      meta: `${v.at} · MapScale`,
      body: "MapScale mapped the floor. Frame-changing actions wait until it completes; editing stays open.",
    });
  }
  if (v.n === 1) {
    out.push({
      dot: DOT.created,
      title: "Level created",
      meta: `${v.at} · Dashboard`,
      body: `${levelName} created.`,
    });
  } else {
    out.push({
      dot: DOT.arrival,
      title: v.restoredFrom
        ? `Restored from Version ${v.restoredFrom}`
        : v.source === "api"
          ? "Update received via API"
          : "Uploaded via Dashboard",
      meta: `${v.at} · ${v.source === "api" ? "API" : "Dashboard"}`,
      body: v.restoredFrom
        ? `Version ${v.restoredFrom}'s map content re-submitted as Version ${v.n}. Nothing was deleted.`
        : `New floor-plan (${KIND_LABEL[v.input.kind]}) for ${levelName} ${v.source === "api" ? "ingested from the API" : "uploaded from the dashboard"}.`,
    });
  }
  return out;
}

/**
 * Is this version still in its pipeline (the one the diff overlay can honestly depict)?
 * `rejected` is deliberately NOT pending: a rejected floor-plan never shows a diff (decision 9),
 * so S1 must never claim an overlay for it.
 */
function isPending(v: LevelVersion): boolean {
  return (
    v.state === "needs-review" ||
    v.state === "needs-decision" ||
    v.state === "expert-review"
  );
}

export function VersionHistory({
  level,
  initialN,
  initialMode,
  onBack,
}: {
  level: LevelRef;
  /** Which version's checkpoint starts selected — set when a floor-plan row was clicked. */
  initialN?: number;
  /** Open straight into Compare — cause B's review enters here (decision 11). */
  initialMode?: "timeline" | "compare";
  onBack: () => void;
}) {
  // the same list the editor writes to — see useLevelVersions (fixed 2026-08-11)
  const [versions] = useLevelVersions(level);
  const newest = versions[0];
  const [selectedN, setSelectedN] = useState(initialN ?? newest.n);
  const [mode, setMode] = useState<"timeline" | "compare">(
    initialMode ?? "timeline",
  );
  const selected = versions.find((v) => v.n === selectedN) ?? newest;
  const liveVersion = versions.find((v) => versionBadge(versions, v).live);

  // the pending newest's diff — the only change set the one-tile-set prototype can honestly draw
  const pendingChanges = useMemo<Change[]>(() => {
    if (!isPending(newest)) return NO_CHANGES;
    const band = newest.redCause
      ? "large"
      : magnitudeBand(newest.changePct ?? 30);
    return seedChanges(band);
  }, [newest]);

  const mapTarget = useMemo(
    () =>
      level.buildingId
        ? { building: level.buildingId, level: level.index }
        : undefined,
    [level.buildingId, level.index],
  );
  /**
   * Map Settings lives on S1 too (Olcay, 2026-08-10 evening), FOCUS included (same evening):
   * basemap + floor-plan overlay apply to every pane; the FOCUS toggles — greyscale, hide POI
   * labels — apply to the panes that actually draw the pending diff (the timeline map on the
   * pending checkpoint, Compare's right pane), because focus exists to get noise out from
   * between you and the diff (§3) and a published pane has no diff to focus on.
   *
   * ⚠️ **Greyscale defaults OFF here now, and it had to.** It used to default on "as in Manual
   * Review", which stopped being true on 2026-08-28. More than a stale cross-reference: greyscale
   * filters the *canvas*, and the diff overlay is a sibling SVG **above** that filter — so a
   * coloured, filled overlay stayed vivid over a desaturated floor, which is exactly what made the
   * pairing work. The overlay is now a muted 1–2px grey outline, so the same pairing would have put
   * grey lines on a grey floor. The toggle still works for anyone who wants it.
   */
  const [userPrefs, setUserPrefs] = useState<MapPrefsState>({
    greyscale: false,
    hidePoiLabels: false,
    floorplan: false,
    basemap: "vector",
  });
  const plainPrefs = useMemo(
    () => ({ ...userPrefs, greyscale: false, hidePoiLabels: false }),
    [userPrefs],
  );
  const diffPrefs = userPrefs;

  const showDiff = selected.n === newest.n && isPending(newest);
  const snapshotNote =
    !showDiff && liveVersion && selected.n !== liveVersion.n
      ? `Version ${selected.n}'s snapshot isn't rendered in the prototype — showing the published map (Version ${liveVersion.n}).`
      : null;

  /**
   * Compare's LEFT pane follows the checkpoint scrubber (Olcay: clicking the dates must update
   * the map): the comparison is selected-vs-pending. Selecting the pending newest itself falls
   * back to the live baseline — comparing pending to pending would say nothing. The one-tile-set
   * honesty applies: a non-live selection shows the published map with the snapshot note.
   */
  const leftVersion =
    (selected.n === newest.n && isPending(newest) ? liveVersion : selected) ??
    selected;
  const leftBadge = versionBadge(versions, leftVersion);
  const leftNote =
    !leftBadge.live && liveVersion && leftVersion.n !== liveVersion.n
      ? `Version ${leftVersion.n}'s snapshot isn't rendered in the prototype — showing the published map (Version ${liveVersion.n}).`
      : null;

  const timeline = useMemo(
    () => eventsForVersion(selected, selected.n === newest.n, level.name),
    [selected, newest.n, level.name],
  );
  const chrono = useMemo(
    () => [...versions].sort((a, b) => a.n - b.n),
    [versions],
  );

  // Compare's panes mirror each other's camera (Olcay: "the maps should be in sync"). Each pane
  // reports its moves; the app pushes them into the sibling, whose guarded jumpTo can't echo.
  // Boot framing flows through the same channel, so the panes converge without a special case.
  const leftMap = useRef<PointrMapHandle>(null);
  const rightMap = useRef<PointrMapHandle>(null);
  const onLeftCamera = useCallback(
    (cam: MapCamera) => rightMap.current?.setCamera(cam),
    [],
  );
  const onRightCamera = useCallback(
    (cam: MapCamera) => leftMap.current?.setCamera(cam),
    [],
  );

  return (
    <div style={{ flex: 1, display: "flex", minHeight: 0, background: "#fff" }}>
      {/* ── versions, as rows (click = select the checkpoint) ─────────────── */}
      <div
        style={{
          width: PANEL_WIDTH,
          flex: `0 0 ${PANEL_WIDTH}px`,
          borderRight: `1px solid ${LINE}`,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <div style={{ padding: PANEL_PAD, borderBottom: `1px solid ${LINE}` }}>
          <PanelHeader
            title="Version history"
            onClose={onBack}
            closeLabel="Close version history"
          />
          <Text
            style={{
              fontSize: 13,
              color: MUTED,
              display: "block",
              marginTop: 2,
            }}
          >
            {level.name} · {level.building} — all floor-plans, newest first
          </Text>
        </div>
        <div style={{ overflow: "auto", flex: 1 }}>
          {versions.map((v) => {
            const badge = versionBadge(versions, v);
            const tone =
              badge.label === "Superseded"
                ? NEUTRAL_PILL
                : badge.live
                  ? PILL.published
                  : PILL[v.state];
            const isSel = v.n === selectedN;
            return (
              <div
                key={v.n}
                onClick={() => setSelectedN(v.n)}
                style={{
                  padding: "14px 20px",
                  borderBottom: `1px solid ${LINE}`,
                  background: isSel ? "#eef3ff" : "#fff",
                  borderLeft: isSel
                    ? `3px solid ${LINK}`
                    : "3px solid transparent",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--review-ink)",
                    }}
                  >
                    Version {v.n}
                  </span>
                  <SourcePill source={v.source} />
                  {/* only the exception is named: a restore's lineage, or a GeoJSON push */}
                  {(v.restoredFrom || v.input.kind === "geojson") && (
                    <span style={{ fontSize: 11, color: MUTED }}>
                      {v.restoredFrom
                        ? `Restored from Version ${v.restoredFrom}`
                        : KIND_LABEL.geojson}
                    </span>
                  )}
                  <span style={{ flex: 1 }} />
                  <span
                    style={{
                      fontSize: 11,
                      color: tone.ink,
                      background: tone.tint,
                      border: `1px solid ${tone.border}`,
                      borderRadius: 999,
                      padding: "1px 8px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {badge.live ? "Live" : badge.label}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 6,
                  }}
                >
                  <span
                    style={{ fontSize: 12, color: MUTED }}
                    title={`${v.input.file} — ${v.by ?? "unknown"}`}
                  >
                    {v.at}
                    {v.by ? ` · ${v.by}` : ""}
                  </span>
                  <span style={{ flex: 1 }} />
                  {typeof v.changePct === "number" && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color:
                          v.changePct >= 20 ? BAND.medium.ink : BAND.minor.ink,
                      }}
                    >
                      +{v.changePct}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── checkpoints over the map ──────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "14px 24px",
            borderBottom: `1px solid ${LINE}`,
          }}
        >
          {/* the scrubber: one checkpoint per floor-plan, oldest to newest */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flex: 1,
              minWidth: 0,
            }}
          >
            {chrono.map((v, i) => {
              const isSel = v.n === selectedN;
              const badge = versionBadge(versions, v);
              const dotColor = badge.live
                ? DOT.published
                : isPending(v)
                  ? DOT.pipeline
                  : v.state === "failed" ||
                      v.state === "needs-decision" ||
                      v.state === "rejected"
                    ? DOT.decision
                    : DOT.created;
              return (
                <div
                  key={v.n}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flex: i ? 1 : "0 0 auto",
                    minWidth: 0,
                  }}
                >
                  {i > 0 && (
                    <div
                      style={{
                        flex: 1,
                        height: 2,
                        background: LINE,
                        minWidth: 24,
                      }}
                    />
                  )}
                  <button
                    onClick={() => setSelectedN(v.n)}
                    title={`${v.input.file} · ${badge.live ? "Live" : badge.label}`}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        background: dotColor,
                        boxShadow: isSel
                          ? `0 0 0 3px ${LINK}33, 0 0 0 1.5px ${LINK}`
                          : "none",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: isSel ? 600 : 400,
                        color: isSel ? INK : MUTED,
                        whiteSpace: "nowrap",
                      }}
                    >
                      V{v.n} · {v.at.split(" · ")[0]}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8, flex: "0 0 auto" }}>
            <Button
              size="sm"
              variant={mode === "timeline" ? "default" : "outline"}
              onClick={() => setMode("timeline")}
            >
              Timeline
            </Button>
            <Button
              size="sm"
              variant={mode === "compare" ? "default" : "outline"}
              onClick={() => setMode("compare")}
            >
              Compare
            </Button>
          </div>
        </div>

        {mode === "timeline" ? (
          <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
            {/* the selected checkpoint's own story */}
            <div
              style={{
                flex: "0 0 340px",
                borderRight: `1px solid ${LINE}`,
                overflow: "auto",
                padding: "16px 20px",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--review-ink)",
                  display: "block",
                }}
              >
                Version {selected.n} — what happened
              </Text>
              <div
                style={{
                  marginTop: 14,
                  borderLeft: `2px solid ${LINE}`,
                  marginLeft: 5,
                }}
              >
                {timeline.map((e, i) => (
                  <div
                    key={i}
                    style={{ position: "relative", padding: "0 0 22px 20px" }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: -7,
                        top: 3,
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        background: e.dot,
                        border: "2px solid #fff",
                      }}
                    />
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--review-ink)",
                      }}
                    >
                      {e.title}
                    </div>
                    <div
                      style={{ fontSize: 11, color: "#9AA0A6", marginTop: 1 }}
                    >
                      {e.meta}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#464a53",
                        marginTop: 3,
                        lineHeight: 1.45,
                      }}
                    >
                      {e.body}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* the map follows the checkpoint */}
            <div
              style={{
                position: "relative",
                flex: 1,
                minWidth: 0,
                background: "#EDEEF0",
              }}
            >
              <PointrMap
                changes={showDiff ? pendingChanges : NO_CHANGES}
                prefs={showDiff ? diffPrefs : plainPrefs}
                target={mapTarget}
              />
              {snapshotNote && (
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    bottom: 18,
                    transform: "translateX(-50%)",
                    background: "#fff",
                    borderRadius: 8,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.14)",
                    padding: "8px 14px",
                    fontSize: 12,
                    color: MUTED,
                    maxWidth: 460,
                    textAlign: "center",
                  }}
                >
                  {snapshotNote}
                </div>
              )}
              <MapSettings prefs={userPrefs} onChange={setUserPrefs} focus />
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
            {/* left: the selected checkpoint (the scrubber drives it). right: what wants to replace it. */}
            <div
              style={{
                position: "relative",
                flex: 1,
                minWidth: 0,
                background: "#EDEEF0",
                borderRight: `2px solid ${INK}`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  zIndex: 4,
                  background: "#fff",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--review-ink)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                }}
              >
                Version {leftVersion.n} ·{" "}
                {leftBadge.live ? "Live" : leftBadge.label}
              </div>
              <PointrMap
                ref={leftMap}
                onCamera={onLeftCamera}
                changes={NO_CHANGES}
                prefs={plainPrefs}
                target={mapTarget}
              />
              {leftNote && (
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    bottom: 18,
                    transform: "translateX(-50%)",
                    background: "#fff",
                    borderRadius: 8,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.14)",
                    padding: "8px 14px",
                    fontSize: 12,
                    color: MUTED,
                    maxWidth: 420,
                    textAlign: "center",
                    zIndex: 4,
                  }}
                >
                  {leftNote}
                </div>
              )}
              <MapSettings prefs={userPrefs} onChange={setUserPrefs} focus />
            </div>
            <div
              style={{
                position: "relative",
                flex: 1,
                minWidth: 0,
                background: "#EDEEF0",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  zIndex: 4,
                  background: "#fff",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--review-ink)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                }}
              >
                {isPending(newest)
                  ? `Version ${newest.n} · ${typeof newest.changePct === "number" ? `+${newest.changePct}% pending` : "pending"}`
                  : `Version ${newest.n} · nothing pending`}
              </div>
              <PointrMap
                ref={rightMap}
                onCamera={onRightCamera}
                changes={pendingChanges}
                prefs={diffPrefs}
                target={mapTarget}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
