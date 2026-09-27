import {
  ChevronLeft,
  ChevronRight,
  Ellipsis as EllipsisIcon,
  StarFilled,
} from "../ui/icons";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Button,
  Icon,
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Text,
} from "@kozmos-ds/react";
import PointrMap, {
  type MapNetwork,
  type MapBuilding,
  type MapLevel,
} from "../map/PointrMap";
import { ConfirmOverlay } from "../ui/ConfirmOverlay";
import {
  GeometryToolbar,
  type GeomCommand,
  type GeomState,
} from "../ui/GeometryToolbar";
import {
  getFollowRequest,
  followVersion,
  subscribeFollow,
  getEditorsOnFloor,
  setPresenceEditing,
  getPeersOnFloor,
  peerColour,
  presenceVersion,
  setPresenceCursor,
  setPresenceFloor,
  subscribePresence,
} from "../cloud/presence";
import {
  BAND,
  EXPERT_HOLD,
  EXPERT_REVIEW_LEVEL,
  GRACE_DAYS,
  NEW_VERSION_LEVEL,
  expertReviewEnabled,
  isUnderExpertReview,
  seedVersions,
  type Change,
} from "../mock/diff";
import { PANEL_WIDTH } from "../ui/Chrome";
import { MapSettings, type MapPrefsState } from "../ui/MapSettings";
import { LevelSelector } from "../ui/LevelSelector";
import { levelGeometry, type LevelGeometry } from "../cloud/levelFeatures";
import { levelPaths, type PathNode } from "../cloud/levelPaths";
import {
  FeaturePanel,
  FEATURE_PANEL_WIDTH,
  mergeForEditing,
} from "../ui/FeaturePanel";
import { SavedNotice } from "../ui/SavedNotice";
import { UploadDropConfirm } from "../ui/UploadDropConfirm";
import {
  getCreatedBuildings,
  getLevelVersions,
  getReviewOutcome,
  levelKey,
  subscribeCreatedBuildings,
  subscribeReviews,
  getReviewCount,
} from "../mock/store";
import { CONCOURSE_A_ID, SITE_SNAPSHOT, T3_ID } from "../mock/site";
import {
  type MapSection,
  SPRITE_BASE,
  groupForSection,
  spriteName,
  rowLabel,
  typeLabel,
  type LevelTypeCount,
  type SpriteSheet,
} from "../mock/taxonomy";

/**
 * S4 — Map Content (Figma node 2483:776). The dashboard's entry point: the buildings of the active
 * site, their levels, and the per-level context menu that starts the update flow.
 */

/** Stable identity: an inline [] is a new array every render, and PointrMap posts on change. */
const NO_CHANGES: Change[] = [];

const LINE = "#e3e4e8";
const INK = "#082975";
const LINK = "#0b369c";
const MUTED = "#5d626f";

export interface LevelRef {
  building: string;
  /** The SDK's building id — what the map needs to open this level (`building` is only a label). */
  buildingId: string;
  index: number;
  name: string;
  short: string;
  /** A level being CREATED (drop → "Add as new level"): no seeded history, the upload is v1. */
  isNew?: boolean;
}

/**
 * A status tag on a level row. Tones that restate a magnitude band reuse `BAND` so the tree and the
 * review screen can't drift apart; everything else is neutral or informational.
 *
 * This is the one extension of "traffic-light is reserved for magnitude": a tag like "Auto-published"
 * or "Needs your review" IS the magnitude speaking, just earlier in the journey. A tag never carries
 * a change-type colour or a decision colour.
 */
export type TagTone = "info" | "neutral" | "minor" | "medium" | "large";

/** Every state a level can advertise in the tree. Ordered and filtered by the tables below. */
export type LevelTagKind =
  | "rejected"
  | "needs-decision"
  | "grace"
  | "needs-review"
  | "expert-review"
  | "new-version"
  | "auto-published"
  | "flagged"
  /** Saved part-way: held out of publishing until the review is completed (never "draft"). */
  | "in-review";

export interface LevelTag {
  kind: LevelTagKind;
  label: string;
  tone: TagTone;
  title?: string;
  /** Tags that are also the call to action are clickable; the rest are pure status. */
  action?: "review";
}

/**
 * Which tag matters most when several are true at once. Higher wins, and sorts first.
 *
 * A level routinely qualifies for more than one — a new version arrived AND it is amber AND the
 * grace period is counting down are all the same event seen from three angles. Showing all three
 * is noise, so a tag can supersede the ones it makes redundant.
 */
const TAG_PRIORITY: Record<LevelTagKind, number> = {
  rejected: 100,
  "needs-decision": 100,
  grace: 90,
  "needs-review": 80,
  "expert-review": 70,
  "new-version": 50,
  "auto-published": 40,
  flagged: 30,
  // Above the band tags it suspends: a level being held cannot also be counting down.
  "in-review": 95,
};

/**
 * Only true redundancy is suppressed. "Publishes in 6d" says everything "Needs review" says and
 * adds the deadline, so it replaces it — but "New version" survives alongside a band tag, because
 * it is the action (it opens the review) while the band is the status.
 */
const TAG_SUPERSEDES: Partial<Record<LevelTagKind, LevelTagKind[]>> = {
  rejected: ["needs-review", "grace", "new-version"],
  "needs-decision": ["needs-review", "grace", "new-version"],
  grace: ["needs-review"],
  "auto-published": ["new-version"],
  // The countdown is suspended while it's held, so showing it would contradict the hold.
  "in-review": ["needs-review", "grace", "new-version"],
};

/** How many tags a row shows before the rest collapse into a count. */
const MAX_VISIBLE_TAGS = 3;

export function resolveTags(tags: LevelTag[] | undefined): {
  shown: LevelTag[];
  hidden: number;
} {
  if (!tags?.length) return { shown: [], hidden: 0 };
  const sorted = [...tags].sort(
    (a, b) => TAG_PRIORITY[b.kind] - TAG_PRIORITY[a.kind],
  );
  const beaten = new Set<LevelTagKind>();
  for (const t of sorted)
    for (const k of TAG_SUPERSEDES[t.kind] ?? []) beaten.add(k);
  const kept = sorted.filter((t) => !beaten.has(t.kind));
  return {
    shown: kept.slice(0, MAX_VISIBLE_TAGS),
    hidden: Math.max(0, kept.length - MAX_VISIBLE_TAGS),
  };
}

interface Level {
  index: number;
  name: string;
  short: string;
  count?: number;
  starred?: boolean;
  /** Every state the level advertises, "New version" included — see resolveTags(). */
  tags?: LevelTag[];
  children?: string[];
}

interface Building {
  id: string;
  name: string;
  count?: number;
  status?: string;
  levels?: Level[];
}

const OUTDOOR = { id: "outdoor", name: "Outdoor Map Content", count: 13 };

/** The level MapScale has a new version for — the one the review flow opens (see LEVEL_TAGS). */

const TAG_TONE: Record<TagTone, { bg: string; border: string; ink: string }> = {
  info: { bg: "#eef3ff", border: "#cfdcff", ink: LINK },
  neutral: { bg: "#f2f3f5", border: LINE, ink: MUTED },
  minor: {
    bg: BAND.minor.tint,
    border: BAND.minor.border,
    ink: BAND.minor.ink,
  },
  medium: {
    bg: BAND.medium.tint,
    border: BAND.medium.border,
    ink: BAND.medium.ink,
  },
  large: {
    bg: BAND.large.tint,
    border: BAND.large.border,
    ink: BAND.large.ink,
  },
};

function Tag({ tag, onAction }: { tag: LevelTag; onAction?: () => void }) {
  const t = TAG_TONE[tag.tone];
  const clickable = !!tag.action && !!onAction;
  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    lineHeight: 1.6,
    color: t.ink,
    background: t.bg,
    border: `1px solid ${t.border}`,
    borderRadius: 999,
    padding: "1px 8px",
    whiteSpace: "nowrap",
    flex: "0 0 auto",
    cursor: clickable ? "pointer" : "default",
  };
  const inner = (
    <>
      {tag.kind === "new-version" && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            background: t.ink,
            flex: "0 0 auto",
          }}
        />
      )}
      {tag.label}
    </>
  );
  return clickable ? (
    <button title={tag.title} onClick={onAction} style={style}>
      {inner}
    </button>
  ) : (
    <span title={tag.title} style={style}>
      {inner}
    </span>
  );
}

/**
 * Where each level stands, shown in the tree so you don't have to open a level to find out.
 * The real thing reads it from the job + version state.
 *
 * **Kept in step with `seedVersions()` in mock/diff.ts** — the editor seeds its status card from
 * the same place, so the tag you clicked and the screen you land on always agree. Change a band
 * here and the seed there, together.
 *
 * ⚠️ **This table is Terminal 3's**, and that is new (2026-08-11). It used to be keyed by level
 * index alone, with a comment calling the resulting repetition "a mock-wide convention, not a
 * bug" — defensible while you could only ever see one building expanded at a time. The
 * notification feed flattens the whole site into one list, and it came out saying two buildings
 * had a rejected floor-plan and three were under an expert hold. They weren't: the tags were.
 * `levelTagsFor()` is the fix, and `seedVersions()` took the same building argument.
 */
const LEVEL_TAGS: Record<number, LevelTag[]> = {
  [NEW_VERSION_LEVEL]: [
    {
      kind: "needs-review",
      label: "Needs review",
      tone: "medium",
      title:
        "30% of floor area changed — publishes automatically in 6 days unless you review it",
    },
    {
      kind: "new-version",
      label: "New version",
      tone: "info",
      action: "review",
      title: "Review the changes MapScale detected",
    },
  ],
  // Red cause A (>50%): rejected outright (decision 9) — nothing to review, so the tag carries
  // no action; the title says the way out. Its supersede rule drops the "New version" tag.
  3: [
    {
      kind: "rejected",
      label: "Rejected",
      tone: "large",
      title:
        "62% of floor area changed — a change this large is unrealistic, so the floor plan was rejected. Upload a corrected file, or contact our support team if this really is new construction",
    },
  ],
  // B4 carries no seeded tag any more. It used to say "2 flagged" as a hardcoded label with no
  // report behind it, so the map beside it drew nothing and the feature looked broken. The review
  // is seeded for real in App.tsx now, and `liveTagsFor` derives the tag from it like every other
  // level — the count is whatever is actually flagged, and it drops to nothing when you clear them.
  0: [
    {
      kind: "auto-published",
      label: "Auto-published",
      tone: "minor",
      title: "Minor change (12% of floor area) — published automatically",
    },
    // Superseded by auto-published: the arrival is history once it is live.
    {
      kind: "new-version",
      label: "New version",
      tone: "info",
      action: "review",
    },
  ],
  1: [
    // Templated from GRACE_DAYS so the tag and the review screen's strip can't drift apart —
    // and read through GETTERS, because LEVEL_TAGS is a module constant and a plain template
    // literal would have frozen at import, ignoring the grace period S5 now configures.
    {
      kind: "grace",
      tone: "medium",
      get label(): string {
        return GRACE_DAYS.demoLeft === 0
          ? "Publishes today"
          : `Publishes in ${GRACE_DAYS.demoLeft}d`;
      },
      get title(): string {
        return GRACE_DAYS.demoLeft === 0
          ? "The grace period ends today"
          : `Grace period ends in ${GRACE_DAYS.demoLeft} days`;
      },
    },
    // Superseded by the countdown, which says the same thing and adds the deadline.
    { kind: "needs-review", label: "Needs review", tone: "medium" },
  ],
  // keyed off the same constant the hold reads, so the tag and the held screen can't disagree
  [EXPERT_REVIEW_LEVEL]: [
    {
      kind: "expert-review",
      label: "Expert Review",
      tone: "neutral",
      title:
        "Pointr's mapping team is checking this floor — changes you make may be overridden by their corrections",
    },
  ],
};

/**
 * Red cause B (US5): MapScale couldn't match the floor plan. It lives on **Concourse A's level
 * 4** because it needs an index Terminal 3 hasn't got, so it is the one demo state deliberately
 * outside the demo building (handoff §17).
 */
