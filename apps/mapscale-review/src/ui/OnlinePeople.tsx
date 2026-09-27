import { Pencil } from "./icons";
import { useSyncExternalStore } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Text,
} from "@kozmos-ds/react";
import {
  isCrossMachine,
  followPeer,
  getMyFloor,
  getPeople,
  peerColour,
  presenceVersion,
  subscribePresence,
  type Person,
} from "../cloud/presence";

/**
 * Who else is in the dashboard, beside the bell — **a stack that opens on hover** (Olcay,
 * 2026-08-14: *"should be stacked when hovered overlay shows which users are online and I can
 * follow them"*).
 *
 * **Everyone online is listed; only some of them have a cursor on your map.** A colleague on
 * another floor is present — worth knowing before you edit — but pointing at something you cannot
 * see. So the avatar is solid on your floor and faded elsewhere, and the list says where. Dropping
 * the distant ones would answer *"is anyone here?"* with *"no"* while somebody edits the floor below.
 *
 * **Following is the point of naming the place.** Knowing Ege is on Concourse A · L4 is only useful
 * if you can go there, so the whole row is the control — it moves the map to their building and
 * level, which is the same destination their cursor is drawn in.
 */
/** A pencil, 12px — `edit-02` from the Pointr Icon Library (see `./icons`). */
function EditGlyph({ colour }: { colour: string }) {
  return <Pencil size={12} style={{ color: colour, flex: "0 0 auto" }} />;
}

export function OnlinePeople() {
  useSyncExternalStore(subscribePresence, presenceVersion);
  const { building, level } = getMyFloor();
  const people = getPeople(building, level);
  // Renders with nobody online too, when the transport is the same-browser one: "nobody is here"
  // and "this build cannot see anybody" look the same, and only one of them is worth acting on.
  if (!people.length && isCrossMachine()) return null;

  const withYou = (p: Person) =>
    p.at.building !== undefined &&
    p.at.building === building &&
    p.at.level === level;
  const placeOf = (p: Person) =>
    p.at.levelName
      ? p.at.buildingName
        ? `${p.at.buildingName} · ${p.at.levelName}`
        : p.at.levelName
      : "Not on a floor yet";

  // People on your own floor come first, so the useful ones are never the ones that overflow.
  const ordered = [...people].sort(
    (a, b) => Number(withYou(b)) - Number(withYou(a)),
  );
  const shown = ordered.slice(0, 4);
  const extra = ordered.length - shown.length;

  return (
    <Popover>
      {/*
        Hover opens it, click keeps it — a list you have to click into is a list nobody reads, and
        one that vanishes the moment you reach for a row is worse than none.
      */}
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${people.length} ${people.length === 1 ? "person" : "people"} online`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            padding: "2px 4px",
            cursor: "pointer",
          }}
        >
          <span style={{ display: "flex", alignItems: "center" }}>
            {!people.length && (
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 11,
                  color: "var(--primitives-colors-background-600)",
                  border: "1px dashed var(--primitives-colors-background-900)",
                }}
              >
                0
              </span>
            )}
            {shown.map((p, i) => (
              <span
                key={p.key}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: "#fff",
                  background: peerColour(p),
                  marginLeft: i ? -8 : 0,
                  boxShadow: "0 0 0 2px #fff",
                  // Faded = present, but not where you are. The colour still identifies them, so
                  // the same person is the same colour here and on the map.
                  opacity: withYou(p) ? 1 : 0.42,
                }}
              >
                {p.identity.initials}
              </span>
            ))}
          </span>
          {extra > 0 && (
            <span
              style={{
                fontSize: 11.5,
                color: "var(--primitives-colors-background-600)",
              }}
            >
              +{extra}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" style={{ width: 288, padding: 8 }}>
        <Text
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: ".04em",
            textTransform: "uppercase",
            color: "var(--primitives-colors-background-600)",
            padding: "4px 8px 8px",
          }}
        >
          {people.length} online
        </Text>

        {ordered.map((p) => {
          const here = withYou(p);
          const canFollow =
            p.at.building !== undefined && p.at.level !== undefined && !here;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => canFollow && followPeer(p.at)}
              disabled={!canFollow}
              title={[
                p.at.editingName
                  ? `Editing ${p.at.editingName}`
                  : p.at.editingFid
                    ? "Editing a feature"
                    : "",
                here
                  ? "Already on this floor"
                  : canFollow
                    ? `Go to ${placeOf(p)}`
                    : "Not on a floor yet",
              ]
                .filter(Boolean)
                .join(" · ")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                textAlign: "left",
                padding: "7px 8px",
                borderRadius: 8,
                border: "none",
                background: "none",
                cursor: canFollow ? "pointer" : "default",
                font: "inherit",
              }}
            >
              <span
                style={{
                  flex: "0 0 auto",
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: "#fff",
                  background: peerColour(p),
                  opacity: here ? 1 : 0.55,
                }}
              >
                {p.identity.initials}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 12.5,
                    color: "var(--review-ink)",
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.identity.name}
                  </span>
                  {/*
                    The map draws the outline they are working on, in this same colour — but only
                    if you are on their floor and looking at it. The pencil is the version that
                    survives being somewhere else, and the tooltip is the only place that says
                    WHICH feature.
                  */}
                  {p.at.editingFid && <EditGlyph colour={peerColour(p)} />}
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: 11.5,
                    color: "var(--primitives-colors-background-600)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {(here ? "On this floor with you" : placeOf(p)) +
                    (p.tabs.length > 1 ? ` · ${p.tabs.length} windows` : "")}
                </span>
              </span>
              {/* The affordance names the destination, and says nothing when there is nowhere to go */}
              {canFollow && (
                <span
                  style={{
                    flex: "0 0 auto",
                    fontSize: 11.5,
                    color: "#0b369c",
                    fontWeight: 500,
                  }}
                >
                  Follow
                </span>
              )}
            </button>
          );
        })}
        {/*
          **Say the limit out loud.** On BroadcastChannel this list can only ever contain other
          tabs of THIS browser — so a colleague signed in on their own machine is genuinely absent,
          and an empty list looks identical to a broken feature. Not saying so cost real time.
        */}
        {!isCrossMachine() && (
          <div
            style={{
              marginTop: 6,
              padding: "8px 8px 4px",
              borderTop: "1px solid var(--primitives-colors-background-900)",
              fontSize: 11,
              lineHeight: 1.45,
              color: "var(--primitives-colors-background-600)",
            }}
          >
            Showing other tabs of this browser only. People on other machines
            need a realtime key (
            <code style={{ fontSize: 10.5 }}>VITE_ABLY_KEY</code>).
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
