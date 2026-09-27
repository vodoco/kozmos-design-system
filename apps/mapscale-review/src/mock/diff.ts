// MAP-566 diff contract.
// Phase 1: mock (this file). Phase 2: replace `seedDiff` with a client-side diff of
// published level features vs. the MapScale job-result GeoJSON (see MAP-566_build_plan.md §4).

// S5's client-wide configuration. `settings.ts` deliberately imports nothing from here, so this
// direction is the only one and there is no cycle.
import { getSettings, graceDays } from "./settings";
// Which building each demo state belongs to — see `seedVersions`.
import { CONCOURSE_A_ID, T3_ID } from "./site";
// The override's own sentence-shaping — dependency-free so the harness can exercise it.
// Re-exported so callers keep importing the override's vocabulary from the model it belongs to.
export {
  overrideDetails,
  overrideLine,
  splitOverrideLines,
  REMOVAL_OVERRIDDEN,
  SHOWN_LINES,
} from "./overrideLines";

/**
 * The MapScale Update Report's taxonomy — Add Feature · Delete Feature · Modify Geometry ·
 * Metadata Update — plus `preserved` for a user override carried through untouched.
 *
 * `updated` was one value until 2026-08-09; the report separates geometry from metadata, and the
 * two want different review treatment (geometry needs the map editor, metadata is a one-field fix),
 * so they are separate types that happen to share the "updated" colour and metric box.
 *
 * A feature that changed in both ways stays ONE change — one feature, one map highlight, one
 * decision — classified by the heavier action (geometry), with `details` listing everything.
 */
export type ChangeType =
  | "new"
  | "geometry"
  | "metadata"
  | "deleted"
  | "preserved";

/**
 * **Two decisions, not three** (Olcay, 2026-08-25). `flag` is gone, and with it the whole
 * come-back-to-it-later apparatus: the note, the pennant on the map, the tree's "N flagged" tag.
 *
 * This reverses **decision 2**, which chose Flag *over* Edit in the first place, on the promise
 * that you would *"flag now, keep flagged items visible to edit later"*. The later never earned
 * its keep: a flag is a decision to decide, and the review is where you are already standing.
 * The replacement is the thing it was deferring to — you edit it here, and the edit becomes a
 * **user override** that supersedes MapScale's suggestion (see `Override`).
 *
 * So a row has three possible outcomes and only two of them are chosen from a control:
 * confirm, reject, and — reachable only by doing the work — edited.
 */
export type Decision = "confirm" | "reject";

/**
 * **The user's own value, standing in place of MapScale's** (Olcay, 2026-08-25: *"edit becomes
 * user override which supersedes the incoming change"*).
 *
 * It is deliberately NOT a field on `Change`, and lives beside the decisions in `ReviewOutcome`
 * instead. Same reason `decisions` is separate: `changes` is the report **as it arrived** and has
 * to stay a faithful snapshot of what MapScale said. That snapshot is what makes Revert possible
 * at all — reverting is deleting the override, and what is underneath is still the detected value
 * (Olcay: *"revert means back to MapScale's detected value and geometry"*).
 *
 * Present ⇒ the row reads **Edited** and its `decision`, if any, no longer applies: there is
 * nothing left to confirm or reject, because the incoming change has already been superseded.
 */
export interface Override {
  /** The name the user typed, if they changed it. */
  name?: string;
  /** The object type the user picked, if they changed it. */
  kind?: string;
  /** GeoJSON.Geometry — the shape the user drew, if they reshaped it. */
  geometry?: unknown;
  /**
   * **Every other field the panel settled** (Olcay, 2026-08-26: *"go with the full property bag"*).
   *
   * ⚠️ `name` and `kind` stay first-class beside this rather than folding into it. The map's pinned
   * card reads `mine.name` directly — *"the name you gave it wins"* — and `changeAccent` reads the
   * type. Folding them in would be tidier and would break two surfaces for nothing.
   */
  props?: Record<string, unknown>;
  /**
   * The fields the panel **binned**.
   *
   * ⚠️ **This has to be said out loud**, for the reason `FeaturePanel.save()` already documents:
   * absent from `props` means *leave this alone*, so a removed field that is merely missing would
   * silently do nothing.
   */
  removedProps?: string[];
  /** What the user changed, in the changelog's own voice — one line each, same as `details`. */
  details?: string[];
}

/**
 * What a row actually resolves to. `edited` is not a `Decision` because you cannot pick it: it
 * becomes true by editing, and it outranks whatever was chosen before.
 */
export type Outcome = Decision | "edited";

/** The outcome of one row, given the override that may be standing over it. */
export function outcomeOf(
  decision: Decision | undefined,
  override?: Override,
): Outcome | undefined {
  if (override) return "edited";
  return decision;
}

/**
 * US8: *"Changelog consists of Notices and Warnings. Notices include any changes deemed safe by the
 * system. Warnings include any changes deemed risky."* This is the primary sort — warnings first
 * and expanded, notices collapsed — because it answers "what needs me?" before "what happened?".
 */
export type Risk = "notice" | "warning";

/**
 * Why a change is risky. The first FIVE are the US7 preservation warnings; the last three are
 * whole-floor conditions (US10) and the engine's own confidence.
 *
 * `override-removed` was added 2026-08-13, for the collision US7 never covers: one object that is
 * both **your edit** and **the source's deletion**. `type` carries its fate, `warning` carries why
 * a human is needed — two axes, so neither fact is lost.
 */
export type WarningKind =
  | "source-conflict"
  | "clash"
  | "out-of-bounds"
  | "re-removed"
  | "override-removed"
  | "georeference-shifted"
  | "floorplan-resized"
  | "low-confidence";

export const WARNING_LABEL: Record<WarningKind, string> = {
  "source-conflict": "Source conflict",
  clash: "Overlaps another object",
  "out-of-bounds": "Outside the floor plan",
  "re-removed": "Removed again",
  "override-removed": "Edited, now removed",
  "georeference-shifted": "Georeference shifted",
  "floorplan-resized": "Floor plan resized",
  "low-confidence": "Low match confidence",
};

/** One line saying why it needs a human — shown under the warning group's title. */
export const WARNING_WHY: Record<WarningKind, string> = {
  "source-conflict":
    "The source value changed underneath an edit you made. Yours is still applied.",
  clash: "Now collides with another object on the new floor plan.",
  "out-of-bounds": "Now falls outside the new floor plan's boundary.",
  "re-removed":
    "You removed this before. It is back in the source and has been removed again.",
  "override-removed":
    "The new floor plan does not contain an object you had edited. Confirming this removal discards that edit.",
  "georeference-shifted":
    "The new floor plan is positioned differently to the published one.",
  "floorplan-resized":
    "The new floor plan covers a different area to the published one.",
  "low-confidence":
    "MapScale matched this to the published feature with low confidence.",
};

/**
 * Below this, a geometry change is treated as risky on its own — the engine is saying it is not
 * sure the new shape is the same object. Gap 13: the score should drive order, not just be printed.
 */
export const SIMILARITY_WARN = 0.7;

export interface Change {
  id: string; // feature.properties.fid
  name: string; // feature.properties.name
  type: ChangeType;
  detail?: string; // e.g. 'Type: "Restaurant" → "Cafe"'
  /**
   * One line per attribute that moved, in the real report's voice ("Name changed: from X to Y",
   * "Geometry modified — similarity 0.73"). A single feature routinely has several.
   */
  details?: string[];
  /** The object type MapScale reports it as — retail-space, meeting-room-chair, wall… */
  kind?: string;
  /** Why this is risky. Present ⇒ warning. Absent ⇒ see `riskOf()`, which also reads similarity. */
  warning?: WarningKind;
  /** 0–1, geometry changes only. The report carries it; below SIMILARITY_WARN it raises a warning. */
  similarity?: number;
  decision?: Decision; // Review & Finalise — client state
  /**
   * ⚠️ **`markOnly` and `note` were removed 2026-08-25, with flagging.**
   *
   * `markOnly` drew a decision mark on Map Content *without* the diff shape, so a flag could
   * outlive its review and stay findable on the live floor. Nothing outlives a review any more:
   * Olcay, 2026-08-25 — *"once review concluded the map becomes the current map"*. An edit made
   * during the review is simply in the data, and shows up on the **next** run as a `preserved`
   * override, which is the honest place for it. `note` went with the flag it annotated.
   */
  geometry?: unknown; // GeoJSON.Geometry — for the map highlight
}