const CONCOURSE_A_TAGS: Record<number, LevelTag[]> = {
  4: [
    {
      kind: "needs-decision",
      label: "Needs decision",
      tone: "large",
      action: "review",
      title:
        "MapScale couldn't match the new floor plan to the published one — review it, then publish when you're ready",
    },
  ],
};

/** The building-aware lookup `seedVersions()` mirrors. Buildings with no demo state get none. */
function levelTagsFor(
  buildingId: string,
  index: number,
): LevelTag[] | undefined {
  if (buildingId === CONCOURSE_A_ID) return CONCOURSE_A_TAGS[index];
  if (buildingId !== T3_ID) return undefined;
  // The hold is a Settings flag now (S5), so the tag has to ask the same question the seed and
  // every locked control already ask. Without this, turning Expert Review off left the tree
  // advertising a hold that no longer existed anywhere else in the app.
  if (index === EXPERT_REVIEW_LEVEL && !expertReviewEnabled()) return undefined;
  return LEVEL_TAGS[index];
}

/**
 * The tags a level wears *now*, seeds overridden by anything that has actually happened.
 *
 * A concluded review is the case that matters: the seeded tags say "Needs review · New version"
 * forever, so reviewing B2 and coming back to the tree found it still asking to be reviewed —
 * the same class of drift as the expert hold above, and exactly what §10's "the tree tag and the
 * screen you land on must agree" rule exists to prevent. Once concluded, the level reports what
 * it became: published, and whatever you left flagged.
 */
/**
 * ⚠️ **Four flag readers stood here until 2026-08-25** — `flaggedNamesFor`, `flagNoteFor`,
 * `flaggedChangesFor` and `clearFlagForName` — and the reasoning they carried is worth keeping
 * even though the code is not.
 *
 * They existed because a flag meant *"come back to this"*, and where you come back to things is
 * the content tree: a flag visible only in the changelog and the diff map was a note written on
 * the inside of a closed drawer. So a concluded review's flags reached the tree rows, the type
 * counts, the POI panel and the live map as `markOnly` marks.
 *
 * Olcay, 2026-08-25: *"once review concluded the map becomes the current map."* Nothing outlives
 * a review any more, so there is nothing for browsing to display. Two consequences are deliberate
 * and should not be re-litigated as bugs:
 *
 * - **Nothing marks an edited feature while browsing.** An edit is not outstanding work; it is the
 *   floor. It shows up again on the *next* MapScale run, as a `preserved` override.
 * - **`clearFlagForName` is gone with the state it cleared.** Editing a feature used to clear its
 *   flag implicitly (§18a's ruling, name-matched, and with duplicate names it cleared them
 *   together — the D18 ambiguity). No flag, no clearing, no ambiguity to warn about.
 *
 * The half of a feature's bag the editor may never touch — which feature it is, and where it lives.
 * Kept aside so a save can *replace* the editable half wholesale (a removed field must actually go)
 * without the identity going with it.
 */
function pickIdentity(props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of ["fid", "bid", "sid", "lvl", "mainType", "mapPersonas"])
    if (k in props) out[k] = props[k];
  return out;
}

function liveTagsFor(
  buildingId: string,
  index: number,
  short: string,
): LevelTag[] | undefined {
  const seeded = levelTagsFor(buildingId, index);
  const key = levelKey(buildingId, index);
  const newest = getLevelVersions(key, () =>
    seedVersions(short, index, buildingId),
  )[0];
  // asking by version is the supersede rule: a newer upload has no report of its own yet
  const outcome = getReviewOutcome(key, newest?.n);
  if (!outcome) return seeded;

  /**
   * **Two orthogonal facts, reported separately: is it live, and is the review finished?**
   *
   * They were conflated at first — "saved part-way" simply returned *In review · won't publish
   * until you complete it*. That is a lie in one reachable case: pressing **Publish now** and then
   * **Save** publishes the level deliberately while leaving the review unfinished, and the tree
   * went on claiming it couldn't publish something that was already live.
   *
   * Live-ness is read from the **version**, never from `outcome.published` — the version is what
   * every other surface reads, and an explicit publish moves it whatever the review is doing.
   */
  const live = newest.state === "published";
  const tags: LevelTag[] = [];

  if (live)
    tags.push({
      kind: "auto-published",
      label: "Published",
      tone: "minor",
      title: outcome.complete
        ? "You reviewed this version and it went live"
        : "You published this version. The review is still unfinished.",
    });

  if (!outcome.complete)
    /**
     * The hold, when there is one. Neutral, not a band colour — traffic-light is magnitude
     * speaking (§10), and being mid-review is something *you* did, not a size. It keeps the
     * review action because the way back in has to stay, and it supersedes the countdown tags:
     * a level being held cannot also be publishing in 6 days.
     */
    tags.push({
      kind: "in-review",
      label: live ? "Review unfinished" : "In review",
      tone: "neutral",
      action: "review",
      title: live
        ? "This version is live, but you haven't finished reviewing it."
        : "You saved this review part-way. It won't publish — automatically or otherwise — until you complete it.",
    });

  /**
   * ⚠️ **A completed review adds no third tag.** It used to add *"N flagged"*, which was the tree's
   * whole reason to know about flags. A completed review now leaves nothing outstanding — an edit
   * is the floor, not a to-do — so the level says *Published* and stops talking.
   */
  return tags.length ? tags : seeded;
}

/**
 * The tree is built from the SDK's own buildings and levels (via the map), so the tree, the
 * breadcrumb and the map can't disagree. `BUILDINGS` below is only the pre-load placeholder.
 */
function toBuildings(live: MapBuilding[]): Building[] {
  return live.map((b) => ({
    id: b.id,
    name: b.name,
    count: b.levels.length,
    levels: b.levels.map((l) => ({
      index: l.index,
      name: l.long,
      short: l.short,
      tags: levelTagsFor(b.id, l.index),
    })),
  }));
}

/**
 * The pre-boot placeholder is a verbatim snapshot of the live site, pushed through the SAME
 * mapping the live data uses — so the tree doesn't visibly change when the map finishes booting
 * (Olcay). The snapshot itself now lives in `mock/site.ts`, because the notification feed derives
 * from it too (2026-08-11); the refresh recipe is documented there.
 */
const BUILDINGS: Building[] = toBuildings(SITE_SNAPSHOT);

function Count({ n }: { n: number }) {
  return (
    <span
      style={{
        fontSize: 11,
        lineHeight: "18px",
        color: MUTED,
        background: "#f2f3f5",
        borderRadius: 10,
        padding: "0 8px",
      }}
    >
      {n}
    </span>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <span
      style={{
        display: "grid",
        placeItems: "center",
        width: 20,
        color: MUTED,
        transform: open ? "rotate(90deg)" : "none",
        transition: "transform .12s",
      }}
    >
      <Icon name="chevron-right" />
    </span>
  );
}

/** `dots-horizontal` from the Pointr Icon Library (see `../ui/icons`). */
function Ellipsis() {
  return <EllipsisIcon size={18} />;
}

function Star() {
  /* `star-01`, filled — the default level is a state, not a separate mark (see `../ui/icons`). */
  return (
    <StarFilled size={14} label="Default level" style={{ color: "#3B82F6" }} />
  );
}

/**
 * One indent step = chevron (20) + gap (8), so each level's chevron sits directly under its
 * parent's *symbol* rather than under the parent's chevron.
 */
const INDENT = 28;
const ROW_PAD = 12;
const indent = (depth: number) => ROW_PAD + depth * INDENT;

const MENU_ITEM: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  background: "none",
  border: "none",
  padding: "10px 14px",
  fontSize: 13,
  cursor: "pointer",
  color: "var(--review-ink)",
  borderRadius: 8,
};

/**
 * A row of the ⋯ menu. `reason` disables it and says why — a disabled control needs a title on a
 * wrapper, since a disabled <button> swallows the hover that would show its own.
 */
function MenuItem({
  label,
  onClick,
  danger,
  reason,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  reason?: string;
}) {
  return (
    <span title={reason} style={{ display: "block" }}>
      <button
        disabled={!!reason}
        onClick={onClick}
        style={{
          ...MENU_ITEM,
          color: reason ? MUTED : danger ? "#C62828" : "var(--review-ink)",
          cursor: reason ? "not-allowed" : "pointer",
          opacity: reason ? 0.6 : 1,
        }}
      >
        {label}
      </button>
    </span>
  );
}

/**
 * What the map has told us is on each floor, keyed `buildingId:index`, plus the way to ask about a
 * floor it hasn't visited.
 *
 * A **context**, not props: the only consumer is `LevelRow`, three components down, and threading
 * a cache plus a setter through `BuildingRow` would make that component carry state it has no
 * opinion about.
 */
const LevelTypesContext = createContext<{
  byLevel: Record<string, LevelTypeCount[]>;
  /** The level the map is showing. Its row in the tree starts expanded — you open on what you see. */
  current?: { building: string; level: number };
  /** Show this floor on the map — which is also what makes its counts arrive. */
  request: (buildingId: string, index: number) => void;
  sheet: SpriteSheet | null;
  /**
   * Centre the map on one feature — **and switch to its floor**, which is the half that was
   * missing: the map can be showing a different level than the row you clicked, and centring on
   * the right coordinates of the wrong floor lands you nowhere useful.
   */
  focus: (buildingId: string, index: number, fid: string) => void;
  focused: string | null;
  /** fid → who has it open in the editor, and in what colour. Marks the row, like a flag does. */
  editors: Record<string, { who: string; colour: string }>;
  /**
   * What the cursor is over — lit on the map through the SDK's own selection layer. `null` on
   * leave, which falls back to whatever is selected rather than going dark.
   */
  hover: (
    sel: { fid?: string; mainType?: string; subType?: string } | null,
  ) => void;
  /** Local edits by `fid`, so a rename in the panel shows in the tree too. In memory only (D3). */
  edits: Record<string, { name?: string; subType?: string }>;
  /** The rail's selected layer group — the tree lists that section's rows and no others. */
  section: MapSection;
  /** The networks the map found, by level — the Wayfinding section's entities. */
  networks: Record<number, MapNetwork[]>;
}>({
  byLevel: {},
  request: () => {},
  sheet: null,
  focus: () => {},
  focused: null,
  editors: {},
  hover: () => {},
  edits: {},
  section: "content",
  networks: {},
});

/**
 * One taxonomy icon, drawn straight from the published sprite sheet.
 *
 * The sheet is one PNG plus a JSON of frames, so an icon is a background-position — no per-icon
 * request, and it stays in step with the taxonomy because it *is* the taxonomy's own artwork.
 * A type with no icon renders a neutral dot rather than a broken frame: `wall`, `section` and
 * `furniture` genuinely have none.
 */
