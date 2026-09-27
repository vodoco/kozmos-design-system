import { Star as StarOutline, StarFilled } from "../ui/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Checkbox,
  FieldWrapper,
  Icon,
  IconButton,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  Text,
} from "@kozmos-ds/react";
import { PANEL_WIDTH } from "../ui/Chrome";
import PointrMap from "../map/PointrMap";
import { AiMappingStatus, type MapScaleState } from "../ui/AiMappingStatus";
import { FloorPlanThumb } from "../ui/FloorPlanThumb";
import { dropKind } from "../ui/UploadDropConfirm";
import { PANEL_PAD, PanelHeader } from "../ui/PanelHeader";
import { ConfirmOverlay } from "../ui/ConfirmOverlay";
import { ManualReview } from "./ManualReview";
import {
  addBuilding,
  getReviewOutcome,
  levelKey,
  setLevelVersions,
  setReviewOutcome,
  updateBuilding,
} from "../mock/store";
import type { Change, LevelVersion, Override } from "../mock/diff";
import {
  ALIGN_COPY,
  FINETUNE_COPY,
  LEVEL_DROP_COPY,
  PREVIEW_LABELS,
  WIZARD_STEPS,
  buildingStats,
  creationChangesFor,
  levelIssueCount,
  levelResult,
  levelStateLabel,
  nameFromFile,
  type LevelReviewState,
  type WizardStepKey,
} from "../mock/wizard";
import { PICKER_SECTORS, sectorKey } from "../mock/sectors";
import { T3_ID } from "../mock/site";

/** The wizard's default Level Type — the design's rows all read "Workplace" (2164:19545). */
const WIZARD_SECTOR_KEY = sectorKey("Workplace", "Corporate Office");

/** "workplace/corporate-office" → "Corporate Office", for the read row's tag. */
function sectorLabel(key: string): string {
  for (const sec of PICKER_SECTORS) {
    if (sectorKey(sec.name) === key) return sec.name;
    for (const sub of sec.subsectors)
      if (sectorKey(sec.name, sub.name) === key) return sub.name;
  }
  return key;
}

/**
 * The Building wizard (v9 section 10059:102926; entry: Map Content's "Add new" — Olcay,
 * 2026-08-10 late evening, un-parking it with all four scope answers):
 *
 *   1 Metadata → 2 Level Manager (drop N floor-plan files → N levels, each through the MapScale
 *   pipeline) → 3 Floor-plan Alignment (align every level to ONE reference level) → 4 Fine-tune
 *   Building Placement (georeference the whole stack via the reference floor: 2Dot Align, A/B
 *   anchors) → 5 Preview (mapped surface · duration · confidence · Potential Issues → the
 *   Resolve Potential Issues page) → Save.
 *
 * Decisions honoured here: the wizard's review is ISSUES-ONLY (no changelog — there is no
 * published baseline to diff; the traffic light arms from the second floor-plan onward), and
 * Save CREATES the building (it appears in the tree via the store) — publishing stays the site's
 * Publish. Interactions are faithful-UI/simple-math: drag + rotate on the align canvas, draggable
 * anchors with derived coordinates on the fine-tune map; no scale/skew. One preview asset stands
 * in for every level's drawing (the same honest limit as everywhere else).
 */

const LINE = "var(--primitives-colors-background-100)";
const INK = "var(--primitives-colors-theme-900)";
const MUTED = "var(--primitives-colors-background-600)";
const NO_CHANGES: never[] = [];

type Phase =
  | "queued"
  | "validating"
  | "mapping"
  | "expert"
  | "ready"
  | "failed";

interface WizLevel {
  id: number;
  index: number;
  short: string;
  long: string;
  file: string;
  phase: Phase;
  /**
   * The level's position in the building's creation order — what `mock/wizard.ts` keys MapScale's
   * per-level result off (area, duration, confidence, issue count).
   *
   * Creation order, **not** the sorted index: indices are editable in the Level Manager, and
   * deriving the ordinal from them would silently re-roll a level's issues the moment somebody
   * renumbered a floor.
   */
  ordinal: number;
  /** The sector list, same as the level editor's Level Type (Olcay: it IS the sector list). */
  sector: string;
  extId: string;
  /** The building's default level — the one the map opens on. One winner; the ☆ sets it. */
  isDefault?: boolean;
}

/** The pipeline's own phases. What happens once it lands is the level's REVIEW state — see below. */
const PHASE_CARD: Record<Phase, { state: MapScaleState; note?: string }> = {
  queued: { state: "in-queue" },
  validating: { state: "validating" },
  mapping: { state: "in-progress" },
  expert: { state: "expert-review" },
  // `ready` no longer speaks for itself: what a finished level says depends on whether MapScale
  // left anything to confirm, which is `levelCardFor()`'s job. It used to read "Ready — review in
  // Preview" on every finished level — actively misleading, since those guesses were unconfirmed
  // and Preview didn't distinguish levels at all (§18).
  ready: { state: "completed" },
  failed: { state: "failed", note: "Couldn't process this floor-plan" },
};

/** How a finished level's state reaches the v9 AI-Mapping card. */
const STATE_CARD: Record<LevelReviewState, MapScaleState> = {
  mapping: "in-progress",
  failed: "failed",
  ready: "completed",
  awaiting: "user-review",
  "in-review": "user-review",
  reviewed: "completed",
};

interface XYR {
  x: number;
  y: number;
  rot: number;
}
const IDENTITY: XYR = { x: 0, y: 0, rot: 0 };

interface Anchors {
  ax: number;
  ay: number;
  bx: number;
  by: number;
}
/** Where the 2Dot anchors sit before anyone touches them — also what Clear returns them to. */
const ANCHORS_HOME: Anchors = { ax: 120, ay: 90, bx: 420, by: 250 };

/** One drag interaction: pointerdown here, move deltas flow to `onMove`, `onEnd` on release. */
function startDrag(
  e: React.PointerEvent,
  onMove: (dx: number, dy: number, ev: PointerEvent) => void,
  onEnd?: () => void,
) {
  e.preventDefault();
  e.stopPropagation();
  const sx = e.clientX;
  const sy = e.clientY;
  const move = (ev: PointerEvent) =>
    onMove(ev.clientX - sx, ev.clientY - sy, ev);
  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    onEnd?.();
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}

/** The default-level star — `star-01` from the Pointr Icon Library, filled when it is the
    default. One silhouette in two states (see `../ui/icons`). */
function Star({ filled }: { filled?: boolean }) {
  return filled ? (
    <StarFilled
      size={14}
      style={{ color: "var(--primitives-colors-theme-700)" }}
    />
  ) : (
    <StarOutline size={14} />
  );
}

/* ── the step accordion (drawer left) ─────────────────────────────────────── */