/**
 * The two `WarningKind`s that are **facts about the floor**, not about any one object — US10's
 * georeference shift and US7's "the new plan is a different size" edge cases.
 */
export type FloorWarningKind = Extract<
  WarningKind,
  "georeference-shifted" | "floorplan-resized"
>;

/**
 * **D16, fixed 2026-08-13.** These used to have nowhere to live: the only slot for a warning was
 * `Change.warning`, so saying "the floor moved" meant picking an arbitrary feature and hanging the
 * warning off it — which reads as *"Costa Coffee: georeference shifted"* when what moved was
 * everything. A whole-floor fact now travels with the diff itself and renders **above** the
 * changelog, where it scopes every row beneath it instead of impersonating one.
 */
export interface FloorWarning {
  kind: FloorWarningKind;
  /** The measured statement — "8% larger", "shifted 1.4 m north-east". Never a bare restatement. */
  detail: string;
}

export interface DiffResult {
  changes: Change[];
  magnitudePct: number; // share of floor AREA changed → <20 auto · 20–50 review · >50 manual
  /**
   * Whole-floor conditions, if any. Empty for most updates. Never merged into `changes`: US10
   * requires the engine to *continue* processing everything else, so these scope the list rather
   * than joining it.
   */
  floorWarnings: FloorWarning[];
}

export type MagnitudeBand = "minor" | "medium" | "large";

/**
 * The traffic light, per the "Automatic Map Updates" user stories (US3/4/5):
 *   Green  (<20% of sqft)   → published automatically, no intervention
 *   Amber  (20–50% of sqft) → notify; auto-publishes after the grace period (7 days by default)
 *                             unless reviewed; on review you may cancel the publish or publish now
 *   Red    (>50% of sqft)   → NEVER auto-published, but publishable manually at any time.
 *                             Red is also returned when the engine cannot match (B) or cannot
 *                             process (C) the floorplan — see MAP-566_AUDIT.md §2.
 * The measure is the share of **floor area**, not a count of features — the MapScale Update Report
 * calls it "Ratio of the modified area".
 */
export const MAGNITUDE = { minorBelow: 20, largeAbove: 50 };

/**
 * US5: Red is one band with three causes, and they behave differently:
 *   A `large-change`   — >50% of floor area. **Rejected outright** (Olcay, 2026-08-10, ruling the
 *                        Q9 dev note): a change this large is assumed unrealistic unless major
 *                        construction happened — more likely the wrong file, or a line-up failure
 *                        that slipped past the matcher. No review, no publish; upload a corrected
 *                        floor plan, or contact support if the construction is real. This
 *                        supersedes US5-A's "review link + publishable anytime" acceptance
 *                        criteria (decision 9). Implied by the band, never stored.
 *   B `cannot-match`   — the engine produced content but couldn't align it with the published
 *                        map, so there is no reliable ratio. Review is offered (the whole floor
 *                        needs eyes); the magnitude block explains instead of counting.
 *   C `cannot-process` — the engine couldn't read the file at all. Nothing exists to review or
 *                        publish, so the only offers are the error and a fresh upload.
 *
 * The A-guard targets suspect *uploads*. A **restore** is deliberate re-submission of known-good
 * content, so it never trips it — restores review at any size (the mock keeps its demo under the
 * threshold).
 */
export type RedCause = "large-change" | "cannot-match" | "cannot-process";

export const RED_CAUSE_COPY = {
  "large-change": {
    card: (pct: number) => `Rejected · ${pct}% of floor area changed`,
    error:
      "A change this large is unrealistic unless major construction happened — more likely the wrong file, or a floor plan that couldn't be lined up with the published map. Check the floor plan and upload a corrected file. If this really is new construction, get in touch with our support team.",
  },
  "cannot-match": {
    card: "Needs your decision · couldn't match the floor plan",
    title: "Match failed",
    detail:
      "MapScale couldn't align the new floor plan with the published map, so there is no reliable change ratio — the whole floor needs your eyes.",
  },
  "cannot-process": {
    card: "Couldn't process the floor plan",
    error:
      "The file couldn't be read as a floor plan — usually an unsupported or corrupted CAD export. Check the export settings, then upload a new floor plan.",
  },
};

/**
 * The grace period (US4): Amber publishes itself after this many days unless someone intervenes.
 * Client-wide (§6 decision 6).
 *
 * **Getters, not values** (2026-08-11, when S5 was built). These used to be the literals
 * `{ default: 7, demoLeft: 6 }` with a comment promising that S5 would make them configurable.
 * It does now — the numbers live in `mock/settings.ts` — and reading them through getters keeps
 * every existing `GRACE_DAYS.demoLeft` call site working while making it react to the screen that
 * sets it. A plain object here would have frozen at module-eval and quietly ignored Settings.
 *
 * `demoLeft` is how far into the countdown the seeds are: the demo is one day in, so a 7-day
 * period shows 6 left. It floors at 0 rather than going negative for the sub-day options.
 */
export const GRACE_DAYS = {
  get default(): number {
    return graceDays(getSettings().graceSeconds);
  },
  get demoLeft(): number {
    return Math.max(0, graceDays(getSettings().graceSeconds) - 1);
  },
};

/**
 * Does Pointr's mapping team check the result before the customer sees it? A **Settings** flag —
 * S5 built it (2026-08-11), so this reads the store rather than being the compile-time constant
 * it was. A function, not a const, precisely because it can change while the app is running.
 *
 * Expert review runs **before** the customer's review (Olcay, 2026-08-09 — reversing the earlier
 * decision). The experts prune MapScale's over-reporting, so the modified-area ratio the customer
 * is shown is the *post-expert* number: usually much lower, often low enough to fall in Green and
 * publish automatically with no one having to look at it. That also settles who owns the number in
 * `MAP-566_AUDIT.md` §7 Q3 — it is the mapping team's, not the raw engine's.
 *
 * Turned off, the raw MapScale result goes straight to the customer and the % is the engine's own.
 */
export function expertReviewEnabled(): boolean {
  return getSettings().expertReview;
}

/* ── the expert-review hold (S2 — warn-but-allow, Olcay 2026-08-10) ───────── */

/**
 * Which level the mapping team currently holds. The sibling of `EXPERT_REVIEW_ENABLED`: that says
 * the phase exists at all, this says who is in it. The real thing reads the job's
 * `resultExtra.internalStatus` (build_plan §5), and both seams disappear together when it lands.
 */
export const EXPERT_REVIEW_LEVEL = 2;

/**
 * The level carrying the reviewable amber arrival — B2, "Departures - Terminal 3". Moved here from
 * `MapContent.tsx` on 2026-08-13 so the tree's tag, `seedVersions()` and `seedFloorWarnings()` read
 * one constant instead of three copies of `-2`; `mock/` owns the demo data, and the screens read it.
 */
export const NEW_VERSION_LEVEL = -2;

/**
 * Is Pointr's mapping team currently working on this level?
 *
 * With experts running first (handoff §6 decision 4) most jobs land Green and publish unseen — so
 * this is not a waiting room on the way to review, it is the only screen many customers ever see
 * of an update. Every frame-changing control has to ask this question (see EXPERT_HOLD).
 *
 * Building-aware since 2026-08-11, for the same reason `seedVersions()` is: index alone put a
 * hold on every building's L2, including ones whose seeded timeline says nothing of the sort.
 */
export function isUnderExpertReview(
  levelIndex: number,
  buildingId: string = T3_ID,
): boolean {
  return (
    expertReviewEnabled() &&
    buildingId === T3_ID &&
    levelIndex === EXPERT_REVIEW_LEVEL
  );
}

