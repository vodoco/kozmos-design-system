import { useEffect, useState, useSyncExternalStore } from "react";
import { TooltipProvider } from "@kozmos-ds/react";
import { TopBar, LeftRail } from "./ui/Chrome";
import { MapContent, type LevelRef } from "./screens/MapContent";
import type { MapSection } from "./mock/taxonomy";
import { LevelEditor } from "./screens/LevelEditor";
import { ManualReview } from "./screens/ManualReview";
import { VersionHistory } from "./screens/VersionHistory";
import { BuildingWizard } from "./screens/BuildingWizard";
import { Settings } from "./screens/Settings";
import {
  NotificationBell,
  type NotificationTarget,
} from "./ui/NotificationBell";
import {
  EDITED_LEVEL,
  seedEditedChanges,
  seedEditedOverrides,
  seedFloorWarnings,
  seedVersions,
  type RedCause,
} from "./mock/diff";
import {
  getCreatedBuildings,
  getLevelVersions,
  getReviewOutcome,
  levelKey,
  setReviewOutcome,
} from "./mock/store";
import { FeedbackLayer } from "./ui/FeedbackLayer";
import { PublishScope } from "./ui/PublishScope";
import type { TourScreen } from "./ui/Tour";
import { Login } from "./screens/Login";
import { getSession, sessionKey, subscribeSession } from "./cloud/session";
import {
  followVersion,
  startPresence,
  stopPresence,
  subscribeFollow,
} from "./cloud/presence";
import { OnlinePeople } from "./ui/OnlinePeople";

/**
 * The flow, in the order a customer walks it:
 *   Map Content (buildings → levels) → ⋯ → Edit level details
 *   → Editing Level (metadata + floor-plan) → upload a new CAD → MapScale → Expert Review
 *   → Manual Review of the detected changes → Apply.
 */
type Screen =
  | "mapContent"
  | "levelEditor"
  | "review"
  | "history"
  | "wizard"
  | "settings";

/** Terminal 3 and B Gates — the demo building the tour walks through (see §5). */
const T3_BUILDING_ID = "51dd37d1-c2bc-4d9e-8e22-2ea1a15a626c";

/**
 * **B4 starts with a finished review that two changes were EDITED in** (2026-08-14, rewritten
 * 2026-08-25).
 *
 * It began as the flagged-level seed: the tree advertised *"2 flagged"* on that level as a
 * hardcoded label with **no report behind it**, so every surface reading the real data — the map
 * most visibly — correctly showed nothing, and the feature read as broken.
 *
 * ⚠️ **The tag it existed to make true is gone**, along with flagging. Olcay, 2026-08-25: *"once
 * review concluded the map becomes the current map."* An edit is not an outstanding item to
 * advertise; it is simply the floor. What the seed is for now is the **record**: a concluded
 * review that carries two overrides, so Version History has a real one to show and so the shape a
 * live review writes is the shape a seeded one has.
 *
 * `complete: true, published: true` on purpose: this is a review someone **finished**.
 *
 * Runs at import, once, and only fills a gap: if a report already exists for that version it is
 * left alone, so this can never overwrite something the user did in-session.
 */
function seedEditedLevel() {
  const key = levelKey(T3_BUILDING_ID, EDITED_LEVEL);
  const versions = getLevelVersions(key, () =>
    seedVersions("B4", EDITED_LEVEL, T3_BUILDING_ID),
  );
  const newest = versions[0];
  if (!newest || getReviewOutcome(key, newest.n)) return;
  setReviewOutcome(key, {
    versionN: newest.n,
    changes: seedEditedChanges(),
    // No decisions: an override supersedes the incoming change, so confirming or rejecting it
    // as well would be recording two answers to one question.
    decisions: {},
    overrides: seedEditedOverrides(),
    published: true,
    complete: true,
  });
}
seedEditedLevel();
/**
 * The level the tour opens: B2, the amber demo whose diff has real geometry. A MODULE constant,
 * not an inline literal — a fresh object each call would set state to a "new" value every time
 * and spin the tour's navigation effect.
 */
