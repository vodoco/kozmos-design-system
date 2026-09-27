import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Text,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kozmos-ds/react";
import { ChangeGroupBlock } from "../ui/ChangeGroup";
import { FeaturePanel, FEATURE_PANEL_WIDTH } from "../ui/FeaturePanel";
import { typeLabel } from "../mock/taxonomy";
import { propertyLabel } from "../mock/properties";
import { ChevronLeft, ChevronRight } from "../ui/icons";
import {
  GeometryToolbar,
  type GeomCommand,
  type GeomState,
} from "../ui/GeometryToolbar";
import { ChangeReviewRow, WarningGlyph } from "../ui/ChangeReviewRow";
import { overrideDetails } from "../mock/overrideLines";
import { ConfirmOverlay } from "../ui/ConfirmOverlay";
import { PANEL_WIDTH } from "../ui/Chrome";
import { MapSettings } from "../ui/MapSettings";
import { PANEL_PAD, PanelHeader } from "../ui/PanelHeader";
import PointrMap, { type MapPrefs, type MapLevel } from "../map/PointrMap";
import { levelGeometry, type LevelGeometry } from "../cloud/levelFeatures";
import type { LevelRef } from "./MapContent";
import {
  seedChanges,
  magnitudeBand,
  bindToFloor,
  buildSections,
  inMetric,
  BAND,
  GRACE_DAYS,
  METRIC_COLOR,
  METRIC_LABEL,
  METRIC_ORDER,
  RED_CAUSE_COPY,
  type Change,
  type Decision,
  seedVersions,
  type MagnitudeBand,
  type RedCause,
  WARNING_LABEL,
  SEEDED_OVERRIDES,
  type FloorWarning,
  type Override,
} from "../mock/diff";
import {
  getLevelVersions,
  getReviewOutcome,
  levelKey,
  setLevelVersions,
  setReviewOutcome,
} from "../mock/store";

const LINE = "#e3e4e8";
/** Stable identity — PointrMap re-posts whenever `changes` changes by reference. */
const NO_CHANGES: Change[] = [];

function MapChrome({
  prefs,
  onPrefs,
  focus,
}: {
  prefs: MapPrefs;
  onPrefs: (p: MapPrefs) => void;
  focus: boolean;
}) {
  // No legend: every colour on the map is named in the list beside it (NEW / UPDATED / REMOVED /
  // PRESERVED), and the ✓ 🚩 ✗ marks are keyed by the tally under the magnitude block.
  // Focus lives here and nowhere else: it exists to get noise out from between you and the diff —
  // so cause B's review, which has no diff, doesn't offer it (§3).
  return <MapSettings prefs={prefs} onChange={onPrefs} focus={focus} />;
}