/**
 * S2 began as a hard read-only lock (Ege on MAP-566: *"the user cannot touch their map until the
 * Mapping Team is done"*) and was **reversed the day it was built** (Olcay, 2026-08-10): the
 * customer keeps working while the team does, warned that the team's corrections may override
 * theirs. "Let them play."
 *
 * The line between allowed and locked is **mergeability, not ownership**:
 *
 * - **Field-level edits merge.** Metadata and settings are exactly what US7's preservation
 *   machinery reconciles — a user edit with a source that moved underneath it surfaces in the
 *   changelog as an override with a source-conflict warning. So they stay open, warned.
 * - **Frame-changing operations don't merge** — they move or replace the substrate the experts
 *   are correcting in, so they stay locked:
 *     · **georeferencing** (Figma `2090:16799`, the named exception) — re-aligning the floor
 *       moves every correction the team has made with it
 *     · **uploading a new floor plan** — replaces the input mid-correction (newest-wins would
 *       silently discard their work)
 *     · **restore** — replaces the content wholesale; an upload by another name
 *     · **deleting the level** — destroys the subject
 *
 * Precedence — ruled (Olcay, 2026-08-10 evening, answering audit Q7): **the team's corrections
 * win.** The floor-plan that went to the experts is a frozen snapshot; whatever the user edits
 * during the hold is "for playing around" — it does NOT get the US7 kept-and-warned treatment
 * when the result lands. The mapping team *may choose* to fold those updates into their result,
 * which is why "may be overridden" (not "will be") stays the honest wording. US7's preservation
 * machinery still covers the normal case: edits made *between* updates, reconciled when the next
 * floor-plan arrives.
 */
export const EXPERT_HOLD = {
  /** The banner across the top of the panel — a caution, not a lock. */
  banner:
    "Pointr's Mapping Team is reviewing this floor. You can keep editing — changes may be overridden by their corrections.",
  /** The chip over the map, which carries no controls of its own to explain. */
  mapTitle: "Mapping Team is reviewing this floor",
  mapDetail: "Changes you make may be overridden by their corrections.",
  /** The status card's info tooltip: what is happening, and what decides what happens next. */
  what: "Pointr's mapping team is correcting MapScale's result before you see it. The floor they're working on is a snapshot — you can keep editing meanwhile, but their corrections take precedence when the result lands (the team may fold your updates in). Once they finish, how much of the floor area changed decides what happens next: minor updates publish automatically, larger ones come to you for review.",
  /** Per-action reasons, hung off each locked control where the question is asked. */
  upload:
    "Locked during Expert Review — a new floor plan would replace the one the mapping team is correcting.",
  restore:
    "Locked during Expert Review — restoring would replace the content the mapping team is correcting.",
  remove:
    "Locked during Expert Review — the mapping team is working on this level.",
  georeference:
    "Locked during Expert Review — re-aligning the floor plan would move it under the mapping team's corrections.",
};

/** The hold's tone (Figma 2450:65 / 2450:69): amber, because it is a caution, not a failure. */
export const HOLD_TONE = {
  tint: "#fff7e0",
  border: "#edc759",
  ink: "#805905",
  dot: "#D98C0D",
};

/* ── versions ─────────────────────────────────────────────────────────────── */

/**
 * A version is a floor-plan revision of ONE level, created the moment a file arrives — before
 * MapScale runs — so a job that fails to process still has something to attach its error to.
 *
 * `source` matters as much as the number: a level's history interleaves dashboard uploads and API
 * ingests, and "who sent this" is the first question when two of them land close together.
 */
export type VersionSource = "dashboard" | "api";

/**
 * What actually arrived. The section is a timeline of arrivals, and MapScale is a per-version
 * processing step, not the section's subject: a **floor-plan** file (DWG/DXF/PDF) is what MapScale
 * requires and runs on; **GeoJSON** is already-mapped vector content, so it skips MapScale
 * entirely. v9's Add-level flow accepts both ("Supported File Types: GeoJSON & DWG/DXF").
 * A restore re-submits an old version's mapped content, so it behaves like the GeoJSON path.
 */
export type VersionInputKind = "floor-plan" | "geojson";

export const KIND_LABEL: Record<VersionInputKind, string> = {
  "floor-plan": "Floor plan",
  geojson: "GeoJSON",
};

export interface VersionInput {
  kind: VersionInputKind;
  file: string;
}

export type VersionState =
  | "created" // level created, no floor plan yet
  | "processing" // MapScale is mapping it; frame-changing actions are held (JOB_RUNNING)
  | "expert-review" // Pointr's mapping team is correcting the result
  | "needs-review" // amber — publishes after the grace period unless reviewed
  | "needs-decision" // red cause B — never auto-published, always manually publishable
  | "rejected" // red cause A — >50%, unrealistic, rejected outright (decision 9); no review, no publish
  | "failed" // red cause C — the job couldn't read the file; nothing exists to publish
  | "published";

export const VERSION_STATE_LABEL: Record<VersionState, string> = {
  created: "Created",
  processing: "Processing",
  "expert-review": "Expert Review",
  "needs-review": "Needs your review",
  "needs-decision": "Needs your decision",
  rejected: "Rejected",
  failed: "Processing failed",
  published: "Published",
};

export const SOURCE_LABEL: Record<VersionSource, string> = {
  dashboard: "Dashboard",
  api: "API",
};

export interface LevelVersion {
  n: number;
  source: VersionSource;
  /** Already formatted — the mock has no clock, and the real thing formats server-side anyway. */
  at: string;
  state: VersionState;
  /** Share of floor area changed vs the version before it. Absent on the first version. */
  changePct?: number;
  /** Who sent it. Concurrency starts here: two people uploading to one level is the common case. */
  by?: string;
  /** What arrived. A floor-plan input doubles as the level's blueprint overlay on the map. */
  input: VersionInput;
  /** Set when this version was created by restoring an older one — lineage, never a rewrite. */
  restoredFrom?: number;
  /**
   * Why a red outcome is red, when it isn't the band's own arithmetic: `cannot-match` (B) and
   * `cannot-process` (C) are stored; cause A (`large-change`) is carried by the `rejected` state
   * itself — the seed tags it too, but `changePct` > 50 alone implies it (decision 9).
   */
  redCause?: RedCause;
}

/**
 * Newest first, as the dashboard lists them. v1 created the level from already-mapped GeoJSON,
 * v2 is the floor-plan revision that is live today, and whether there is a v3 — and what state it
 * is in — depends on **which level of which building**, kept in step with `levelTagsFor()` in
 * MapContent.tsx: the tag you clicked in the tree and the status card you land on must always tell
 * the same story. The editor seeds its phase from `versions[0].state`.
 *
 * **`buildingId` was added 2026-08-11**, when the notification feed flattened the whole site into
 * one list and three buildings each claimed the same 62% rejection. The seeds keyed on level index
 * alone, so *every* building with an L3 was rejected and every building with an L2 was under an
 * expert hold — wrong in the tree too, just easy to miss there, because you only ever have one
 * building expanded. It defaults to the demo building so a caller without one still demos.
 */
export function seedVersions(
  short: string,
  levelIndex: number,
  buildingId: string = T3_ID,
): LevelVersion[] {
  const history: LevelVersion[] = [
    {
      n: 2,
      source: "dashboard",
      at: "10 Jul 2025 · 09:14",
      state: "published",
      changePct: 10,
      by: "Ege Akpinar",
      input: { kind: "floor-plan", file: `${short}-departures-rev2.dwg` },
    },
    {
      n: 1,
      source: "dashboard",
      at: "02 Jun 2025 · 15:20",
      state: "published",
      by: "Olcay Kurtulus",
      input: { kind: "geojson", file: `${short}-initial-content.geojson` },
    },
  ];

  const arrival = (state: VersionState, changePct?: number): LevelVersion => ({
    n: 3,
    source: "api",
    at: "09 Aug 2026 · 18:21",
    state,
    changePct,
    by: "Airport Ops (API)",
    input: { kind: "floor-plan", file: `${short}-departures-rev3.dwg` },
  });

  // Red cause B (cannot-match) is the one demo that deliberately lives OUTSIDE the demo building:
  // it needs level 4, and Terminal 3 hasn't got one — only Concourse A has (handoff §17).
  if (buildingId === CONCOURSE_A_ID && levelIndex === 4)
    return [
      { ...arrival("needs-decision"), redCause: "cannot-match" },
      ...history,
    ];

  // Everything else belongs to Terminal 3 and B Gates. Other buildings get the quiet two-version
  // history — which is what the tree always meant to say about them.
  if (buildingId !== T3_ID) return history;

  // The three traffic-light cases live on three Terminal 3 levels (Olcay, 2026-08-10):
  //   Green  <20%  → level 0  (Connection Floor, 12% — auto-published, nothing to review)
  //   Amber 20–50% → level -2 (B2, 30% — the full review demo, its diff has real geometry)
  //   Red   >50%   → level 3  (EK Lounges, 62% — rejected outright, cause A)
  // Cause C (cannot-process) isn't seeded anywhere — it is the upload cycle's fourth step.
  if (levelIndex === 3)
    return [
      { ...arrival("rejected", 62), redCause: "large-change" },
      ...history,
    ]; // Red — cause A, rejected
  if (levelIndex === 0) return [arrival("published", 12), ...history]; // Green — auto-published
  if (levelIndex === 1) return [arrival("needs-review", 30), ...history]; // Amber — grace running
  if (levelIndex === EXPERT_REVIEW_LEVEL && expertReviewEnabled())
    return [arrival("expert-review"), ...history]; // the mapping team holds it (S2)
  if (levelIndex === -2) return [arrival("needs-review", 30), ...history]; // Amber — B2, the review demo
  return history;
}