function TypeIcon({
  mainType,
  subType,
}: {
  mainType: string;
  subType?: string;
}) {
  const { sheet } = useContext(LevelTypesContext);
  const name = spriteName(sheet, mainType, subType);
  const f = name && sheet ? sheet[name] : null;
  if (!f) {
    // The sprite has no generic marker (see spriteName) — the DS's neutral pin stands in, so a
    // type without artwork still reads as "a thing on the map" rather than as a missing image.
    return (
      <span
        style={{
          width: 16,
          height: 16,
          flex: "0 0 auto",
          display: "grid",
          placeItems: "center",
          color: "var(--primitives-colors-background-400)",
        }}
      >
        <Icon name="marker-pin-01" />
      </span>
    );
  }
  // scale the frame into a 16px box; background-size scales the whole sheet by the same factor
  const k = 16 / Math.max(f.width, f.height);
  return (
    <span
      aria-hidden
      style={{
        width: 16,
        height: 16,
        flex: "0 0 auto",
        backgroundImage: `url(${SPRITE_BASE}.png)`,
        backgroundPosition: `-${f.x * k}px -${f.y * k}px`,
        backgroundSize: `${SPRITE_W * k}px auto`,
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}
/**
 * The sheet's own pixel width — every frame's x/y is relative to it, so `background-size` has to
 * scale the WHOLE sheet by the same factor as the frame.
 *
 * Measured from the PNG header (2046×588), not guessed: a wrong width doesn't fail loudly, it just
 * lands every icon on empty sheet and renders blanks.
 */
const SPRITE_W = 2046;

/**
 * The ⋯ menu a type or feature row wears (Olcay, 2026-08-12).
 *
 * Same rule as the level row's: it is **always in the layout and only ever hidden**
 * (`visibility`, not conditional rendering), because a hover affordance that appears in flow
 * changes the row's height — the bug that cost the tree its rhythm once already (§3).
 *
 * ⚠️ **Every item here is inert.** These are the affordances the real dashboard offers, placed so
 * the shape of the screen can be judged; none of them has a backend in this prototype. Wiring one
 * up means giving it something real to do, not just removing this note.
 */
function RowMenu({
  label,
  items,
  show,
}: {
  label: string;
  items: { label: string; danger?: boolean }[];
  show: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ flex: "0 0 auto", display: "flex" }}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            aria-label={`Actions for ${label}`}
            style={{
              display: "grid",
              placeItems: "center",
              width: 24,
              height: 24,
              borderRadius: 6,
              border: "none",
              background: "none",
              color: MUTED,
              cursor: "pointer",
              visibility: show || open ? "visible" : "hidden",
            }}
          >
            <Ellipsis />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="bottom"
          style={{ width: 200, padding: 6 }}
        >
          {items.map((i) => (
            <MenuItem
              key={i.label}
              label={i.label}
              danger={i.danger}
              onClick={() => setOpen(false)}
            />
          ))}
        </PopoverContent>
      </Popover>
    </span>
  );
}

/**
 * **Add new** — a menu, not a button (Olcay, 2026-08-16: *"add new should show a dropdown, Building
 * then seperation then Map Content"*).
 *
 * It used to go straight to the Building wizard, which quietly made "add" mean "add a building".
 * There are two things you can add here and they are different sizes of act: a **building** is
 * structure, a piece of **map content** is a thing inside one. The separator says so — it is not
 * decoration, it is the boundary between those two kinds.
 *
 * ⚠️ **Map Content is deliberately disabled, not hidden.** Drawing a feature from scratch is not
 * built — there is no draw mode in the geometry editor, only Reshape, Transform and Split. Hiding
 * it would misrepresent the shape of the product; showing it greyed with a reason says what exists,
 * what does not, and what is coming. The guide engine it will need is already built and running in
 * Split and Reshape.
 */
function AddNewMenu({ onAddBuilding }: { onAddBuilding: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" data-tour="add-building">
          Add new
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        style={{ width: 232, padding: 6 }}
      >
        <MenuItem
          label="Building"
          onClick={() => {
            setOpen(false);
            onAddBuilding();
          }}
        />
        <div
          role="separator"
          style={{
            height: 1,
            margin: "5px 6px",
            background: "var(--primitives-colors-background-900)",
          }}
        />
        <span
          style={{
            display: "block",
            padding: "8px 10px 4px",
            fontSize: 13,
            color: "var(--primitives-colors-background-400)",
            cursor: "default",
          }}
        >
          Map Content
        </span>
        <span
          style={{
            display: "block",
            padding: "0 10px 8px",
            fontSize: 11.5,
            lineHeight: 1.35,
            color: "var(--primitives-colors-background-400)",
          }}
        >
          Drawing a feature is not built yet
        </span>
      </PopoverContent>
    </Popover>
  );
}

/**
 * A count in a circle, sitting **beside its word** rather than pinned to the far right (Olcay,
 * 2026-08-12). Right-aligned numbers put a column of digits an inch away from the labels they
 * belong to, and the eye has to travel to pair them up; a chip reads as part of the phrase.
 */
function CountChip({ n }: { n: number }) {
  return (
    <span
      style={{
        flex: "0 0 auto",
        minWidth: 20,
        height: 20,
        padding: "0 6px",
        borderRadius: 999,
        background: "var(--primitives-colors-background-100)",
        color: MUTED,
        fontSize: 11,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {n}
    </span>
  );
}

/** A single feature under its type — the leaf of the tree, and the only row you edit. */
function FeatureRow({
  name,
  unnamed,
  fid,
  buildingId,
  index,
}: {
  name: string;
  unnamed: boolean;
  fid?: string;
  buildingId: string;
  index: number;
}) {
  const [hover, setHover] = useState(false);
  const {
    focus,
    focused,
    editors,
    hover: onHover,
    edits,
  } = useContext(LevelTypesContext);
  /** Somebody else has this open. Shown, not enforced — see `Peer.editingFid`. */
  const editor = fid ? editors[fid] : undefined;
  const selected = !!fid && focused === fid;
  // A rename in the panel shows here too — one edit, every surface. In memory only (D3).
  const edited = fid ? edits[fid]?.name : undefined;
  const shown = edited !== undefined && edited !== "" ? edited : name;
  return (
    <div
      onMouseEnter={() => {
        setHover(true);
        if (fid) onHover({ fid });
      }}
      onMouseLeave={() => {
        setHover(false);
        onHover(null);
      }}
      onClick={() => fid && focus(buildingId, index, fid)}
      title={fid ? "Show on the map" : undefined}
      style={{
        cursor: fid ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: `5px 12px 5px ${indent(3)}px`,
        borderBottom: `1px solid ${LINE}`,
        fontSize: 12,
        // An unnamed feature is still a feature — numbering it beats hiding it, and most
        // structural geometry genuinely has no name. It reads muted because the label is ours.
        color: unnamed ? MUTED : "var(--review-ink)",
        /* Selection is a ring and a tint, never a colour — the same rule the changelog follows:
           colour says what a thing IS, and being selected is not a property of the thing. */
        background: selected
          ? "var(--primitives-colors-theme-0)"
          : hover
            ? "#f6f7f9"
            : undefined,
        boxShadow: selected
          ? "inset 3px 0 0 var(--primitives-colors-theme-500)"
          : undefined,
      }}
    >
      <span
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {shown}
      </span>
      {/*
        Somebody else has this open. A dot in THEIR colour, so the row, their cursor and their
        avatar all agree about who — and a title that names them, because a coloured dot alone is
        a puzzle. Visibility only: nothing here stops you opening it too.
      */}
      {editor && (
        <span
          title={`${editor.who} is editing this`}
          aria-label={`${editor.who} is editing this`}
          style={{
            flex: "0 0 auto",
            width: 7,
            height: 7,
            borderRadius: 999,
            background: editor.colour,
            boxShadow: "0 0 0 2px #fff",
          }}
        />
      )}
      <RowMenu
        label={name}
        show={hover}
        items={[
          { label: "Edit" },
          { label: "Duplicate" },
          { label: "Select" },
          { label: "Assign to…" },
          { label: "Delete", danger: true },
        ]}
      />
    </div>
  );
}

/**
 * One feature type under a level — and, on demand, the individual features of that type.
 *
 * Indented to `indent(2)`, which is the column the level's **index digit** occupies (Olcay,
 * 2026-08-12). One indent step is chevron + gap, so a child that starts under its parent's *symbol*
 * rather than under its parent's chevron is the tree's existing rule; this row simply follows it.
 */
function TypeRow({
  row,
  all,
  buildingId,
  index,
}: {
  row: LevelTypeCount;
  all: LevelTypeCount[];
  buildingId: string;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const { hover: onHover } = useContext(LevelTypesContext);
  const names = row.names ?? [];
  const label = rowLabel(row, all);
  return (
    <>
      <div
        onMouseEnter={() => {
          setHover(true);
          onHover({ mainType: row.mainType, subType: row.subType });
        }}
        onMouseLeave={() => {
          setHover(false);
          onHover(null);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          // 2px left of the column (Olcay, 2026-08-12): a chevron glyph carries its own
          // internal padding, so aligning its BOX leaves the stroke looking indented.
          padding: `6px 12px 6px ${indent(2) - 2}px`,
          borderBottom: `1px solid ${LINE}`,
          fontSize: 12.5,
          color: "var(--review-ink)",
          background: hover ? "#f6f7f9" : undefined,
        }}
      >
        <button
          onClick={() => setOpen((o) => !o)}
          disabled={!names.length}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: names.length ? "pointer" : "default",
            opacity: names.length ? 1 : 0.25,
          }}
          aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
        >
          <Chevron open={open} />
        </button>
        <TypeIcon mainType={row.mainType} subType={row.subType} />
        <span
          style={{
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
        <CountChip n={row.count} />
        <span style={{ flex: 1 }} />
        {/* A whole type is something you act on in bulk — pick it out on the map, or hand the lot
            to someone. Editing or deleting belongs to the individual feature, not to the type. */}
        <RowMenu
          label={label}
          show={hover}
          items={[{ label: "Select" }, { label: "Assign to…" }]}
        />
      </div>
      {open &&
        names.map((n, i) => (
          <FeatureRow
            key={`${n.fid ?? i}`}
            name={n.name || `${label} ${i + 1}`}
            unnamed={!n.name}
            fid={n.fid}
            buildingId={buildingId}
            index={index}
          />
        ))}
      {open && row.count > names.length && (
        <div
          style={{
            padding: `5px 12px 5px ${indent(3)}px`,
            borderBottom: `1px solid ${LINE}`,
            fontSize: 11.5,
            color: MUTED,
          }}
        >
          + {row.count - names.length} more
        </div>
      )}
    </>
  );
}

/** The expanded body of a level row: its feature types, grouped by taxonomy class. */
function LevelTypes({
  buildingId,
  index,
}: {
  buildingId: string;
  index: number;
}) {
  const { byLevel, section } = useContext(LevelTypesContext);
  const counts = byLevel[`${buildingId}:${index}`];
  const groups = useMemo(
    () => (counts ? groupForSection(counts, section) : []),
    [counts, section],
  );

  if (!counts) {
    return (
      <div
        style={{
          padding: `8px 12px 8px ${indent(2)}px`,
          borderBottom: `1px solid ${LINE}`,
          fontSize: 12.5,
          color: MUTED,
        }}
      >
        Reading this floor…
      </div>
    );
  }
  if (!groups.length) {
    return (
      <div
        style={{
          padding: `8px 12px 8px ${indent(2)}px`,
          borderBottom: `1px solid ${LINE}`,
          fontSize: 12.5,
          color: MUTED,
        }}
      >
        Nothing mapped on this floor yet.
      </div>
    );
  }
  return (
    <>
      {groups.map((g) => (
        <div key={g.label}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: `6px 12px 6px ${indent(2)}px`,
              borderBottom: `1px solid ${LINE}`,
              background: "#fbfcfd",
            }}
          >
            <span
              style={{
                fontSize: 10.5,
                letterSpacing: 0.8,
                fontWeight: 700,
                color: "var(--primitives-colors-theme-700)",
              }}
            >
              {g.label.toUpperCase()}
            </span>
            <span style={{ fontSize: 10.5, color: MUTED }}>
              · {g.total} as loaded
            </span>
          </div>
          {g.rows.map((r) => (
            <TypeRow
              key={`${r.mainType}/${r.subType ?? ""}`}
              row={r}
              all={counts}
              buildingId={buildingId}
              index={index}
            />
          ))}
        </div>
      ))}
    </>
  );
}

function LevelRow({
  building,
  buildingId,
  level,
  onEdit,
  onReview,
  onUpdate,
}: {
  building: string;
  buildingId: string;
  level: Level;
  onEdit: (l: LevelRef) => void;
  onReview: (l: LevelRef) => void;
  /** Update floor-plan: opens the editor with the file browser already popped. */
  onUpdate: (l: LevelRef) => void;
}) {
  const { request: requestTypes, current: mapLevel } =
    useContext(LevelTypesContext);
  const current =
    mapLevel?.building === buildingId && mapLevel?.level === level.index;
  /**
   * The level the map is already showing starts EXPANDED (Olcay, 2026-08-14) — the tree should
   * open on what you are looking at, not make you find it and click it open.
   */
  const [open, setOpen] = useState(current);
  const [hover, setHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  /**
   * Expanding a floor shows it on the map — which is also what makes its counts arrive, since the
   * map can only count the floor it is rendering.
   *
   * **The whole row toggles, not only the caret** (Olcay, 2026-08-14). A 10px chevron as the sole
   * target is a smaller thing to hit than the row it controls, and every other row in this tree
   * already answers a click somewhere along its length.
   */
  /**
   * ⚠️ **The request is made in the handler, not inside the `setOpen` updater** (fixed
   * 2026-08-18). React runs updater functions *during render* — and twice under StrictMode — so
   * calling `requestTypes` in there updated `MapContent` while `LevelRow` was still rendering.
   * React said exactly that, every time a floor was expanded:
   * *"Cannot update a component (MapContent) while rendering a different component (LevelRow)"*.
   *
   * `open` read from the closure is correct here: this is a click, so it holds the value from the
   * render that produced the handler, which is the state the click is acting on. The updater form
   * exists to survive rapid successive updates, which a toggle does not have.
   */
  const toggle = useCallback(() => {
    if (!open) requestTypes(buildingId, level.index);
    setOpen(!open);
  }, [open, buildingId, level.index, requestTypes]);
  // The map moving to this level opens it too — same rule, arrived at from the other direction.
  useEffect(() => {
    if (current) setOpen(true);
  }, [current]);
  const ref: LevelRef = {
    building,
    buildingId,
    index: level.index,
    name: level.name,
    short: level.short,
  };
  /**
   * Derived at render, not read off `level.tags`.
   *
   * The tree's `Building[]` is built once — the module-level placeholder at import, the live one
   * when the map reports its buildings — so a tag baked in then can't answer a question that
   * changes later. The grace tag survived that because its label is a getter on a shared object,
   * but Expert Review has to be able to *disappear* when S5 turns the phase off, and no getter
   * removes an array element. `levelTagsFor` is cheap and the row already re-renders.
   */
  const { shown: shownTags, hidden: hiddenTags } = resolveTags(
    liveTagsFor(buildingId, level.index, level.short),
  );
  const lockedByExperts = isUnderExpertReview(level.index, buildingId);

  return (
    <>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={toggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: `8px 12px 8px ${indent(1)}px`,
          borderBottom: `1px solid ${LINE}`,
          background: hover || menuOpen ? "#f6f7f9" : "#fff",
          cursor: "pointer",
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
          aria-label={open ? "Collapse" : "Expand"}
        >
          <Chevron open={open} />
        </button>
        {/*
          **Left-aligned** (Olcay, 2026-08-12: *"POI and chevron should align with 0 above"*).
          The box always started on the child column, but the digit was right-aligned inside it, so
          the glyph sat ~10px to the right of everything nested beneath it and nothing looked lined
          up. Right-alignment was making the indices agree with *each other*; agreeing with their
          own children matters more, and a negative index simply takes the first character slot.
        */}
        <span
          style={{ width: 16, textAlign: "left", fontSize: 13, color: MUTED }}
        >
          {level.index}
        </span>
        {/*
          Name on the first line, tags on a second beneath it — the same shape the DS `listItem`
          uses for its `additionalInformation` slot (Figma node 2505:1249). Inline tags fight the
          name for width and force it to truncate; stacked, the name gets the whole row.
        */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            minWidth: 0,
            flex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: 0,
            }}
          >
            <span
              title={level.name}
              style={{
                fontSize: 13,
                color: "var(--review-ink)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                minWidth: 0,
              }}
            >
              {level.name}
            </span>
            {level.starred && <Star />}
            {typeof level.count === "number" && <Count n={level.count} />}
          </div>
          {/*
            Every state lives on this line, "New version" included — it is a status like the rest,
            just one that happens to be clickable. Ordered most-important first, with redundant
            states dropped (see TAG_PRIORITY / TAG_SUPERSEDES).
          */}
          {!!shownTags.length && (
            <div
              data-tour="level-tags"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              {shownTags.map((t) => (
                <Tag
                  key={t.kind}
                  tag={t}
                  onAction={
                    t.action === "review" ? () => onReview(ref) : undefined
                  }
                />
              ))}
              {hiddenTags > 0 && (
                <span style={{ fontSize: 11, color: MUTED }}>
                  +{hiddenTags}
                </span>
              )}
            </div>
          )}
        </div>
        {/* the menu button only appears on hover, as in the design */}
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button
              aria-label={`Actions for ${level.name}`}
              style={{
                display: "grid",
                placeItems: "center",
                width: 28,
                height: 28,
                borderRadius: 6,
                border: "none",
                background: "none",
                color: MUTED,
                cursor: "pointer",
                visibility: hover || menuOpen ? "visible" : "hidden",
              }}
            >
              <Ellipsis />
            </button>
          </PopoverTrigger>
          {/*
            Three items only (Olcay, 2026-08-10 evening — Georeference and View version history
            moved out; both remain reachable from the editor, which is a click away). The expert
            hold still reaches the frame-changing actions (EXPERT_HOLD is the law): Update
            floor-plan and Delete lock with their reasons; Edit stays open — it is how you reach
            the held screen in the first place. Update floor-plan opens the editor AND pops the
            file browser (the menu click's user activation carries into the editor's mount).
          */}
          <PopoverContent
            align="start"
            side="bottom"
            style={{ width: 232, padding: 6 }}
          >
            <MenuItem
              label="Update floor-plan"
              reason={lockedByExperts ? EXPERT_HOLD.upload : undefined}
              onClick={() => {
                setMenuOpen(false);
                onUpdate(ref);
              }}
            />
            <MenuItem
              label="Edit level details"
              onClick={() => {
                setMenuOpen(false);
                onEdit(ref);
              }}
            />
            <MenuItem
              label="Delete level"
              danger
              reason={lockedByExperts ? EXPERT_HOLD.remove : undefined}
              onClick={() => setMenuOpen(false)}
            />
          </PopoverContent>
        </Popover>
      </div>
      {/*
        **What is actually on this floor** (Olcay, 2026-08-11: *"we need to expand levels to show
        each type"*), grouped the way the real dashboard groups it.

        The grouping is the taxonomy's own `class` — POI · Structural · Interior · Virtual — and the
        counts are the map's, not a fixture: every `source_ptr` feature carries `mainType`/`subType`,
        so this is the floor describing itself. Icons come from the taxonomy's published sprite
        sheet, so they cannot drift from the types they label.

        ⚠️ **Counts are of what the map has LOADED.** `querySourceFeatures` only sees loaded tiles,
        so a floor whose far end has never been in view under-reports. Hence "as loaded" in the
        header rather than a bare total — the real dashboard reads these from the content API.
      */}
      {open && <LevelTypes buildingId={buildingId} index={level.index} />}
    </>
  );
}

function BuildingRow({
  building,
  open,
  onToggle,
  onEdit,
  onReview,
  onUpdate,
  onEditBuilding,
}: {
  building: Building;
  /** Expansion lives in MapContent so the map's own building can open itself (see openBuildings). */
  open: boolean;
  onToggle: () => void;
  onEdit: (l: LevelRef) => void;
  onReview: (l: LevelRef) => void;
  onUpdate: (l: LevelRef) => void;
  /** The ⋯ menu's Edit building — re-enters the Building wizard with steps pre-completed. */
  onEditBuilding: (b: Building) => void;
}) {
  const [hover, setHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: `10px 12px 10px ${indent(0)}px`,
          borderBottom: `1px solid ${LINE}`,
          background: hover || menuOpen ? "#f6f7f9" : "#fff",
          // the ⋯ floats over the row rather than sitting in its flow: at 28px it is taller than
          // the 19px text line, so in-flow it stretched building rows to 49px against Outdoor Map
          // Content's 39px — a hover affordance was setting the tree's rhythm (fixed 2026-08-11)
          position: "relative",
        }}
      >
        <button
          onClick={onToggle}
          disabled={!building.levels}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: building.levels ? "pointer" : "default",
            opacity: building.levels ? 1 : 0.25,
          }}
          aria-label={open ? "Collapse" : "Expand"}
        >
          <Chevron open={open} />
        </button>
        <span style={{ color: MUTED, display: "grid", placeItems: "center" }}>
          <Icon name="building-01" />
        </span>
        <span style={{ fontSize: 13, color: "var(--review-ink)" }}>
          {building.name}
        </span>
        {building.status && (
          <span
            style={{
              fontSize: 11,
              color: "#B45309",
              border: "1px solid #F5A623",
              borderRadius: 999,
              padding: "2px 10px",
            }}
          >
            {building.status}
          </span>
        )}
        {typeof building.count === "number" && <Count n={building.count} />}
        {/* buildings carry a ⋯ just like levels (Olcay, 2026-08-11) */}
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button
              aria-label={`Actions for ${building.name}`}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                display: "grid",
                placeItems: "center",
                width: 28,
                height: 28,
                borderRadius: 6,
                border: "none",
                background: "none",
                color: MUTED,
                cursor: "pointer",
                visibility: hover || menuOpen ? "visible" : "hidden",
              }}
            >
              <Ellipsis />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="bottom"
            style={{ width: 232, padding: 6 }}
          >
            <MenuItem
              label="Edit building"
              onClick={() => {
                setMenuOpen(false);
                onEditBuilding(building);
              }}
            />
            <MenuItem
              label="Delete building"
              danger
              onClick={() => setMenuOpen(false)}
            />
          </PopoverContent>
        </Popover>
      </div>
      {open &&
        building.levels?.map((l) => (
          <LevelRow
            key={l.index}
            building={building.name}
            buildingId={building.id}
            level={l}
            onEdit={onEdit}
            onReview={onReview}
            onUpdate={onUpdate}
          />
        ))}
    </>
  );
}

