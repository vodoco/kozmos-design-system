import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Icon,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Text,
} from "@kozmos-ds/react";
import {
  NOTIF_TONE,
  buildFeed,
  getRead,
  markAllRead,
  markRead,
  subscribeRead,
  type Notification,
} from "../mock/notifications";
import { getSettings, subscribeSettings } from "../mock/settings";
import {
  getLevelVersionsRevision,
  getReviewCount,
  subscribeLevelVersions,
  subscribeReviews,
} from "../mock/store";

/**
 * S7 · Notifications (Figma `2495:463`) — a **bell dropdown in the chrome, not a page**. The
 * frame draws it that way and it is right: a notification list is a glance, and routing to a
 * screen to glance is the thing notifications exist to avoid.
 *
 * The rows are a projection of the level seeds (`mock/notifications.ts`), so this can't tell a
 * different story from the tree or the editor. Two deliberate departures from the frame, both
 * recorded there: the Expert Review row is not purple (that purple is User Override's, §3), and
 * the >50% row is a rejection rather than a decision (decision 9).
 */

const LINE = "var(--primitives-colors-background-100)";
const INK = "var(--primitives-colors-theme-900)";
const LINK = "var(--primitives-colors-theme-800)";
const MUTED = "var(--primitives-colors-background-600)";
const FG = "#2e3138";

export interface NotificationTarget {
  buildingId: string;
  buildingName: string;
  levelIndex: number;
  levelShort: string;
  levelName: string;
  to: "review" | "level";
}

function Row({
  n,
  unread,
  onGo,
  onClose,
}: {
  n: Notification;
  unread: boolean;
  onGo: (t: NotificationTarget) => void;
  onClose: () => void;
}) {
  const tone = NOTIF_TONE[n.kind];
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: "12px 16px",
        borderBottom: `1px solid ${LINE}`,
        background: unread ? tone.tint : "#fff",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          background: tone.dot,
          flex: "0 0 auto",
          marginTop: 5,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{ display: "block", fontSize: 13, fontWeight: 600, color: FG }}
        >
          {n.title}
        </Text>
        <Text
          style={{
            display: "block",
            fontSize: 12,
            color: MUTED,
            marginTop: 2,
            lineHeight: 1.45,
          }}
        >
          {n.meta} · {n.ago}
        </Text>
        {n.action && (
          <button
            onClick={() => {
              markRead(n.id);
              onClose();
              onGo({
                buildingId: n.buildingId,
                buildingName: n.buildingName,
                levelIndex: n.levelIndex,
                levelShort: n.levelShort,
                levelName: n.levelName,
                to: n.action!.to,
              });
            }}
            style={{
              marginTop: 4,
              padding: 0,
              border: "none",
              background: "none",
              color: LINK,
              fontSize: 12.5,
              cursor: "pointer",
            }}
          >
            {n.action.label}
          </button>
        )}
      </div>
    </div>
  );
}

export function NotificationBell({
  onGo,
}: {
  onGo: (t: NotificationTarget) => void;
}) {
  // The feed depends on the grace period, so it must re-derive when Settings changes it.
  const settings = useSyncExternalStore(subscribeSettings, getSettings);
  const read = useSyncExternalStore(subscribeRead, getRead);
  /**
   * The feed is derived from three stores, so it has to listen to all three. It subscribed only to
   * settings at first, which meant a concluded review changed the underlying data and the bell
   * went on showing the old projection until something unrelated happened to re-render it.
   */
  const versions = useSyncExternalStore(
    subscribeLevelVersions,
    getLevelVersionsRevision,
  );
  const reviews = useSyncExternalStore(subscribeReviews, getReviewCount);
  const feed = useMemo(() => buildFeed(), [settings, versions, reviews]);
  const unreadIds = feed.filter((n) => !read.has(n.id)).map((n) => n.id);
  /**
   * Controlled so acting on a notification closes it. Left uncontrolled, following a row left the
   * panel hanging over the screen it had just navigated to — the list obscuring the thing you
   * asked to see.
   */
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label={`Notifications${unreadIds.length ? `, ${unreadIds.length} unread` : ""}`}
          title="Notifications"
          style={{
            position: "relative",
            width: 40,
            height: 40,
            display: "grid",
            placeItems: "center",
            border: "none",
            background: "none",
            color: LINK,
            cursor: "pointer",
          }}
        >
          <Icon name="bell-01" />
          {unreadIds.length > 0 && (
            /* the frame's small green presence dot — a count would compete with the tree's own
               tags for the same attention, and the list is one click away */
            <span
              style={{
                position: "absolute",
                top: 8,
                right: 9,
                width: 8,
                height: 8,
                borderRadius: 4,
                background: "#2FBF71",
                border: "1.5px solid #fff",
              }}
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        style={{ width: 380, padding: 0, overflow: "hidden" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: `1px solid ${LINE}`,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: 600, color: INK }}>
            Notifications
          </Text>
          <button
            onClick={() => markAllRead(feed.map((n) => n.id))}
            disabled={unreadIds.length === 0}
            style={{
              border: "none",
              background: "none",
              fontSize: 12.5,
              color: unreadIds.length ? LINK : MUTED,
              cursor: unreadIds.length ? "pointer" : "default",
              padding: 0,
            }}
          >
            Mark all read
          </button>
        </div>

        <div style={{ maxHeight: 420, overflowY: "auto" }}>
          {feed.length === 0 ? (
            <div
              style={{
                padding: "24px 16px",
                textAlign: "center",
                fontSize: 12.5,
                color: MUTED,
              }}
            >
              Nothing needs your attention.
            </div>
          ) : (
            feed.map((n) => (
              <Row
                key={n.id}
                n={n}
                unread={!read.has(n.id)}
                onGo={onGo}
                onClose={() => setOpen(false)}
              />
            ))
          )}
        </div>

        <div style={{ padding: "10px 16px", textAlign: "center" }}>
          {/* S7-as-a-page doesn't exist — say so rather than draw a dead link that looks live. */}
          <span
            title="A full notifications page isn't part of this prototype"
            style={{ fontSize: 12.5, color: MUTED, cursor: "default" }}
          >
            View all notifications
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