/** The version the published map currently shows — the newest one that reached `published`. */
export function liveN(versions: LevelVersion[]): number | undefined {
  return versions
    .filter((v) => v.state === "published")
    .map((v) => v.n)
    .sort((a, b) => b - a)[0];
}

/**
 * How a version reads in a history list. **Live and Superseded are derived, never stored**:
 * "published" is a fact about the version's past, "live" is a fact about the level now, and
 * storing the second would let the two drift. Anything overtaken by a newer version reads
 * Superseded — newest wins (§11); warning the person whose review is being superseded before it
 * happens is still an open gap.
 */
export function versionBadge(
  versions: LevelVersion[],
  v: LevelVersion,
): { label: string; live: boolean } {
  if (v.state === "published")
    return v.n === liveN(versions)
      ? { label: "Live", live: true }
      : { label: "Superseded", live: false };
  const overtaken = versions.some((o) => o.n > v.n);
  if (overtaken && v.state !== "created")
    return { label: "Superseded", live: false };
  return { label: VERSION_STATE_LABEL[v.state], live: false };
}

/**
 * Restore re-publishes old *mapped* content, so only versions that actually went live qualify —
 * and not the live one, because restoring it would be a no-op.
 */
export function isRestorable(
  versions: LevelVersion[],
  v: LevelVersion,
): boolean {
  return v.state === "published" && v.n !== liveN(versions);
}

/**
 * Why THIS version offers no Restore — the row wears the reason instead of hiding the control
 * (same law as the expert hold's locks: a control that vanishes teaches nothing). Olcay's
 * question "why don't we have restore for all items?" is exactly what a hidden control invites.
 */
export function restoreBlockReason(
  versions: LevelVersion[],
  v: LevelVersion,
): string | undefined {
  if (isRestorable(versions, v)) return undefined;
  if (v.state === "published")
    return "This is the live version — restoring it would change nothing.";
  if (v.state === "created" || v.state === "processing")
    return "Nothing to restore — this version never finished processing, so it has no mapped content.";
  if (v.state === "failed")
    return "Nothing to restore — processing failed, so this version has no mapped content.";
  // superseded needs-review / needs-decision / rejected / expert-review: content exists but nobody
  // ever approved it — restoring must return to a KNOWN-GOOD state, and unpublished isn't one.
  return "Never published — only content that actually went live can be restored.";
}

/**
 * Restore, in one sentence: an **append-only re-submission**. It creates a NEW version carrying an
 * old one's content and walks the same pipeline as any arrival — minus MapScale (there is no
 * floor-plan to re-map) and minus Expert Review (nothing engine-reported to prune) — so it lands
 * straight at the traffic light. The diff vs the published map still gates it: restoring away
 * months of later edits is usually a large change, so it lands Red and waits for an explicit
 * publish. That is the protection working, not friction — it is also exactly where the US7
 * preservation warnings matter most, because your own dashboard edits are the thing at stake.
 * History is never rewritten; the restored-from version keeps its place.
 */
export const RESTORE_COPY = {
  action: "Restore",
  title: (n: number) => `Restore Version ${n}?`,
  body: (n: number, next: number) =>
    `Creates Version ${next} from Version ${n}'s map content and compares it against the published map. Nothing is deleted.`,
  detail: "Skips MapScale and Expert Review — this content was already mapped.",
};

/** Why Upload new / Restore are unavailable while the pipeline is running. */
export const JOB_RUNNING = "A MapScale job is already running for this level.";

/**
 * Bind a change set to the features that are ACTUALLY on the floor being shown.
 *
 * The seeds name B2's units, because that is the floor whose tiles the demo diff was harvested
 * from. On any other level — EK Lounges, Concourse A's L4, a building the wizard just created —
 * those names resolve to nothing, so the panel listed changes beside a map with no highlights
 * (old defect D4). The map now reports its floor's named polygons and this rebinds each row to
 * one of them, so the list and the map always describe the same place.
 *
 * What is preserved is the *story*: every row keeps its type, risk, warning, bullets and decision;
 * only the feature it points at changes. Rows whose seeded name is already present on this floor
 * keep it — B2 therefore renders exactly as it always did, which is what makes this safe.
 *
 * `preserved` rows are bound too: a user override is a real feature like any other.
 */
export function bindToFloor(changes: Change[], available: string[]): Change[] {
  if (!available.length) return changes;
  const onFloor = new Set(available);
  // names this floor offers that the seed didn't already claim, in the map's own order (biggest
  // first) so the highlights land on units a reviewer can actually see
  const claimed = new Set(
    changes.filter((c) => onFloor.has(c.name)).map((c) => c.name),
  );
  const spare = available.filter((n) => !claimed.has(n));
  let next = 0;
  return changes.map((c) => {
    if (onFloor.has(c.name)) return c;
    const name = spare[next++];
    // ran out of real features: keep the seeded name rather than inventing a duplicate — the row
    // simply won't highlight, which is the honest outcome for a floor with too little content
    return name ? { ...c, name } : c;
  });
}

export function magnitudeBand(pct: number): MagnitudeBand {
  if (pct < MAGNITUDE.minorBelow) return "minor";
  return pct > MAGNITUDE.largeAbove ? "large" : "medium";
}

/** Traffic-light colours — reserved for magnitude, never for a change type, risk or a decision. */
/**
 * `onSolid` is the ink that goes ON the `solid` surface, and it is **per band on purpose**
 * (Olcay, 2026-08-14: *"not enough contrast, black on red"*).
 *
 * One shared ink `#3A2A00` used to sit on all three. It is an amber ink and it measures
 * **6.8:1 on amber** and **5.8:1 on green** — but only **3.66:1 on red**, which fails WCAG AA for
 * the 12px detail line underneath. White on the old `#EF4444` was worse still at 3.76:1, so the
 * surface had to move, not just the ink: `large.solid` is now **`#B42318`** — the band's own `ink`
 * value, so no new hue enters the palette — and carries **white at 6.62:1**.
 */
export const BAND: Record<
  MagnitudeBand,
  {
    tint: string;
    border: string;
    ink: string;
    solid: string;
    onSolid: string;
    title: string;
    detail: string;
  }
> = {
  minor: {
    tint: "#F1FBF5",
    border: "#B7E4C7",
    ink: "#1E7A46",
    solid: "#2FBF71",
    onSolid: "#3A2A00",
    title: "Auto-published",
    detail: "Minor change — published automatically, nothing to review.",
  },
  medium: {
    tint: "#FFF8EC",
    border: "#F5D08A",
    ink: "#8A5A00",
    solid: "#F5A623",
    onSolid: "#3A2A00",
    title: "Ready for your review",
    // a getter for the same reason GRACE_DAYS is one — a template literal here would bake in
    // whatever the grace period was when the module first loaded
    get detail(): string {
      return GRACE_DAYS.demoLeft === 0
        ? "Publishes automatically today unless you review it."
        : `Publishes automatically in ${GRACE_DAYS.demoLeft} days unless you review it.`;
    },
  },
  large: {
    tint: "#FEF2F2",
    border: "#F3B4B4",
    ink: "#B42318",
    solid: "#B42318",
    onSolid: "#FFFFFF",
    title: "Needs your decision",
    detail:
      "Never published automatically. Review it, then publish when you're ready.",
  },
};