export function ManualReview({
  level: target,
  magnitudePct,
  redCause,
  onClose,
  onCompare,
  creation,
  floorWarnings,
}: {
  level?: LevelRef | null;
  /**
   * The job's post-expert modified-area %, when the caller knows it — the editor does, the tree
   * path derives it from the same seed. Absent for red cause B, which has no reliable ratio.
   */
  magnitudePct?: number;
  /** Why red isn't the band's arithmetic: `cannot-match` reviews without a % (US5 cause B). */
  redCause?: RedCause;
  onClose?: () => void;
  /** Opens Version History in Compare mode — cause B's review is the one that needs it. */
  onCompare?: () => void;
  /**
   * Whole-floor conditions (D16) — US10's georeference shift, US7's size edge cases. They render
   * as a notice ABOVE the changelog because they scope every row beneath them; hanging them off a
   * single change was the bug this prop exists to end.
   */
  floorWarnings?: FloorWarning[];
  /**
   * The Building wizard's review sequence rides THIS screen (Olcay, 2026-08-11: "exactly the
   * same as user review"): MapScale's guesses arrive as changes, the magnitude block carries the
   * run's confidence (a new building has no baseline to diff), there is no fate strip (Save =
   * created, not live — decision from the wizard scoping), and the footer returns to the wizard.
   */
  creation?: {
    confidencePct: number;
    changes: Change[];
    onBack: () => void;
    /**
     * Save — hands the DECIDED ROWS back without concluding, so the level reads **In review** and
     * the user can come back to it. Same intention, same word and same pair of buttons as the
     * update flow (Olcay, 2026-08-11); creation's Save just has nothing to hold out of publishing,
     * because nothing publishes here.
     */
    onSave: (rows: Change[], overrides: Record<string, Override>) => void;
    /**
     * Complete review — concludes this LEVEL. Hands the decided rows back, not a count, so
     * reopening resumes where the user left off (the wizard owns them; this screen is remounted
     * each time). No confirmation overlay: the update flow's asks first because completing may
     * publish a site, and creation publishes nothing.
     */
    onConfirm: (rows: Change[], overrides: Record<string, Override>) => void;
    /**
     * The wizard reviews **one level at a time**, and moving between them is the wizard's own
     * "Level to Align, N of M" idiom rather than the map's `LevelSelector` — you are inside the
     * wizard, which taught that vocabulary two steps earlier (§18).
     *
     * Completing a level deliberately does **not** advance to the next one (Olcay's answer 3): the
     * others stay exactly where they are, so a user who wants to stop after one can.
     */
    levels?: {
      currentId: number;
      items: { id: number; label: string; issues: number; done: boolean }[];
      onPick: (id: number) => void;
    };
  };
}) {
  const pct = magnitudePct ?? 30;
  // Cause B has no ratio but the whole floor needs eyes, so it reads as the large band.
  // Creation reads minor: a 92%-confidence result is good news, and green is its colour.
  const bandKind: MagnitudeBand = creation
    ? "minor"
    : redCause
      ? "large"
      : magnitudeBand(pct);
  /**
   * Cause B reviews WITHOUT a changelog (Olcay, 2026-08-10 evening, ruling audit Q8): a changelog
   * IS a comparison against the published map, and matching is exactly what failed — so any
   * per-change list here would be invented. The whole floor gets eyes instead: inspect the map,
   * Compare against the published version, publish or re-upload wholesale. (It previously showed
   * the large change set as a stand-in.)
   */
  /**
   * What the map says is on this floor. The changelog binds to it (see `bindToFloor`), so the
   * list and the map describe the same place on every level — not just B2, whose features the
   * seeds were harvested from. Empty until the map reports; the seeded names stand in meanwhile.
   */
  const [floorFeatures, setFloorFeatures] = useState<string[]>([]);
  const onFeatures = useCallback(
    (names: string[]) => setFloorFeatures(names),
    [],
  );
  const matchFailed = redCause === "cannot-match";
  /**
   * Decision 9 in this screen's own voice: a >50% change is REJECTED, never reviewed. Every
   * caller already honours that (the tag carries no action, the card offers no Review), but the
   * screen used to have no guard of its own — hand it a bare 62% and it would have rendered a
   * full changelog under "publish when you're ready", contradicting the decision. Cause B is the
   * one large-band review that exists.
   */
  const rejectedByGuard =
    !creation && !redCause && magnitudeBand(pct) === "large";
  // The set scales with the declared magnitude — a 62% screen shows a remodel, not the 30% list.
  // Creation mode reviews MapScale's guesses instead of a diff.
  const initialChanges = useMemo(
    () =>
      bindToFloor(
        creation ? creation.changes : matchFailed ? [] : seedChanges(bandKind),
        floorFeatures,
      ),
    [creation, matchFailed, bandKind, floorFeatures],
  );
  const band = BAND[bandKind];
  /**
   * What happens to this version if nobody acts, and whether someone already intervened: Amber
   * counts down to an automatic publish (US4 — cancellable, or publish now); Red never publishes
   * itself but may be published at any time (US5). Local state only — persistence is Phase 2.
   */
  /**
   * `held` = this review was saved part-way, so the level is out of publishing until it is
   * completed (Olcay, 2026-08-11). Seeded on mount from the store, because reopening a held level
   * must not greet you with "publishes automatically in 6 days" — that countdown is suspended, and
   * saying otherwise would be the screen lying about the one thing it exists to tell you.
   */
  const [fate, setFate] = useState<
    "pending" | "published" | "cancelled" | "held"
  >(() => {
    if (creation || !target) return "pending";
    const key = levelKey(target.buildingId, target.index);
    const newestN = getLevelVersions(key, () =>
      seedVersions(target.short, target.index, target.buildingId),
    )[0]?.n;
    const saved = getReviewOutcome(key, newestN);
    return saved && !saved.complete ? "held" : "pending";
  });
  /** Save asks first — the consequence lives in the v9 confirmation overlay, not in a caption. */
  const [confirmOpen, setConfirmOpen] = useState(false);
  /**
   * Whole-floor notices rest COLLAPSED (Olcay, 2026-08-14: *"georeference and floor plan resized
   * takes too much space"*). Expanded they were **188px** — two paragraphs to read before the first
   * change is even visible, on a 440 panel. They are context for the list, not the work.
   *
   * Collapsed still **names them and says the list is unaffected**, because that is US10's whole
   * point; only the explanatory sentence folds away. A count alone ("2 notices") would have hidden
   * which conditions applied, which is the one thing a reviewer needs at a glance.
   */
  const [floorNoticesOpen, setFloorNoticesOpen] = useState(false);
  /**
   * **The reviewer's own values, keyed by change id** — what replaced the flag's note field.
   *
   * Seeded from the demo table first and the saved report second, so re-opening a part-way review
   * brings back what you edited exactly as `decisions` does. The demo table is narrowed to the ids
   * actually in this band: `SEEDED_OVERRIDES` is flat and global, and an override for a change
   * that is not on this floor would be an outcome nobody could see or revert.
   */
  const [overrides, setOverrides] = useState<Record<string, Override>>(() => {
    if (!target) return {};
    const key = levelKey(target.buildingId, target.index);
    const newest = getLevelVersions(key, () =>
      seedVersions(target.short, target.index, target.buildingId),
    )[0];
    const saved = getReviewOutcome(key, newest?.n)?.overrides;
    if (saved) return { ...saved };
    return {};
  });
  /**
   * Seed the demo overrides once the changes are known. A separate effect rather than an
   * initialiser, because `initialChanges` depends on what the **map** reports about the floor
   * (`bindToFloor`), which is not known at mount — the same reason `decisions` needs its own
   * gap-filling effect in creation mode.
   *
   * ⚠️ Fills gaps only. Overwriting would undo an edit the user has just made, and would resurrect
   * one they have just reverted — which is the worse of the two, because Revert would visibly not
   * work.
   */
  const seededOverrides = useRef(
    (() => {
      // Creation seeds nothing, and a level with no target has nothing to seed onto. A level that
      // already carries a **saved report** must not be seeded either: the demo overrides would
      // come back on top of a review someone has been through, resurrecting any they reverted —
      // and a Revert that visibly does not stick is worse than no demo at all.
      if (creation || !target) return true;
      const key = levelKey(target.buildingId, target.index);
      const newest = getLevelVersions(key, () =>
        seedVersions(target.short, target.index, target.buildingId),
      )[0];
      return !!getReviewOutcome(key, newest?.n);
    })(),
  );
  useEffect(() => {
    if (creation || seededOverrides.current || !initialChanges.length) return;
    const seed: Record<string, Override> = {};
    for (const c of initialChanges)
      if (SEEDED_OVERRIDES[c.id]) seed[c.id] = SEEDED_OVERRIDES[c.id];
    if (!Object.keys(seed).length) return;
    seededOverrides.current = true;
    setOverrides((p) => {
      const next = { ...p };
      let changed = false;
      for (const [id, o] of Object.entries(seed))
        if (!(id in next)) {
          next[id] = o;
          changed = true;
        }
      return changed ? next : p;
    });
  }, [creation, initialChanges]);
  // `preserved` is not a change to review — it carries no decision, and the group and section
  // controls filter it out themselves rather than the screen pre-computing a list.
  // keyed by id, so a rebind (which changes names, never ids) can't lose a decision
  const [decisions, setDecisions] = useState<
    Record<string, Decision | undefined>
  >(() => {
    const seeded = Object.fromEntries(
      initialChanges.map((c) => [c.id, c.decision]),
    );
    // Resume a review saved part-way. Version-matched, so a new upload starts clean rather than
    // inheriting decisions taken about a floor-plan that has since been replaced.
    if (creation || !target) return seeded;
    const key = levelKey(target.buildingId, target.index);
    const newestN = getLevelVersions(key, () =>
      seedVersions(target.short, target.index, target.buildingId),
    )[0]?.n;
    // version-matched by the key itself now: a newer upload simply has no report yet
    const saved = getReviewOutcome(key, newestN);
    if (!saved) return seeded;
    return { ...seeded, ...saved.decisions };
  });
  // memoised: this array is posted to the map, so a fresh identity each render would re-post it
  const changes: Change[] = useMemo(
    () => initialChanges.map((c) => ({ ...c, decision: decisions[c.id] })),
    [initialChanges, decisions],
  );
  /**
   * ⚠️ **The review map opens in FULL COLOUR** (Olcay, 2026-08-28: *"let's also make default
   * colorful not greyscale"*). Greyscale existed to make the coloured diff overlay legible against
   * the floor — and the overlay is not coloured any more, so desaturating the real map now costs
   * the floor and buys nothing. The toggle stays; only the default moved.
   */
  const [prefs, setPrefs] = useState<MapPrefs>({
    greyscale: false,
    hidePoiLabels: false,
    floorplan: true,
    basemap: "vector",
  });
  const [mapLevel, setMapLevel] = useState<MapLevel | null>(null);
  const onLevel = useCallback((l: MapLevel) => setMapLevel(l), []);
  /**
   * **The level's DRAFT geometry, so "Show Floor-plan" traces the plan being reviewed** (Olcay,
   * 2026-08-25: *"Show floor-plan shows the uploaded one… If the user wants to see the current
   * map's floor-plan they'd save and exit from review"*).
   *
   * Until now this screen fetched none, so the map shell fell back to `source_ptr` and the overlay
   * traced the **last publish** — precisely the floor-plan the ruling says you should have to leave
   * the review to see. `cloud/levelFeatures` fetches the **draft** scope, which is what the upload
   * became.
   *
   * ⚠️ **This does NOT swap the floor render.** The shell builds outline sources only and leaves
   * the tiles drawing the fills — see `fpMode` there. A review needs both sides of the diff on
   * screen: a removal is a feature the tiles have and the draft does not, so a floor drawn from the
   * draft alone would have nothing underneath the red shape.
   *
   * Empty until it arrives, and empty forever if it fails — in which case the overlay keeps doing
   * exactly what it did before, rather than the screen losing its floor-plan.
   */
  const [levelGeom, setLevelGeom] = useState<LevelGeometry[]>([]);
  /**
   * Whose name the header carries. **The passed level wins** (fixed 2026-08-11) — this screen has
   * no level switcher, so what it was opened for is what it reviews.
   *
   * It used to prefer `mapLevel`, on the principle that the map reports reality. That principle
   * belongs to screens where you can *change* level; here it silently lied, twice over: PointrMap
   * only reports boot and FAILED switches upward (successes are deliberately swallowed, see its
   * onMessage), so `mapLevel` stayed the iframe's hard-coded boot floor — reviewing Concourse A's
   * L4 read "Reviewing B2 | Departures - Terminal 3", and the wizard's creation review named the
   * demo building instead of the one being created. `mapLevel` survives only as the fallback for
   * a caller that passes no level at all.
   */
  const shown = {
    building: target?.building ?? mapLevel?.building ?? "",
    short: target?.short ?? mapLevel?.short ?? "",
    long: target?.name ?? mapLevel?.long ?? "",
  };
  // Open the map on the level actually being reviewed, not the map page's own default. Memoised
  // for the same reason `changes` is: PointrMap posts whenever this prop's identity changes, so an
  // inline object would re-target the map on every render.
  const mapTarget = useMemo(
    () =>
      target?.buildingId
        ? { building: target.buildingId, level: target.index }
        : undefined,
    [target?.buildingId, target?.index],
  );
  useEffect(() => {
    if (!mapTarget) return;
    let live = true;
    // Cleared first: leaving one floor's outline up while another loads would trace a plan that
    // belongs to the level you have just left.
    setLevelGeom([]);
    void levelGeometry(mapTarget.building, mapTarget.level).then((g) => {
      if (live) setLevelGeom(g);
    });
    return () => {
      live = false;
    };
  }, [mapTarget]);

  const setOne = (id: string, d: Decision | undefined) =>
    setDecisions((p) => ({ ...p, [id]: d }));
  /**
   * The map's pinned card decides through the SAME function the list rows use (Olcay, 2026-08-11:
   * *"I want to click on the markers on the map, see all options and change to something else"*).
   * One store of decisions, two ways in — which is what keeps the centroid badge, the row's
   * control and the tally from ever telling different stories.
   *
   * Stable identity: `PointrMap` re-subscribes when this changes, and an inline arrow would
   * re-register the listener on every render.
   */
  const onMapDecision = useCallback(
    (id: string, d: "confirm" | "reject" | null) => setOne(id, d ?? undefined),
    [],
  );

  /* ── editing ────────────────────────────────────────────────────────────────
   *
   * **The review page can now edit** (Olcay, 2026-08-25) — metadata in the row, geometry on the
   * map. The geometry half is the editor that already exists, armed from here: the same command
   * queue, the same `GeometryToolbar`, the same state messages that Map Content uses. Growing a
   * second editor inside the review would have been two editors to keep in step, and this screen
   * is the one place where a divergence would be invisible until it shipped.
   */
  /** Revert — the override is simply deleted, and MapScale's detected value is what is underneath. */
  const revertOverride = useCallback(
    (id: string) =>
      setOverrides((p) => {
        if (!(id in p)) return p;
        const next = { ...p };
        delete next[id];
        return next;
      }),
    [],
  );
  /**
   * **Revert on an ordinary row, Reset on a `preserved` one** — one control, and they are genuinely
   * two acts, so this is where they part.
   *
   * A `preserved` row's override was made in an **earlier** run and is not in `overrides`; there is
   * nothing here to delete. Resetting it means *stop keeping my old edit and take what the source
   * says*, and the model already has a word for that: `reject`. Which is exactly the decision the
   * row's segments were forbidden from offering (discarding your own work must not be a ✗ among
   * twenty triage rows) — the objection was always to the **control**, never to the act, and a
   * button that says what it discards is the control that was missing.
   *
   * ⚠️ Order matters: if the row also carries an override from *this* review, that comes off first.
   * Reset would otherwise reach past the edit in front of you to the one from last month.
   */
  const revertOrReset = useCallback(
    (id: string) => {
      if (overrides[id]) return revertOverride(id);
      const c = changes.find((x) => x.id === id);
      if (c?.type === "preserved") setOne(id, "reject");
    },
    [overrides, revertOverride, changes],
  );
  const [geom, setGeom] = useState<GeomState>({ editing: false });
  /**
   * ⚠️ Bounded and append-only, exactly as Map Content's is — the consumer tracks the last `seq`
   * it posted, so trimming can never replay a command. See the long note there.
   */
  const [geomCommands, setGeomCommands] = useState<
    { seq: number; body: Record<string, unknown> }[]
  >([]);
  const geomSeq = useRef(0);
  const sendGeom = useCallback((body: Record<string, unknown>) => {
    geomSeq.current += 1;
    setGeomCommands((cur) => [
      ...cur.slice(-31),
      { seq: geomSeq.current, body },
    ]);
  }, []);
  const onGeomCommand = useCallback(
    (c: GeomCommand) => sendGeom(c as unknown as Record<string, unknown>),
    [sendGeom],
  );
  const onGeomState = useCallback(
    (st: Record<string, unknown>) => setGeom(st as unknown as GeomState),
    [],
  );
  /**
   * Which CHANGE the open geometry session belongs to.
   *
   * A ref, not state: `onGeometry` fires from a message handler that must not be re-registered
   * every time the answer changes, and nothing renders differently for knowing it.
   *
   * ⚠️ **It is a change id, not an `fid`.** The map resolves changes to real features by name (see
   * `resolveChanges` in the shell), so the app has never held the fid — which is exactly why the
   * shell grew `beginchange` rather than the app guessing one.
   */
  const geomFor = useRef<string | null>(null);

  /* ── the panel session ───────────────────────────────────────────────────
   *
   * **✎ opens the standard properties panel with the geometry live** (Olcay, 2026-08-26: *"edit
   * should bring in the edit panel as if it's normal feature edit. geometry becomes editable."*).
   *
   * It replaced an inline row form plus a separate *"Edit shape on the map"* button. The panel is
   * the SAME `FeaturePanel` Map Content opens, in the same place — measured, it leaves 532×741 of
   * map at 1440, which is the identical number Map Content leaves with its tree open. The
   * composition is not new; it is the one the geometry editor already runs in.
   */

  /** Which change the panel is open on, and the feature's own property bag once the map answers. */
  const [panelFor, setPanelFor] = useState<string | null>(null);
  /** The changelog's own collapse, remembered for the session — never automatic. See the handle. */
  const [listOpen, setListOpen] = useState(true);
  const [panelProps, setPanelProps] = useState<Record<string, unknown> | null>(
    null,
  );
  /** Why ✎ is unavailable — the map could not resolve a change to a feature on this floor. */
  const [editBlocked, setEditBlocked] = useState<string | undefined>();
  /** The panel's own report: is there anything to save, and may it be saved? */
  const [dirty, setDirty] = useState(false);
  const [canSave, setCanSave] = useState(false);
  const [saveSignal, setSaveSignal] = useState(0);
  const onDirtyChange = useCallback((d: boolean, can: boolean) => {
    setDirty(d);
    setCanSave(can);
  }, []);
  const onFeatureProps = useCallback(
    (_fid: string, props: Record<string, unknown>) => setPanelProps(props),
    [],
  );
  const onGeomError = useCallback(
    (_fid: string, message: string) => setEditBlocked(message),
    [],
  );

  /** The labels the override's vocabulary prints with — the taxonomy's, never invented. */
  const labels = useMemo(() => ({ type: typeLabel, prop: propertyLabel }), []);
  /** Read from handlers that must not be re-registered when the baseline changes. */
  const baseline = useRef<Record<string, unknown> | null>(null);
  baseline.current = panelProps;
  const changesRef = useRef(changes);
  changesRef.current = changes;

  const openEditorNow = useCallback(
    (id: string) => {
      geomFor.current = id;
      setPanelFor(id);
      setPanelProps(null);
      setEditBlocked(undefined);
      setDirty(false);
      setActive({ id, from: "list" });
      sendGeom({ cmd: "beginchange", id });
    },
    [sendGeom],
  );
  const closeEditor = useCallback(
    (commit: boolean) => {
      if (geomFor.current) {
        sendGeom({ cmd: "end", commit: commit && !!geom.dirty });
        geomFor.current = null;
      }
      setPanelFor(null);
      setPanelProps(null);
      setDirty(false);
    },
    [sendGeom, geom.dirty],
  );

  /**
   * **One unsaved-work conversation, and it now has FOUR ways in.**
   *
   * Map Content guards three: the panel's ✕, Escape over the map, and opening another feature. The
   * review adds a fourth — **deciding any row**, including a bulk *Confirm all* / *Reject all* and
   * *Complete review*. That is the one that bites: bulk actions already skip rows that carry an
   * override, but a **dirty, unsaved session is not an override yet**, so without this they would
   * erase a half-made edit without asking.
   */
  const [pendingExit, setPendingExit] = useState<{
    kind: "close" | "switch" | "decide";
    run: () => void;
  } | null>(null);
  /** Everything that can interrupt an edit goes through here, so none of them can forget to ask. */
  const guard = useCallback(
    (kind: "close" | "switch" | "decide", run: () => void) => {
      if (panelFor && dirty) return setPendingExit({ kind, run });
      run();
    },
    [panelFor, dirty],
  );
  const openEditor = useCallback(
    (id: string) => {
      if (id === panelFor) return;
      guard("switch", () => openEditorNow(id));
    },
    [guard, openEditorNow, panelFor],
  );

  /**
   * **Update wrote the feature; here it writes an OVERRIDE.** The panel does not know changes exist
   * and must not learn — it reports what the user settled, and this decides what that means.
   */
  const onEdited = useCallback(
    (next: Record<string, unknown>, removed?: string[]) => {
      const id = panelFor;
      if (!id) return;
      const c = changesRef.current.find((x) => x.id === id);
      if (!c) return;
      const before = baseline.current ?? {};
      setOverrides((p) => {
        const cur = p[id] ?? {};
        const o: Override = { ...cur };
        // ⚠️ The baseline is MapScale's DETECTED value, not the published one — Revert deletes the
        // override and what is underneath is the detected value by construction.
        const name =
          typeof next.name === "string" ? next.name.trim() : undefined;
        if (name !== undefined && name !== c.name) o.name = name;
        else delete o.name;
        const kind =
          typeof next.subType === "string" ? next.subType : undefined;
        if (kind !== undefined && kind !== (c.kind ?? "")) o.kind = kind;
        else delete o.kind;

        const props: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(next)) {
          if (k === "name" || k === "subType") continue;
          if (JSON.stringify(v) !== JSON.stringify(before[k])) props[k] = v;
        }
        o.props = Object.keys(props).length ? props : undefined;
        // ⚠️ Said out loud, because absent from `props` already means *leave this alone*.
        const gone = (removed ?? []).filter((k) => before[k] !== undefined);
        o.removedProps = gone.length ? gone : undefined;

        o.details = overrideDetails(c, o, before, labels);
        /**
         * ⚠️ **An edit that settled nothing writes no override.** Opening the panel, changing
         * nothing and pressing Update would otherwise leave a purple row on the map claiming an
         * override nobody made. This matters MORE with a wide bag, not less: there are more ways to
         * open a panel and settle nothing.
         */
        if (!o.details.length && o.geometry === undefined) {
          const rest = { ...p };
          delete rest[id];
          return rest;
        }
        return { ...p, [id]: o };
      });
    },
    [panelFor, labels],
  );
  /** Update finished. The shape commits first (see `FeaturePanel.save`), then the panel closes. */
  const onSaved = useCallback(() => closeEditor(true), [closeEditor]);
  const activeChange = useMemo(
    () => changes.find((c) => c.id === panelFor),
    [changes, panelFor],
  );

  /**
   * A committed outline. It rebuilds the whole line list rather than appending, so the boundary
   * lands in reading order — after Name and Type — however late the map's message arrives.
   */
  const onGeometry = useCallback(
    (_fid: string, rings: number[][][], pieces: number) => {
      const id = geomFor.current;
      if (!id) return;
      const c = changesRef.current.find((x) => x.id === id);
      const before = baseline.current ?? {};
      setOverrides((p) => {
        const cur = p[id] ?? {};
        const line =
          pieces > 1
            ? `Boundary redrawn by hand — now ${pieces} pieces`
            : "Boundary redrawn by hand";
        const o: Override = {
          ...cur,
          geometry: rings,
          details: [
            ...(cur.details ?? []).filter((d) => !d.startsWith("Boundary")),
            line,
          ],
        };
        return {
          ...p,
          [id]: c
            ? { ...o, details: overrideDetails(c, o, before, labels) }
            : o,
        };
      });
    },
    [labels],
  );

  /**
   * The active change — one selection shared by the changelog and the map (Olcay, 2026-08-11).
   * Clicking a row opens that feature's card and eases the camera onto it; clicking a shape lights
   * the row and scrolls it into view. Held here rather than in either surface because neither owns
   * it: it is a fact about the review.
   *
   * It carries **who made it**, because the two want opposite scrolling: a row you clicked is
   * already under your eye, and moving the list then is an unrequested jolt — while a selection
   * made on the map has to come and find you.
   */
  const [active, setActive] = useState<{
    id: string | null;
    from: "list" | "map";
  }>({
    id: null,
    from: "list",
  });
  const activeId = active.id;
  const activate = (id: string) =>
    setActive((cur) => ({ id: cur.id === id ? null : id, from: "list" }));
  /** Stable, so PointrMap doesn't re-subscribe its message listener on every render. */
  const onMapSelect = useCallback(
    (id: string | null) => setActive({ id, from: "map" }),
    [],
  );

  /**
   * Concluding the review — what Save leaves behind (Olcay, 2026-08-11: *"we need to show the
   * flags once saved — on the map"*, and *"AI Mapping state should change too as the user
   * concluded the review"*).
   *
   * Two writes, both to the store the editor already reads:
   *
   * 1. **The outcome**, so the flags survive. Decision 2 chose Flag over Edit on the promise that
   *    you *"keep flagged items visible to edit later"* — and until now the decisions died with
   *    the screen, so there was no later.
   * 2. **The version's state**, because saving an eligible review *is* the publish (decision 5).
   *    Amber concluded → published. Red cause B never auto-publishes (US5), so it only moves if
   *    the fate strip's *Publish now* was used. A rejected version never gets here at all.
   *
   * Creation mode writes nothing: the wizard's review hands its rows back to the wizard, and the
   * building isn't in the tree yet.
   */
  const writeOutcome = (complete: boolean) => {
    if (creation || !target) return;
    const key = levelKey(target.buildingId, target.index);
    const versions = getLevelVersions(key, () =>
      seedVersions(target.short, target.index, target.buildingId),
    );
    const newest = versions[0];
    if (!newest) return;
    /**
     * Two different publishes, and only one of them waits for the review to be finished.
     *
     * **Publish now** (the fate strip) is a deliberate act: the strip already says *"Published
     * just now — this version is live"*, so it must publish whether or not you then Save or
     * Complete. Gating it on `complete` — as this did — meant pressing Publish now and then Save
     * left the version unpublished under a strip claiming it was live.
     *
     * **Auto-publish on conclusion** (decision 5) is the other one, and that genuinely requires
     * completing: an amber level publishes because you finished reviewing it.
     */
    const published =
      fate === "published" ||
      (complete && !matchFailed && bandKind === "medium");
    // Only overrides for rows that are actually in this report. An override keyed to a change the
    // floor no longer carries could never be seen or reverted, and would come back to life the day
    // a re-upload happened to reuse the id.
    const live: Record<string, Override> = {};
    for (const c of changes) if (overrides[c.id]) live[c.id] = overrides[c.id];
    setReviewOutcome(key, {
      versionN: newest.n,
      decisions,
      changes,
      published,
      complete,
      overrides: live,
    });
    if (published && newest.state !== "published")
      setLevelVersions(key, [
        { ...newest, state: "published" },
        ...versions.slice(1),
      ]);
  };

  /** Come back to it later. No ceremony: nothing is decided, nothing publishes, nothing is lost. */
  const saveProgress = () => writeOutcome(false);
  /** Conclude it — the version's state moves, and an eligible level publishes (decision 5). */
  const concludeReview = () => writeOutcome(true);

  /**
   * How many changes still carry no decision. Completing with some undecided is **allowed** — the
   * stories never require deciding everything, and a footer that refuses is a rule pretending to
   * be a review. But the overlay has to say what happens to them, and what happens is that they
   * apply: doing nothing at all is what the grace period already does, so an undecided change is
   * a change you let through.
   */
  const undecidedCount = changes.filter(
    (c) => c.type !== "preserved" && !decisions[c.id] && !overrides[c.id],
  ).length;

  /**
   * How many rows carry **your** value rather than MapScale's.
   *
   * It replaces `flaggedCount`, and the sentence it feeds says something different in kind. The
   * flag warning existed because flags were *annotations, not gates* — they did not hold anything
   * back, so completing took them live exactly as detected and the moment before that had to say
   * so. An edit has no such trap: what goes live is precisely what you put there. The count is
   * kept because it is still worth stating what you are about to publish under your own name.
   */
  const editedCount = changes.filter((c) => overrides[c.id]).length;
  /**
   * The changes as the MAP should see them: the report, plus your override where you made one.
   *
   * Married here rather than in `changes`, which stays a clean snapshot of what MapScale said —
   * the same division the store keeps, and the reason Revert is a deletion rather than an undo
   * log. The shell reads `override` to paint the row's shape in the override purple and to show
   * your name on the card instead of the detected one.
   */
  const mapChanges = useMemo(
    () =>
      changes.map((c) =>
        overrides[c.id] ? { ...c, override: overrides[c.id] } : c,
      ),
    [changes, overrides],
  );
  /** Does completing this review actually publish? Decision 5 — and only for an eligible band. */
  const willPublish =
    fate !== "published" && !matchFailed && bandKind === "medium";

  /**
   * Creation reviews one level at a time and **stays mounted while you step between them**, so
   * that decisions taken on a level survive going to another and coming back. That costs this
   * effect: `decisions` is seeded once, from whichever level was open first, so a level arriving
   * later would show its own saved decisions as undecided — the rows carry them, the map didn't.
   *
   * It only ever fills gaps. Overwriting would undo a decision the user has just taken on the row
   * in front of them, and row ids carry their level (`create-{index}-{n}`), so accumulating every
   * level's decisions in one map is safe by construction.
   */
  useEffect(() => {
    if (!creation) return;
    setDecisions((p) => {
      let changed = false;
      const next = { ...p };
      for (const c of initialChanges)
        if (next[c.id] === undefined && c.decision !== undefined) {
          next[c.id] = c.decision;
          changed = true;
        }
      return changed ? next : p;
    });
  }, [creation, initialChanges]);

  /**
   * Bring the lit row to the middle of the panel — but only when the *map* drove the selection.
   *
   * `block: "nearest"` was wrong here and read as right in code: it scrolls the **minimum**
   * distance, so a row from the bottom of a 23-row list arrived jammed against the sticky footer,
   * half covered, exactly where nobody is looking. The list had followed the map and appeared not
   * to. `"center"` puts it where the eye already is.
   */
  useEffect(() => {
    if (!active.id || active.from !== "map") return;
    const row = document.querySelector(
      `[data-change-row="${CSS.escape(active.id)}"]`,
    );
    row?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [active]);
  /**
   * Bulk decision — used by both a group header and a whole risk section.
   *
   * **An edited row is never touched by a bulk action.** This is the same rule that used to
   * protect flags, and it matters more now than it did then: a flag was a note, and one careless
   * "Confirm all" cost you a reminder. An override is *work* — a name you typed, an outline you
   * redrew — and writing a decision over it would silently throw that away, since a decision and
   * an override cannot both stand (see the row's Edited state). Deciding an edited row one at a
   * time still works: Revert first, and the ✓/✗ pair comes back.
   */
  const setMany = (ids: string[], d: Decision) =>
    setDecisions((p) => {
      const next = { ...p };
      for (const id of ids) if (!overrides[id]) next[id] = d;
      return next;
    });
  // Colour-keyed sections by change type, warnings sorted to the top of each.
  const sections = useMemo(() => buildSections(changes), [changes]);
  // A user override is carried through untouched, so it can't be bulk-decided.
  const decidableIds = useMemo(
    () => changes.filter((c) => c.type !== "preserved").map((c) => c.id),
    [changes],
  );

  if (rejectedByGuard) {
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
          <div style={{ padding: PANEL_PAD, flex: 1 }}>
            <PanelHeader
              eyebrow={shown.building}
              title={`${shown.short} | ${shown.long}`}
              onClose={onClose}
              closeLabel="Close"
            />
            <div
              style={{
                background: BAND.large.tint,
                border: `1px solid ${BAND.large.border}`,
                color: BAND.large.ink,
                borderRadius: 10,
                padding: "12px 14px",
                marginTop: 14,
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {RED_CAUSE_COPY["large-change"].card(pct)}
              </div>
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "var(--review-muted)",
                lineHeight: 1.5,
                marginTop: 12,
              }}
            >
              {RED_CAUSE_COPY["large-change"].error}
            </div>
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
          <PointrMap changes={NO_CHANGES} prefs={prefs} target={mapTarget} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
      {/* Left drawer — collapsible, so the map can be worked on. See the handle on the map's edge. */}
      <div
        style={{
          width: listOpen ? PANEL_WIDTH : 0,
          flex: `0 0 ${listOpen ? PANEL_WIDTH : 0}px`,
          overflow: "hidden",
          transition: "width .16s ease, flex-basis .16s ease",
          borderRight: listOpen ? "1px solid #E7E9EE" : "none",
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {/*
          The header sits OUTSIDE the scroll area (fixed 2026-08-11, Olcay: *"position of the close
          button should be consistent"*). Two things were wrong while it scrolled with the content:

          1. **A scrollbar moved it.** The ✕ was 36px from the panel's right edge here and 21px on
             the level editor — exactly one 15px scrollbar apart, because a scrollbar takes its
             width out of the content box and only the long screens have one.
          2. **It scrolled away entirely.** 300px down the changelog put the ✕ at top −228 — off
             screen. Panels close from the header ✕ (the standing rule), so the only way out was to
             scroll back up to find it.

          A drawer header is chrome, not content. `PANEL_PAD` keeps every panel's header block
          identical, which is what makes the ✕ land in the same place on every screen.
        */}
        <div style={{ padding: PANEL_PAD }}>
          {/*
            The level is the subject of this screen, so it carries the title weight; the building is
            context above it. (Supersedes the earlier rule of "building name large" — you review a
            floor, not a building.) Still named the way the SDK names it: short | long.
          */}
          <PanelHeader
            eyebrow={shown.building}
            title={
              <Text
                style={{
                  fontSize: 18,
                  display: "block",
                  margin: "1px 0 0",
                  color: "var(--primitives-colors-background-600)",
                  lineHeight: 1.3,
                }}
              >
                Reviewing{" "}
                <b
                  style={{
                    color: "var(--primitives-colors-theme-900)",
                    fontWeight: 600,
                  }}
                >
                  {shown.short}
                  <span
                    style={{
                      color: "var(--primitives-colors-background-200)",
                      fontWeight: 400,
                      margin: "0 6px",
                    }}
                  >
                    |
                  </span>
                  {shown.long}
                </b>
              </Text>
            }
            onClose={creation ? creation.onBack : onClose}
            closeLabel={creation ? "Back to the wizard" : "Close review"}
          />
        </div>
        <div style={{ padding: "0 20px 8px", overflow: "auto", flex: 1 }}>
          {/* 8px of the old 10px gap now comes from the header block's own bottom padding */}
          <div style={{ height: 2 }} />
          <Text
            style={{
              fontSize: 13,
              color: "var(--review-muted)",
              display: "block",
              lineHeight: 1.45,
            }}
          >
            {/*
              **The map is a preview of what you are about to publish** (Olcay, 2026-08-25), so
              the lede says what the three outcomes do to it rather than naming three buttons.
              Reject no longer means "mark it with a ✗": it means the floor keeps the published
              value, and you watch that happen.
            */}
            {creation
              ? "Confirm each of MapScale's guesses, edit it to put your own value in its place, or reject it."
              : matchFailed
                ? "Inspect the whole floor, then publish it or upload a corrected floor-plan."
                : "Confirm a change to apply it, reject it to keep what is published, or edit it to put your own value in its place. The map shows the floor as it will be."}
          </Text>
          {/*
            The wizard's level cycle — step 3's "Level to Align, N of M" idiom, reused because you
            are still inside the wizard and it taught this control two steps earlier. Levels with
            nothing to confirm never appear here: a zero-issue level is creation's Green, and the
            wizard skips it rather than asking you to open an empty list (Olcay's answer 2).
          */}
          {creation?.levels && creation.levels.items.length > 1 && (
            <div style={{ marginTop: 14 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  marginBottom: 4,
                  color: "var(--review-ink)",
                }}
              >
                ● Level to Review{" "}
                <span
                  style={{
                    background: "var(--primitives-colors-emotional-success-0)",
                    border:
                      "1px solid var(--primitives-colors-emotional-success-200)",
                    borderRadius: 999,
                    padding: "0 8px",
                    fontSize: 10,
                  }}
                >
                  {creation.levels.items.findIndex(
                    (l) => l.id === creation.levels!.currentId,
                  ) + 1}{" "}
                  of {creation.levels.items.length}
                </span>
              </div>
              <Select
                value={String(creation.levels.currentId)}
                onValueChange={(v) => creation.levels!.onPick(Number(v))}
              >
                <SelectTrigger aria-label="Level to Review">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {creation.levels.items.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      {l.label} · {l.issues} issue{l.issues === 1 ? "" : "s"}
                      {l.done ? " ✓" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {/* magnitude — traffic light, the one place red/amber/green is allowed. Cause B has no
              reliable ratio, so the block explains instead of counting (US5). */}
          <div
            data-tour="magnitude"
            style={{
              background: band.solid,
              color: band.onSolid,
              // the tally hangs off the block's bottom edge; without one (cause B) it closes itself
              borderRadius: matchFailed ? 10 : "10px 10px 0 0",
              padding: "12px 14px",
              marginTop: 14,
              marginBottom: matchFailed ? 12 : 0,
            }}
          >
            {creation ? (
              <>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  {creation.confidencePct}%
                </div>
                <div style={{ fontSize: 12 }}>
                  MapScale confidence — a new building has nothing to compare
                  yet; confirm its guesses below
                </div>
              </>
            ) : redCause === "cannot-match" ? (
              <>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  {RED_CAUSE_COPY["cannot-match"].title}
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.35 }}>
                  {RED_CAUSE_COPY["cannot-match"].detail}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{pct}%</div>
                <div style={{ fontSize: 12 }}>
                  of floor area changed vs the published floor plan
                </div>
              </>
            )}
          </div>
          {/* the tally, hung off the magnitude block rather than floating as a sentence — dropped
              for cause B: counting is exactly what the engine could not do (decision 11) */}
          {!matchFailed && (
            <div
              style={{
                display: "flex",
                border: `1px solid ${LINE}`,
                borderTop: "none",
                borderRadius: "0 0 10px 10px",
                overflow: "hidden",
                marginBottom: 12,
              }}
            >
              {METRIC_ORDER.map((t, i) => (
                <div
                  key={t}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderLeft: i ? `1px solid ${LINE}` : "none",
                    lineHeight: 1.15,
                  }}
                >
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 600,
                      color: METRIC_COLOR[t],
                    }}
                  >
                    {changes.filter((c) => inMetric(c, t)).length}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--review-muted)" }}>
                    {METRIC_LABEL[t]}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/*
            The version's fate if nobody acts, and the levers to change it — US4 and US5's real
            actions, which the old Cancel/"Apply update" footer never expressed. Amber counts down
            to an automatic publish: cancel the schedule, or publish now. Red never publishes
            itself but is publishable at any time. Traffic-light tinting is sanctioned here — the
            strip restates the magnitude's consequence, like the tree tags (§10). What "Publish
            now" publishes for ONE level while publishing is site-scoped is open question Q5; the
            mock records the intent locally and Phase 2 gives it a real backend.
          */}
          {/* creation has no fate: Save creates, publishing stays the site's Publish */}
          {!creation &&
            (fate !== "pending" ? (
              <div
                style={{
                  border: `1px solid ${fate === "published" ? BAND.minor.border : LINE}`,
                  background:
                    fate === "published" ? BAND.minor.tint : "#f2f3f5",
                  color:
                    fate === "published"
                      ? BAND.minor.ink
                      : "var(--review-muted)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 12,
                  lineHeight: 1.4,
                }}
              >
                <div style={{ flex: 1 }}>
                  {fate === "published"
                    ? "Published just now — this version is live."
                    : fate === "held"
                      ? // A part-way save suspends the countdown, so the strip must stop promising it.
                        "In review — this level is held out of publishing, including the automatic one, until you complete the review."
                      : "Scheduled publish cancelled — nothing publishes until you conclude the review or publish it yourself."}
                </div>
                {/* killing the timer doesn't take away the deliberate path — and being held doesn't
                  either: you can still decide to put it live as it stands */}
                {(fate === "cancelled" || fate === "held") && (
                  <Button size="sm" onClick={() => setFate("published")}>
                    Publish now
                  </Button>
                )}
              </div>
            ) : (
              <div
                style={{
                  border: `1px solid ${band.border}`,
                  background: band.tint,
                  color: band.ink,
                  borderRadius: 10,
                  padding: "10px 12px",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  // when the action wraps under the sentence it is an aside, not a second block
                  columnGap: 10,
                  rowGap: 6,
                  flexWrap: "wrap",
                }}
              >
                {/*
                Amber's one action is a text link, so it fits BESIDE the sentence — and squeezes it
                into three cramped lines. Give the sentence the whole row and let the link sit under
                it. Cause B keeps them side by side: its action is a real button and reads as one.
              */}
                <div
                  style={{
                    flex: bandKind === "medium" ? "1 1 100%" : 1,
                    minWidth: 180,
                    fontSize: 12,
                    lineHeight: 1.4,
                  }}
                >
                  {bandKind === "medium"
                    ? `Publishes automatically in ${GRACE_DAYS.demoLeft} days unless you finish reviewing.`
                    : // only cause B reaches a large-band review: cause A is rejected before it gets
                      // here (decision 9) and cause C never produces anything to review
                      "Never published automatically. Review it, then publish when you're ready."}
                </div>
                {/*
                Amber carries ONE action, and it is the quiet one (Olcay, 2026-08-13).
                *Publish now* used to sit here too, and it was the wrong offer mid-review: it
                publishes the same thing **Complete review** publishes, from the opposite end of the
                screen, while you are still deciding. US4's "publish immediately as soon as I'm done
                with my review" IS Complete review — so the duplicate went, and only the action with
                no substitute stayed: stopping the clock.

                Cause B keeps *Publish now*, and must: decision 11 gives it no changelog, so there
                is nothing to "complete" and this is its only way to publish.
              */}
                <div style={{ display: "flex", gap: 8, flex: "0 0 auto" }}>
                  {bandKind === "medium" ? (
                    // A link in a 41px button box left the strip 90px tall for one line of text
                    // (Olcay, 2026-08-14). Sized to its own text, it reads as the aside it is.
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setFate("cancelled")}
                      style={{ padding: 0, height: "auto", minHeight: 0 }}
                    >
                      Cancel scheduled publish
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => setFate("published")}>
                      Publish now
                    </Button>
                  )}
                </div>
              </div>
            ))}

          {/*
            Cause B's body (decision 11): whole-floor inspection instead of a changelog. The map
            beside this panel already shows the floor; Compare puts it next to the published
            version; the fate strip above carries Publish now, and a corrected re-upload lives
            where uploads live — the editor.
          */}
          {matchFailed && (
            <div
              style={{
                border: `1px solid ${LINE}`,
                borderRadius: 10,
                padding: "14px 16px",
                marginTop: 10,
                fontSize: 12.5,
                lineHeight: 1.5,
                color: "#464a53",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                  color: "var(--review-ink)",
                  marginBottom: 4,
                }}
              >
                No per-change list for this update
              </div>
              A per-change list is a comparison against the published map — and
              aligning the two is exactly what failed, so listing changes here
              would be guesswork. Inspect the floor on the map, compare it with
              the published version, then publish when you’re satisfied — or
              upload a corrected floor-plan from the level’s editor.
              {onCompare && (
                <div style={{ marginTop: 10 }}>
                  <Button variant="outline" size="sm" onClick={onCompare}>
                    Compare with published map
                  </Button>
                </div>
              )}
            </div>
          )}

          {/*
            Sections by change type, colour-keyed, rows visible — the v9 shape. Risk rides on the
            rows (warnings sort first and wear a mark) rather than becoming an outer container,
            which hid every change behind a chevron. Confirm all / Reject all sit on the first
            section's title row.
          */}
          {/*
            D16 — whole-floor conditions, above the list they scope. Neutral by §3: risk is a third
            axis and is never coloured, so this never wears amber even though it is a warning. It
            says the list is UNAFFECTED, because US10's whole point is that the engine carries on.
          */}
          {floorWarnings && floorWarnings.length > 0 && (
            <div
              data-tour="floor-warnings"
              style={{
                marginTop: 10,
                border: `1px solid ${LINE}`,
                borderRadius: 8,
                overflow: "hidden",
                background: "#f6f7f9",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: "9px 12px",
                }}
              >
                <span style={{ flex: "0 0 auto", marginTop: 2 }}>
                  <WarningGlyph size={13} />
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: "var(--review-ink)",
                    }}
                  >
                    {floorWarnings
                      .map((w) => WARNING_LABEL[w.kind])
                      .join(" · ")}
                  </div>
                  {/* US10's point, and the reason these never wear amber: the engine carried on */}
                  <div
                    style={{
                      fontSize: 12,
                      color: "#5d626f",
                      lineHeight: 1.45,
                      marginTop: 2,
                    }}
                  >
                    Affects the whole floor. The change list below is
                    unaffected.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFloorNoticesOpen((v) => !v)}
                  aria-expanded={floorNoticesOpen}
                  style={{
                    flex: "0 0 auto",
                    border: 0,
                    background: "none",
                    padding: 0,
                    cursor: "pointer",
                    fontSize: 12,
                    color: "var(--review-link, #0b369c)",
                    fontFamily: "inherit",
                  }}
                >
                  {floorNoticesOpen ? "Hide" : "Details"}
                </button>
              </div>
              {floorNoticesOpen &&
                floorWarnings.map((w) => (
                  <div
                    key={w.kind}
                    style={{
                      padding: "9px 12px 9px 35px",
                      borderTop: `1px solid ${LINE}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "var(--review-ink)",
                      }}
                    >
                      {WARNING_LABEL[w.kind]}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#5d626f",
                        lineHeight: 1.45,
                        marginTop: 2,
                      }}
                    >
                      {w.detail}
                    </div>
                  </div>
                ))}
            </div>
          )}

          <div data-tour="changelog">
            {sections.map((s, i) => (
              <div key={s.key} style={{ marginTop: i ? 18 : 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: s.color,
                      flex: "0 0 auto",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      letterSpacing: 1,
                      fontWeight: 700,
                      color: s.color,
                    }}
                  >
                    {s.label}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      letterSpacing: 1,
                      fontWeight: 600,
                      color: "#9AA0A6",
                    }}
                  >
                    · {s.count}
                  </span>
                  <span style={{ flex: 1 }} />
                  {i === 0 && (
                    <>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setMany(decidableIds, "confirm")}
                      >
                        Confirm all
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setMany(decidableIds, "reject")}
                      >
                        Reject all
                      </Button>
                    </>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    marginTop: 8,
                  }}
                >
                  {s.groups.map((g) => (
                    <ChangeGroupBlock
                      key={g.key}
                      group={g}
                      onDecideOne={(id, d) =>
                        guard("decide", () => setOne(id, d))
                      }
                      onDecideGroup={(ids, d) =>
                        guard("decide", () => setMany(ids, d))
                      }
                      overrides={overrides}
                      onOpenEditor={openEditor}
                      onRevert={revertOrReset}
                      editingId={panelFor}
                      editBlocked={editBlocked}
                    />
                  ))}
                  {s.rows.map((c) => (
                    <ChangeReviewRow
                      key={c.id}
                      change={c}
                      preserved={c.type === "preserved"}
                      onDecide={(d) => guard("decide", () => setOne(c.id, d))}
                      active={activeId === c.id}
                      onActivate={() => activate(c.id)}
                      edit={overrides[c.id]}
                      /**
                       * ⚠️ **Every type opens the panel, including a removal.** It used to skip
                       * `deleted` and `metadata` because neither had an outline worth handing the
                       * geometry editor. The panel is not the geometry editor — it is the feature —
                       * and Olcay ruled on 2026-08-26 that a removal may be edited: an override on
                       * one **keeps** the feature, which is a thing you may well want to do while
                       * changing its name.
                       */
                      onOpenEditor={() => openEditor(c.id)}
                      onRevert={() => revertOrReset(c.id)}
                      editing={panelFor === c.id}
                      editBlocked={editBlocked}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "12px 20px",
            borderTop: "1px solid #E7E9EE",
            justifyContent: "flex-end",
          }}
        >
          {/*
            Cancel/Go back became the header's ✕ (Olcay's standing rule). The footer used to keep
            only the concluding action — one button, "Save" — and it now keeps **two**, because
            they are genuinely two different intentions (Olcay, 2026-08-11):

              **Save** — "I'm part-way through, I'll come back." Your decisions are written to the
              level and **the level is held out of publishing until you complete the review** —
              including the automatic publish, because a grace period firing here would take a
              half-reviewed floor live. No confirmation: nothing goes live, so there is nothing to
              warn about.
              **Complete review** — the concluding action, and the only one that publishes.
              Primary, right-most, and it still asks first.

            The held state is **"In review"**, never "draft" (Olcay: *"similar to draft but we
            don't want to say draft"*) — decision 5 removed the draft model and the word is spoken
            for.

            **Creation carries the same pair** (§18: *"each level gets its own Save / Complete
            review, exactly like the update flow"*), superseding its single Confirm Changes. The
            words mean the same things: Save keeps your decisions and leaves the level **In
            review**; Complete review concludes it. What differs is only what conclusion *costs* —
            in the update flow it can publish a site, so it asks first; here it publishes nothing,
            so it doesn't.
          */}
          {creation ? (
            <>
              <Button
                variant="secondary"
                title="Save your decisions and come back to this level later. Nothing is concluded."
                onClick={() => creation.onSave(changes, overrides)}
              >
                Save
              </Button>
              <Button onClick={() => creation.onConfirm(changes, overrides)}>
                Complete review
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                title="Save your decisions to the level and come back later. The level is held out of publishing — including the automatic one — until you complete the review."
                onClick={() => {
                  saveProgress();
                  onClose?.();
                }}
              >
                Save
              </Button>
              <Button onClick={() => setConfirmOpen(true)}>
                Complete review
              </Button>
            </>
          )}
        </div>

        <ConfirmOverlay
          open={confirmOpen}
          tone="info"
          title={
            editedCount
              ? `Finalise with ${editedCount} edited change${editedCount === 1 ? "" : "s"}?`
              : "Finalise this review?"
          }
          confirmLabel="Complete review"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            concludeReview();
            onClose?.();
          }}
        >
          {/*
            Three sentences, each earning its place, in the order they matter.

            1. **What completing does** — and it says *publishes* outright when it will, rather
               than the old hedge "if this level is eligible", which left the reader to work out
               whether it applied to them at the moment they most needed to know.
            2. **The edits**, when there are any. Unlike the flag sentence this replaced, it is
               not a warning — there is no trap in an override, because what goes live is exactly
               what you put there. It says so because publishing something under your own name is
               worth stating once, out loud, at the moment it happens.
            3. **The undecided**, which apply as detected — exactly what the grace period would
               have done unattended.
          */}
          {(fate === "published"
            ? "This version is already live. Completing the review keeps your decisions on record."
            : willPublish
              ? "Completing concludes the review and publishes this level with your decisions applied."
              : "Completing concludes the review. This level is not published automatically — use Publish now when you're ready.") +
            (editedCount
              ? ` ${editedCount} change${editedCount === 1 ? "" : "s"} carr${editedCount === 1 ? "ies" : "y"} your own value instead of MapScale's — ${editedCount === 1 ? "it goes" : "they go"} live as you edited ${editedCount === 1 ? "it" : "them"}.`
              : "") +
            (undecidedCount
              ? ` ${undecidedCount} change${undecidedCount === 1 ? "" : "s"} still ${undecidedCount === 1 ? "has" : "have"} no decision — ${undecidedCount === 1 ? "it will be applied" : "they will be applied"} as detected.`
              : "")}
        </ConfirmOverlay>
      </div>

      {/* Map pane — live Pointr WebSDK map, highlights driven by the decisions above */}
      <div
        data-tour="review-map"
        style={{
          position: "relative",
          flex: 1,
          background: "#EDEEF0",
          minWidth: 0,
        }}
      >
        {/*
          **The changelog collapses**, exactly as Map Content's tree does and for the same reason —
          editing happens on the map with the panel on the right, and once you have arrived the 440px
          you came through is 440px of the thing you are working on that you cannot see.

          ⚠️ **A remembered toggle, never automatic.** Collapsing the list out from under someone the
          moment they press ✎ moves the ground they are standing on, which is worse than a click. And
          the changelog must stay by default: you are working down a list.
        */}
        <button
          type="button"
          onClick={() => setListOpen((v) => !v)}
          aria-expanded={listOpen}
          aria-label={listOpen ? "Hide the changelog" : "Show the changelog"}
          title={listOpen ? "Hide the changelog" : "Show the changelog"}
          style={{
            position: "absolute",
            left: 0,
            top: 16,
            zIndex: 3,
            width: 22,
            height: 44,
            display: "grid",
            placeItems: "center",
            padding: 0,
            cursor: "pointer",
            border: `1px solid ${LINE}`,
            borderLeft: "none",
            borderRadius: "0 8px 8px 0",
            background: "#fff",
            color: "var(--review-muted)",
            boxShadow: "0 1px 4px rgba(0,0,0,.10)",
          }}
        >
          {listOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
        <PointrMap
          changes={mapChanges}
          prefs={prefs}
          onLevel={onLevel}
          onFeatures={onFeatures}
          onDecision={onMapDecision}
          active={activeId}
          onSelect={onMapSelect}
          target={mapTarget}
          geomCommands={geomCommands}
          onGeomState={onGeomState}
          onGeometry={onGeometry}
          onFeatureProps={onFeatureProps}
          onGeomError={onGeomError}
          /* Escape over the map is the same act as the panel's ✕ — it must ask the same question. */
          onEscape={() => guard("close", () => closeEditor(false))}
          levelGeometry={levelGeom}
          /**
           * The camera must frame the feature in the map the panel leaves — see the note on
           * `focusChange` in the shell, which had no reservation of its own until now.
           */
          focusPadRight={panelFor ? FEATURE_PANEL_WIDTH + 24 : 0}
        />
        {/*
          The same bar Map Content uses, on the same map, driven by the same queue.

          ⚠️ **`padLeft` exists because of a collision `padRight` uncovers.** With the panel open the
          bar's centre moves left, and its LEFT EDGE lands on x=16 — exactly where the Map Settings
          button sits (`left 16, bottom 16`, 44×44). They overlap by 44×28. It happens in Map Content
          today too, on any 1440 window with the tree open, and nothing about it is visible until a
          panel is there. Reserving the left is the bar's own mechanism, mirrored.
        */}
        <GeometryToolbar
          state={geom}
          padLeft={panelFor ? 72 : 0}
          padRight={panelFor ? FEATURE_PANEL_WIDTH + 24 : 0}
          onCommand={onGeomCommand}
        />
        {panelFor && (
          <FeaturePanel
            props={panelProps ?? { name: activeChange?.name ?? "" }}
            /**
             * ⚠️ **The subtitle is the one string that varies by change type.** *"Your value
             * replaces MapScale's"* is true of a removal and useless: it does not say the deletion
             * stops happening.
             */
            reviewNote={
              activeChange?.type === "deleted"
                ? "MapScale removes this feature. Saving keeps it, with your values."
                : "Your value replaces MapScale’s for this change."
            }
            reviewFootnote="Your override is kept with this review and applies when you complete it. Nothing is written back to Pointr Cloud."
            onDirtyChange={onDirtyChange}
            geometryDirty={!!geom.dirty}
            onCommitGeometry={() => sendGeom({ cmd: "commit" })}
            onEdited={onEdited}
            onSaved={onSaved}
            onCancelEdit={() => guard("close", () => closeEditor(false))}
            saveSignal={saveSignal}
            onClose={() => guard("close", () => closeEditor(false))}
          />
        )}
        {/**
         * The same conversation Map Content has, with a fourth way in — deciding another row. The
         * primary is **Save changes** when it can be saved, because saving is the safe answer and
         * the destructive one must never be what Enter presses.
         */}
        <ConfirmOverlay
          open={!!pendingExit}
          tone="warning"
          title="You have unsaved changes"
          confirmLabel={canSave ? "Save changes" : "Discard changes"}
          altLabel={canSave ? "Discard changes" : undefined}
          cancelLabel="Keep editing"
          onConfirm={() => {
            const run = pendingExit?.run;
            setPendingExit(null);
            if (canSave) {
              // Save through the panel's own `save()`, so it cannot walk around a rule the Update
              // button enforces; the queued act runs once the panel has closed itself.
              setSaveSignal((n) => n + 1);
              queueMicrotask(() => run?.());
            } else {
              closeEditor(false);
              run?.();
            }
          }}
          onAlt={
            canSave
              ? () => {
                  const run = pendingExit?.run;
                  setPendingExit(null);
                  closeEditor(false);
                  run?.();
                }
              : undefined
          }
          onCancel={() => setPendingExit(null)}
        >
          {!canSave
            ? "This edit cannot be saved — the feature needs a name. Go back and give it one, or discard the changes."
            : pendingExit?.kind === "close"
              ? "This feature has edits you have not saved. Closing will lose them."
              : pendingExit?.kind === "decide"
                ? "This feature has edits you have not saved. Deciding another row will lose them."
                : "This feature has edits you have not saved. Opening another one will lose them."}
        </ConfirmOverlay>
        <MapChrome prefs={prefs} onPrefs={setPrefs} focus={!matchFailed} />
      </div>
    </div>
  );
}