export function MapContent({
  section = "content",
  onEditLevel,
  onReviewLevel,
  onUpdateLevel,
  onUploadLevel,
  onAddBuilding,
  onEditBuilding,
}: {
  /**
   * Which of the rail's four layer groups is selected (Olcay, 2026-08-16). It decides two things
   * and nothing else: what the map draws, and which rows the tree lists under a level. The screen
   * is the same screen — these are not four screens, they are four layers over one.
   */
  section?: MapSection;
  onEditLevel: (l: LevelRef) => void;
  onReviewLevel: (l: LevelRef) => void;
  /** The ⋯ menu's Update floor-plan: open the editor with the file browser popped. */
  onUpdateLevel: (l: LevelRef) => void;
  /** A dropped floor-plan was confirmed for a level — open its editor and start the upload. */
  onUploadLevel: (l: LevelRef, file: string) => void;
  /** "Add new" — opens the Building wizard (v9 10059:102926). */
  onAddBuilding: () => void;
  /** A building row's ⋯ → Edit building: the wizard re-entered with steps pre-completed. */
  onEditBuilding: (b: {
    id: string;
    name: string;
    levels: { index: number; short: string; name: string }[];
  }) => void;
}) {
  const [buildings, setBuildings] = useState<Building[] | null>(null);
  const [live, setLive] = useState<MapBuilding[]>([]);
  // What the map is showing — driven by the selector over the map, top-centre.
  const [target, setTarget] = useState<
    { building: string; level: number } | undefined
  >();

  /**
   * The per-level type counts the map reports, cached so a floor you have already looked at stays
   * populated when you collapse and re-open it — and so switching away doesn't blank it.
   */
  const [typesByLevel, setTypesByLevel] = useState<
    Record<string, LevelTypeCount[]>
  >({});
  const onTypes = useCallback(
    (forLevel: { building: string; level: number }, types: LevelTypeCount[]) =>
      setTypesByLevel((prev) => ({
        ...prev,
        [`${forLevel.building}:${forLevel.level}`]: types,
      })),
    [],
  );

  /**
   * The taxonomy's sprite sheet, fetched once. It is a published, versioned artefact, so the icons
   * cannot drift from the types they label — and one PNG plus one JSON costs one request each
   * rather than an icon per type.
   */
  const [sheet, setSheet] = useState<SpriteSheet | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`${SPRITE_BASE}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (live && j) setSheet(j);
      })
      .catch(() => {}); // no icons is a fine outcome; the rows still read
    return () => {
      live = false;
    };
  }, []);

  /** Expanding a floor shows it on the map, which is what makes its counts arrive. */
  const requestTypes = useCallback(
    (building: string, level: number) =>
      setTarget((t) =>
        t?.building === building && t?.level === level
          ? t
          : { building, level },
      ),
    [],
  );
  /**
   * The feature the tree has centred the map on, plus a nonce that rises on every request — so
   * clicking the same row twice re-centres, which matters because you may have panned away since.
   */
  const [focused, setFocused] = useState<{ fid: string; n: number } | null>(
    null,
  );
  /**
   * **The rest of the selection** — every feature shift-clicked alongside `focused`, which is
   * always the first of them (Olcay, 2026-08-16: *"I should be able to press shift and multi select
   * features"*).
   *
   * ⚠️ Held *beside* `focused` rather than turning it into a list. `focused` is the anchor for a
   * great deal of machinery — the camera, presence, the flag lookup, the geometry editor — every
   * bit of which acts on exactly one feature and always will. Making it an array would have forced
   * all of them to answer "which one?", and the honest answer everywhere is "the one the panel is
   * anchored to". So the anchor stays a scalar and the extras live here.
   *
   * ⚠️ Declared **above** `focusNow` and everything else that clears it. A `const` read before its
   * declaration is a temporal dead zone, not `undefined` — the same shape of bug as the blank page
   * in `cloud/session.ts` and the one `closeProps` carries a warning about.
   */
  const [also, setAlso] = useState<string[]>([]);
  /**
   * Every selected feature's property bag, by fid — what the panel merges to decide whether a field
   * shows one value or *Multiple values*, and what a multi-edit writes back into.
   *
   * A **ref**, not state: it is filled by the very click that selects a feature, so `also` changing
   * is what re-renders and it always changes in the same breath.
   */
  const propsOfRef = useRef<Record<string, Record<string, unknown>>>({});
  /**
   * **The level's true geometry**, fetched from Pointr Cloud rather than scraped from the tiles —
   * see `cloud/levelFeatures` for why the tiles cannot answer this.
   *
   * Held here and handed to the map, because the *app* owns the session and the map shell has no
   * token. The same division of labour as `editabletypes`: the app knows who you are, the map knows
   * where things are.
   *
   * Empty until it arrives, and empty forever if it fails — the editor falls back to the tiles,
   * which is precisely how it behaved before this existed.
   */
  const [levelGeom, setLevelGeom] = useState<LevelGeometry[]>([]);
  /**
   * The level's **wayfinding graph** — nodes and the adjacency between them (Olcay, 2026-08-16:
   * *"there should be lines with direction on the wayfinding network"*).
   *
   * Fetched only where it can be drawn: the Wayfinding Network section. A floor's network is
   * hundreds of nodes and thousands of neighbour references, and pulling it for a screen that hides
   * the whole type would be a megabyte spent to draw nothing.
   */
  const [pathNodes, setPathNodes] = useState<PathNode[]>([]);
  /**
   * The **networks** on the shown floor, as the map works them out — one entity per connected
   * component (Olcay, 2026-08-16). Keyed by level, because the tree can have several floors open.
   */
  const [netsByLevel, setNetsByLevel] = useState<Record<number, MapNetwork[]>>(
    {},
  );
  const onNetworks = useCallback(
    (forLevel: number, nets: MapNetwork[]) =>
      setNetsByLevel((prev) => ({ ...prev, [forLevel]: nets })),
    [],
  );
  useEffect(() => {
    if (!target || section !== "wayfinding-network") {
      setPathNodes([]);
      return;
    }
    let live = true;
    // ⚠️ Cleared first, for the same reason the geometry is: leaving the last floor's corridors on
    // screen while the next floor's arrive draws a network over a building it does not belong to.
    setPathNodes([]);
    void levelPaths(target.building, target.level).then((n) => {
      if (live) setPathNodes(n);
    });
    return () => {
      live = false;
    };
  }, [target, section]);
  useEffect(() => {
    if (!target) return;
    let live = true;
    // Cleared first: leaving one floor's geometry on screen while another loads would let the
    // editor open a shape from the level you have just left.
    setLevelGeom([]);
    void levelGeometry(target.building, target.level).then((g) => {
      if (live) setLevelGeom(g);
    });
    return () => {
      live = false;
    };
  }, [target]);
  /**
   * ⚠️ The primary's fid, for handlers that cannot see state. `onFeatureClick` is memoised with an
   * empty dependency list — it must be, or every keystroke would re-post it to the iframe — so it
   * cannot read `focused` and would forever compare against the first feature ever opened.
   */
  const focusedRef = useRef<string | null>(null);
  focusedRef.current = focused?.fid ?? null;
  /** The same, for the rest of the selection — `onEdited` is memoised on `focused` alone. */
  const alsoRef = useRef<string[]>([]);
  alsoRef.current = also;
  const focusNow = useCallback(
    (buildingId: string, index: number, fid: string) => {
      // the floor first, then the feature — see the context's `focus` note
      setTarget((t) =>
        t?.building === buildingId && t?.level === index
          ? t
          : { building: buildingId, level: index },
      );
      setFocused((f) => ({ fid, n: (f?.n ?? 0) + 1 }));
      // A tree row picks ONE feature, so it replaces the selection rather than joining it. Shift
      // adds only from the map, where you can see which rooms are next to which.
      setAlso([]);
      // Drop the previous feature's properties the moment a new one is picked. Keeping them until
      // the replacement arrives would show the OLD feature's fid under the NEW feature's name for as
      // long as the tiles take — and after a level switch that is seconds, not frames.
      setProps((cur) => (cur && cur.fid === fid ? cur : null));
    },
    [],
  );
  /**
   * The focused feature's own properties, as the map reported them (§19). Held beside `focused`
   * rather than inside it because they arrive **later**: the map retries until the tiles carrying
   * that feature have landed.
   */
  const [props, setProps] = useState<{
    fid: string;
    props: Record<string, unknown>;
  } | null>(null);
  /**
   * Local feature edits, keyed by `fid` — the panel's edit mode writing back.
   *
   * ⚠️ **In memory only** (D3): the vector tiles are the SDK's and this prototype writes to nothing.
   * It is held here rather than in the panel so that **every surface agrees** — the tree row renames
   * with the panel, which is the whole design principle this app is arranged around. A reload
   * restores whatever the tiles say.
   */
  const [edits, setEdits] = useState<
    Record<string, { name?: string; subType?: string }>
  >({});
  const onFeatureProps = useCallback(
    (fid: string, p: Record<string, unknown>) => setProps({ fid, props: p }),
    [],
  );
  /**
   * A click on the map's own geometry. The panel is driven by `focused`, so a map click has to
   * become a focus exactly as a tree row does — otherwise `shownProps` discards the properties as
   * belonging to a feature nobody selected.
   *
   * The camera is deliberately NOT re-flown: you clicked the thing, you can already see it, and
   * moving the map under a cursor that just landed is disorienting. The nonce still rises so a
   * second click on the same feature re-opens a panel you had closed.
   */
  const onFeatureClick = useCallback(
    (fid: string, p: Record<string, unknown>, additive?: boolean) => {
      /**
       * ⚠️ **Shift-click never asks about unsaved work.** The guard exists because opening another
       * feature *replaces* what the panel is editing and would lose it; adding one does the
       * opposite — the edit stays open and now covers one more feature. Asking "you have unsaved
       * changes" while extending the very selection those changes belong to would be nonsense.
       */
      if (additive) {
        setAlso((cur) => {
          const at = cur.indexOf(fid);
          // Shift-clicking something already in the selection takes it back out (Olcay, 2026-08-16).
          if (at >= 0) return cur.filter((f) => f !== fid);
          // Shift-clicking the PRIMARY is the same gesture, but the primary cannot simply be
          // dropped — the panel is anchored to it. Promote the first of the others and carry the
          // rest, so the selection shrinks by one exactly as it does everywhere else.
          if (focusedRef.current === fid) {
            if (!cur.length) return cur; // the last one standing: nothing to promote to
            const [next, ...rest] = cur;
            const bag = propsOfRef.current[next];
            if (bag) setProps({ fid: next, props: bag });
            setFocused((f) => ({ fid: next, n: f?.n ?? 0 }));
            return rest;
          }
          propsOfRef.current[fid] = p;
          return [...cur, fid];
        });
        propsOfRef.current[fid] = p;
        return;
      }
      if (dirtyRef.current) {
        setPendingPick({ kind: "map", fid, props: p });
        return;
      }
      // A plain click REPLACES the selection — the counterpart to shift adding to it.
      setAlso([]);
      propsOfRef.current = { [fid]: p };
      setProps({ fid, props: p });
      setFocused((f) => ({ fid, n: (f?.n ?? 0) + 1 }));
    },
    [],
  );
  /**
   * **Unsaved edits guard** (Olcay, 2026-08-14: *"warn the user if they changed a POI then tried
   * to select some other POI"*).
   *
   * Held in a REF as well as state: the map's click handler is memoised with an empty dependency
   * list — it must be, or every keystroke would re-post it to the iframe — so it cannot read
   * changing state directly and would forever see `false`.
   *
   * Nothing is auto-saved. The choice is explicit and the safe branch is the default: discarding
   * is the destructive one, so it is what the user has to ask for.
   */
  const dirtyRef = useRef(false);
  /**
   * Whether the panel's edit could actually be saved right now — it cannot, for instance, with the
   * required **Name** emptied. State rather than a ref because the overlay reads it while
   * rendering, to decide whether *Save changes* is an honest thing to offer at all.
   */
  const [canSave, setCanSave] = useState(false);
  const onDirtyChange = useCallback((d: boolean, can: boolean) => {
    dirtyRef.current = d;
    setCanSave(can);
  }, []);
  /**
   * Closing the panel clears the selection itself — the panel IS the selection made visible.
   *
   * ⚠️ Declared HERE, above everything that calls it. It used to sit two hundred lines further
   * down, which was harmless only for as long as nothing above it referred to it — a `useCallback`
   * listing it as a dependency reads it at render time, and a `const` read before its declaration
   * is a temporal dead zone, not `undefined`. The same shape of bug as the blank page in
   * `cloud/session.ts`.
   */
  const closeProps = useCallback(() => {
    setFocused(null);
    setProps(null);
    setAlso([]);
  }, []);
  const [pendingPick, setPendingPick] = useState<
    | { kind: "map"; fid: string; props: Record<string, unknown> }
    | { kind: "tree"; buildingId: string; index: number; fid: string }
    /** Cancel, on a panel with unsaved work — the third thing that has to ask before it acts. */
    | { kind: "close" }
    | null
  >(null);
  /**
   * Carry out whichever thing was waiting on the answer. Shared by *Discard* and by *Save changes*,
   * because what happens next is the same either way — only the fate of the edit differs, and that
   * is settled before this runs.
   */
  const runPending = useCallback(
    (pick: typeof pendingPick) => {
      dirtyRef.current = false;
      if (!pick) return;
      if (pick.kind === "close") {
        closeProps();
      } else if (pick.kind === "map") {
        setProps({ fid: pick.fid, props: pick.props });
        setFocused((f) => ({ fid: pick.fid, n: (f?.n ?? 0) + 1 }));
        // Only a PLAIN click is ever held here — shift-click skips the guard entirely, because
        // adding to a selection cannot lose the edit the guard is protecting.
        setAlso([]);
        propsOfRef.current = { [pick.fid]: pick.props };
      } else {
        focusNow(pick.buildingId, pick.index, pick.fid);
      }
    },
    [closeProps, focusNow],
  );
  /**
   * *Discard changes* — the edit is thrown away and the waiting thing happens.
   *
   * The geometry needs no explicit reset: whichever branch runs, the effect that watches
   * `shownProps` sends the map either `begin` for the new feature — which rebuilds the outline
   * from the source — or `end` with `commit: false`. An uncommitted shape cannot survive either.
   */
  const discardAndContinue = useCallback(() => {
    const pick = pendingPick;
    setPendingPick(null);
    runPending(pick);
  }, [pendingPick, runPending]);
  /**
   * *Save changes* — ask the panel to save (the draft is its), and let `onSaved` carry on. The
   * overlay stays up for that one render; the alternative is closing it and leaving the user
   * looking at nothing while the save happens.
   */
  const [saveSignal, setSaveSignal] = useState(0);
  const saveAndContinue = useCallback(() => setSaveSignal((n) => n + 1), []);
  /**
   * **Cancel closes the whole thing** (Olcay, 2026-08-15: *"Cancel edit should close the panel
   * completely and close all the geometry edit. Ask user to confirm if they changed something."*).
   *
   * Closing clears `focused`, which drops the geometry editor with it — the effect below sends the
   * map `end` with `commit: false`, so the outline goes back to the published one. One gesture,
   * both halves, exactly as Update is one gesture for both halves.
   *
   * Only asks when there is something to lose. Cancelling an edit you never made should not open a
   * dialog to tell you nothing will happen.
   */
  const onCancelEdit = useCallback(() => {
    if (dirtyRef.current) {
      setPendingPick({ kind: "close" });
      return;
    }
    closeProps();
  }, [closeProps]);
  /**
   * **Escape leaves the edit, wherever the focus happens to be** (Olcay, 2026-08-17: *"escape
   * should exit editing (confirmation overlay if any change)"*).
   *
   * Two listeners for one key, because the screen is two documents: the map is an **iframe** and
   * keeps its own keyboard, so a press over the map never reaches this window. The map peels its
   * own layers first and then reports the key (`onEscape` below); this covers the other half —
   * focus in the panel, the tree, or nowhere in particular.
   *
   * It goes through `onCancelEdit`, which is the ✕ button's own path: **Escape must not be a way
   * around the unsaved-work question**, only a faster way of asking it.
   */
  useEffect(() => {
    if (!focused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // The overlay owns Escape while it is open — there it means *Keep editing*, and closing the
      // panel underneath the question being asked about it would be absurd.
      if (pendingPick) return;
      /**
       * ⚠️ A native `<select>` eats Escape to close its own dropdown. Taking the panel down at the
       * same time would make one press do two things, one of them invisible.
       */
      if (e.target instanceof HTMLSelectElement) return;
      e.preventDefault();
      onCancelEdit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focused, pendingPick, onCancelEdit]);

  /** The tree's selection, guarded the same way the map's is — one rule, both surfaces. */
  const focus = useCallback(
    (buildingId: string, index: number, fid: string) => {
      if (dirtyRef.current) {
        setPendingPick({ kind: "tree", buildingId, index, fid });
        return;
      }
      focusNow(buildingId, index, fid);
    },
    [focusNow],
  );
  /**
   * **Presence is scoped to the floor** (Olcay, 2026-08-14: *"don't show cursor even though same
   * viewport but different levels"*). Two people at the same coordinates on different levels are
   * not looking at the same thing — an airport stacks its floors, so the same lng/lat is a
   * different room one storey down.
   */
  useSyncExternalStore(subscribePresence, presenceVersion);
  useEffect(() => {
    const b = live.find((x) => x.id === target?.building);
    const l = b?.levels.find((x) => x.index === target?.level);
    setPresenceFloor(
      target?.building,
      target?.level,
      b?.name,
      l?.long ?? l?.short,
    );
  }, [target, live]);
  /**
   * Somebody chose to follow a colleague. The request comes through presence rather than a prop:
   * the control is in the top bar and the destination is this screen's `target`, and threading a
   * callback through App would make it the middleman for a fact it has no reason to know.
   */
  useSyncExternalStore(subscribeFollow, followVersion);
  const follow = getFollowRequest();
  useEffect(() => {
    if (!follow) return;
    setTarget((t) =>
      t?.building === follow.building && t?.level === follow.level
        ? t
        : { building: follow.building, level: follow.level },
    );
    // Keyed on the NONCE alone: following the same person twice must fire again, and the
    // whole request object would re-run this on unrelated presence ticks.
  }, [follow?.n]);
  /** Who else has something open on this floor — the map draws it, the tree marks the row. */
  const editors = useMemo(
    () =>
      getEditorsOnFloor(target?.building, target?.level).map((p) => ({
        fid: p.editingFid as string,
        who: p.identity.name,
        colour: peerColour(p),
      })),
    // `presenceVersion()` is read as a VALUE, so the memo recomputes whenever presence changes —
    // the subscription above is what re-renders us. (No eslint-disable: this config has no
    // `react-hooks/exhaustive-deps` rule, so the comment itself would be the error.)
    [target, presenceVersion()],
  );

  const editorsByFid = useMemo(() => {
    const out: Record<string, { who: string; colour: string }> = {};
    for (const e of editors) out[e.fid] = { who: e.who, colour: e.colour };
    return out;
  }, [editors]);

  const peers = useMemo(
    () =>
      getPeersOnFloor(target?.building, target?.level).map((p) => ({
        id: p.id,
        name: p.identity.name,
        colour: peerColour(p),
        lng: p.lng,
        lat: p.lat,
      })),
    // presenceVersion is the dependency in spirit; the subscription above re-renders us
    [target, presenceVersion()],
  );
  /**
   * The geometry editor lives in the map page — it needs `project`/`unproject` on every mouse move,
   * and round-tripping that through React would put a postMessage in the middle of a drag. This
   * side owns only the toolbar and the state the map reports back.
   */
  const [geom, setGeom] = useState<GeomState>({ editing: false });
  /**
   * ⚠️ **A QUEUE, not one slot — because two commands can be sent in the same commit.**
   *
   * This was a single `{ seq, body }` and it silently ate commands. Opening a feature fires two
   * effects on one commit — `begin` for the editor and `select` for the multi-selection — and two
   * plain `setState` calls in one batch are last-write-wins, so **`begin` never reached the map**.
   * The panel opened, the map was never told, and the whole geometry editor simply failed to
   * appear. The `seq` was already there and did not help: it makes the *same* command twice fire
   * twice, which is a different problem from two *different* commands colliding.
   *
   * Bounded, because it is append-only: the consumer tracks the last `seq` it posted (see
   * PointrMap), so trimming can never replay anything, and no realistic burst reaches 32 — every
   * send causes the render that drains it.
   */
  const [geomCommands, setGeomCommands] = useState<
    { seq: number; body: Record<string, unknown> }[]
  >([]);
  const geomSeq = useRef(0);
  const sendGeom = useCallback((body: Record<string, unknown>) => {
    geomSeq.current += 1;
    const seq = geomSeq.current;
    setGeomCommands((cur) => [...cur.slice(-31), { seq, body }]);
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
   * A committed outline.
   *
   * ⚠️ **Local to the map, and only for as long as the panel is open.** `edits` is
   * `{ name, subType }` keyed by `fid` — there is nowhere in it for a shape, so nothing merges a
   * new outline into the tree the way a rename does, and closing the panel drops it. That is the
   * honest state of geometry editing in this prototype; it is recorded here rather than dressed up.
   *
   * `pieces > 1` means the feature has been SPLIT. Which piece keeps the fid is deliberately not
   * answered here — see the note on `geomApplyCut` in the map shell, and the open question in the
   * hand-off. Naming the second room is the unbuilt half of this.
   */
  const onGeometry = useCallback(
    (
      fid: string,
      rings: number[][][],
      pieces: number,
      point?: [number, number] | null,
      absorbed?: string[],
    ) => {
      console.info(
        "[geometry] edited",
        fid,
        // A point feature has no rings at all — reporting "0 ring(s)" for a POI somebody just
        // dragged said nothing about what happened to it.
        point
          ? `point ${point[0].toFixed(6)}, ${point[1].toFixed(6)}`
          : `${rings.length} ring(s)`,
        pieces > 1 ? `· split into ${pieces} pieces` : "",
        // ⚠️ The absorbed features are NOT deleted — they are still in Pointr Cloud and still have
        // rows in the tree. Saying "absorbed" rather than "removed" is the whole of the honesty
        // available here; a real merge needs a write path this prototype does not have.
        absorbed?.length ? `· absorbed ${absorbed.join(", ")}` : "",
      );
    },
    [],
  );
  /**
   * **The editor moved the edit onto another feature** — a Combine, where the largest of the
   * combined rooms keeps its identity (Olcay, 2026-08-16).
   *
   * ⚠️ **Deliberately not `onFeatureClick`.** That path guards against unsaved work, and by
   * definition there is unsaved work here — the combine that caused this. It would greet the
   * gesture with "You have unsaved changes", about the change the user just made on purpose.
   *
   * The nonce is deliberately NOT bumped: the map is already looking at the result, and the map
   * shell ignores the resulting focus anyway (see `skipFocus` there).
   *
   * ⚠️ **Both state updates must happen here, in one handler.** `shownProps` is only non-null while
   * `props.fid` and `focused.fid` agree, and the effect below it sends the map `end` whenever it is
   * null — so setting the focus in one message and waiting for the properties in another would put
   * a render between them in which the app tears down the editor holding the combine. React batches
   * within a handler; two `postMessage`s are two handlers.
   */
  const onGeomIdentity = useCallback(
    (fid: string, p: Record<string, unknown>) => {
      setProps({ fid, props: p });
      setFocused((f) => ({ fid, n: f?.n ?? 0 }));
    },
    [],
  );

  /**
   * **Undo / Redo on the keyboard — the parent's half** (Olcay, 2026-08-23).
   *
   * ⚠️ **The map shell carries the same binding, and that is deliberate.** The map is an iframe, so
   * it only receives a keystroke while focus is inside it. The moment anyone touches the properties
   * panel, focus is in THIS document instead and the shell never hears the key. Both halves are
   * needed for the shortcut to work from everywhere a user actually is; neither is redundant.
   *
   * ⚠️ **It must not fire while somebody is typing.** `Cmd+Z` in the Name field has to undo the
   * TEXT, not the geometry — quietly reshaping a room because a user corrected a typo would be the
   * worst kind of surprise. So a text target hands the event straight back to the browser.
   *
   * It also stands down while the unsaved-changes overlay is up: changing the shape behind a modal
   * that is asking about that very shape is not something to offer.
   *
   * `preventDefault` only where the shortcut is genuinely handled, so the browser's own undo is
   * left alone everywhere else.
   */
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (!(ev.metaKey || ev.ctrlKey)) return;
      const k = ev.key.toLowerCase();
      if (k !== "z" && k !== "y") return;
      if (!geom.editing || pendingPick) return;

      const t = ev.target as HTMLElement | null;
      const tag = t?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        t?.isContentEditable
      )
        return;

      const redo = k === "y" || ev.shiftKey;
      if (redo ? !geom.canRedo : !geom.canUndo) return;
      ev.preventDefault();
      sendGeom({ cmd: redo ? "redo" : "undo" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [geom.editing, geom.canUndo, geom.canRedo, pendingPick, sendGeom]);

  /**
   * The editor refusing a cut, in its own words. Shown on the toolbar rather than logged, because
   * the message is an instruction — "move it a little and try again" is useless in a console.
   */
  const [geomNotice, setGeomNotice] = useState<string | null>(null);
  const onGeomError = useCallback((_fid: string, message: string) => {
    setGeomNotice(message);
  }, []);
  useEffect(() => {
    if (!geomNotice) return;
    const t = setTimeout(() => setGeomNotice(null), 4000);
    return () => clearTimeout(t);
  }, [geomNotice]);
  // A notice is about the cut you just tried; the moment you start another one it is stale.
  useEffect(() => {
    if (geom.cutting) setGeomNotice(null);
  }, [geom.cutting]);

  // Only ever show properties for the feature currently selected: a late reply about a feature you
  // have already moved on from must not repaint the panel.
  const shownProps =
    focused && props && props.fid === focused.fid ? props.props : null;

  /**
   * Tell everyone what this tab has open. Driven by `shownProps` rather than `focused`, because a
   * focus is only a request — the panel is not actually open on a feature until its properties
   * have arrived, and announcing sooner would flag features nobody ended up editing.
   */
  /**
   * **Geometry editing starts with the panel** (Olcay, 2026-08-15: *"edit shape already should be
   * enabled when in edit mode"*) — the same reasoning that removed the Edit button. Selecting a
   * feature is the intent to work on it; making the shape wait behind one more click was the step
   * between the click and the thing the click was for.
   */
  useEffect(() => {
    const fid = shownProps ? String(props?.fid ?? "") : "";
    if (fid) sendGeom({ cmd: "begin", fid });
    else sendGeom({ cmd: "end", commit: false });
  }, [shownProps, props?.fid, sendGeom]);

  /**
   * **The map is told what is selected; it answers with what it alone knows.**
   *
   * The app owns the selection because the panel, the count and the toast all live here. What it
   * cannot know is whether these features are close enough to Combine — that needs their outlines,
   * which only the map shell has. So this posts the fids and the shell reports `combinable` back in
   * `geomstate`.
   *
   * ⚠️ After `begin`, never before: the shell hangs the selection off the open editor, so a
   * selection sent while nothing is open is dropped on the floor. Both effects run in order on the
   * same commit, which is exactly the ordering needed and the reason this sits directly below.
   */
  useEffect(() => {
    if (shownProps) sendGeom({ cmd: "select", fids: also });
  }, [also, shownProps, props?.fid, sendGeom]);

  /**
   * The whole selection, primary first — the order the panel lists them in and the order the map
   * highlights them in. Memoised because it is a prop the map diffs against its previous value.
   */
  const selection = useMemo(
    () => (focused ? [focused.fid, ...also] : []),
    [focused, also],
  );
  /**
   * **The property bags for everything selected**, primary first.
   *
   * The primary's comes from `shownProps` — which carries local edits merged in — while the others
   * come from the click that selected them. `null` entries are skipped rather than treated as an
   * empty bag: a feature whose properties have not arrived would otherwise make every field read
   * *Multiple values* for no reason the user could see.
   */
  const selectionProps = useMemo(() => {
    if (!focused || !shownProps) return [];
    const out = [shownProps];
    for (const fid of also) {
      const bag = propsOfRef.current[fid];
      if (bag) out.push({ ...bag, ...(edits[fid] ?? {}) });
    }
    return out;
  }, [focused, shownProps, also, edits]);
  /** One bag standing for all of them — see `mergeForEditing`. */
  const mergedProps = useMemo(
    () => (selectionProps.length ? mergeForEditing(selectionProps) : null),
    [selectionProps],
  );
  /**
   * The list the panel prints when you expand the count — **and what became of each row**.
   *
   * Three fates in one list rather than three lists (Olcay, 2026-08-16). After a Combine the
   * question a person has is "what did that just do to my map", and the answer is one reading:
   * this is what you still have, this is what went into it, this is what it took off the floor.
   *
   * The joined rows are named from `propsOfRef`, because the app selected them and holds their
   * properties. The removed rows arrive already named from the map shell — the app has never seen
   * them, and once they are hidden they cannot be looked up at all.
   */
  const selectionList = useMemo(() => {
    const rows = selectionProps.map((b) => ({
      fid: String(b.fid ?? ""),
      name: String(b.name ?? ""),
      typeLabel: typeLabel(String(b.subType ?? "") || String(b.mainType ?? "")),
      fate: undefined as "joined" | "removed" | undefined,
    }));
    const shown = new Set(rows.map((r) => r.fid));
    for (const fid of geom.joined ?? []) {
      if (shown.has(fid)) continue;
      shown.add(fid);
      const bag = propsOfRef.current[fid] ?? {};
      rows.push({
        fid,
        name: String(bag.name ?? ""),
        typeLabel: typeLabel(
          String(bag.subType ?? "") || String(bag.mainType ?? ""),
        ),
        fate: "joined",
      });
    }
    for (const r of geom.removed ?? []) {
      if (shown.has(r.fid)) continue;
      shown.add(r.fid);
      rows.push({
        fid: r.fid,
        name: r.name,
        typeLabel: r.type,
        fate: "removed",
      });
    }
    return rows;
  }, [selectionProps, geom.joined, geom.removed]);
  /** The ordinary case: a live selection shrinking by one. */
  const onDeselectLive = useCallback((fid: string) => {
    setAlso((cur) => {
      if (cur.includes(fid)) return cur.filter((f) => f !== fid);
      // The primary, dropped from the list: promote the next, exactly as shift-clicking it does.
      const [next, ...rest] = cur;
      if (!next) return cur;
      const bag = propsOfRef.current[next];
      if (bag) setProps({ fid: next, props: bag });
      setFocused((f) => ({ fid: next, n: f?.n ?? 0 }));
      return rest;
    });
  }, []);
  /**
   * A row's ✕ — and **which of three things it means depends on what the row is** (Olcay,
   * 2026-08-16: *"removing from the selected list it should update the geometry. Also removing the
   * wall removal should bring the wall back."*).
   *
   * - **selected** → drop it from the selection, nothing else changes.
   * - **joined** → take it back out of the combined shape, which *recomputes the geometry*.
   * - **removed** → put it back on the map. Not an undo of the join: the room stays combined and
   *   the wall stands over it again, which is a coherent thing to want and exactly what was asked.
   *
   * The last two are the map's to do, because only it has the geometry.
   */
  const onDeselect = useCallback(
    (fid: string, fate?: "joined" | "removed") => {
      if (fate === "joined") return sendGeom({ cmd: "uncombine", fid });
      if (fate === "removed") return sendGeom({ cmd: "unhide", fid });
      onDeselectLive(fid);
    },
    [sendGeom],
  );
  /**
   * The map peeling the selection back to one — Escape, or a Combine that has absorbed the rest.
   * It names the survivor because a combine can change which feature that is.
   */
  const onSelectClear = useCallback((fid: string) => {
    setAlso([]);
    setFocused((f) => (f && f.fid === fid ? f : { fid, n: f?.n ?? 0 }));
  }, []);

  useEffect(() => {
    setPresenceEditing(
      shownProps ? String(props?.fid ?? "") || undefined : undefined,
      shownProps ? String(shownProps.name ?? "") || undefined : undefined,
    );
  }, [shownProps, props?.fid]);

  /**
   * ⚠️ **`mapFlagMarks`, `focusedFlagged` and `focusedSharing` stood here until 2026-08-25.** They
   * put a concluded review's flags onto the live map and into the properties panel — including the
   * *"N features here share this name, so the flag may be about any of them"* admission, which was
   * the honest half of matching a review to a floor by name. Nothing outlives a review now, so
   * there is nothing to place and nothing to admit. The name-matching weakness itself (D5/D18) is
   * unchanged and still applies to `bindToFloor`.
   */

  /**
   * Which subTypes this feature's mainType offers — taken from **the floor's own types**, so the
   * list can't drift from the taxonomy the rest of the screen is drawn from. A type the floor
   * doesn't have yet is not offered, which is the honest limit of reading options off the content
   * rather than off the taxonomy service.
   */
  const subTypeOptions = useMemo(() => {
    if (!shownProps || !target) return [];
    const rows = typesByLevel[`${target.building}:${target.level}`] ?? [];
    const mine = String(shownProps.mainType ?? "");
    const set = new Set(
      rows
        .filter((r) => r.mainType === mine && r.subType)
        .map((r) => r.subType!),
    );
    if (shownProps.subType) set.add(String(shownProps.subType));
    return [...set].sort();
  }, [shownProps, target, typesByLevel]);
  /**
   * Saving an edit. Two consequences, and the second is the ruled one:
   * the panel shows the new values (via `edits`, which every surface reads), and **the flag clears**
   * — §18a, implicit on edit.
   */
  const onEdited = useCallback(
    (next: Record<string, unknown>, removed?: string[]) => {
      if (!focused || !target) return;
      /**
       * ⚠️ **A multi-edit MERGES; a single edit REPLACES.** They cannot share one rule.
       *
       * Editing one feature, the panel hands back its whole bag, so replacing is right and is what
       * makes a removed field actually disappear. Editing several, it hands back only the fields
       * that were settled — everything the features disagreed about and nobody touched is
       * deliberately absent — so replacing would wipe four different descriptions the moment
       * somebody renamed a room. Removal is therefore said out loud instead of inferred from what
       * is missing.
       */
      const alsoFids = alsoRef.current;
      setEdits((cur) => {
        if (!alsoFids.length) return { ...cur, [focused.fid]: next };
        const out = { ...cur };
        for (const fid of [focused.fid, ...alsoFids]) {
          const base = {
            ...(propsOfRef.current[fid] ?? {}),
            ...(cur[fid] ?? {}),
          };
          for (const k of removed ?? []) delete base[k as keyof typeof base];
          out[fid] = { ...base, ...next };
        }
        return out;
      });
      // Replace rather than merge the property bag: a field REMOVED in the editor has to disappear,
      // and a spread would keep resurrecting it from the tile's original values.
      setProps((cur) =>
        cur && cur.fid === focused.fid
          ? {
              ...cur,
              props: alsoFids.length
                ? (() => {
                    const base = { ...cur.props };
                    for (const k of removed ?? []) delete base[k];
                    return { ...base, ...next };
                  })()
                : { ...pickIdentity(cur.props), ...next },
            }
          : cur,
      );
      // Everything else selected keeps its own bag, with the settled fields written over it.
      for (const fid of alsoFids) {
        const base = { ...(propsOfRef.current[fid] ?? {}) };
        for (const k of removed ?? []) delete base[k];
        propsOfRef.current[fid] = { ...base, ...next };
      }
      /**
       * ⚠️ **Saving used to clear the feature's flag here** — §18a's *de-flagging is implicit on
       * edit*, cleared by NAME and therefore clearing all four of B2's *Food Court* features at
       * once (the D18 ambiguity). Both the state and its ambiguity went with flagging on
       * 2026-08-25; a save is now just a save.
       */
    },
    [focused, target],
  );
  /**
   * **Update closes the panel and says so** (Olcay, 2026-08-15: *"update a feature should close the
   * edit and save the changes … act like saved"*).
   *
   * ⚠️ **It reads as saved; nothing is written.** This is D3 — every edit here is in memory and dies
   * with the tab, and the confirmation deliberately does not pretend otherwise in the wording: it
   * says the change was *applied*, which is exactly what happened. The demo needs the gesture to
   * complete; it does not need a lie about a round-trip.
   */
  const [saved, setSaved] = useState<string | null>(null);
  const onSaved = useCallback(
    (name: string) => {
      setSaved(name || "Feature");
      /**
       * Where to go afterwards depends on why we saved. Pressing **Update** closes the panel,
       * because saving finished the task. Answering **Save changes** to the unsaved-work overlay
       * means the task was interrupted — so it carries on to whatever was waiting: the other
       * feature you clicked, or the close you asked for.
       */
      const pick = pendingPick;
      setPendingPick(null);
      if (pick) runPending(pick);
      else closeProps();
    },
    [closeProps, pendingPick, runPending],
  );
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(null), 2600);
    return () => clearTimeout(t);
  }, [saved]);

  const [hovered, setHovered] = useState<{
    fid?: string;
    mainType?: string;
    subType?: string;
  } | null>(null);
  const typesCtx = useMemo(
    () => ({
      byLevel: typesByLevel,
      current: target,
      request: requestTypes,
      sheet,
      focus,
      focused: focused?.fid ?? null,
      editors: editorsByFid,
      hover: setHovered,
      edits,
      section,
      networks: netsByLevel,
    }),
    [
      typesByLevel,
      target,
      requestTypes,
      sheet,
      focus,
      focused,
      editorsByFid,
      edits,
      section,
      netsByLevel,
    ],
  );
  /**
   * Hover wins while it lasts; leaving falls back to the selection rather than going dark.
   *
   * The SDK's own selection layer lights **all** of them (Olcay, 2026-08-16) — the geometry
   * overlay's dashed outlines are a second, finer mark on top, and only exist while a panel is
   * open. This is what makes a multi-selection legible at a glance.
   */
  const highlight = useMemo(
    () =>
      hovered ??
      (selection.length
        ? selection.length > 1
          ? { fids: selection }
          : { fid: selection[0] }
        : null),
    [hovered, selection],
  );
  const [mapLevel, setMapLevel] = useState<MapLevel | null>(null);
  const onBuildings = useCallback((b: MapBuilding[]) => {
    setBuildings(toBuildings(b));
    setLive(b);
  }, []);
  const onLevel = useCallback((l: MapLevel) => setMapLevel(l), []);
  // Seed the selector from whatever the map opened on, and correct it when the map says a switch
  // failed — that report carries the floor it never left, so the selector can't sit on a level the
  // map isn't showing. PointrMap only surfaces boot and *failed* switches, so this never fights a
  // selection the user just made. Same target in = same object out, so it can't loop back either.
  useEffect(() => {
    if (!live.length || !mapLevel) return;
    const b = live.find((x) => x.name === mapLevel.building) ?? live[0];
    setTarget((cur) =>
      cur && cur.building === b.id && cur.level === mapLevel.index
        ? cur
        : { building: b.id, level: mapLevel.index },
    );
  }, [live, mapLevel]);
  // Wizard-created buildings ride the store so they survive navigation; their levels carry no
  // index-keyed tags — a just-created building has no update story yet.
  const created = useSyncExternalStore(
    subscribeCreatedBuildings,
    getCreatedBuildings,
  );
  // Concluding a review changes what the level's tags say — re-read when one lands. (Navigating
  // back here remounts the screen anyway; this covers a review concluded in another surface.)
  useSyncExternalStore(subscribeReviews, getReviewCount);
  const tree = [
    ...(buildings ?? BUILDINGS),
    ...created.map((b) => ({
      id: b.id,
      name: b.name,
      count: b.levels.length,
      levels: b.levels.map((l) => ({
        index: l.index,
        name: l.long,
        short: l.short,
      })),
    })),
  ];
  /**
   * Which buildings are expanded. The building the map is showing is the one you're working in,
   * so it opens itself (Olcay, 2026-08-10) — on boot and again whenever the map's building
   * changes. Only ever ADDED, never collapsed: a building you closed by hand stays closed until
   * the map actually moves to it, and other buildings are never touched. Starts with the
   * placeholder's Terminal C so the pre-boot tree isn't a wall of chevrons.
   */
  const [openBuildings, setOpenBuildings] = useState<Set<string>>(
    () => new Set([T3_ID, ...getCreatedBuildings().map((b) => b.id)]),
  );
  useEffect(() => {
    const b = target?.building;
    if (!b) return;
    setOpenBuildings((prev) => (prev.has(b) ? prev : new Set(prev).add(b)));
  }, [target?.building]);
  const toggleBuilding = (id: string) =>
    setOpenBuildings((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const [prefs, setPrefs] = useState<MapPrefsState>({
    greyscale: false,
    hidePoiLabels: false,
    floorplan: false,
    basemap: "vector",
  });
  // A file dropped on the map, waiting for the confirmation overlay's answer. Ignored until the
  // map has booted — before that there is no honest building/level to prefill.
  const [dropped, setDropped] = useState<string | null>(null);
  const onFileDrop = useCallback(
    (f: { name: string }) => setDropped(f.name),
    [],
  );
  /** Remembered across navigation, so choosing to work on the map survives leaving the screen. */
  const [listOpen, setListOpen] = useState(() => {
    try {
      return localStorage.getItem("mapscale.listOpen") !== "0";
    } catch {
      return true; // private mode, or storage disabled — the list is the safer default
    }
  });
  const toggleList = useCallback(() => {
    setListOpen((v) => {
      try {
        localStorage.setItem("mapscale.listOpen", v ? "0" : "1");
      } catch {
        /* not being able to remember it must not stop it working now */
      }
      return !v;
    });
  }, []);

  return (
    <LevelTypesContext.Provider value={typesCtx}>
      <div
        style={{ flex: 1, display: "flex", minHeight: 0, position: "relative" }}
      >
        {/*
        **The list collapses** (Olcay, 2026-08-14: *"maybe we could have a collapse listing feature.
        So I can click on the map and continue editing"*). Editing happens on the map with the panel
        on the right; the tree is how you *get* there, and once you have arrived it is 440px of the
        thing you are working on that you cannot see.

        A remembered toggle, never automatic: collapsing the list out from under someone the moment
        they select a feature moves the ground they are standing on, which is worse than a click.
      */}
        <div
          style={{
            width: listOpen ? PANEL_WIDTH : 0,
            flex: `0 0 ${listOpen ? PANEL_WIDTH : 0}px`,
            borderRight: listOpen ? `1px solid ${LINE}` : "none",
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
            transition: "width .16s ease, flex-basis .16s ease",
          }}
        >
          <div style={{ padding: "16px 16px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: 600, color: INK }}>
                Map Content
              </Text>
              <span
                style={{ color: MUTED, display: "grid", placeItems: "center" }}
              >
                <Icon name="info-circle" />
              </span>
              <span style={{ flex: 1 }} />
              <AddNewMenu onAddBuilding={onAddBuilding} />
            </div>
            <Text style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
              You are viewing buildings for{" "}
              <b style={{ color: "var(--review-ink)" }}>
                Dubai International Airports
              </b>
            </Text>
            <div style={{ marginTop: 12 }}>
              <Input placeholder="Search" aria-label="Search map content" />
            </div>
            <Text style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>
              316 Map Content found.
            </Text>
          </div>

          <div
            data-tour="tree"
            style={{
              overflow: "auto",
              flex: 1,
              borderTop: `1px solid ${LINE}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: `10px 12px 10px ${indent(0)}px`,
                borderBottom: `1px solid ${LINE}`,
              }}
            >
              <Chevron open={false} />
              <span
                style={{ color: MUTED, display: "grid", placeItems: "center" }}
              >
                <Icon name="map-01" />
              </span>
              <span style={{ fontSize: 13, color: "var(--review-ink)" }}>
                {OUTDOOR.name}
              </span>
              <Count n={OUTDOOR.count} />
            </div>
            {tree.map((b) => (
              <BuildingRow
                key={b.id}
                building={b}
                open={openBuildings.has(b.id)}
                onToggle={() => toggleBuilding(b.id)}
                onEdit={onEditLevel}
                onReview={onReviewLevel}
                onUpdate={onUpdateLevel}
                onEditBuilding={(bb) =>
                  onEditBuilding({
                    id: bb.id,
                    name: bb.name,
                    levels: (bb.levels ?? []).map((l) => ({
                      index: l.index,
                      short: l.short,
                      name: l.name,
                    })),
                  })
                }
              />
            ))}
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
          {/* On the map's own left edge, so it sits where the list's boundary is and reads as the
            handle for it — the arrow points the way the list will move. */}
          <button
            type="button"
            onClick={toggleList}
            aria-expanded={listOpen}
            aria-label={
              listOpen ? "Hide the content list" : "Show the content list"
            }
            title={listOpen ? "Hide the list" : "Show the list"}
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
              color: MUTED,
              boxShadow: "0 1px 4px rgba(0,0,0,.10)",
            }}
          >
            {/* `chevron-left` / `chevron-right` from the Pointr Icon Library — the direction is
                the state, so it is two glyphs rather than one rotated (see `../ui/icons`). */}
            {listOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
          {/*
          Switching away from a half-edited feature. Three ways out and none of them auto-saves:
          keep editing (the default and the safe one), or discard and go where you were heading.
          "Discard" is the destructive branch, so it is the one the user has to ask for.
        */}
          <GeometryToolbar
            state={geom}
            notice={geomNotice}
            // The same reservation the camera already makes — see `focusPadRight` below. Driven by
            // `shownProps`, so it matches when the panel is actually on screen rather than when a
            // focus has merely been requested.
            padRight={shownProps ? FEATURE_PANEL_WIDTH + 24 : 0}
            onCommand={onGeomCommand}
          />
          {saved && <SavedNotice name={saved} />}

          {/**
           * One conversation for all three ways an unsaved edit can be interrupted — switching
           * feature from the map, from the tree, or cancelling out of the panel. The primary is
           * **Save changes**, not Discard: saving is the safe answer, and the destructive one
           * should never be the button that has focus when you hit Enter.
           */}
          {/**
           * ⚠️ **When the edit cannot be saved, saving is not offered.** Emptying the required Name
           * disables Update, and *Save changes* runs the very same `save()` — so offering it here
           * would let the overlay walk around a rule the button enforces. Discard becomes the
           * primary in that case, and the copy says why rather than leaving a button mysteriously
           * missing.
           */}
          <ConfirmOverlay
            open={!!pendingPick}
            tone="warning"
            title="You have unsaved changes"
            confirmLabel={canSave ? "Save changes" : "Discard changes"}
            altLabel={canSave ? "Discard changes" : undefined}
            cancelLabel="Keep editing"
            onConfirm={canSave ? saveAndContinue : discardAndContinue}
            onAlt={canSave ? discardAndContinue : undefined}
            onCancel={() => setPendingPick(null)}
          >
            {!canSave
              ? "This feature has edits that cannot be saved — it needs a name. Go back and give it one, or discard the changes."
              : pendingPick?.kind === "close"
                ? "This feature has edits you have not saved. Closing will lose them."
                : "This feature has edits you have not saved. Opening another one will lose them."}
          </ConfirmOverlay>
          <PointrMap
            /* Browsing is not reviewing, and a concluded review leaves nothing to draw. */
            changes={NO_CHANGES}
            prefs={prefs}
            onBuildings={onBuildings}
            onLevel={onLevel}
            onTypes={onTypes}
            onFileDrop={onFileDrop}
            focusFeature={focused?.fid ?? null}
            focusNonce={focused?.n ?? 0}
            highlight={highlight}
            onFeatureProps={onFeatureProps}
            /**
             * Clicking an editable feature on the map opens its panel, ready to edit — the same
             * destination the tree's rows reach, from the other surface.
             */
            onFeatureClick={onFeatureClick}
            onCursor={setPresenceCursor}
            /**
             * Escape over the map, once the map has peeled everything of its own. The same path the
             * ✕ takes, so the unsaved-work question is asked either way.
             */
            onEscape={onCancelEdit}
            /**
             * The rail's section, and the only thing the map is told about it. What may be drawn,
             * what may answer a click and what stays quiet under the pointer are all derived from
             * this one value, so they cannot disagree with each other or with the tree.
             */
            section={section}
            onNetworks={onNetworks}
            peers={peers}
            editing={editors}
            levelGeometry={levelGeom}
            levelPaths={pathNodes}
            geomCommands={geomCommands}
            onGeomState={onGeomState}
            onGeometry={onGeometry}
            onGeomIdentity={onGeomIdentity}
            onSelectClear={onSelectClear}
            onGeomError={onGeomError}
            // Reserved on the right so a focused feature frames in the map the panel doesn't cover.
            // Read from a ref inside PointrMap, so changing it can never re-fly the camera on its own.
            focusPadRight={focused ? FEATURE_PANEL_WIDTH + 24 : 0}
            target={target}
          />
          {live.length > 0 && target && (
            <LevelSelector
              buildings={live}
              buildingId={target.building}
              levelIndex={target.level}
              onChange={(building, level) => setTarget({ building, level })}
              offsetRight={shownProps ? FEATURE_PANEL_WIDTH + 24 : 0}
            />
          )}
          {shownProps && (
            <FeaturePanel
              // The merged bag when several are selected, and the plain one when it is just this
              // feature — `mergeForEditing` returns the single bag untouched, so there is one path.
              props={mergedProps ?? shownProps}
              selection={selectionList}
              onDeselect={onDeselect}
              recomposable={!!geom.recomposable}
              icon={
                <TypeIcon
                  mainType={String(shownProps.mainType ?? "")}
                  subType={
                    shownProps.subType ? String(shownProps.subType) : undefined
                  }
                />
              }
              onDirtyChange={onDirtyChange}
              geometryDirty={!!geom.dirty}
              onCommitGeometry={() => sendGeom({ cmd: "commit" })}
              subTypeOptions={subTypeOptions}
              onEdited={onEdited}
              onSaved={onSaved}
              onCancelEdit={onCancelEdit}
              saveSignal={saveSignal}
              // The ✕ is the same act as Cancel — it must ask the same question, or the guard is
              // one click wide and the corner of the panel walks straight round it.
              onClose={onCancelEdit}
            />
          )}
          <MapSettings prefs={prefs} onChange={setPrefs} />
          {dropped && live.length > 0 && target && (
            <UploadDropConfirm
              file={dropped}
              buildings={live}
              initialBuildingId={target.building}
              initialLevel={target.level}
              onConfirm={(l, f) => {
                setDropped(null);
                onUploadLevel(l, f);
              }}
              onCancel={() => setDropped(null)}
            />
          )}
        </div>
      </div>
    </LevelTypesContext.Provider>
  );
}