/**
 * Four colours, five types: geometry and metadata are both "updated" to the eye.
 *
 * **These are DS tokens now** (Olcay, 2026-08-11 — "let's add semantic diff"). They used to be
 * hardcoded hex with a note saying no published equivalent existed, which was true and was also
 * the reason to add one rather than to bend them onto `--semantics-data-*` (charts — and its blue
 * is a different blue). `Semantics/Diff/{New,Updated,Deleted,Override}` now ships in
 * `@kozmos-ds/tokens`, so the map's diff encoding is design-system law rather than five literals
 * copied between files.
 *
 * It also makes them **theme-aware**: the app mounts a ThemeProvider and loads all the token
 * variables, so every hardcoded hex was silently a dark-mode bug. The dark values keep the hue and
 * lift the lightness — identity has to survive the theme, because this colour says what a feature
 * *is*.
 *
 * ⚠️ `public/map/index.html` keeps its own literal copy of these four, and must: the iframe is a
 * standalone page that never loads the DS stylesheet, so `var()` would resolve to nothing there.
 * Change one, change both — see the note beside its `COLORS`.
 */
export const CHANGE_COLORS: Record<ChangeType, string> = {
  new: "var(--semantics-diff-new)",
  geometry: "var(--semantics-diff-updated)",
  metadata: "var(--semantics-diff-updated)",
  deleted: "var(--semantics-diff-deleted)",
  preserved: "var(--semantics-diff-override)",
};

/**
 * **The decision mark is muted ink, and the map carries the decision itself** (Olcay, 2026-08-25).
 *
 * This ends the `COLOURED_DECISIONS` experiment and, in doing so, restores the rule it suspended
 * on 2026-08-13 — *"a decision never recolours anything"* — by a route neither side foresaw. The
 * argument for colouring the marks was that a decision was invisible until you found its badge.
 * That is no longer true: the map is now a **preview of the finalised floor**, so a confirmed
 * change simply *is* the map, a rejected one falls back to the published shape, and an edit paints
 * override purple. The outcome is legible in the geometry before any mark is read.
 *
 * Which leaves the mark as a footnote on a shape that already says the answer — so it is drawn in
 * muted ink, and never in green or red. Spending the traffic light twice on one map was the
 * original objection and it was always the right one.
 *
 * ⚠️ **`#5d626f`, not `#737373` — ruled 2026-08-27.** Figma's tray drew `background-600` while the
 * app drew `--review-muted`, and the two greys had been a hair apart since the marks were built.
 * Olcay chose Figma's. It is also the better one: **6.10:1** on white against 4.74:1, which matters
 * for an 18px glyph and for the ghost's dashed hairline, and it sits closer to the ✎'s 7.10 so the
 * tray reads as one family rather than as two weights.
 */
export const DECISION_INK = "#5d626f"; // Colors/background/600

/**
 * The ink an **edited** row draws in — the override purple, and the same fact `preserved` wears.
 *
 * A `preserved` row is *"your override, carried through from a previous run"*; an edit made during
 * this review is your override about to be carried through from this one. They are the same fact
 * at two ages, and giving them one colour is what closes the loop: finish a review with an edit on
 * it, and that feature comes back purple next time MapScale runs.
 *
 * ⚠️ **NOT `--semantics-diff-override`, and this is the one place the two part company.** The DS
 * publishes that token at **#9c6eff**, which is the SHAPE FILL — on white it measures about
 * **3.3:1**, below the 4.5:1 a 11–13px label needs, so a pill and a detail line drawn in it are
 * legible only to someone who already knows what they say. This is the darker half of the same
 * pair — the value the map shell has always used for the `preserved` **stroke** (`LINE.preserved`)
 * — at roughly 7.4:1.
 *
 * **`changeAccent` still returns the token**, because a 4px accent bar is a shape and the token is
 * correct there. Ink and fill are two jobs; the DS ships one of them.
 *
 * 🔴 **Token debt**: `Semantics/Diff` has no `override-ink`. Every other diff colour has the same
 * gap and gets away with it because nothing else draws diff-coloured TEXT. Worth filing against
 * the DS rather than spreading this literal — see `KOZMOS_DS_IMPROVEMENTS.md`.
 */
export const OVERRIDE_INK = "#6D28D9";

/**
 * ⚠️ **`COLOURED_DECISIONS` was retired 2026-08-25.** It was a one-switch experiment (Olcay,
 * 2026-08-11: *"I'd like to try coloring the flags… so make it easy to revert"*) that painted
 * ✓ green, 🚩 amber, ✗ red. The switch is gone rather than flipped: the reason to colour a mark
 * was that the map said nothing about the outcome, and the preview now says all of it. See
 * `DECISION_INK`.
 *
 * ⚠️ The map page keeps its own copy of this ink — it never loads this module
 * (`public/map/index.html`, search `DECISION_INK`). Change one, change both.
 */

/** The ink a mark draws in. Muted for a decision; the override purple for an edit. */
export function outcomeInk(o?: Outcome): string {
  return o === "edited" ? OVERRIDE_INK : DECISION_INK;
}

/**
 * Colour for a row/feature.
 *
 * Normally the diff type — colour says **what a feature is**, and that rule has survived every
 * other change to this file. An **edited** row is the one case where the type is no longer the
 * truth: MapScale said "new", you replaced its answer with your own, and what is now heading for
 * the floor is *your override*. So it takes the override purple, which is the colour that fact
 * already has (`preserved`), and the two are the same fact at two ages — see `OVERRIDE_INK`.
 */
export function changeAccent(c: Change, override?: Override): string {
  return override ? CHANGE_COLORS.preserved : CHANGE_COLORS[c.type];
}

/* ── the four metric boxes (v9 node 12826:126197) ─────────────────────────── */

/** The tally keeps v9's four categories, so geometry + metadata both count as "Updated". */
export type MetricCategory = "preserved" | "new" | "updated" | "deleted";

export const METRIC_ORDER: MetricCategory[] = [
  "preserved",
  "new",
  "updated",
  "deleted",
];

export const METRIC_LABEL: Record<MetricCategory, string> = {
  preserved: "User Override",
  new: "New Items",
  updated: "Updated",
  deleted: "Removed",
};

export const METRIC_COLOR: Record<MetricCategory, string> = {
  preserved: CHANGE_COLORS.preserved,
  new: CHANGE_COLORS.new,
  updated: CHANGE_COLORS.geometry,
  deleted: CHANGE_COLORS.deleted,
};

export function inMetric(c: Change, m: MetricCategory): boolean {
  return m === "updated"
    ? c.type === "geometry" || c.type === "metadata"
    : c.type === m;
}

/* ── risk + grouping ──────────────────────────────────────────────────────── */

/** An explicit warning wins; otherwise a geometry change the engine isn't sure about is risky. */
export function riskOf(c: Change): Risk {
  if (c.warning) return "warning";
  if (
    c.type === "geometry" &&
    c.similarity !== undefined &&
    c.similarity < SIMILARITY_WARN
  )
    return "warning";
  return "notice";
}

/** The warning to show — explicit, or the one implied by a low similarity score. */
export function warningOf(c: Change): WarningKind | undefined {
  if (c.warning) return c.warning;
  if (
    c.type === "geometry" &&
    c.similarity !== undefined &&
    c.similarity < SIMILARITY_WARN
  )
    return "low-confidence";
  return undefined;
}

/** How a group of this type is named — the report's taxonomy, in the dashboard's voice. */
export const TYPE_GROUP_LABEL: Record<ChangeType, string> = {
  new: "Added",
  geometry: "Geometry changed",
  metadata: "Details changed",
  deleted: "Removed",
  preserved: "Kept — your edit",
};

/** Plain-language plural of a MapScale object type: `food-beverage-space` → "food & beverage spaces". */
export function humanKind(kind: string | undefined, count: number): string {
  if (!kind) return count === 1 ? "object" : "objects";
  const words = kind.replace(/-/g, " ").replace(/\bbeverage\b/, "& beverage");
  if (count === 1) return words;
  return /s$/.test(words) ? words : `${words}s`;
}

export interface ChangeGroup {
  key: string;
  /** "Added · retail spaces" — a collapsed bucket standing in for many rows of one object type. */
  title: string;
  changes: Change[];
}

/**
 * Collapse a (change type × object type) bucket into one counted row only ABOVE this many members.
 *
 * The report's "15 new meeting-room-chairs are added" is a real problem at 139 chairs and a
 * non-problem at 22 changes: grouping everything turned the changelog into a dozen identical grey
 * boxes you had to click to see anything, and threw away the type colours that made the list
 * readable at a glance. So the list stays flat and coloured, and collapsing is what happens when a
 * single bucket would otherwise flood it.
 */