const TOUR_LEVEL: LevelRef = {
  building: "Terminal 3 and B Gates",
  buildingId: T3_BUILDING_ID,
  index: -2,
  name: "Departures - Terminal 3",
  short: "B2",
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("mapContent");
  /**
   * Which of the Maps rail's four sections is selected — the layer group on the map and the rows in
   * the tree (Olcay, 2026-08-16).
   *
   * Held here rather than inside Map Content because the rail is drawn beside **every** screen, and
   * a section picked from the Level Editor has to be able to take you back to the map to show you
   * the thing you just asked for.
   */
  const [section, setSection] = useState<MapSection>("content");
  const [level, setLevel] = useState<LevelRef | null>(null);
  /**
   * What the review screen is reviewing: the job's post-expert % and, when red isn't the band's
   * own arithmetic, its cause (B cannot-match has no reliable %). The editor passes both; the
   * tree path reads them off the level's own newest version — same source the editor seeds from,
   * so no path can disagree with the tags. Threading this is what stopped the status card saying
   * 62% while the review header said 30.
   */
  const [reviewCtx, setReviewCtx] = useState<{
    pct: number | null;
    cause: RedCause | null;
  }>({
    pct: null,
    cause: null,
  });

  /** Where Version History returns to — it is reachable from the tree, the editor and B's review. */
  const [historyFrom, setHistoryFrom] = useState<Screen>("mapContent");
  /** Which version's checkpoint starts selected — set when a floor-plan row was clicked. */
  const [historyN, setHistoryN] = useState<number | undefined>(undefined);
  /** Cause B's review opens history straight in Compare mode (decision 11). */
  const [historyMode, setHistoryMode] = useState<
    "timeline" | "compare" | undefined
  >(undefined);

  const openLevel = (l: LevelRef) => {
    setLevel(l);
    setScreen("levelEditor");
  };
  const openReview = (l: LevelRef) => {
    setLevel(l);
    // read the LIVE version (the store), not the seed — after an upload the tree's review path
    // used to carry the seeded %, disagreeing with the card the user just looked at
    const v = getLevelVersions(levelKey(l.buildingId, l.index), () =>
      seedVersions(l.short, l.index, l.buildingId),
    )[0];
    setReviewCtx({ pct: v?.changePct ?? null, cause: v?.redCause ?? null });
    setScreen("review");
  };
  const openHistory = (
    l: LevelRef,
    from: Screen,
    selectN?: number,
    mode?: "timeline" | "compare",
  ) => {
    setLevel(l);
    setHistoryFrom(from);
    setHistoryN(selectN);
    setHistoryMode(mode);
    setScreen("history");
  };
  /**
   * A confirmed map-drop travelling to its level's editor (drag-drop upload, Olcay 2026-08-10
   * evening): the file rides here through the navigation, the editor consumes it on mount and
   * reports back so a later visit can't replay the upload.
   */
  const [pendingUpload, setPendingUpload] = useState<string | null>(null);
  /**
   * The site publish asks first (2026-08-13). It does not gate anything — the overlay says which
   * levels are held out of the publish because their review has not concluded, and offers a route
   * into each. See `mock/publishScope.ts` for why holding them out is the rule.
   */
  const [publishOpen, setPublishOpen] = useState(false);
  const openUpload = (l: LevelRef, file: string) => {
    setLevel(l);
    setPendingUpload(file);
    setBrowseOnOpen(false);
    setScreen("levelEditor");
  };
  /** The Building wizard's edit-mode parcel (building ⋯ → Edit building); null = New Building. */
  const [wizardInitial, setWizardInitial] = useState<null | {
    storeId?: string;
    name: string;
    levels: { index: number; short: string; long: string; file: string }[];
  }>(null);
  /** The tree's "Update floor-plan": the editor opens with the file browser popped. */
  const [browseOnOpen, setBrowseOnOpen] = useState(false);
  const openLevelBrowse = (l: LevelRef) => {
    setLevel(l);
    setBrowseOnOpen(true);
    setScreen("levelEditor");
  };

  /**
   * **Nothing renders until someone is signed in** (2026-08-14). Not a permission check — the app
   * is a prototype and the instance decides what you may see — but an identity check: everything
   * queued behind this (a flag's author, a comment thread, a cursor with a name on it) is
   * meaningless without a person attached, and bolting identity on afterwards is how you end up
   * with anonymous rows nobody can attribute.
   *
   * `useSyncExternalStore` over the token, so signing out anywhere drops the whole app back here.
   */
  useSyncExternalStore(subscribeSession, sessionKey);
  /**
   * Presence follows the session exactly: you appear to others when you sign in and vanish when
   * you sign out. Started here rather than inside a screen so that moving between screens does not
   * make you flicker in and out of everyone else's list.
   */
  useEffect(() => {
    if (getSession()) startPresence();
    else stopPresence();
  });
  /**
   * Following somebody has to bring you back to the map. Map Content moves its own target; this is
   * the other half — you can be in Settings or the editor when you decide to go and see what a
   * colleague is doing, and arriving on the right floor of a screen you are not on is no arrival.
   */
  const follows = useSyncExternalStore(subscribeFollow, followVersion);
  useEffect(() => {
    if (follows > 0) setScreen("mapContent");
  }, [follows]);
  if (!getSession())
    return (
      <TooltipProvider delayDuration={0}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            minHeight: 0,
          }}
        >
          {/* `onDone` exists for the transition; the store is what actually re-renders this. */}
          <Login onDone={() => undefined} />
        </div>
      </TooltipProvider>
    );

  return (
    // no hover delay: these tooltips carry the only label the icon-only controls have
    <TooltipProvider delayDuration={0}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          minHeight: 0,
        }}
      >
        <TopBar
          people={<OnlinePeople />}
          tab={screen === "settings" ? "Settings" : "Maps"}
          onTab={(t) => setScreen(t === "Settings" ? "settings" : "mapContent")}
          onPublish={() => setPublishOpen(true)}
          bell={
            <NotificationBell
              /**
               * A notification names a level, so acting on one is the same navigation the tree's
               * tags do — same two destinations, same functions. `to` decides which: a rejection
               * or a failed job sends you to the level (a corrected upload is the way out), and
               * anything reviewable sends you to the review.
               */
              onGo={(t: NotificationTarget) => {
                const ref: LevelRef = {
                  building: t.buildingName,
                  buildingId: t.buildingId,
                  index: t.levelIndex,
                  name: t.levelName,
                  short: t.levelShort,
                };
                if (t.to === "review") openReview(ref);
                else openLevel(ref);
              }}
            />
          }
          tools={
            <FeedbackLayer
              screen={screen}
              /**
               * The tour drives the app so each step can spotlight a real element. Screens that
               * need a level get the amber B2 demo — the one level whose diff has real geometry.
               */
              onNavigate={(s: TourScreen) => {
                if (s === "mapContent") return setScreen("mapContent");
                const demo = level ?? TOUR_LEVEL;
                if (s === "levelEditor") {
                  setLevel(demo);
                  setScreen("levelEditor");
                } else if (s === "review") {
                  openReview(demo);
                }
              }}
            />
          }
        />
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          <LeftRail
            variant={screen === "settings" ? "settings" : "maps"}
            section={section}
            onSection={(s) => {
              setSection(s);
              // The rail's sections are layer groups over the map, so picking one from anywhere
              // else in the app means "show me that on the map" — not "remember it for later".
              setScreen("mapContent");
            }}
          />
          {screen === "mapContent" && (
            <MapContent
              section={section}
              onEditLevel={openLevel}
              onReviewLevel={openReview}
              onUpdateLevel={openLevelBrowse}
              onUploadLevel={openUpload}
              onAddBuilding={() => {
                setWizardInitial(null);
                setScreen("wizard");
              }}
              onEditBuilding={(b) => {
                // a store building re-enters with its own files; an SDK building's levels get
                // stand-in file names (their real inputs live behind the API)
                const stored = getCreatedBuildings().find((x) => x.id === b.id);
                setWizardInitial({
                  storeId: stored?.id,
                  name: b.name,
                  levels:
                    stored?.levels ??
                    b.levels.map((l) => ({
                      index: l.index,
                      short: l.short,
                      long: l.name,
                      file: `${l.short.toLowerCase()}-floor-plan.dwg`,
                    })),
                });
                setScreen("wizard");
              }}
            />
          )}
          {screen === "settings" && <Settings />}
          {screen === "wizard" && (
            <BuildingWizard
              key={wizardInitial?.storeId ?? wizardInitial?.name ?? "new"}
              initial={wizardInitial ?? undefined}
              onClose={() => setScreen("mapContent")}
              onDone={() => setScreen("mapContent")}
            />
          )}
          {screen === "levelEditor" && level && (
            <LevelEditor
              // keyed so an editor→editor retarget (a drop confirmed for another level) is a fresh
              // mount — the editor's lazy state initialisers assume one mount per level
              key={`${level.buildingId ?? ""}:${level.index}`}
              level={level}
              onCancel={() => setScreen("mapContent")}
              onReview={(pct, cause) => {
                setReviewCtx({ pct, cause: cause ?? null });
                setScreen("review");
              }}
              onHistory={(selectN, mode) =>
                openHistory(level, "levelEditor", selectN, mode)
              }
              uploadFile={pendingUpload}
              onUploadStarted={() => setPendingUpload(null)}
              browseOnMount={browseOnOpen}
              onBrowseConsumed={() => setBrowseOnOpen(false)}
              onUploadTo={openUpload}
            />
          )}
          {screen === "history" && level && (
            <VersionHistory
              level={level}
              initialN={historyN}
              initialMode={historyMode}
              onBack={() => setScreen(historyFrom)}
            />
          )}
          {screen === "review" && (
            <ManualReview
              level={level}
              magnitudePct={reviewCtx.pct ?? undefined}
              redCause={reviewCtx.cause ?? undefined}
              // The review is the level's child, so leaving it lands on the level — its editor —
              // not back at the whole tree (Olcay, 2026-08-10 evening). Both exits: Cancel and a
              // concluded Save (the editor is where the version's new state shows).
              onClose={() => setScreen(level ? "levelEditor" : "mapContent")}
              onCompare={
                level
                  ? () => openHistory(level, "review", undefined, "compare")
                  : undefined
              }
              floorWarnings={
                level
                  ? seedFloorWarnings(level.buildingId, level.index)
                  : undefined
              }
            />
          )}
        </div>
      </div>
      <PublishScope
        open={publishOpen}
        onCancel={() => setPublishOpen(false)}
        onPublish={() => setPublishOpen(false)}
        onOpenLevel={(l) => {
          setPublishOpen(false);
          openReview({
            building: l.building,
            buildingId: l.buildingId,
            index: l.index,
            name: l.name,
            short: l.short,
          });
        }}
      />
    </TooltipProvider>
  );
}
