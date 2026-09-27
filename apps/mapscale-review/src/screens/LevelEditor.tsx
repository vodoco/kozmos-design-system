import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { getReviewOutcome, levelKey, subscribeReviews } from "../mock/store";
import {
  Button,
  FieldWrapper,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Switch,
  Text,
} from "@kozmos-ds/react";
import PointrMap, { type MapBuilding } from "../map/PointrMap";
import { PANEL_WIDTH } from "../ui/Chrome";
import { MapSettings, type MapPrefsState } from "../ui/MapSettings";
import { AiMappingStatus, type MapScaleState } from "../ui/AiMappingStatus";
import { ExpertHoldChip } from "../ui/ExpertHoldNotice";
import { SourcePill } from "../ui/SourcePill";
import { FloorPlanThumb } from "../ui/FloorPlanThumb";
import { PANEL_PAD, PanelHeader } from "../ui/PanelHeader";
import { ConfirmOverlay } from "../ui/ConfirmOverlay";
import { UploadDropConfirm, dropKind } from "../ui/UploadDropConfirm";
import {
  magnitudeBand,
  restoreBlockReason,
  versionBadge,
  BAND,
  EXPERT_HOLD,
  expertReviewEnabled,
  JOB_RUNNING,
  KIND_LABEL,
  RED_CAUSE_COPY,
  RESTORE_COPY,
  type Change,
  type LevelVersion,
  type RedCause,
  type VersionState,
} from "../mock/diff";
import { DEFAULT_SECTOR_KEY, PICKER_SECTORS, sectorKey } from "../mock/sectors";
import type { LevelRef } from "./MapContent";
import { useLevelVersions } from "../mock/useLevelVersions";

/**
 * S8 — Editing Level (Figma node 2510:776): metadata, the MapScale floor-plan section, and the
 * Auto-Map Updates flag. This is where a new CAD file enters the flow.
 *
 * S2 — Expert Review (Figma node 2449:64) is this same screen with the hold applied, not a screen
 * of its own. Reversed from hard read-only to **warn-but-allow** (Olcay, 2026-08-10): while
 * Pointr's mapping team holds the level the customer keeps editing, told their changes may be
 * overridden — only frame-changing operations lock (EXPERT_HOLD in mock/diff.ts is the law:
 * georeferencing, upload, restore, delete). Since experts run *before* the customer (handoff §6
 * decision 4), most updates never get further than this — so it is the screen a customer is most
 * likely to see, not a splash passed through on the way to review.
 *
 * The AI-Mapping section is the level's **update timeline**: every arrival — floor-plan upload,
 * GeoJSON push, restore — is a version; the status card is the newest version's live state.
 */

/** Stable identity: an inline [] is a new array every render, and PointrMap posts on change. */
const NO_CHANGES: Change[] = [];

const LINE = "#e3e4e8";
const MUTED = "#5d626f";

type Phase = "idle" | "queued" | "validating" | "mapping" | "expert" | "done";

/**
 * Successive uploads walk the four outcomes: amber (your review) → green (auto-published) →
 * red cause A (>50%: rejected outright, decision 9 — error + re-upload, no review) → red cause C
 * (couldn't process: error + re-upload, no review). Red cause B (couldn't match) isn't in the
 * cycle — it lives on Concourse A's level 4 seed.
 */
const RUNS: { pct: number; cause?: RedCause }[] = [
  { pct: 30 },
  { pct: 12 },
  { pct: 62 },
  { pct: 0, cause: "cannot-process" },
];

/**
 * What the mock reports for a restore's diff vs the published map. Deliberately big — restoring
 * away months of later edits usually IS a big change — but kept under the >50% rejection guard:
 * the A-guard targets suspect *uploads*, and a restore is deliberate re-submission of known-good
 * content, so it reviews as amber rather than being rejected. (Scoping to confirm with Olcay:
 * should a restore whose real diff exceeds 50% also be exempt, or reviewed as Red cause A?)
 * The real number comes from the diff itself (D5).
 */
const RESTORE_PCT = 45;

/**
 * Where a finished job lands (MAP-199 / US5). Cause A is the band's own arithmetic — and it is a
 * **rejection** (decision 9): no Review, no publish; the info tooltip carries the re-upload and
 * support guidance and Upload new below is the way out, like cause C. B still offers Review — the
 * content exists, it just couldn't be aligned — while C offers only the error (in the info slot)
 * and a fresh upload, because nothing exists to review or publish.
 */
function outcomeFor(
  pct: number,
  cause?: RedCause,
): { state: MapScaleState; note: string; primary?: string; info?: string } {
  if (cause === "cannot-process")
    return {
      state: "failed",
      note: RED_CAUSE_COPY["cannot-process"].card,
      info: RED_CAUSE_COPY["cannot-process"].error,
    };
  if (cause === "cannot-match")
    return {
      state: "failed",
      note: RED_CAUSE_COPY["cannot-match"].card,
      primary: "Review",
    };
  if (cause === "large-change" || magnitudeBand(pct) === "large")
    return {
      state: "rejected",
      note: RED_CAUSE_COPY["large-change"].card(pct),
      info: RED_CAUSE_COPY["large-change"].error,
    };
  if (magnitudeBand(pct) === "minor")
    return {
      state: "published",
      note: `Auto-published · ${pct}% of floor area`,
    };
  return {
    state: "user-review",
    note: `Awaiting your review · ${pct}% of floor area`,
    primary: "Review",
  };
}