export const COLLAPSE_ABOVE = 6;

/** One coloured section of the changelog — the v9 shape: NEW · UPDATED · REMOVED · USER OVERRIDES. */
export interface ReviewSection {
  key: MetricCategory;
  label: string;
  color: string;
  /** Rendered as individual coloured rows. Risky ones first. */
  rows: Change[];
  /** Only buckets big enough to flood the list (> COLLAPSE_ABOVE of one object type). */
  groups: ChangeGroup[];
  count: number;
}

export const SECTION_LABEL: Record<MetricCategory, string> = {
  new: "NEW",
  updated: "UPDATED",
  deleted: "REMOVED",
  preserved: "USER OVERRIDES",
};

/** New first, then the things that changed, then removals, then your own edits as context. */
export const SECTION_ORDER: MetricCategory[] = [
  "new",
  "updated",
  "deleted",
  "preserved",
];

/**
 * The changelog: sections by change type, each one colour-keyed, rows visible.
 *
 * US8's risk split is carried **on the rows**, not as a container — risky changes sort to the top of
 * their section and wear a warning mark. Making risk the outer container (Warnings ▸ / Notices ▸)
 * was tried and reverted: it hid every change behind a chevron and drained the type colour that
 * makes the list scannable, which is the whole point of the panel.
 *
 * Within a section, order is: warnings first, least-confident geometry first among those (the
 * engine's own doubt is the best ordering signal we have), then the rest as seeded.
 */
export function buildSections(changes: Change[]): ReviewSection[] {
  const byRisk = (a: Change, b: Change) => {
    const ra = riskOf(a) === "warning" ? 0 : 1;
    const rb = riskOf(b) === "warning" ? 0 : 1;
    if (ra !== rb) return ra - rb;
    return (a.similarity ?? 1) - (b.similarity ?? 1);
  };

  return SECTION_ORDER.map((key) => {
    const inSection = changes.filter((c) => inMetric(c, key));

    // Only a bucket that would flood the section gets collapsed; everything else stays a real row.
    const byKind = new Map<string, Change[]>();
    for (const c of inSection) {
      const k = `${c.type}:${c.kind ?? "other"}`;
      byKind.set(k, [...(byKind.get(k) ?? []), c]);
    }
    const groups: ChangeGroup[] = [];
    const collapsed = new Set<Change>();
    for (const [k, cs] of byKind) {
      if (cs.length <= COLLAPSE_ABOVE) continue;
      groups.push({
        key: k,
        title: `${TYPE_GROUP_LABEL[cs[0].type]} · ${humanKind(cs[0].kind, cs.length)}`,
        changes: [...cs].sort(byRisk),
      });
      cs.forEach((c) => collapsed.add(c));
    }

    return {
      key,
      label: SECTION_LABEL[key],
      color: METRIC_COLOR[key],
      rows: inSection.filter((c) => !collapsed.has(c)).sort(byRisk),
      groups,
      count: inSection.length,
    };
  }).filter((s) => s.count > 0);
}

/**
 * The amber (30%) change set — 6 new · 7 updated · 6 removed · 5 user overrides — tagged onto
 * features that genuinely exist on the level under review — Dubai · Terminal 3 and B Gates ·
 * **levelIndex -2, "Departures - Terminal 3" (short title B2)**. Every row therefore has geometry
 * on the map. NB: this building numbers floors per terminal, so B2 is levelIndex -2; levelIndex 2
 * is "L2", Departures · Concourse B.
 *
 * Risk is *derived*, not hand-tagged, wherever the data can carry it: the two low-similarity
 * geometry changes below become warnings through `riskOf()`. Only the US7 preservation cases —
 * which the engine reports explicitly — set `warning` themselves.
 */
function amberChanges(): Change[] {
  return [
    // ── New ────────────────────────────────────────────────────────────────
    {
      id: "costa",
      name: "Costa Coffee",
      type: "new",
      kind: "food-beverage-space",
      detail: "New café",
      decision: "confirm",
    },
    {
      id: "ddfzone10",
      name: "DDF Zone 10",
      type: "new",
      kind: "retail-space",
      detail: "New retail zone",
      decision: "confirm",
    },
    {
      id: "giraffe",
      name: "Giraffe Pop-up Outlet",
      type: "new",
      kind: "retail-space",
      detail: "New pop-up unit",
      decision: "confirm",
    },
    {
      id: "desi",
      name: "Desi LunchBox",
      type: "new",
      kind: "food-beverage-space",
      detail: "New quick-service unit",
      decision: "confirm",
    },
    {
      id: "childcare",
      name: "Child Care",
      type: "new",
      kind: "amenity-space",
      detail: "New amenity",
      decision: "confirm",
    },
    {
      id: "prayerf",
      name: "Female Prayer Room",
      type: "new",
      kind: "faith-worship-space",
      detail: "New amenity",
      decision: "confirm",
    },

    // ── Geometry ───────────────────────────────────────────────────────────
    {
      id: "burgerking",
      name: "Burger King",
      type: "geometry",
      kind: "food-beverage-space",
      similarity: 0.73,
      detail: "Area & layout updated",
      details: ["Geometry modified — similarity 0.73", "Area: 84 m² → 96 m²"],
      decision: "confirm",
    },
    {
      id: "ddfzone11",
      name: "DDF Zone 11",
      type: "geometry",
      kind: "retail-space",
      similarity: 0.81,
      detail: "Renamed & reshaped",
      details: [
        'Name changed: from "DDF Zone 11" to "DDF Duty Free 11"',
        "Geometry modified — similarity 0.81",
      ],
      decision: "confirm",
    },
    {
      // similarity 0.66 → below SIMILARITY_WARN, so riskOf() raises a low-confidence warning
      id: "rostamani",
      name: "Al Rostamani Exchange",
      type: "geometry",
      kind: "service-space",
      similarity: 0.66,
      detail: "Geometry changed",
      details: ["Geometry modified — similarity 0.66"],
      decision: "confirm",
    },
    {
      id: "nursery",
      name: "Nursery",
      type: "geometry",
      kind: "amenity-space",
      similarity: 0.58,
      detail: "Moved & renamed",
      details: [
        'Name changed: from "Nursery" to "Baby Care Room"',
        "Geometry modified — similarity 0.58",
      ],
      decision: "confirm",
    },
    {
      id: "visacancel",
      name: "Visa Cancellation Services",
      type: "geometry",
      kind: "service-space",
      similarity: 0.79,
      detail: "Area reduced",
      details: ["Geometry modified — similarity 0.79", "Area: 31 m² → 22 m²"],
      decision: "confirm",
    },

    // ── Metadata ───────────────────────────────────────────────────────────
    {
      // Seeded EDITED, not decided — see SEEDED_OVERRIDES. These two carried `decision: "flag"`
      // until 2026-08-25 and were the demo of a deferred row; they are now the demo of a fixed one.
      id: "subway",
      name: "Subway",
      type: "metadata",
      kind: "food-beverage-space",
      detail: 'Type: "Restaurant" → "Cafe"',
      details: ['Type changed: from "Restaurant" to "Cafe"'],
    },
    {
      id: "ahlan",
      name: "Dubai Ahlan Counter",
      type: "metadata",
      kind: "service-space",
      detail: "Renamed",
      details: [
        'Name changed: from "Dubai Ahlan Counter" to "Ahlan Services Desk"',
      ],
    },

    // ── Removed ────────────────────────────────────────────────────────────
    {
      id: "pharmacy",
      name: "DDF Pharmacy",
      type: "deleted",
      kind: "retail-space",
      detail: "Removed from floor plan",
      decision: "reject",
    },
    {
      id: "wrapping",
      name: "Emirates Baggage Wrapping",
      type: "deleted",
      kind: "retail-space",
      detail: "Removed from floor plan",
      decision: "reject",
    },
    {
      id: "dilizie",
      name: "Dilizie",
      type: "deleted",
      kind: "food-beverage-space",
      detail: "Removed from floor plan",
      decision: "reject",
    },
    {
      // US7: you deleted this once already; it is back in the source and has been removed again
      id: "wrapmachine",
      name: "Wrapping Machine Area",
      type: "deleted",
      kind: "retail-space",
      warning: "re-removed",
      detail: "Removed from floor plan",
      details: [
        "You removed this in Version 2",
        "Present in the new source, removed again",
      ],
      /**
       * Rests APPLIED, and that is the point (Olcay, 2026-08-13: *"is it respecting the user's
       * removal — similar to user overrides?"*). It is: US7 says a manually removed object **must
       * remain removed**, so the system re-applies your removal and the row REPORTS it. It is not
       * asking you to decide. D17's "option to NOT remove" is the escape hatch from that default,
       * which is the reject control — hence its "Keep it" tooltip.
       *
       * ⚠️ I briefly made this `undefined` on the same day, reading "the user should be given an
       * option" as "the user must choose". Wrong: an option is an escape hatch from a default, not
       * the absence of one.
       */
      decision: "confirm",
    },
    {
      id: "ambulance",
      name: "Ambulance Services Room",
      type: "deleted",
      kind: "medical-space",
      detail: "Removed from floor plan",
      decision: "reject",
    },
    {
      /**
       * **The case US7 does not cover** (Olcay, 2026-08-13). US7 says overrides must be kept, and
       * it says source removals are changes — but never what happens when one object is both. The
       * two facts live on different axes: `type` is the object's FATE, `warning` is why a human is
       * needed. So this stays a removal, and wears the mark.
       *
       * It rests **undecided** — the opposite of the re-removal above, and for the opposite
       * reason: there, the answer is known (you already removed it). Here nothing can know whether
       * you want the object you invested in deleted, so the system must not choose for you.
       */
      id: "berlinroom",
      name: "Berlin Room",
      type: "deleted",
      kind: "service-space",
      warning: "override-removed",
      detail: "Removed from floor plan",
      details: [
        'You renamed this from "Room 10" in Version 2',
        "The new floor-plan does not contain it",
      ],
      decision: undefined,
    },

    // ── User overrides — your own dashboard edits, carried through untouched.
    // No review action applies to these; they're shown so you can see they survived.
    {
      // US7: the source value moved underneath your rename — yours still stands, but you should know
      id: "marhaba",
      name: "Marhaba Reception",
      type: "preserved",
      kind: "service-space",
      warning: "source-conflict",
      detail: "Your edit kept — source changed",
      details: [
        'You renamed "Marhaba" to "Marhaba Reception"',
        'Source now calls it "Marhaba Services"',
      ],
    },
    {
      id: "prm",
      name: "PRM Lounge  Reception",
      type: "preserved",
      kind: "service-space",
      detail: "Your earlier edit — kept",
      details: ['Type changed: from "Lounge" to "Assistance"'],
    },
    {
      // US7: a manually added object that now collides with the new floor plan
      id: "costaseating",
      name: "Costa Coffee Seating",
      type: "preserved",
      kind: "social-space",
      warning: "clash",
      detail: "Your edit kept — now overlaps",
      details: [
        "You added this in Version 2",
        "Overlaps the new Costa Coffee unit",
      ],
    },
    {
      id: "ekcustoms",
      name: "EK & Customs Counter",
      type: "preserved",
      kind: "service-space",
      detail: "Your earlier edit — kept",
      details: [
        'Name changed: from "EK Customs" to "EK & Customs Counter"',
        "Geometry changed",
      ],
    },
    {
      // US7's third preservation warning. It was declared in WarningKind but never seeded, so
      // "Outside the floor plan" could not appear on any screen (found 2026-08-11) — the new plan
      // is a different shape, and something you added now sits off it.
      id: "wrapdesk",
      name: "Wrapping Desk 2",
      type: "preserved",
      kind: "service-space",
      warning: "out-of-bounds",
      detail: "Your edit kept — now off the plan",
      details: [
        "You added this in Version 2",
        "The new floor plan's boundary no longer covers it",
      ],
    },
  ];
}