function StepRow({
  n,
  title,
  blurb,
  state,
  onClick,
  children,
}: {
  n: number;
  title: string;
  blurb: string;
  state: "done" | "current" | "locked" | "idle";
  onClick: () => void;
  children?: React.ReactNode;
}) {
  const current = state === "current";
  return (
    <div
      style={{
        border: `1px solid ${current ? INK : LINE}`,
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <button
        onClick={onClick}
        disabled={state === "locked"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          textAlign: "left",
          border: "none",
          cursor: state === "locked" ? "default" : "pointer",
          padding: "10px 12px",
          background: current ? INK : "#fff",
          color: current
            ? "#fff"
            : state === "locked"
              ? "var(--primitives-colors-background-400)"
              : "var(--review-ink)",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, letterSpacing: 0.4, opacity: 0.75 }}>
            Step {n}/5
          </div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
        </div>
        {state === "done" && (
          <span
            style={{
              color: "var(--primitives-colors-emotional-success-600)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="check" />
          </span>
        )}
      </button>
      {current && (
        <div style={{ padding: "10px 12px", borderTop: `1px solid ${LINE}` }}>
          <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.4 }}>
            {blurb}
          </div>
          {children}
        </div>
      )}
    </div>
  );
}

/** The design's own words when a level row is left open (2007:17095). */
const UNSAVED_TIP =
  "You have unsaved floor-plans. Confirm or cancel them before proceeding.";

/**
 * When a wizard-created level's first version arrived, formatted the way the seeds are.
 *
 * The mock has no clock and its fixtures are fixed strings — but a building created a moment ago
 * genuinely happened at a time, and printing a 2025 date on it would be the fiction, not the fix.
 */
function stamp(): string {
  const d = new Date();
  return `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

const SKIP_STYLE: React.CSSProperties = {
  border: "1px solid #f3a2b3",
  color: "var(--primitives-colors-emotional-danger-600)",
  background: "none",
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: 12,
  cursor: "pointer",
  width: "100%",
  textAlign: "left",
  marginTop: 10,
};

/* ── the wizard ───────────────────────────────────────────────────────────── */

export function BuildingWizard({
  onClose,
  onDone,
  initial,
}: {
  onClose: () => void;
  onDone: () => void;
  /**
   * Edit mode (the tree's building ⋯ → Edit building): the wizard re-enters with the building's
   * name and levels pre-completed — the existing levels arrive `ready`, so every step is open.
   * `storeId` present ⇒ Save updates the store row; absent (an SDK building) ⇒ edits don't
   * persist in the mock, the same limit as the editor's metadata (D3).
   */
  initial?: {
    storeId?: string;
    name: string;
    levels: { index: number; short: string; long: string; file: string }[];
  };
}) {
  const [step, setStep] = useState<WizardStepKey>("metadata");
  const [name, setName] = useState(initial?.name ?? "");
  const [extId, setExtId] = useState("");

  /* — step 2: levels + their MapScale pipeline — */
  const [levels, setLevels] = useState<WizLevel[]>(() =>
    (initial?.levels ?? []).map((l, i) => ({
      id: i + 1,
      index: l.index,
      short: l.short,
      long: l.long,
      file: l.file,
      phase: "ready" as Phase,
      ordinal: i,
      sector: WIZARD_SECTOR_KEY,
      extId: "",
    })),
  );
  const [autoMapping, setAutoMapping] = useState(true);
  const nextId = useRef((initial?.levels.length ?? 0) + 1);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  const advance = (id: number, phase: Phase, ms: number) =>
    timers.current.push(
      window.setTimeout(
        () =>
          setLevels((ls) => ls.map((l) => (l.id === id ? { ...l, phase } : l))),
        ms,
      ),
    );
  /**
   * Ids and timers are minted OUTSIDE the setState updater on purpose: StrictMode double-invokes
   * updaters to catch impurity, and this one used to burn two ids and schedule two pipeline chains
   * per dropped file — the first chain then ticking against ids that never reached state.
   */
  const addFiles = (files: string[]) => {
    const accepted = files.filter((f) => dropKind(f));
    if (!accepted.length) return;
    const top = levels.length ? Math.max(...levels.map((l) => l.index)) : -1;
    const topOrdinal = levels.length
      ? Math.max(...levels.map((l) => l.ordinal))
      : -1;
    const added: WizLevel[] = accepted.map((f, i) => {
      const index = top + 1 + i;
      return {
        id: nextId.current++,
        index,
        short: `L${index}`,
        long: nameFromFile(f),
        file: f,
        phase: "queued" as Phase,
        // never reused, even after a removal — a level's MapScale result is its own
        ordinal: topOrdinal + 1 + i,
        sector: WIZARD_SECTOR_KEY,
        extId: "",
      };
    });
    setLevels((ls) => [...ls, ...added]);
    // staggered pipeline per level — each walks queued → … → ready on its own clock, except the
    // one MapScale can't read, which dies in validation (cause C) and never reaches the experts
    added.forEach((l, i) => {
      const doomed = levelResult(l.ordinal).failed;
      advance(l.id, "validating", 700 + i * 350);
      if (doomed) {
        advance(l.id, "failed", 1600 + i * 350);
        return;
      }
      advance(l.id, "mapping", 1600 + i * 350);
      advance(l.id, "expert", 2800 + i * 350);
      advance(l.id, "ready", 4200 + i * 350);
    });
  };
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  /**
   * The level row being edited, and its working copy. The design (2007:17095) turns the row into
   * a form with its own **Cancel / Confirm** — so edits are a draft until confirmed, and a row
   * left open blocks Continue ("You have unsaved floor-plans. Confirm or cancel them before
   * proceeding."). One row at a time: opening another confirms nothing, it just refuses.
   */
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<WizLevel | null>(null);
  const startEdit = (l: WizLevel) => {
    if (editing !== null) return;
    setEditing(l.id);
    setDraft({ ...l });
  };
  const cancelEdit = () => {
    setEditing(null);
    setDraft(null);
  };
  const confirmEdit = () => {
    if (!draft) return;
    setLevels((ls) =>
      ls.map((l) =>
        l.id === draft.id
          ? draft
          : // one default level per building: confirming a new default clears the old one
            draft.isDefault
            ? { ...l, isDefault: false }
            : l,
      ),
    );
    cancelEdit();
  };
  const removeLevel = (id: number) => {
    setLevels((ls) => ls.filter((l) => l.id !== id));
    cancelEdit();
  };

  /* — step 3: alignment — */
  const [refId, setRefId] = useState<number | null>(null);
  const reference = levels.find((l) => l.id === refId) ?? levels[0];
  const others = levels.filter((l) => l.id !== reference?.id);
  const [alignT, setAlignT] = useState<Record<number, XYR>>({});
  const [aligned, setAligned] = useState<Set<number>>(new Set());
  const [alignCurrent, setAlignCurrent] = useState<number | null>(null);
  const [alignSkipped, setAlignSkipped] = useState(false);
  /**
   * Changing the reference invalidates every alignment made against the old one — and the
   * building placement too, since step 4 georeferences THROUGH the reference floor. Keeping the
   * ticks would let step 3 read complete with a level that was aligned to a floor no longer in
   * play, and silently carry an old placement into step 4 (fixed 2026-08-11).
   */
  const changeReference = (id: number) => {
    setRefId(id);
    setAligned(new Set());
    setAlignT({});
    setAlignCurrent(null);
    setAlignSkipped(false);
    setFineConfirmed(false);
    setFineSkipped(false);
    setFineT(IDENTITY);
    setHistory([{ t: IDENTITY, a: ANCHORS_HOME }]);
    setHistAt(0);
    setAnchors(ANCHORS_HOME);
  };
  const current =
    others.find((l) => l.id === alignCurrent) ??
    others.find((l) => !aligned.has(l.id)) ??
    others[0];
  const [refOpacity, setRefOpacity] = useState(0.9);

  /* — step 4: fine-tune (2Dot Align) — */
  const [fineT, setFineT] = useState<XYR>(IDENTITY);
  const [anchors, setAnchors] = useState<Anchors>(ANCHORS_HOME);
  const [pinned, setPinned] = useState(false);
  const [tool, setTool] = useState<"2dot" | "transform">("2dot");
  const [fineConfirmed, setFineConfirmed] = useState(false);
  const [fineSkipped, setFineSkipped] = useState(false);
  /**
   * Undo/redo history. **State, not refs** (fixed 2026-08-11): refs don't re-render, so the
   * buttons kept their boot-time disabled look. The stack is seeded with the untouched placement
   * and each entry is pushed AFTER a drag settles — snapshotting the pre-drag values (the old
   * bug) left the live state outside the history, so the first Undo stepped to index -1 and did
   * nothing, and Redo's `histAt >= length - 1` was true forever.
   */
  const [history, setHistory] = useState<{ t: XYR; a: Anchors }[]>([
    { t: IDENTITY, a: ANCHORS_HOME },
  ]);
  const [histAt, setHistAt] = useState(0);
  /** Live mirrors, so `commit` can read post-drag values without re-binding the drag handlers. */
  const fineRef = useRef(fineT);
  fineRef.current = fineT;
  const anchorsRef = useRef(anchors);
  anchorsRef.current = anchors;
  /** Called when an interaction settles: truncate any redo tail, push where we actually landed. */
  const commit = () => {
    setHistory((h) => [
      ...h.slice(0, histAt + 1),
      { t: fineRef.current, a: anchorsRef.current },
    ]);
    setHistAt((i) => i + 1);
  };
  const restore = (i: number) => {
    const snap = history[i];
    if (!snap) return;
    setHistAt(i);
    setFineT(snap.t);
    setAnchors(snap.a);
  };

  /* — the per-level review (the review IS Manual Review — creation mode) — */

  /**
   * Which level is open in the review, and what every level's review has come to.
   *
   * The decisions live HERE, not inside ManualReview (fixed 2026-08-11): opening the review
   * unmounts and remounts that screen, so decisions kept there were silently thrown away — confirm
   * everything, go back, reopen, and every row was undecided again while the banner had already
   * counted them. Holding the rows in the wizard makes reopening resume where you left off.
   *
   * They are now **per level** (§18): one flat list could not say which floor an issue was on, and
   * every seeded issue claimed the same one.
   */
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviews, setReviews] = useState<
    Record<
      number,
      { rows: Change[]; overrides: Record<string, Override>; complete: boolean }
    >
  >(() => {
    /**
     * Edit mode picks up where creation left off. A building's levels carry their concluded
     * reviews in the store (that is how creation's own edits reach the level editor at all —
     * answer 4), so re-entering the wizard through the tree's *Edit building* reads them back
     * rather than presenting every level as untouched. Version-matched like every other reader: a
     * level whose floor-plan has been replaced since starts clean.
     *
     * ⚠️ **`overrides` rides along with `rows`** and is not derivable from them: a `Change` is
     * MapScale's report and holds no answer to itself. Reading back the rows alone — which is what
     * this did before 2026-08-25 — would present a level somebody had edited as one they had
     * merely confirmed.
     */
    if (!initial?.storeId) return {};
    const out: Record<
      number,
      { rows: Change[]; overrides: Record<string, Override>; complete: boolean }
    > = {};
    (initial.levels ?? []).forEach((l, i) => {
      const saved = getReviewOutcome(levelKey(initial.storeId, l.index), 1);
      if (saved)
        out[i + 1] = {
          rows: saved.changes,
          overrides: saved.overrides ?? {},
          complete: saved.complete,
        };
    });
    return out;
  });
  /** Which level the Preview's list has selected — it drives the map beside it. */
  const [previewLevelId, setPreviewLevelId] = useState<number | null>(null);
  /** Save warns about unreviewed levels; it never blocks (Olcay's answer 1). */
  const [saveWarnOpen, setSaveWarnOpen] = useState(false);

  /* — completion + gating — */
  const metadataDone = name.trim().length > 0;
  /** The design's gate: an open row means unsaved work, so the step can't be left. */
  const unsavedRow = editing !== null;
  // A failed run is settled, not pending: the level reports the failure and the wizard moves on.
  // Gating on `ready` alone would have left Continue disabled forever behind a file MapScale
  // couldn't read, with nothing the user could do about it.
  const levelsDone =
    levels.length > 0 &&
    levels.every((l) => l.phase === "ready" || l.phase === "failed");
  const alignDone =
    alignSkipped ||
    others.length === 0 ||
    others.every((l) => aligned.has(l.id));
  const fineDone = fineSkipped || fineConfirmed;
  const complete: Record<WizardStepKey, boolean> = {
    metadata: metadataDone,
    levels: levelsDone && !unsavedRow,
    align: alignDone,
    finetune: fineDone,
    preview: false,
  };
  const order: WizardStepKey[] = [
    "metadata",
    "levels",
    "align",
    "finetune",
    "preview",
  ];
  const canEnter = (k: WizardStepKey) =>
    order.slice(0, order.indexOf(k)).every((p) => complete[p]);

  /* ── per-level review state ─────────────────────────────────────────────── */

  /**
   * A level's rows: its saved ones if it has been touched, otherwise MapScale's own guesses.
   * Memoised because they feed `PointrMap` through the review, which re-posts to the iframe on any
   * change of array identity.
   */
  const rowsByLevel = useMemo(() => {
    const m: Record<number, Change[]> = {};
    for (const l of levels)
      m[l.id] = reviews[l.id]?.rows ?? creationChangesFor(l, l.ordinal);
    return m;
  }, [levels, reviews]);

  /**
   * The five words, in the editor's own vocabulary (§18). Note what earns each: `ready` is now
   * *zero issues found*, not "the pipeline finished" — the state this screen used to print on
   * every completed level while its guesses sat unconfirmed.
   */
  const stateOf = (l: WizLevel): LevelReviewState => {
    if (l.phase === "failed") return "failed";
    if (l.phase !== "ready") return "mapping";
    if (levelIssueCount(l.ordinal) === 0) return "ready";
    const r = reviews[l.id];
    if (!r) return "awaiting";
    return r.complete ? "reviewed" : "in-review";
  };
  /** How many of a level's rows carry the reviewer's own value rather than MapScale's. */
  const editedOf = (l: WizLevel) =>
    Object.keys(reviews[l.id]?.overrides ?? {}).length;
  const levelCardFor = (l: WizLevel) => {
    const s = stateOf(l);
    if (s === "mapping") return PHASE_CARD[l.phase];
    const card = {
      state: STATE_CARD[s],
      note: levelStateLabel(s, levelIssueCount(l.ordinal), editedOf(l)),
    };
    // Zero-issue and failed levels get no way in: there is nothing to confirm on one, and nothing
    // to confirm *from* on the other (§18 — both are excluded from the review count too).
    if (s === "ready" || s === "failed") return card;
    return {
      ...card,
      primary: s === "reviewed" ? "Reopen" : "Review",
      onPrimary: () => setReviewingId(l.id),
    };
  };

  /**
   * Which levels the review is actually about. **Zero-issue levels are skipped** and not counted
   * (Olcay's answer 2) — creation's equivalent of Green auto-publishing; so is a failed one, which
   * would otherwise sit in the list as a task nobody can complete (§18's stated assumption).
   */
  const reviewable = levels.filter(
    (l) => l.phase === "ready" && levelIssueCount(l.ordinal) > 0,
  );
  const reviewedCount = reviewable.filter(
    (l) => reviews[l.id]?.complete,
  ).length;
  const unreviewed = reviewable.filter((l) => !reviews[l.id]?.complete);
  /** The building's three tiles — summed from the levels, not declared (§18). */
  const stats = buildingStats(levels.map((l) => l.ordinal));

  const sortedLevels = useMemo(
    () => [...levels].sort((a, b) => b.index - a.index),
    [levels],
  );
  const previewLevel = levels.find((l) => l.id === previewLevelId) ?? null;
  const reviewingLevel = levels.find((l) => l.id === reviewingId) ?? null;

  /* ── save ───────────────────────────────────────────────────────────────── */

  /**
   * What the wizard leaves behind.
   *
   * **Creation flags flow into the created level's editor** (Olcay's answer 4): each level's
   * decisions are written as the same `ReviewOutcome` the update flow writes, so a level flagged
   * during creation opens with those flags on its map — same store, same shape, no second model.
   *
   * The version timeline is seeded at the same time, and that is a real fix rather than a
   * convenience: without it a created level fell through to `seedVersions()`, which invents a
   * two-version Pointr history dating from 2025 for a building that did not exist a minute ago —
   * and whose newest version number would not have matched the outcome, so the flags would have
   * been silently discarded as belonging to a superseded floor-plan.
   *
   * ⚠️ **Judgement call, open to veto:** the version's state is `published`. Nothing was published
   * to anybody — Save creates the building, and the site-wide publish stays the platform's separate
   * mechanism (decision 5). But `published` is this app's word for *the content that is current for
   * this level*, and a created level's only version is current by definition; every other state
   * would make the tree offer a review, a decision or a re-upload that creation has already
   * settled. The alternative — `created` — reads "no floor plan yet", which is worse.
   */
  const createBuilding = () => {
    const id =
      initial?.storeId ??
      `created-${nextId.current}-${name.trim().toLowerCase().replace(/\W+/g, "-")}`;
    const data = {
      name: name.trim(),
      levels: levels.map((l) => ({
        index: l.index,
        short: l.short,
        long: l.long,
        file: l.file,
      })),
    };
    if (initial?.storeId) updateBuilding({ id: initial.storeId, ...data });
    else if (!initial) addBuilding({ id, ...data });
    // an SDK building's edit has nowhere to persist in the mock (D3's limit) — its levels are
    // skipped below for the same reason: there is no store row for them to hang off.
    if (!initial || initial.storeId) {
      for (const l of levels) {
        if (l.phase === "failed") continue;
        const key = levelKey(id, l.index);
        const version: LevelVersion = {
          n: 1,
          source: "dashboard",
          at: stamp(),
          state: "published",
          by: "You",
          input: {
            kind: l.file.toLowerCase().endsWith(".geojson")
              ? "geojson"
              : "floor-plan",
            file: l.file,
          },
        };
        setLevelVersions(key, [version]);
        const r = reviews[l.id];
        if (!r) continue;
        setReviewOutcome(key, {
          versionN: 1,
          decisions: Object.fromEntries(r.rows.map((c) => [c.id, c.decision])),
          changes: r.rows,
          // Creation publishes nothing — the building is created, not live.
          published: false,
          complete: r.complete,
        });
      }
    }
    onDone();
  };

  /** Save **warns** about unreviewed levels and never blocks — creation isn't publication. */
  const save = () => {
    if (unreviewed.length) setSaveWarnOpen(true);
    else createBuilding();
  };

  /* ── drawer step bodies ─────────────────────────────────────────────────── */

  /**
   * Memoised: `changes` feeds PointrMap, which re-posts to the iframe whenever the array's
   * identity changes — an inline object here rebuilt the whole change set on every wizard render.
   */
  const creationCtx = useMemo(() => {
    const l = levels.find((x) => x.id === reviewingId);
    if (!l) return undefined;
    return {
      // the LEVEL's confidence, not the building's — the building tile is the area-weighted mean
      confidencePct: levelResult(l.ordinal).confidencePct,
      changes: rowsByLevel[l.id] ?? [],
      onBack: () => setReviewingId(null),
      onSave: (rows: Change[], overrides: Record<string, Override>) => {
        setReviews((r) => ({
          ...r,
          [l.id]: { rows, overrides, complete: false },
        }));
        setReviewingId(null);
      },
      onConfirm: (rows: Change[], overrides: Record<string, Override>) => {
        setReviews((r) => ({
          ...r,
          [l.id]: { rows, overrides, complete: true },
        }));
        // **No auto-advance** (Olcay's answer 3): completing one level leaves the others exactly
        // where they are, so somebody who wants to stop after one can. This is the single place
        // the wizard deliberately does not copy step 3's alignment cycle, which does advance.
        setReviewingId(null);
      },
      levels: {
        currentId: l.id,
        items: levels
          .filter((x) => x.phase === "ready" && levelIssueCount(x.ordinal) > 0)
          .sort((a, b) => b.index - a.index)
          .map((x) => ({
            id: x.id,
            label: `${x.short} — ${x.long}`,
            issues: levelIssueCount(x.ordinal),
            done: !!reviews[x.id]?.complete,
          })),
        onPick: (id: number) => setReviewingId(id),
      },
    };
  }, [levels, reviews, reviewingId, rowsByLevel]);

  const alignBody = (
    <div
      style={{
        marginTop: 10,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div>
        <div
          style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}
          title={ALIGN_COPY.referenceHint}
        >
          ● {ALIGN_COPY.reference}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Select
              value={String(reference?.id ?? "")}
              onValueChange={(v) => changeReference(Number(v))}
            >
              <SelectTrigger aria-label={ALIGN_COPY.reference}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {levels.map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    {l.short} — {l.long}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* the reference's opacity, so you can see the level you're moving underneath it.
              NB the width is inline, not a Tailwind class: this app has no Tailwind build of its
              own — it inherits the DS's compiled sheet, so an arbitrary class like `w-[72px]`
              simply doesn't exist and the control collapses to nothing. */}
          <div style={{ width: 76, flex: "0 0 auto" }}>
            <Slider
              min={0.2}
              max={1}
              step={0.05}
              value={[refOpacity]}
              onValueChange={([v]) => setRefOpacity(v)}
              aria-label="Reference opacity"
            />
          </div>
        </div>
      </div>
      {others.length > 0 && current && (
        <div>
          <div
            style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}
            title={ALIGN_COPY.toAlignHint}
          >
            ● {ALIGN_COPY.toAlign}{" "}
            <span
              style={{
                background: aligned.has(current.id)
                  ? "var(--primitives-colors-emotional-success-0)"
                  : "#fff7e0",
                border: `1px solid ${aligned.has(current.id) ? "var(--primitives-colors-emotional-success-200)" : "#edc759"}`,
                borderRadius: 999,
                padding: "0 8px",
                fontSize: 10,
              }}
            >
              {others.findIndex((l) => l.id === current.id) + 1} of{" "}
              {others.length}
            </span>
          </div>
          <Select
            value={String(current.id)}
            onValueChange={(v) => setAlignCurrent(Number(v))}
          >
            <SelectTrigger aria-label={ALIGN_COPY.toAlign}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {others.map((l) => (
                <SelectItem key={l.id} value={String(l.id)}>
                  {l.short} — {l.long}
                  {aligned.has(l.id) ? " ✓" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {others.length === 0 && (
        <div style={{ fontSize: 12, color: MUTED }}>
          One level only — nothing to align.
        </div>
      )}
      {!alignDone && (
        <button style={SKIP_STYLE} onClick={() => setAlignSkipped(true)}>
          ⊘ {ALIGN_COPY.skip}
        </button>
      )}
    </div>
  );

  const fineBody = (
    <div
      style={{
        marginTop: 10,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div>
        <div
          style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}
          title={FINETUNE_COPY.referenceHint}
        >
          ● Reference Level
        </div>
        <div
          style={{
            padding: "8px 10px",
            borderRadius: 8,
            border: `1px solid ${LINE}`,
            fontSize: 12,
            color: MUTED,
          }}
          title={FINETUNE_COPY.referenceHint}
        >
          {reference ? `${reference.short} — ${reference.long}` : "—"}
        </div>
      </div>
      {!fineDone && (
        <button style={SKIP_STYLE} onClick={() => setFineSkipped(true)}>
          ⊘ {FINETUNE_COPY.skip}
        </button>
      )}
    </div>
  );

  /**
   * Preview = **the building's tiles + a level list** (Olcay's answer 5).
   *
   * The three tiles stay building-level and are now summed from the levels; the list beneath them
   * is where per-level work happens. **"N of M reviewed" goes on the list header, not into a fourth
   * tile**: the tiles describe the *building*, that number describes *your progress*, and mixing
   * them makes the tiles mean less.
   */
  const previewBody = (
    <div
      style={{
        marginTop: 10,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        {[
          [
            `${stats.surface} ${PREVIEW_LABELS.surfaceUnit}`,
            PREVIEW_LABELS.surfaceLabel,
          ],
          [stats.duration, PREVIEW_LABELS.durationLabel],
          [stats.confidence, PREVIEW_LABELS.confidenceLabel],
        ].map(([v, l]) => (
          <div
            key={l}
            style={{
              flex: 1,
              border: `1px solid ${LINE}`,
              borderRadius: 8,
              padding: "8px 10px",
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--review-ink)",
              }}
            >
              {v}
            </div>
            <div style={{ fontSize: 10, color: MUTED, lineHeight: 1.3 }}>
              {l}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          marginTop: 2,
        }}
      >
        <span
          style={{ fontSize: 12, fontWeight: 700, color: "var(--review-ink)" }}
        >
          Levels
        </span>
        <span style={{ flex: 1 }} />
        {reviewable.length > 0 && (
          <span style={{ fontSize: 11, color: MUTED }}>
            {reviewedCount} of {reviewable.length} reviewed
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {sortedLevels.map((l) => {
          const s = stateOf(l);
          const issues = levelIssueCount(l.ordinal);
          const selected = previewLevelId === l.id;
          return (
            <div
              key={l.id}
              /* Selecting a level switches the map to it — the map shows one level at a time, and
                 this is the same shared-selection pattern the changelog and map already use. */
              onClick={() => setPreviewLevelId(l.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                border: `1px solid ${selected ? "var(--primitives-colors-theme-500)" : LINE}`,
                boxShadow: selected
                  ? "0 0 0 3px var(--primitives-colors-theme-0)"
                  : "none",
                borderRadius: 8,
                padding: "6px 8px",
                cursor: "pointer",
                background: "#fff",
              }}
            >
              <span
                style={{
                  width: 18,
                  textAlign: "right",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--review-ink)",
                  flex: "0 0 auto",
                }}
              >
                {l.index}
              </span>
              {/* The thumb keeps its own tap-to-enlarge, and must not ALSO select the row — one
                  press was opening the lightbox and switching the map underneath it. */}
              <span
                onClick={(e) => e.stopPropagation()}
                style={{ display: "flex", flex: "0 0 auto" }}
              >
                <FloorPlanThumb file={l.file} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--review-ink)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {l.short} · {l.long}
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    lineHeight: 1.3,
                    color:
                      s === "failed"
                        ? "var(--primitives-colors-emotional-danger-600)"
                        : s === "awaiting" || s === "in-review"
                          ? "var(--primitives-colors-emotional-alert-900)"
                          : MUTED,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {levelStateLabel(s, issues, editedOf(l))}
                </div>
              </div>
              {/* Zero-issue and failed levels offer no way in: there is nothing to confirm on one
                  and nothing to confirm *from* on the other. */}
              {(s === "awaiting" || s === "in-review" || s === "reviewed") && (
                <Button
                  size="sm"
                  variant={s === "reviewed" ? "ghost" : "outline"}
                  style={{ flex: "0 0 auto" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setReviewingId(l.id);
                  }}
                >
                  {s === "reviewed" ? "Reopen" : "Review"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ── right-side areas per step ──────────────────────────────────────────── */

  const levelsArea = (
    <div
      style={{ position: "absolute", inset: 0, overflow: "auto", padding: 24 }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        addFiles(Array.from(e.dataTransfer.files ?? []).map((f) => f.name));
      }}
    >
      <input
        ref={fileInput}
        type="file"
        multiple
        accept=".dwg,.dxf,.pdf,.geojson,.json"
        style={{ display: "none" }}
        onChange={(e) => {
          addFiles(Array.from(e.target.files ?? []).map((f) => f.name));
          e.target.value = "";
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: 600, color: INK }}>
          Levels
        </Text>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: MUTED }}>
          Auto Mapping {autoMapping ? "On" : "Off"}
        </span>
        <Switch
          checked={autoMapping}
          onCheckedChange={setAutoMapping}
          aria-label="Auto Mapping"
          wrapperClassName="w-auto shrink-0"
        />
      </div>
      <div
        onClick={() => fileInput.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? "#346df1" : "var(--primitives-colors-theme-200)"}`,
          background: dragOver ? "rgba(241,245,254,.9)" : "#f7f9ff",
          borderRadius: 12,
          padding: "18px 20px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          cursor: "pointer",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 13,
            color: "var(--primitives-colors-theme-700)",
            fontWeight: 600,
            flex: "0 0 auto",
          }}
        >
          <Icon name="plus" /> Add new level(s)
        </div>
        <div style={{ fontSize: 12, color: MUTED, flex: 1 }}>
          <b>{LEVEL_DROP_COPY.title}</b> {LEVEL_DROP_COPY.detail}
        </div>
        <div
          style={{
            fontSize: 11,
            color: MUTED,
            flex: "0 0 auto",
            maxWidth: 200,
          }}
        >
          {LEVEL_DROP_COPY.types}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[...levels]
          .sort((a, b) => b.index - a.index)
          .map((l) =>
            editing === l.id ? (
              /* ── edit state (design 2007:17095): the row becomes the level's form ──────
               Two deliberate rows rather than a wrap: the file and its type belong together,
               then the level's own identity (index · short · long · external id). Widths are
               sized to their CONTENT — an index is 1–3 characters, a short name two, so neither
               deserves the space a file path does (Olcay, 2026-08-11: "inputs widths should be
               optimised"). The right column runs full height: confirm/cancel at the top, the two
               level actions in the bottom corner, as the frame draws them. */
              <div
                key={l.id}
                style={{
                  border: `1px solid ${LINE}`,
                  borderRadius: 10,
                  background: "#fff",
                  padding: "14px 16px",
                  display: "flex",
                  gap: 16,
                  alignItems: "stretch",
                }}
              >
                <div style={{ paddingTop: 22, flex: "0 0 auto" }}>
                  <FloorPlanThumb file={draft?.file ?? l.file} />
                </div>
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      width: "100%",
                    }}
                  >
                    {/* capped: a file name is ~24 characters, so letting it flex to the pane's full
                      width just stretched one input across 560px of empty space */}
                    <div
                      style={{ flex: "1 1 auto", minWidth: 0, maxWidth: 340 }}
                    >
                      <Input
                        label="Floor-plan File"
                        value={draft?.file ?? ""}
                        onChange={(e) =>
                          setDraft((d) =>
                            d ? { ...d, file: e.target.value } : d,
                          )
                        }
                      />
                    </div>
                    <div style={{ flex: "0 0 190px" }}>
                      <FieldWrapper label="Level Type" inputId={`lt-${l.id}`}>
                        <Select
                          value={draft?.sector ?? WIZARD_SECTOR_KEY}
                          onValueChange={(v) =>
                            setDraft((d) => (d ? { ...d, sector: v } : d))
                          }
                        >
                          <SelectTrigger
                            id={`lt-${l.id}`}
                            aria-label="Level Type"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PICKER_SECTORS.map((sec) =>
                              sec.subsectors.length ? (
                                <SelectGroup key={sec.name}>
                                  <SelectLabel title={sec.description}>
                                    {sec.name}
                                  </SelectLabel>
                                  {sec.subsectors.map((sub) => (
                                    <SelectItem
                                      key={sub.name}
                                      value={sectorKey(sec.name, sub.name)}
                                      title={sub.description}
                                    >
                                      {sub.name}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              ) : (
                                <SelectItem
                                  key={sec.name}
                                  value={sectorKey(sec.name)}
                                  title={sec.description}
                                >
                                  {sec.name}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </FieldWrapper>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      width: "100%",
                    }}
                  >
                    <div style={{ flex: "0 0 88px" }}>
                      <Input
                        label="Level Index"
                        type="number"
                        value={String(draft?.index ?? 0)}
                        onChange={(e) =>
                          setDraft((d) =>
                            d ? { ...d, index: Number(e.target.value) } : d,
                          )
                        }
                      />
                    </div>
                    <div style={{ flex: "0 0 104px" }}>
                      <Input
                        label="Short Name"
                        value={draft?.short ?? ""}
                        onChange={(e) =>
                          setDraft((d) =>
                            d ? { ...d, short: e.target.value } : d,
                          )
                        }
                      />
                    </div>
                    <div
                      style={{ flex: "1 1 auto", minWidth: 0, maxWidth: 300 }}
                    >
                      <Input
                        label="Long Name"
                        value={draft?.long ?? ""}
                        onChange={(e) =>
                          setDraft((d) =>
                            d ? { ...d, long: e.target.value } : d,
                          )
                        }
                      />
                    </div>
                    <div style={{ flex: "0 0 178px" }}>
                      <Input
                        label="External Identifier"
                        value={draft?.extId ?? ""}
                        placeholder="1234567890abc"
                        onChange={(e) =>
                          setDraft((d) =>
                            d ? { ...d, extId: e.target.value } : d,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    gap: 12,
                    flex: "0 0 auto",
                  }}
                >
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button size="sm" variant="outline" onClick={cancelEdit}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={confirmEdit}>
                      Confirm
                    </Button>
                  </div>
                  {/* bottom corner, side by side — where the frame puts them */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 16 }}
                  >
                    <button
                      onClick={() =>
                        setDraft((d) => (d ? { ...d, isDefault: true } : d))
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        fontSize: 12,
                        whiteSpace: "nowrap",
                        padding: 0,
                        color: draft?.isDefault
                          ? "var(--primitives-colors-theme-700)"
                          : MUTED,
                      }}
                    >
                      <Star filled={!!draft?.isDefault} /> Make Default
                    </button>
                    <button
                      onClick={() => removeLevel(l.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        fontSize: 12,
                        whiteSpace: "nowrap",
                        padding: 0,
                        color: "var(--primitives-colors-emotional-danger-600)",
                      }}
                    >
                      <Icon name="trash-01" /> Remove Level
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ── read state (design 2164:19545) ──────────────────────────────────────── */
              <div
                key={l.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  border: `1px solid ${LINE}`,
                  borderRadius: 10,
                  background: "#fff",
                  padding: "10px 14px",
                }}
              >
                <span
                  style={{
                    width: 24,
                    textAlign: "right",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--review-ink)",
                  }}
                >
                  {l.index}
                </span>
                <FloorPlanThumb file={l.file} />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--review-ink)",
                    width: 34,
                  }}
                >
                  {l.short}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--review-ink)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {l.long}
                    </span>
                    {l.isDefault && (
                      <span
                        title="Default level — the map opens here"
                        style={{
                          flex: "0 0 auto",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <Star filled />
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: MUTED,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {l.extId ? `External Identifier: ${l.extId}` : l.file}
                  </div>
                </div>
                {/* the Level Type, as the design's tag rather than a repeat of the file name */}
                <span
                  style={{
                    flex: "0 0 auto",
                    fontSize: 11,
                    borderRadius: 999,
                    padding: "1px 10px",
                    color: "var(--primitives-colors-theme-700)",
                    border: "1px solid var(--primitives-colors-theme-200)",
                    background: "var(--primitives-colors-theme-0)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {sectorLabel(l.sector)}
                </span>
                {/*
                The Level Manager is a way IN to the review, not just a report of it (§18: both
                surfaces, one screen) — and the way in is the status card's own `primary` slot,
                which exists for exactly this ("the one state that needs a real button: review the
                detected changes"). A standalone button beside the card cost the row 85px it hasn't
                got: the level's long name is the only flexible column, so it was the one that paid,
                and at 1280px it was crushed to nothing.
              */}
                <div style={{ width: 288, flex: "0 0 auto" }}>
                  <AiMappingStatus {...levelCardFor(l)} />
                </div>
                {/* the edit affordance the design puts at the end of every row */}
                <IconButton
                  variant="ghost"
                  size="sm"
                  aria-label={`Edit ${l.long}`}
                  title="Edit level"
                  onClick={() => startEdit(l)}
                  style={{ flex: "0 0 auto" }}
                >
                  <Icon name="edit-01" />
                </IconButton>
              </div>
            ),
          )}
        {levels.length === 0 && (
          <div
            style={{
              fontSize: 12.5,
              color: MUTED,
              textAlign: "center",
              padding: 30,
            }}
          >
            No levels yet — drop floor-plan files above to create them.
          </div>
        )}
      </div>
    </div>
  );

  const alignArea = (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        // the alignment happens in floor-plan space, not on the earth — the design draws a dot grid
        backgroundImage: "radial-gradient(#c9cedb 1px, transparent 1px)",
        backgroundSize: "22px 22px",
        backgroundColor: "#eef0f6",
      }}
    >
      {reference && (
        <img
          src="/floorplan-preview.png"
          alt=""
          draggable={false}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 560,
            transform: "translate(-50%, -50%)",
            opacity: refOpacity,
            filter: "sepia(1) saturate(8) hue-rotate(320deg)",
            pointerEvents: "none",
          }}
        />
      )}
      {current && (
        <div
          onPointerDown={(e) => {
            if (aligned.has(current.id)) return;
            const t = alignT[current.id] ?? IDENTITY;
            startDrag(e, (dx, dy) =>
              setAlignT((m) => ({
                ...m,
                [current.id]: { ...t, x: t.x + dx, y: t.y + dy },
              })),
            );
          }}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 560,
            transform: `translate(calc(-50% + ${(alignT[current.id] ?? IDENTITY).x}px), calc(-50% + ${(alignT[current.id] ?? IDENTITY).y}px)) rotate(${(alignT[current.id] ?? IDENTITY).rot}deg)`,
            cursor: aligned.has(current.id) ? "default" : "move",
            touchAction: "none",
          }}
        >
          <img
            src="/floorplan-preview.png"
            alt=""
            draggable={false}
            style={{
              width: "100%",
              display: "block",
              opacity: 0.85,
              filter: aligned.has(current.id)
                ? "sepia(1) saturate(6) hue-rotate(90deg)"
                : "sepia(1) saturate(8) hue-rotate(180deg)",
            }}
          />
          {!aligned.has(current.id) && (
            <div
              title="Drag to rotate"
              onPointerDown={(e) => {
                const box = (
                  e.currentTarget.parentElement as HTMLElement
                ).getBoundingClientRect();
                const cx = box.left + box.width / 2;
                const cy = box.top + box.height / 2;
                const t = alignT[current.id] ?? IDENTITY;
                const a0 = Math.atan2(e.clientY - cy, e.clientX - cx);
                startDrag(e, (_dx, _dy, ev) => {
                  const a = Math.atan2(ev.clientY - cy, ev.clientX - cx);
                  setAlignT((m) => ({
                    ...m,
                    [current.id]: {
                      ...t,
                      rot: t.rot + ((a - a0) * 180) / Math.PI,
                    },
                  }));
                });
              }}
              style={{
                position: "absolute",
                left: "50%",
                top: -28,
                transform: "translateX(-50%)",
                width: 16,
                height: 16,
                borderRadius: 8,
                border: "2px solid var(--primitives-colors-theme-700)",
                background: "#fff",
                cursor: "grab",
              }}
            />
          )}
        </div>
      )}
      {/* the chip: Modify re-opens a confirmed level; Confirm freezes it and advances the cycle */}
      {current && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 20,
            transform: "translateX(-50%)",
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,.16)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
          }}
          title={ALIGN_COPY.confirmTip}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--review-ink)",
            }}
          >
            {ALIGN_COPY.chip}
          </span>
          {aligned.has(current.id) ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setAligned((s) => {
                  const n = new Set(s);
                  n.delete(current.id);
                  return n;
                })
              }
            >
              <Icon name="edit-01" /> Modify
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                setAligned((s) => new Set(s).add(current.id));
                const next = others.find(
                  (l) => l.id !== current.id && !aligned.has(l.id),
                );
                if (next) setAlignCurrent(next.id);
              }}
            >
              <Icon name="check" /> Confirm
            </Button>
          )}
        </div>
      )}
      {!alignDone && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1F2328",
            color: "#fff",
            fontSize: 11.5,
            borderRadius: 8,
            padding: "6px 12px",
            maxWidth: 420,
            textAlign: "center",
          }}
        >
          {ALIGN_COPY.gateTip}
        </div>
      )}
    </div>
  );

  const lat = (y: number) => (25.2528 - y * 0.00001).toFixed(7);
  const lng = (x: number) => (55.3644 + x * 0.00001).toFixed(7);

  const fineArea = (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <PointrMap changes={NO_CHANGES} />
      {/* the reference floor riding the earth: 2Dot = anchors steer it, Transform = drag the plan */}
      <div
        onPointerDown={(e) => {
          if (fineConfirmed || tool !== "transform") return;
          const t = fineT;
          startDrag(
            e,
            (dx, dy) => setFineT({ ...t, x: t.x + dx, y: t.y + dy }),
            commit,
          );
        }}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 520,
          transform: `translate(calc(-50% + ${fineT.x}px), calc(-50% + ${fineT.y}px)) rotate(${fineT.rot}deg)`,
          cursor: fineConfirmed
            ? "default"
            : tool === "transform"
              ? "move"
              : "default",
          touchAction: "none",
          zIndex: 3,
        }}
      >
        <img
          src="/floorplan-preview.png"
          alt=""
          draggable={false}
          style={{
            width: "100%",
            display: "block",
            opacity: 0.55,
            filter: "sepia(1) saturate(8) hue-rotate(180deg)",
          }}
        />
        {!fineConfirmed &&
          tool === "2dot" &&
          (["a", "b"] as const).map((k) => {
            const x = k === "a" ? anchors.ax : anchors.bx;
            const y = k === "a" ? anchors.ay : anchors.by;
            return (
              <div
                key={k}
                onPointerDown={(e) => {
                  const t0 = fineT;
                  const a0 = anchors;
                  startDrag(
                    e,
                    (dx, dy) => {
                      if (pinned) {
                        // pinned to the floorplan: the anchor repositions ON the plan; the plan holds
                        setAnchors(
                          k === "a"
                            ? { ...a0, ax: a0.ax + dx, ay: a0.ay + dy }
                            : { ...a0, bx: a0.bx + dx, by: a0.by + dy },
                        );
                      } else if (k === "a") {
                        // anchor A carries the plan (translate)…
                        setFineT({ ...t0, x: t0.x + dx, y: t0.y + dy });
                      } else {
                        // …anchor B swings it around A (rotate) — the "simple math" 2-dot align
                        const a1 = Math.atan2(a0.by - a0.ay, a0.bx - a0.ax);
                        const a2 = Math.atan2(
                          a0.by - a0.ay + dy,
                          a0.bx - a0.ax + dx,
                        );
                        setFineT({
                          ...t0,
                          rot: t0.rot + ((a2 - a1) * 180) / Math.PI,
                        });
                      }
                    },
                    commit,
                  );
                }}
                title={`Anchor ${k.toUpperCase()}`}
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  transform: "translate(-50%, -50%)",
                  background: "#fff",
                  border: "3px solid var(--primitives-colors-theme-700)",
                  cursor: "grab",
                  boxShadow: "0 1px 4px rgba(0,0,0,.3)",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: 20,
                    top: -4,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--primitives-colors-theme-700)",
                  }}
                >
                  {k.toUpperCase()}
                </span>
              </div>
            );
          })}
      </div>
      {/* the anchor card (top-right, per the frame) */}
      {!fineConfirmed && tool === "2dot" && (
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            zIndex: 4,
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 2px 10px rgba(0,0,0,.18)",
            padding: "10px 12px",
            width: 250,
          }}
        >
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: "var(--review-ink)",
            }}
          >
            {FINETUNE_COPY.anchorsTitle}
          </div>
          <div
            style={{
              fontSize: 11,
              color: MUTED,
              lineHeight: 1.35,
              margin: "2px 0 8px",
            }}
          >
            {FINETUNE_COPY.anchorsDetail}
          </div>
          <Checkbox
            checked={pinned}
            onCheckedChange={(c) => setPinned(c === true)}
            label={FINETUNE_COPY.pinned}
          />
          {(["a", "b"] as const).map((k) => {
            const x = k === "a" ? anchors.ax : anchors.bx;
            const y = k === "a" ? anchors.ay : anchors.by;
            return (
              <div
                key={k}
                style={{
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    background: "var(--primitives-colors-theme-700)",
                    color: "#fff",
                    fontSize: 10,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {k.toUpperCase()}
                </span>
                <div style={{ flex: 1, fontSize: 10.5, color: MUTED }}>
                  <div>
                    {pinned ? "X" : "latitude"}:{" "}
                    <b style={{ color: "var(--review-ink)" }}>
                      {pinned ? Math.round(x) : lat(y + fineT.y)}
                    </b>
                  </div>
                  <div>
                    {pinned ? "Y" : "longitude"}:{" "}
                    <b style={{ color: "var(--review-ink)" }}>
                      {pinned ? Math.round(y) : lng(x + fineT.x)}
                    </b>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!fineConfirmed && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1F2328",
            color: "#fff",
            fontSize: 11.5,
            borderRadius: 8,
            padding: "6px 12px",
            zIndex: 4,
          }}
        >
          {FINETUNE_COPY.toast}
        </div>
      )}
      {/* the toolbar chip (Modify expands it in the frame; here it is always the toolbar) */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 20,
          transform: "translateX(-50%)",
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,.16)",
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "8px 12px",
          zIndex: 4,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--review-ink)",
            marginRight: 6,
          }}
        >
          {FINETUNE_COPY.chip}
        </span>
        {fineConfirmed ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setFineConfirmed(false)}
          >
            <Icon name="edit-01" /> Modify
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              variant={tool === "2dot" ? "default" : "ghost"}
              onClick={() => setTool("2dot")}
            >
              2Dot Align
            </Button>
            <Button
              size="sm"
              variant={tool === "transform" ? "default" : "ghost"}
              onClick={() => setTool("transform")}
            >
              Transform
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={histAt <= 0}
              onClick={() => restore(histAt - 1)}
            >
              Undo
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={histAt >= history.length - 1}
              onClick={() => restore(histAt + 1)}
            >
              Redo
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAnchors(ANCHORS_HOME);
                anchorsRef.current = ANCHORS_HOME;
                commit();
              }}
            >
              Clear
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setFineT(IDENTITY);
                fineRef.current = IDENTITY;
                commit();
              }}
            >
              Reset
            </Button>
            <Button size="sm" onClick={() => setFineConfirmed(true)}>
              <Icon name="check" /> Confirm
            </Button>
          </>
        )}
      </div>
    </div>
  );

  /**
   * The Preview map follows the level list's selection — the map shows one level at a time, so a
   * list beside it that doesn't move it is a list of names.
   *
   * ⚠️ **Honest limit:** a building that doesn't exist yet has no tiles of its own, so what
   * actually switches is the demo site's floor of the same index — the same stand-in the align and
   * fine-tune steps make with one floor-plan image. The correspondence is real; the geometry under
   * it is borrowed until the API can serve a created building's own. A level whose index the demo
   * building hasn't got is refused instantly by the map's `targetExists()`, not spun on.
   */
  const previewTarget = useMemo(
    () =>
      previewLevel ? { building: T3_ID, level: previewLevel.index } : undefined,
    [previewLevel?.index],
  );
  const previewArea = (
    <div style={{ position: "absolute", inset: 0 }}>
      <PointrMap changes={NO_CHANGES} target={previewTarget} />
    </div>
  );

  /* ── the wizard's review sequence = the Manual Review screen, creation mode ──
     (Olcay, 2026-08-11: "exactly the same as user review") — MapScale's guesses as rows with
     the ✓/🚩/✗ decisions, the magnitude block carrying confidence, no fate strip, wizard exits.

     It reviews ONE LEVEL at a time (§18) — the level named in the header is the level whose
     guesses are listed, where it used to be the alignment *reference* level whatever you had
     opened. Deliberately NOT keyed on the level: keeping one mounted instance is what lets
     decisions taken on a level survive stepping away to another and back, since every row id
     carries its own level. */
  if (creationCtx && reviewingLevel) {
    return (
      <ManualReview
        level={{
          building: name.trim() || "New Building",
          buildingId: "",
          index: reviewingLevel.index,
          name: reviewingLevel.long,
          short: reviewingLevel.short,
        }}
        creation={creationCtx}
      />
    );
  }

  /* ── the wizard frame ───────────────────────────────────────────────────── */

  return (
    <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
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
        {/* Header outside the scroll area — the ✕ must not move with a scrollbar or scroll off
            the top of the panel (see PANEL_PAD). */}
        <div style={{ padding: PANEL_PAD }}>
          <PanelHeader
            title={initial ? "Edit Building" : "New Building"}
            subtitle="Add a building to facilitate detailed indoor navigation and POI management across multiple levels."
            onClose={onClose}
            closeLabel={initial ? "Close building editor" : "Close wizard"}
          />
        </div>
        <div style={{ padding: "0 20px 8px", overflow: "auto", flex: 1 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginTop: 6,
            }}
          >
            {WIZARD_STEPS.map((s) => (
              <StepRow
                key={s.key}
                n={s.n}
                title={s.title}
                blurb={s.blurb}
                state={
                  step === s.key
                    ? "current"
                    : canEnter(s.key) && complete[s.key]
                      ? "done"
                      : canEnter(s.key)
                        ? "idle"
                        : "locked"
                }
                onClick={() => canEnter(s.key) && setStep(s.key)}
              >
                {s.key === "metadata" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      marginTop: 10,
                    }}
                  >
                    <Input
                      label="Building Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Terminal D"
                    />
                    <Input
                      label="External Identifier"
                      value={extId}
                      onChange={(e) => setExtId(e.target.value)}
                      placeholder="DXB-TD"
                    />
                  </div>
                )}
                {s.key === "levels" && (
                  <div style={{ marginTop: 10 }}>
                    <div
                      style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}
                    >
                      {levels.length === 0
                        ? "Drop floor-plan files on the right to create levels."
                        : `${levels.length} level${levels.length > 1 ? "s" : ""} · ${levels.filter((l) => l.phase === "ready").length} ready`}
                    </div>
                  </div>
                )}
                {s.key === "align" && alignBody}
                {s.key === "finetune" && fineBody}
                {s.key === "preview" && previewBody}
              </StepRow>
            ))}
          </div>
        </div>
        {/* the drawer's bottom carries the one advancing action (design 2007:24419: Continue,
            right-aligned; the header ✕ is the only cancel — Olcay's standing rule) */}
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "12px 20px",
            borderTop: `1px solid ${LINE}`,
            justifyContent: "flex-end",
          }}
        >
          {step === "preview" ? (
            <Button onClick={save} disabled={!metadataDone || !levelsDone}>
              Save
            </Button>
          ) : (
            <span
              title={unsavedRow && step === "levels" ? UNSAVED_TIP : undefined}
            >
              <Button
                disabled={!complete[step]}
                onClick={() => setStep(order[order.indexOf(step) + 1])}
              >
                Continue
              </Button>
            </span>
          )}
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
        {(step === "metadata" || step === "levels") && levelsArea}
        {step === "align" && alignArea}
        {step === "finetune" && fineArea}
        {step === "preview" && previewArea}
      </div>

      {/*
        Save **warns, never blocks** (Olcay's answer 1): creation isn't publication, so an
        unreviewed level is a thing to come back to, not a gate. It says where to come back to it,
        because after Save the wizard is gone and the level's own editor is the way in.
      */}
      <ConfirmOverlay
        open={saveWarnOpen}
        tone="info"
        title={`Save with ${unreviewed.length} level${unreviewed.length === 1 ? "" : "s"} still to review?`}
        confirmLabel="Save building"
        onCancel={() => setSaveWarnOpen(false)}
        onConfirm={() => {
          setSaveWarnOpen(false);
          createBuilding();
        }}
      >
        {/*
          Where "later" actually is, said precisely. It is NOT the level's own editor: that screen
          reviews a floor-plan against a published one, and a level created a minute ago has no
          such baseline — the creation guesses live in the wizard. Re-entering it through the tree
          reads back what has been reviewed already, so the unreviewed levels are waiting exactly
          as they were left.
        */}
        {`${unreviewed.map((l) => l.short).join(", ")} still ${unreviewed.length === 1 ? "has" : "have"} MapScale's guesses unconfirmed. The building is created either way — nothing publishes — and you can pick these up later from Map Content: the building's ⋯ menu → Edit building.`}
      </ConfirmOverlay>
    </div>
  );
}