/** The traffic light, as a version state — what a finished run writes back to its version. */
function stateForBand(pct: number): VersionState {
  switch (magnitudeBand(pct)) {
    case "minor":
      return "published";
    case "large":
      return "rejected";
    default:
      return "needs-review";
  }
}

/**
 * Where the status card starts for a level opened from the tree, read off its newest version —
 * so the tag you clicked and the card you land on agree. (It used to always start at idle, which
 * opened B2 saying "Completed" under a tree tag saying "Needs review".) `published`/`created`
 * rest at idle: v9's Completed card is the resting state of a settled level.
 */
function phaseFor(v: LevelVersion | undefined): Phase {
  switch (v?.state) {
    case "expert-review":
      return "expert";
    case "processing":
      return "mapping";
    case "needs-review":
    case "needs-decision":
    case "rejected":
    case "failed":
      return "done";
    case "published":
      // A published version whose change was minor genuinely auto-published — that is the whole
      // traffic light — so its card says "Auto-published · N%" rather than resting at Completed.
      // A published version with a bigger % went live manually after review; outcomeFor() would
      // mislabel that, so those rest at Completed.
      return v.changePct !== undefined && magnitudeBand(v.changePct) === "minor"
        ? "done"
        : "idle";
    default:
      return "idle";
  }
}

/**
 * Restore behind the app's **classic confirmation overlay** — the same v9 `error` component set
 * Save and the drop-to-upload speak through (Olcay, 2026-08-11: *"this should be using our classic
 * overlays"*).
 *
 * It was a Popover, on the reasoning that an append-only action needs a moment of stated intent
 * rather than a modal ceremony. That reasoning was wrong twice over: **every other confirmation in
 * the app is this overlay**, so a popover made Restore the odd one out; and "append-only" describes
 * the *history*, not the consequence — a restore re-publishes an old floor over the live map, which
 * is exactly the weight the overlay exists to carry.
 */
function RestoreAction({
  v,
  next,
  reason,
  onRestore,
}: {
  v: LevelVersion;
  next: number;
  /** Present ⇒ disabled, and this is why (the lock, or a running job). */
  reason?: string;
  onRestore: (v: LevelVersion) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* a disabled button swallows hover, so the reason rides a wrapping span */}
      <span title={reason}>
        <Button
          variant="link"
          size="sm"
          disabled={!!reason}
          onClick={() => setOpen(true)}
        >
          {RESTORE_COPY.action}
        </Button>
      </span>
      <ConfirmOverlay
        open={open}
        tone="info"
        title={RESTORE_COPY.title(v.n)}
        confirmLabel={RESTORE_COPY.action}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          onRestore(v);
        }}
      >
        {RESTORE_COPY.body(v.n, next)}
        <div style={{ fontSize: 13, color: MUTED, marginTop: 8 }}>
          {RESTORE_COPY.detail}
        </div>
      </ConfirmOverlay>
    </>
  );
}

/**
 * The versions behind the current one. They live here, not only on the Version History screen,
 * because this is where you land when a new floor plan arrives — and the first thing you need to
 * know is what it is replacing, and whether someone else sent it. Live/Superseded is derived by
 * `versionBadge`, never stored; Restore appears only where it means something (`isRestorable`).
 */