/**
 * The weight that makes 62% believable — a wing remodel on top of everything the amber set
 * already said (red ⊇ amber, so a story that grew from 30% to 62% stays recognisable). Every name
 * below was harvested from B2's live vector tiles (2026-08-10), so every row still highlights.
 *
 * The eight check-in counters are the point: a real large update hits whole families of one
 * object type — the report's "15 new meeting-room-chairs" case — and a bucket of 8 is what
 * finally trips COLLAPSE_ABOVE, so the changelog shows a counted group instead of a flood.
 */
function redExtras(): Change[] {
  return [
    // ── New — the remodel's anchors ─────────────────────────────────────────
    {
      id: "apm",
      name: "APM Station",
      type: "new",
      kind: "transit-space",
      detail: "New APM station",
      details: ["New automated people mover station", "Area: 1,240 m²"],
      decision: "confirm",
    },
    {
      id: "prayerm",
      name: "Male Prayer Room",
      type: "new",
      kind: "faith-worship-space",
      detail: "New amenity",
      decision: "confirm",
    },
    {
      id: "nbd",
      name: "Emirates NBD",
      type: "new",
      kind: "service-space",
      detail: "New bank branch",
      decision: "confirm",
    },

    // ── Geometry — the check-in row rebuilt (collapses: 8 of one kind) ─────
    {
      id: "bagdrop1",
      name: "Bag Drop Check-in 1",
      type: "geometry",
      kind: "check-in-counter",
      similarity: 0.55,
      detail: "Rebuilt",
      details: ["Geometry modified — similarity 0.55"],
      decision: "confirm",
    },
    {
      id: "baggagedrop",
      name: "Baggage Drop",
      type: "geometry",
      kind: "check-in-counter",
      similarity: 0.58,
      detail: "Rebuilt",
      details: ["Geometry modified — similarity 0.58"],
      decision: "confirm",
    },
    {
      id: "ekexpress",
      name: "Emirates F&J Express Check-in Counter",
      type: "geometry",
      kind: "check-in-counter",
      similarity: 0.63,
      detail: "Rebuilt",
      details: ["Geometry modified — similarity 0.63"],
      decision: "confirm",
    },
    {
      id: "ektickets",
      name: "Emirates Ticket Sales Counters",
      type: "geometry",
      kind: "check-in-counter",
      similarity: 0.72,
      detail: "Rebuilt",
      details: ["Geometry modified — similarity 0.72"],
      decision: "confirm",
    },
    {
      id: "ekticketing",
      name: "Emirates Ticketing Counter",
      type: "geometry",
      kind: "check-in-counter",
      similarity: 0.76,
      detail: "Rebuilt",
      details: ["Geometry modified — similarity 0.76"],
      decision: "confirm",
    },
    {
      id: "excessbag",
      name: "Excess Baggage Cashier",
      type: "geometry",
      kind: "check-in-counter",
      similarity: 0.81,
      detail: "Rebuilt",
      details: ["Geometry modified — similarity 0.81"],
      decision: "confirm",
    },
    {
      id: "fbcheckin",
      name: "First and Business Class Check-in",
      type: "geometry",
      kind: "check-in-counter",
      similarity: 0.84,
      detail: "Rebuilt",
      details: ["Geometry modified — similarity 0.84"],
      decision: "confirm",
    },
    {
      id: "checkin",
      name: "Check-in",
      type: "geometry",
      kind: "check-in-counter",
      similarity: 0.88,
      detail: "Rebuilt",
      details: ["Geometry modified — similarity 0.88", "Area: 96 m² → 128 m²"],
      decision: "confirm",
    },

    // ── Geometry — the two big floor movers ────────────────────────────────
    {
      id: "foodcourt",
      name: "Food Court",
      type: "geometry",
      kind: "food-beverage-space",
      similarity: 0.52,
      detail: "Nearly doubled",
      details: ["Geometry modified — similarity 0.52", "Area: 310 m² → 540 m²"],
      decision: "confirm",
    },
    {
      id: "entrancehall",
      name: "Entrance Hall",
      type: "geometry",
      kind: "circulation-space",
      similarity: 0.61,
      detail: "Reshaped",
      details: [
        "Geometry modified — similarity 0.61",
        "Reshaped around the new APM station",
      ],
      decision: "confirm",
    },

    // ── Metadata ───────────────────────────────────────────────────────────
    {
      id: "umlounge",
      name: "Emirates Um Service Lounge",
      type: "metadata",
      kind: "service-space",
      detail: "Renamed",
      details: [
        'Name changed: from "Emirates Um Service Lounge" to "Emirates Unaccompanied Minors Lounge"',
      ],
      decision: "confirm",
    },
    {
      id: "workspace",
      name: "Work Space",
      type: "metadata",
      kind: "social-space",
      detail: 'Type: "Office" → "Co-working Space"',
      details: ['Type changed: from "Office" to "Co-working Space"'],
      decision: "confirm",
    },

    // ── Removed — the east services cluster cleared ────────────────────────
    {
      id: "police",
      name: "Police Reception & Corridor",
      type: "deleted",
      kind: "service-space",
      detail: "Removed from floor plan",
      details: ["Relocated off this floor in the new plan"],
      decision: "reject",
    },
    {
      id: "paycabin",
      name: "Automatic Pay Machine Cabin",
      type: "deleted",
      kind: "service-space",
      detail: "Removed from floor plan",
      decision: "reject",
    },
    {
      id: "valet",
      name: "Valet Parking Space",
      type: "deleted",
      kind: "transit-space",
      detail: "Removed from floor plan",
      decision: "reject",
    },

    // ── User overrides ─────────────────────────────────────────────────────
    {
      id: "dilizieseating",
      name: "Dilizie Seating",
      type: "preserved",
      kind: "social-space",
      detail: "Your edit kept — its unit was removed",
      details: [
        "You added this seating in Version 2",
        "The unit it serves (Dilizie) is removed in this update",
      ],
    },
  ];
}

/** The green (<20%) set: a quiet drift — a subset of the amber ids, so stories stay consistent. */
const GREEN_IDS = new Set(["costa", "subway", "ahlan", "visacancel", "prm"]);

/**
 * The change set now matches the declared magnitude (Olcay, 2026-08-10: *"the content could match
 * the declaration of 62% so it's a realistic use case"*): green reads like a drift, amber like a
 * renovation, red like a remodel. The % itself is still seeded, not computed from these rows —
 * that is D5, and it closes when the client-side diff lands. All three sets name only B2 features
 * (D4), so the full red experience — list, groups and map highlights — is demoable on B2 via
 * Restore or the upload cycle.
 */
export function seedChanges(band: MagnitudeBand): Change[] {
  switch (band) {
    case "minor":
      return amberChanges().filter((c) => GREEN_IDS.has(c.id));
    case "large":
      return [...amberChanges(), ...redExtras()];
    default:
      return amberChanges();
  }
}

/**
 * The demo floor conditions (D16). Kept out of `seedDiff`'s default so the canonical Green / Amber
 * / Red screens are unchanged — a floor warning is the exception, not the resting state, and every
 * screen growing a notice strip would say the opposite.
 */
export const FLOOR_WARNING_DEMO: Record<FloorWarningKind, FloorWarning> = {
  "georeference-shifted": {
    kind: "georeference-shifted",
    detail:
      "Shifted 1.4 m north-east of the published floor plan. Every change below was matched after correcting for it, so the list is unaffected.",
  },
  "floorplan-resized": {
    kind: "floorplan-resized",
    detail:
      "The new floor plan covers 8% more area than the published one. The traffic light still reads the share of area that changed, not the size difference.",
  },
};

/**
 * Which demo level's floor actually moved — **Terminal 3 · B2**, the amber review (US10's demo,
 * D16). It is deliberately the same level as the main walkthrough, because **B2's is the only
 * review the tree can actually open**: L1's countdown tag carries no `action: "review"`, and L0's
 * "New version" tag is superseded by "Auto-published". A warning parked on either could never be
 * seen, and an unseeable demo is worse than none.
 *
 * The story still lands, because a floor warning must not move the traffic light: B2 stays at 30%
 * and amber with the floor shifted under it, which is exactly US10's acceptance criterion — warn,
 * and **carry on** processing everything else.
 *
 * ⚠️ One constant to revert. Point it at another level and the amber walkthrough goes back to a
 * floor that stayed put — at the cost of nobody being able to reach the notice.
 */
export function seedFloorWarnings(
  buildingId: string | undefined,
  levelIndex: number,
): FloorWarning[] {
  if ((buildingId ?? T3_ID) !== T3_ID || levelIndex !== NEW_VERSION_LEVEL)
    return [];
  return [
    FLOOR_WARNING_DEMO["georeference-shifted"],
    FLOOR_WARNING_DEMO["floorplan-resized"],
  ];
}

/** B4 · Arrivals — Terminal 3: the level whose review was concluded with two edits on it. */
export const EDITED_LEVEL = -4;

/**
 * The two changes B4's reviewer **edited** rather than accepted — a review someone finished by
 * doing the work, which is the whole point of replacing Flag with Edit.
 *
 * ⚠️ **This used to be `seedFlaggedChanges`**, and it existed for a reason worth keeping: the tree
 * advertised *"2 flagged"* on B4 as a **hardcoded label** with no report behind it, so the map
 * beside it correctly drew nothing and the feature looked broken (found 2026-08-14). A tag that
 * claims work nobody did is worse than no tag.
 *
 * The tag is gone now, and nothing replaces it — deliberately. Olcay, 2026-08-25: *"once review
 * concluded the map becomes the current map."* An edit is not an outstanding item; it is the
 * floor. What survives is the record in the `ReviewOutcome` (`overrides`, keyed the same way as
 * `decisions`) and the fact that MapScale's **next** run will report these two as `preserved`.
 *
 * The changes themselves are still MapScale's, untouched — see `Override` on why the report and
 * the person's answer to it are stored apart. `seedEditedOverrides` carries the answers.
 *
 * Both names are single features on that floor — `pickFeature` resolves by name, and *"Baggage
 * Reclaim"* would have been ambiguous fourteen ways.
 */
export function seedEditedChanges(): Change[] {
  return [
    {
      id: "b4-passport",
      name: "Arrival Passport Control",
      type: "metadata",
      kind: "checkpoint",
      detail: 'Name: "Passport Control" → "Arrival Passport Control"',
      details: [
        'Name changed: from "Passport Control" to "Arrival Passport Control"',
      ],
    },
    {
      id: "b4-customs",
      name: "Arrival Customs Hall",
      type: "geometry",
      kind: "operational-space",
      similarity: 0.71,
      detail: "Boundary redrawn",
      details: [
        "Geometry modified — similarity 0.71",
        "Area: 940 m² → 1,020 m²",
      ],
    },
  ];
}

/**
 * What B4's reviewer put in place of those two suggestions. Keyed by change id, exactly as a live
 * review writes them — so the seeded level and a level you review by hand are the same shape.
 */
export function seedEditedOverrides(): Record<string, Override> {
  return {
    "b4-passport": {
      name: "Passport Control (Arrivals)",
      details: [
        'Name: "Arrival Passport Control" → "Passport Control (Arrivals)" — matches the airport signage',
      ],
    },
    "b4-customs": {
      geometry: undefined,
      details: [
        "Boundary redrawn by hand — the detected hall overlapped the queue barriers",
      ],
    },
  };
}

/**
 * **Every seeded override, keyed by change id** — the demo equivalent of what a reviewer types.
 *
 * One flat table rather than a per-band function, because an override is keyed by the change it
 * stands over and change ids are unique across every band. A screen seeds itself by intersecting
 * this with the ids it actually holds, which is also why an id that is not in the current band
 * costs nothing.
 *
 * `subway` and `ahlan` are the review demo (they were the two seeded *flags* before 2026-08-25);
 * the `b4-` pair is the concluded-review demo — see `seedEditedOverrides`, which is this table
 * narrowed to B4 and kept separate because `App` seeds that level before any screen mounts.
 */
export const SEEDED_OVERRIDES: Record<string, Override> = {
  subway: {
    kind: "quick-service-restaurant",
    details: [
      'Type: "Cafe" → "Quick Service Restaurant" — it is a counter-service franchise, not a cafe',
    ],
  },
  ahlan: {
    name: "Ahlan Services Desk (Arrivals)",
    details: [
      'Name: "Ahlan Services Desk" → "Ahlan Services Desk (Arrivals)" — there is a second desk airside',
    ],
  },
  ...seedEditedOverrides(),
};

export function seedDiff(
  magnitudePct = 30,
  floorWarnings: FloorWarning[] = [],
): DiffResult {
  return {
    changes: seedChanges(magnitudeBand(magnitudePct)),
    magnitudePct,
    floorWarnings,
  };
}