function PreviousVersions({
  level,
  versions,
  restoreReason: reason,
  onRestore,
  onViewAll,
  onPreview,
  onCompare,
}: {
  /** Whose versions these are — needed to look up each one's saved review. */
  level: LevelRef;
  versions: LevelVersion[];
  /** Present ⇒ Restore is disabled, and this is why (the expert hold, or a running job). */
  restoreReason?: string;
  onRestore: (v: LevelVersion) => void;
  /** Opens S1 — the checkpoint timeline with the map. */
  onViewAll: () => void;
  /** Clicking a floor-plan previews it: S1 opens with that version's checkpoint selected. */
  onPreview: (v: LevelVersion) => void;
  /** The row's Compare action: S1 straight into Compare mode. */
  onCompare: (v: LevelVersion) => void;
}) {
  const rows = versions.slice(1);
  if (rows.length === 0) return null;
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
        <Text style={{ fontSize: 12, fontWeight: 600, color: MUTED }}>
          Previous floor-plans
        </Text>
        <span style={{ flex: 1 }} />
        <Button variant="link" size="sm" onClick={onViewAll}>
          View version history
        </Button>
      </div>
      <div
        style={{
          border: `1px solid ${LINE}`,
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {rows.map((v, i) => {
          const badge = versionBadge(versions, v);
          return (
            /*
              Two lines, same shape as the tree rows (§3's second-line rule): identity and its
              actions on the first line, when-and-status on the second. Crammed onto one line the
              kind wrapped and the name truncated against the pill — the row has too many facts
              for one line at PANEL_WIDTH.
            */
            <div
              key={v.n}
              onClick={() => onPreview(v)}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                padding: "8px 10px",
                borderTop: i ? `1px solid ${LINE}` : "none",
                cursor: "pointer",
              }}
              title={`Preview Version ${v.n} in the version history`}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 12,
                    color: "var(--review-ink)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Version {v.n}
                  <span style={{ color: MUTED }}> · </span>
                  <SourcePill source={v.source} />
                  {/* only the exception is named: a restore's lineage, or a GeoJSON push */}
                  {(v.restoredFrom || v.input.kind === "geojson") && (
                    <span style={{ color: MUTED }}>
                      {" · "}
                      {v.restoredFrom
                        ? `Restored from Version ${v.restoredFrom}`
                        : KIND_LABEL.geojson}
                    </span>
                  )}
                </div>
                <span
                  onClick={(e) => e.stopPropagation()}
                  style={{ display: "flex", gap: 8 }}
                >
                  {/* Compare = the two-pane view (S1's Compare mode). The row body previews the
                      checkpoint in the timeline instead — two different questions. */}
                  <Button variant="link" size="sm" onClick={() => onCompare(v)}>
                    Compare
                  </Button>
                  {/* Restore is always visible; a version that can't be restored says why
                      (restoreBlockReason) — hiding the control is what invites "why don't all
                      rows have it?" */}
                  <RestoreAction
                    v={v}
                    next={versions[0].n + 1}
                    reason={reason ?? restoreBlockReason(versions, v)}
                    onRestore={onRestore}
                  />
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 11,
                    color: MUTED,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={`${v.input.file} — ${v.by ?? "unknown"}`}
                >
                  {v.at}
                  {v.by ? ` · ${v.by}` : ""}
                </div>
                {/*
                  **The report a version kept** (2026-08-12). Reports are stored per version now,
                  so an old floor-plan still knows what was decided about it — but "we keep it" is
                  only true if you can see it, and the history is where you look when deciding
                  whether to restore something.
                */}
                {(() => {
                  const rep = getReviewOutcome(
                    levelKey(level.buildingId, level.index),
                    v.n,
                  );
                  if (!rep) return null;
                  const edited = Object.keys(rep.overrides ?? {}).length;
                  return (
                    <span
                      style={{ fontSize: 11, color: MUTED, flex: "0 0 auto" }}
                      title={`This version was reviewed${edited ? `, with ${edited} change${edited === 1 ? "" : "s"} edited by hand` : ""}. Restoring it brings the report back with it.`}
                    >
                      · reviewed{edited ? ` · ${edited} edited` : ""}
                    </span>
                  );
                })()}
                {typeof v.changePct === "number" && (
                  <span
                    style={{ fontSize: 11, color: MUTED, flex: "0 0 auto" }}
                  >
                    +{v.changePct}%
                  </span>
                )}
                <span
                  style={{
                    fontSize: 11,
                    color: badge.live ? BAND.minor.ink : MUTED,
                    background: badge.live ? BAND.minor.tint : "#f2f3f5",
                    border: `1px solid ${badge.live ? BAND.minor.border : LINE}`,
                    borderRadius: 999,
                    padding: "1px 8px",
                    whiteSpace: "nowrap",
                    flex: "0 0 auto",
                  }}
                >
                  {badge.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LevelEditor({
  level,
  onCancel,
  onReview,
  onHistory,
  uploadFile,
  onUploadStarted,
  browseOnMount,
  onBrowseConsumed,
  onUploadTo,
}: {
  level: LevelRef;
  onCancel: () => void;
  /** Opens Manual Review carrying the job's post-expert % and red cause, so it can't disagree. */
  onReview: (pct: number, cause?: RedCause) => void;
  /** Opens S1 Version History; optionally at a version's checkpoint, optionally straight into Compare. */
  onHistory: (selectN?: number, mode?: "timeline" | "compare") => void;
  /** A confirmed map-drop arriving with the screen — start uploading it on mount. */
  uploadFile?: string | null;
  /** Consumed the uploadFile — App clears it so a later remount can't re-upload. */
  onUploadStarted?: () => void;
  /** The tree's "Update floor-plan": pop the file browser as soon as the screen opens. */
  browseOnMount?: boolean;
  /** Consumed the browse flag — App clears it so a later remount can't re-pop the picker. */
  onBrowseConsumed?: () => void;
  /** A map-drop confirmed for a DIFFERENT level — App switches editors and carries the file. */
  onUploadTo?: (l: LevelRef, file: string) => void;
}) {
  const [prefs, setPrefs] = useState<MapPrefsState>({
    greyscale: false,
    hidePoiLabels: false,
    floorplan: false,
    basemap: "vector",
  });
  /** The live building list, for the drop overlay's selector — the map reports it on ready. */
  const [liveBuildings, setLiveBuildings] = useState<MapBuilding[]>([]);
  const onBuildings = useCallback(
    (b: MapBuilding[]) => setLiveBuildings(b),
    [],
  );
  /** A file dropped on this pane's map, awaiting the confirmation overlay's answer. */
  const [dropped, setDropped] = useState<string | null>(null);
  /** Upload-over-finished-work confirmation (Olcay, 2026-08-11) — see `restartsWork`. */
  const [confirmUpload, setConfirmUpload] = useState(false);
  const onFileDrop = useCallback(
    (f: { name: string }) => setDropped(f.name),
    [],
  );

  /**
   * The level's version history, newest first — stateful because the mock honours §11's rule that
   * a version is created the moment a file arrives: Upload new and Restore both prepend here, and
   * a finished run writes its outcome back. Resets on unmount; there is no persistence layer yet.
   */
  /**
   * The level's version timeline — **in the shared store**, not local state (fixed 2026-08-11):
   * Version History used to re-seed its own copy, so anything uploaded or restored here was
   * invisible there. A level being created ("Add as new level") starts empty and its first upload
   * becomes Version 1; `current` is undefined for exactly that moment and the card waits for it.
   */
  const [versions, setVersions] = useLevelVersions(level);
  const current: LevelVersion | undefined = versions[0];

  /**
   * The job's life, in the order MapScale reports it. Seeded from the newest version so a level
   * the mapping team already holds opens *in* the expert phase (S2 reachable from the tree), and a
   * level with a pending review opens saying so. Safe as a lazy initialiser because App unmounts
   * this screen on the way back to the tree, so every open is a fresh mount.
   */
  const [phase, setPhase] = useState<Phase>(() => phaseFor(versions[0]));
  const [autoMap, setAutoMap] = useState(true);
  const [uploads, setUploads] = useState(0);
  /** The run the card is reporting — % and red cause, set when scheduled, never re-derived. */
  const [run, setRun] = useState<{ pct: number; cause?: RedCause }>(() => ({
    pct: versions[0]?.changePct ?? 0,
    cause: versions[0]?.redCause,
  }));

  /**
   * The pipeline's timers. One chain at a time: every schedule clears the last, so a second
   * upload or a cancel can't leave the old chain firing underneath — a cancelled job used to
   * resume seconds later, and two quick uploads interleaved two chains. Cleared on unmount too.
   */
  const timers = useRef<number[]>([]);
  const clearTimers = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  };
  // NB no unmount cleanup here. StrictMode runs setup-all → cleanup-all → setup-all, so an
  // unmount-only `return clearTimers` destroyed the very timers the upload-on-mount effect below
  // had just scheduled — a dropped floor-plan then sat at "In Queue" forever (fixed 2026-08-11).
  // Every entry point clears the chain itself before scheduling a new one, and React 18 no longer
  // warns about setState after unmount, so there is nothing left for a teardown to protect.

  const schedule = (fn: () => void, ms: number) =>
    timers.current.push(window.setTimeout(fn, ms));

  // Show the level being edited, not the map page's own default. Memoised because PointrMap posts
  // whenever this prop's identity changes — an inline object would re-target on every render.
  const mapTarget = useMemo(
    () =>
      level.buildingId
        ? { building: level.buildingId, level: level.index }
        : undefined,
    [level.buildingId, level.index],
  );

  /**
   * A concluded review for the version currently on screen (Olcay, 2026-08-11). One thing hangs
   * off it now: the status card stops asking for a review that already happened.
   *
   * ⚠️ It used to bring the **flagged** changes back onto this level's map — the whole promise
   * decision 2 made when it chose Flag over Edit. That promise was kept and then retired: see
   * `concludedMarks`.
   *
   * Version-matched on purpose: a newer upload must not inherit an older review's conclusions.
   */
  const forThisVersion = useSyncExternalStore(subscribeReviews, () =>
    getReviewOutcome(levelKey(level.buildingId, level.index), versions[0]?.n),
  );
  /** Finished. A part-way save is a different thing — see `inProgress`. */
  const concluded = forThisVersion?.complete ? forThisVersion : undefined;
  /**
   * Saved part-way (Olcay, 2026-08-11). The level is still awaiting review and still counting down
   * to its automatic publish — nothing about its state changed — so the card keeps saying so and
   * keeps offering Review. It just adds how far you got, which is the only new fact.
   */
  const inProgress =
    forThisVersion && !forThisVersion.complete ? forThisVersion : undefined;
  /**
   * ⚠️ **Nothing from a concluded review is drawn on this map any more** (Olcay, 2026-08-25: *"once
   * review concluded the map becomes the current map"*).
   *
   * This used to be the flagged rows, and drawing them was the whole of *"keep flagged items
   * visible to edit later"*. With flagging gone there is no category left to draw: a confirmed
   * change is applied, a rejected one is discarded, and an **edited** one is simply the floor —
   * your own value, already live. Painting it would claim there is something still to decide about
   * a level whose review is over, which is exactly what `markOnly` was invented to avoid and is now
   * avoided by having nothing to paint.
   *
   * Kept as a named constant rather than inlined at the call site so the reasoning has somewhere
   * to live, and so the day something *does* deserve drawing here, there is one place to put it.
   */
  const concludedMarks: Change[] = NO_CHANGES;

  /** Has anything in the metadata block been touched? Drives Done vs Update in the footer. */
  const [metaDirty, setMetaDirty] = useState(false);

  /**
   * Does uploading here throw away work? (Olcay, 2026-08-11: *"if the state is at Review maybe we
   * should also ask for a confirmation — your floor-plan is at the final stage, uploading a new
   * floor-plan would start the process over, do you really want to?"*)
   *
   * True once the current version has **reached or passed review** — it is awaiting your decision,
   * carries a review you started or finished, or is live. A new upload starts the whole pipeline
   * again (MapScale → the mapping team → your review), and because outcomes are **version-matched**
   * the decisions on this version do not carry across.
   *
   * ⚠️ Deliberately **false for `rejected` and `failed`**. There, uploading a corrected file is the
   * prescribed way out (decision 9 and cause C) — warning would argue with the app's own advice.
   * It is also false under the expert hold, where Upload is locked outright rather than warned.
   */
  const restartsWork =
    !!current &&
    (["needs-review", "needs-decision", "published"].includes(current.state) ||
      !!forThisVersion);

  const outcome = outcomeFor(run.pct, run.cause);
  const PHASE: Record<
    Exclude<Phase, "done">,
    { state: MapScaleState; note?: string; progress?: number; action?: string }
  > = {
    idle: { state: "completed" },
    queued: { state: "in-queue", action: "Cancel" },
    validating: { state: "validating", action: "Cancel" },
    mapping: { state: "in-progress", progress: 0.55, action: "Cancel" },
    expert: { state: "expert-review" },
  };
  /**
   * The card after the review is concluded. It must stop saying "Awaiting your review" with a
   * Review button next to it — the user just finished doing that.
   *
   * It reports the two things they'd want to know afterwards: whether it went live, and how much
   * of it is theirs rather than MapScale's. The second used to be a flag count — work left over —
   * and is now an edit count, which is work done; both belong on this card for the same reason,
   * that it is the last thing you read about a review you have just finished.
   */
  const reviewedCard = ():
    | { state: MapScaleState; note: string; info?: string }
    | undefined => {
    if (!concluded) return undefined;
    const n = Object.keys(concluded.overrides ?? {}).length;
    const tail = n ? ` · ${n} edited by you` : "";
    // Live-ness comes from the version, not from the outcome — the version is what every other
    // surface reads, and an explicit Publish now moves it regardless of the review.
    return versions[0]?.state === "published"
      ? { state: "published", note: `Published · reviewed by you${tail}` }
      : {
          state: "completed",
          note: `Review complete · not published${tail}`,
          info: "You concluded the review but this version hasn't been published. Publish it whenever you're ready.",
        };
  };

  /**
   * The unfinished-review card. Two facts, and they are independent: whether the version is live,
   * and whether you have finished reviewing it.
   *
   * The first version of this only existed inside the `phase === "done"` branch, so pressing
   * **Publish now** and then **Save** — which publishes the level and leaves the review open —
   * dropped through to the resting "Completed" card and lost the unfinished review entirely,
   * while the tree simultaneously claimed the level was held out of publishing.
   */
  const inProgressCard = ():
    | { state: MapScaleState; note: string; primary?: string }
    | undefined => {
    if (!inProgress) return undefined;
    return versions[0]?.state === "published"
      ? {
          state: "published",
          note: `Published · your review is unfinished`,
          primary: "Review",
        }
      : {
          state: "user-review",
          note: `In review · ${run.pct}% of floor area · held from publishing until you complete it`,
          primary: "Review",
        };
  };
  /** One shape for every source of the card, so the JSX stops probing it with `in` guards. */
  const card: {
    state: MapScaleState;
    note?: string;
    progress?: number;
    action?: string;
    primary?: string;
    info?: string;
  } =
    /**
     * A saved review outranks the phase, because it is a fact about what *you* did and the phase
     * is only where the job got to. Checked before `phase === "done"` on purpose: publishing moves
     * the version to a resting phase, and nesting these inside "done" is what let a published-but-
     * unfinished review fall through to the blank "Completed" card.
     *
     * Deliberately NOT "N of M reviewed" anywhere here: the seeds arrive pre-decided (so the demo
     * has a populated tally), which made that counter read "18 of 18 reviewed" beside "Awaiting
     * your review" after the user had touched two rows.
     */
    concluded
      ? reviewedCard()!
      : inProgress
        ? inProgressCard()!
        : phase === "done"
          ? outcome
          : PHASE[phase];
  const running =
    phase === "queued" || phase === "validating" || phase === "mapping";

  /**
   * The hold: warn-but-allow, not read-only (Olcay, 2026-08-10, reversing the built-first hard
   * lock and Ege's original read-only reading). Field-level edits stay open under the banner's
   * warning — US7's machinery exists to reconcile them later. Only the frame-changing operations
   * ask this flag: upload and restore here (each with its own EXPERT_HOLD reason), georeference
   * and delete in the tree's ⋯ menu. Locked controls stay *visible* and disabled: a control that
   * vanishes teaches nothing and shifts the layout; a dead one with a reason on it says both what
   * exists and why not now.
   */
  const expertHold = phase === "expert";
  const uploadReason = expertHold
    ? EXPERT_HOLD.upload
    : running
      ? JOB_RUNNING
      : undefined;
  const restoreReason = expertHold
    ? EXPERT_HOLD.restore
    : running
      ? JOB_RUNNING
      : undefined;

  /**
   * Cancel genuinely cancels: the chain is cleared (it used to keep firing underneath) and the
   * version that arrived stays behind, run-less — `created`, exactly what §11's before-MapScale
   * state exists for.
   */
  const cancelRun = () => {
    clearTimers();
    setPhase("idle");
    setVersions((vs) =>
      vs[0]?.state === "processing"
        ? [{ ...vs[0], state: "created" }, ...vs.slice(1)]
        : vs,
    );
  };

  /**
   * Stands in for the real pipeline: POST floor-plan-jobs → poll the job (resultExtra.internalStatus
   * carries genuine progress) → expert review → the traffic light → the customer's Manual Review.
   * See build_plan §5. A version is prepended the moment the "file" arrives (§11), state
   * `processing`, and the run's outcome writes back to it — the history is live, not a fixture.
   * Re-uploading mid-run supersedes the running job (newest wins); its version stays behind and
   * reads Superseded.
   *
   * Expert review sits **before** the customer, and is skipped entirely when the Settings flag is
   * off. That ordering is what makes the traffic light meaningful: the mapping team prunes
   * MapScale's over-reporting first, so the % the customer sees — and the auto-publish decision
   * taken off it — is the corrected number, not the raw engine's.
   */
  const uploadNew = (fileName?: string) => {
    clearTimers();
    const r = RUNS[uploads % RUNS.length];
    // no history yet (a level being created) ⇒ this upload is Version 1
    const n = (current?.n ?? 0) + 1;
    // A dropped/picked file keeps its own name and kind; the button's demo cycle invents one.
    const file = fileName ?? `${level.short}-departures-rev${n}.dwg`;
    const kind = fileName ? (dropKind(fileName) ?? "floor-plan") : "floor-plan";
    setVersions((vs) => [
      {
        n,
        source: "dashboard",
        at: "Just now",
        by: "You",
        state: "processing",
        input: { kind, file },
      },
      ...vs,
    ]);
    setUploads((u) => u + 1);
    setRun(r);
    setPhase("queued");
    if (kind === "geojson") {
      // §11: GeoJSON is already-mapped content — no MapScale (nothing to vectorise), no expert
      // pass (nothing engine-reported to prune) — straight to the traffic light.
      schedule(() => {
        setPhase("done");
        setVersions((vs) =>
          vs[0]?.n === n
            ? [
                { ...vs[0], state: stateForBand(r.pct), changePct: r.pct },
                ...vs.slice(1),
              ]
            : vs,
        );
      }, 1600);
      return;
    }
    schedule(() => setPhase("validating"), 900);
    if (r.cause === "cannot-process") {
      // C dies in validation: no mapping, no experts — there is nothing to hand them.
      schedule(() => {
        setPhase("done");
        setVersions((vs) =>
          vs[0]?.n === n
            ? [{ ...vs[0], state: "failed", redCause: r.cause }, ...vs.slice(1)]
            : vs,
        );
      }, 2600);
      return;
    }
    schedule(() => setPhase("mapping"), 1900);
    if (expertReviewEnabled()) schedule(() => setPhase("expert"), 3400);
    schedule(
      () => {
        setPhase("done");
        setVersions((vs) =>
          vs[0]?.n === n
            ? [
                { ...vs[0], state: stateForBand(r.pct), changePct: r.pct },
                ...vs.slice(1),
              ]
            : vs,
        );
      },
      expertReviewEnabled() ? 5200 : 3600,
    );
  };

  /**
   * A confirmed map-drop that arrived WITH the screen (App carried it through navigation) starts
   * its upload once, on mount; `onUploadStarted` clears the parcel so remounts can't replay it.
   */
  const consumedUpload = useRef(false);
  useEffect(() => {
    if (!uploadFile || consumedUpload.current) return;
    consumedUpload.current = true;
    uploadNew(uploadFile);
    onUploadStarted?.();
    // Deliberately empty: this must fire once, for the upload it was mounted with. (The directive
    // that used to sit here named `react-hooks/exhaustive-deps`, which the root eslint config does
    // not register — it was inert, and eslint 9 errors on the unknown name.)
  }, []);

  /**
   * The tree's "Update floor-plan" opens this screen with the file browser already popped
   * (Olcay, 2026-08-10 evening). Works because the menu click's transient user activation is
   * still alive when this mount effect runs — a file input's programmatic click needs it.
   */
  const fileInput = useRef<HTMLInputElement>(null);
  const consumedBrowse = useRef(false);
  useEffect(() => {
    // ref-guarded like consumedUpload: StrictMode double-invokes mount effects in dev, and a
    // second click() would re-pop the native dialog after the first is cancelled
    if (!browseOnMount || consumedBrowse.current) return;
    consumedBrowse.current = true;
    onBrowseConsumed?.();
    fileInput.current?.click();
    // Deliberately empty — see the note on the upload effect above.
  }, []);

  /**
   * Restore = an append-only re-submission of already-mapped content (RESTORE_COPY is the law).
   * No MapScale — there is no floor-plan to re-map — and no Expert Review — nothing
   * engine-reported to prune — so it lands straight at the traffic light, instantly here and
   * near-instantly for real. RESTORE_PCT lands it amber: not auto-published until the grace runs,
   * reviewed by you — which is the protection this path exists to demonstrate. (It stays under the
   * >50% A-guard on purpose: a restore is deliberate re-submission, not a suspect upload.)
   */
  const restore = (v: LevelVersion) => {
    clearTimers();
    const n = (current?.n ?? 0) + 1;
    setVersions((vs) => [
      {
        n,
        source: "dashboard",
        at: "Just now",
        by: "You",
        state: stateForBand(RESTORE_PCT),
        changePct: RESTORE_PCT,
        input: v.input,
        restoredFrom: v.n,
      },
      ...vs,
    ]);
    setRun({ pct: RESTORE_PCT });
    setPhase("done");
  };

  return (
    <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
      {/* the real file browser behind "Update floor-plan"; the picked name feeds the mock pipeline */}
      <input
        ref={fileInput}
        type="file"
        accept=".dwg,.dxf,.pdf,.geojson,.json"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) uploadNew(f.name);
          e.target.value = "";
        }}
      />
      <div
        style={{
          width: PANEL_WIDTH,
          flex: `0 0 ${PANEL_WIDTH}px`,
          borderRight: `1px solid ${LINE}`,
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {/*
          The full-bleed hold banner was here and is **removed** (Olcay, 2026-08-11: *"let's remove
          this notification, it's already on the side button"*). It said exactly what the map's
          corner chip says, a few hundred pixels away, so the screen opened by telling you the same
          thing twice.

          ⚠️ **This inverts §16's reasoning about the chip, so read that note next to this one.**
          Dismissing the chip used to be safe *because* "the chip is the echo; banner, status card
          and locks remain" — with the banner gone the chip is the loudest voice, and it is
          dismissible. The hold is still stated three ways after a dismiss: the status card reads
          *Awaiting Expert Review* with `EXPERT_HOLD.what` in its info slot, and every frame-changing
          control is disabled carrying its own reason. That is enough — but if the chip is ever made
          quieter, this is the load-bearing bit that would go with it.
        */}
        {/* The header is chrome: it sits outside the scroll area so the ✕ can neither be pushed
            sideways by a scrollbar nor scrolled off the top — see PANEL_PAD. */}
        <div style={{ padding: PANEL_PAD }}>
          {/* the ✕ IS Cancel (Olcay's standing rule), so the footer carries only Update */}
          <PanelHeader
            eyebrow={`Map Content › ${level.building}`}
            title={`Editing Level · ${level.name}`}
            onClose={onCancel}
            closeLabel="Close editor"
          />
        </div>
        <div style={{ padding: "0 20px 8px", overflow: "auto", flex: 1 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: 600,
              display: "block",
              marginTop: 12,
            }}
          >
            Metadata
          </Text>
          {/*
            The DS Input's own label anatomy (label + 6px gap + field), fields 12px apart (tightened
            from 16 — Olcay, 2026-08-10). The field set matches v9's level row
            (Figma b8dqhE3CPxitYfqlXuQJTC · 10059:109004): Type · Index · Short · Long · External
            Identifier. Uncontrolled on purpose: Update doesn't persist anything yet (D3).
            Editable under the expert hold — field edits merge, and the banner carries the warning.
          */}
          {/* One listener for the whole block rather than five: the fields are uncontrolled (D3 —
              Update persists nothing yet), so this is only asking "did anything get touched?",
              which is exactly what the footer button needs to know. */}
          <div
            onInput={() => setMetaDirty(true)}
            onChange={() => setMetaDirty(true)}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginTop: 12,
            }}
          >
            {/*
              Level Type is the sector list (Olcay, 2026-08-10), not free text: sector groups,
              sub-sector options, alphabetical with "Other" pinned last (PICKER_SECTORS).
              A sector with no sub-sectors ("Other") is selectable itself.
              Descriptions ride as title tooltips — the DS SelectItem mirrors its children into
              the closed trigger, so a second line inside the option would leak there. The list
              lives in mock/sectors.ts verbatim; the real one comes from platform config.
            */}
            <FieldWrapper label="Level Type" inputId="level-type">
              <Select defaultValue={DEFAULT_SECTOR_KEY}>
                <SelectTrigger id="level-type" aria-label="Level Type">
                  <SelectValue placeholder="Select a sector" />
                </SelectTrigger>
                <SelectContent>
                  {PICKER_SECTORS.map((s) =>
                    s.subsectors.length ? (
                      <SelectGroup key={s.name}>
                        <SelectLabel title={s.description}>
                          {s.name}
                        </SelectLabel>
                        {s.subsectors.map((sub) => (
                          <SelectItem
                            key={sub.name}
                            value={sectorKey(s.name, sub.name)}
                            title={sub.description}
                          >
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ) : (
                      <SelectItem
                        key={s.name}
                        value={sectorKey(s.name)}
                        title={s.description}
                      >
                        {s.name}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </FieldWrapper>
            {/* both are short values, so they share a row (Olcay, 2026-08-10) — like v9's level row */}
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Input
                  label="Level Index"
                  type="number"
                  defaultValue={String(level.index)}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Input label="Short Name" defaultValue={level.short} />
              </div>
            </div>
            <Input label="Long Name" defaultValue={level.name} />
            <Input
              label="External Identifier"
              placeholder={`DXB-${level.short}`}
            />
          </div>

          <Text
            style={{
              fontSize: 13,
              fontWeight: 600,
              display: "block",
              marginTop: 24,
            }}
          >
            Floor-plan
          </Text>

          {/*
            The floor-plan is the source of truth and the section's subject (Olcay, 2026-08-10,
            superseding both the "AI-Mapping by MapScale" heading and the status-first ordering):
            MapScale is a *state of this floor-plan*, so its status card is attached inside the
            floor-plan's own box rather than standing beside it. Jobs are 1:1 with versions — the
            model already says so (uploadNew writes each run's outcome back to its own version) —
            and this layout finally draws it.

            The status card is still v9's AiMappingActionStatus; once the job is through it becomes
            the traffic light (MAP-199): a minor change offers no Review because there is nothing
            to do.
          */}
          {current && (
            <div
              data-tour="floorplan"
              style={{
                border: `1px solid ${LINE}`,
                borderRadius: 10,
                marginTop: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: 10,
                }}
              >
                {/* the v9 Level Manager thumbnail (18833:214839): a real preview, tap for larger */}
                <FloorPlanThumb file={current.input.file} />
                {/*
                The card's anatomy, reworked per Olcay (2026-08-10 evening): file name with the
                Current chip top-right (the spot Upload new vacated), then one line saying who sent
                it and when. The version *number* is gone — the section shows the current
                floor-plan, and the numbers live in the history right below. The kind label stays
                gone too — only the exception is worth naming (a restore's lineage; a GeoJSON push
                in the rows below). The blueprint link is gone: the overlay toggle lives in Map
                Settings, one handle instead of two.
              */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--review-ink)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={current.input.file}
                  >
                    {current.input.file}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 3,
                      fontSize: 12,
                      color: MUTED,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <SourcePill source={current.source} />
                    {current.restoredFrom ? (
                      <span>
                        · Restored from Version {current.restoredFrom}
                      </span>
                    ) : null}
                    <span>· {current.at}</span>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: 0.3,
                    color: "#0b369c",
                    background: "#eef3ff",
                    border: "1px solid #cfdcff",
                    borderRadius: 999,
                    padding: "0 7px",
                    lineHeight: 1.7,
                    flex: "0 0 auto",
                  }}
                >
                  Current
                </span>
              </div>
              {/* this floor-plan's own MapScale job — attached, because it belongs to it — with the
                way to replace the file right under the state that would make you want to */}
              <div style={{ padding: "0 8px 8px" }}>
                <AiMappingStatus
                  state={card.state}
                  note={card.note}
                  progress={card.progress}
                  action={card.action}
                  onAction={cancelRun}
                  primary={card.primary}
                  onPrimary={() => onReview(run.pct, run.cause)}
                  /* the slot explains what offers no action: the hold, or cause C's error details */
                  info={expertHold ? EXPERT_HOLD.what : card.info}
                />
                {/* under the hold or mid-run the button stays visible, disabled with its reason */}
                <span
                  data-tour="upload"
                  title={uploadReason}
                  style={{ display: "block", marginTop: 8 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      restartsWork ? setConfirmUpload(true) : uploadNew()
                    }
                    disabled={!!uploadReason}
                    className="w-full"
                  >
                    Upload new
                  </Button>
                </span>
              </div>
            </div>
          )}

          <PreviousVersions
            level={level}
            versions={versions}
            restoreReason={restoreReason}
            onRestore={restore}
            onViewAll={() => onHistory()}
            onPreview={(v) => onHistory(v.n)}
            onCompare={(v) => onHistory(v.n, "compare")}
          />

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              marginTop: 24,
            }}
          >
            <div style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: 600, display: "block" }}>
                Auto-Map Updates
              </Text>
              <Text style={{ fontSize: 12, color: MUTED }}>
                Auto-publish minor changes; larger updates go to review.
              </Text>
            </div>
            {/* the DS Switch wrapper is w-full, which would starve the label column */}
            <Switch
              checked={autoMap}
              onCheckedChange={setAutoMap}
              aria-label="Auto-Map Updates"
              wrapperClassName="w-auto shrink-0"
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "12px 20px",
            borderTop: `1px solid ${LINE}`,
            justifyContent: "flex-end",
          }}
        >
          {/* Cancel became the header's ✕ (Olcay, 2026-08-10 evening); saving field edits is
              allowed under the hold — the banner already carries the risk */}
          {/*
            **Done, not Update, when nothing is dirty** (Olcay, 2026-08-11: *"so that we don't need
            to update as we've just saved the review"*). Coming back from a concluded review, the
            only thing left to do on this screen is leave it — and a button called Update invites
            you to wonder what is still unsaved. It becomes Update the moment a metadata field is
            touched.

            **Still the primary** (Olcay, same day): it is demoted in *meaning*, not in weight —
            Done is the way out of the screen and the only action in the footer, so a secondary
            treatment just made the panel look like it had nothing to offer.
          */}
          <Button onClick={onCancel}>{metaDirty ? "Update" : "Done"}</Button>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          flex: 1,
          background: "#EDEEF0",
          minWidth: 0,
        }}
      >
        <PointrMap
          /* nothing from a concluded review is drawn here — see `concludedMarks` */
          changes={concludedMarks}
          prefs={prefs}
          target={mapTarget}
          onBuildings={onBuildings}
          // the drop zone honours the same locks as the Upload button: the expert hold and a
          // running job (a drop while either holds simply no-ops in the handler)
          onFileDrop={expertHold || running ? undefined : onFileDrop}
        />
        {/* the panel's banner explains the panel; the map has to be told separately */}
        {expertHold && <ExpertHoldChip />}
        <MapSettings prefs={prefs} onChange={setPrefs} />
        {dropped && liveBuildings.length > 0 && (
          <UploadDropConfirm
            file={dropped}
            buildings={liveBuildings}
            initialBuildingId={level.buildingId ?? liveBuildings[0].id}
            initialLevel={level.index}
            onConfirm={(l, f) => {
              setDropped(null);
              // dropping on the level you're already editing uploads right here; retargeting
              // hands the parcel to App, which switches editors and carries the file
              if (l.buildingId === level.buildingId && l.index === level.index)
                uploadNew(f);
              else onUploadTo?.(l, f);
            }}
            onCancel={() => setDropped(null)}
          />
        )}

        {/*
          Uploading over a level that has already been through review restarts everything —
          MapScale, the mapping team's pass, and your own review — and the decisions on this
          version do not come with it, because outcomes are version-matched. That is worth a
          sentence before it happens rather than an "oh" afterwards.

          Same v9 overlay as every other confirmation in the app (§3), and it **warns without
          refusing**: re-uploading is a legitimate thing to do, it just costs the work below.
        */}
        <ConfirmOverlay
          open={confirmUpload}
          tone="info"
          title="Start over with a new floor-plan?"
          confirmLabel="Start over"
          onCancel={() => setConfirmUpload(false)}
          onConfirm={() => {
            setConfirmUpload(false);
            uploadNew();
          }}
        >
          {/*
            Short, because a confirmation is read in a second (Olcay, 2026-08-12: *"all we want to
            say is — you've just run a floor-plan and it's at review stage, do you want to
            restart?"*). The first draft explained the whole pipeline back to someone who had just
            watched it run.

            The second line is the part worth keeping: it names the **way back**. Version N stays
            restorable and keeps its report, which is exactly what makes starting over a safe thing
            to agree to.
          */}
          {`Version ${current?.n} is ${current?.state === "published" ? "live" : "at review stage"}. A new floor-plan starts the process again.`}
          <div style={{ fontSize: 13, color: MUTED, marginTop: 8 }}>
            {forThisVersion
              ? `You can restore Version ${current?.n} later — it keeps its review.`
              : `You can restore Version ${current?.n} later.`}
          </div>
        </ConfirmOverlay>
      </div>
    </div>
  );
}
