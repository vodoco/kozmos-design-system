import { Button, Icon, Text } from "@kozmos-ds/react";
import type { KozmosIconKey } from "@kozmos-ds/icons";
import type { MapSection } from "../mock/taxonomy";

/**
 * Dashboard chrome, taken from the Figma header (`headerMenu`, node 2530:907).
 * Colours are the file's own tokens: theme/900 #082975, theme/800 #0b369c, theme/0 #f1f5fe,
 * foreground/600 #5d626f, foreground/800 #2e3138, background/900 #e3e4e8.
 */
const INK = "#082975";
const LINK = "#0b369c";
const TINT = "#f1f5fe";
const LINE = "#e3e4e8";
const MUTED = "#5d626f";
const FG = "#2e3138";

/**
 * The chrome's two vertical rules. The globe cell and the left rail share one width, and the site
 * selector and every screen's left panel share the other, so both rules run unbroken from the
 * header down through the page.
 */
export const RAIL_WIDTH = 96;
export const PANEL_WIDTH = 440;

export function TopBar({
  tools,
  people,
  bell,
  tab: current = "Maps",
  onTab,
  onPublish,
}: {
  tools?: React.ReactNode;
  /**
   * Who else is online (2026-08-14). Beside the bell because they answer the same question —
   * *what is happening that I did not do?* — and passed in for the same reason the bell is: the
   * chrome should not have to know about sessions.
   */
  people?: React.ReactNode;
  /** The notification bell (S7) — passed in so the chrome doesn't have to know the app's routing. */
  bell?: React.ReactNode;
  /** Which top-level tab is lit. Settings became reachable when S5 was built (2026-08-11). */
  tab?: "Maps" | "Settings";
  onTab?: (t: "Maps" | "Settings") => void;
  /**
   * Publishing is a SITE action while a review is a LEVEL one, so this cannot just fire: it opens
   * the scope overlay, which says which levels are held out of the publish (2026-08-13).
   */
  onPublish?: () => void;
}) {
  const tab = (label: string, opts?: { to?: "Maps" | "Settings" }) => {
    const active = label === current;
    const clickable = !!opts?.to && !!onTab;
    return (
      <button
        key={label}
        onClick={clickable ? () => onTab!(opts!.to!) : undefined}
        disabled={!clickable}
        title={clickable ? undefined : "Not part of this prototype"}
        style={{
          display: "flex",
          alignItems: "center",
          alignSelf: "stretch",
          padding: "0 24px",
          fontSize: 13,
          lineHeight: "18px",
          border: "none",
          borderBottom: `2px solid ${active ? INK : "transparent"}`,
          color: active ? LINK : FG,
          background: active ? TINT : "transparent",
          cursor: clickable ? "pointer" : "default",
          opacity: clickable ? 1 : 0.65,
          fontFamily: "inherit",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 54,
        flex: "0 0 54px",
        paddingRight: 16,
        background: "#fff",
        borderBottom: `1px solid ${LINE}`,
        boxShadow: "0 4px 5px rgba(0,0,0,.04)",
        position: "relative",
        zIndex: 2,
      }}
    >
      {/* scope selector — globe cell, then the site block, each fenced by a rule */}
      <div
        style={{ display: "flex", alignSelf: "stretch", alignItems: "center" }}
      >
        <div
          style={{
            width: RAIL_WIDTH,
            display: "grid",
            placeItems: "center",
            alignSelf: "stretch",
          }}
        >
          {/* exported from the Figma header (globe-01) — not in @kozmos-ds/icons */}
          <img src="/icons/globe-01.svg" alt="" width={32} height={32} />
        </div>
        {/* The site block empties out on System Settings, per `2002:41171` — and that is a real
            signal, not a layout tidy-up: these parameters are system-wide, so an "Active Site"
            beside them would imply a scope they haven't got. Publish goes with it for the same
            reason, and so do the rules that fence the column.
            It keeps its WIDTH though: removing it outright slid the centred nav left into the
            prototype tool pills. Empty space, same geometry. */}
        <div
          style={{
            width: PANEL_WIDTH,
            alignSelf: "stretch",
            display: "flex",
            alignItems: "center",
            gap: 24,
            padding: "0 16px",
            visibility: current === "Settings" ? "hidden" : "visible",
            borderLeft: current === "Settings" ? "none" : `1px solid ${LINE}`,
            borderRight: current === "Settings" ? "none" : `1px solid ${LINE}`,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, lineHeight: "14px", color: MUTED }}>
              Active Site
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 13,
                  lineHeight: "16px",
                  fontWeight: 600,
                  color: INK,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Dubai International Airports
              </span>
              <Icon name="chevron-down" />
            </div>
          </div>
          <Button size="sm" onClick={onPublish}>
            Publish
          </Button>
        </div>
      </div>

      <nav style={{ display: "flex", alignSelf: "stretch" }}>
        {tab("Maps", { to: "Maps" })}
        {tab("Analytics")}
        {tab("Settings", { to: "Settings" })}
      </nav>

      {/*
        The right-hand cluster, as one group.
        The header is `space-between`, which distributes the free space between EVERY child — so
        as separate children the tools, the bell and the avatar each drifted apart and the bell
        ended up floating in the middle of nothing (Olcay: *"bell should be next to user menu"*).
        Grouped, they sit together at the right edge the way `2495:463` draws them, and the space
        falls where it should: after the nav.
      */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Prototype-only review tools, deliberately outside the design's chrome vocabulary — see
            ui/FeedbackLayer.tsx. Nothing here is part of the Pointr dashboard. */}
        {tools}

        {/* S7 — the bell sits immediately before the user menu, as in 2495:463 */}
        {people}
        {bell}

        {/* user menu — avatar + chevron only, per the design */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 24,
              background: LINE,
              border: "2px solid #c7cad1",
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
              color: "#8b909c",
            }}
          >
            <Icon name="user-01" />
          </div>
          <Icon name="chevron-down" />
        </div>
      </div>
    </header>
  );
}

type RailItem = {
  label: string;
  icon?: KozmosIconKey;
  img?: string;
  active?: boolean;
  /**
   * The layer group this item selects. Present on the Maps rail's four items and nowhere else —
   * an item with no `section` is a name in the product this prototype does not implement, and it
   * keeps the "Not part of this prototype" tooltip that says so.
   */
  section?: MapSection;
};

/**
 * The Maps rail — and every one of these four now **does** something (Olcay, 2026-08-16:
 * *"Wayfinding Network should show in when wayfinding network is selected. Geofences when geofence
 * selected and beacons when beacon selected."*).
 *
 * They are not four screens: they are four **layer groups** over the same map and the same tree.
 * That is the smallest honest reading of the instruction — each thing appears in its own section
 * and nowhere else — and it costs one list, because the map already takes one.
 */
const RAIL: RailItem[] = [
  { label: "Map Content", icon: "map-01", section: "content" },
  { label: "Geofences", icon: "marker-pin-01", section: "geofence" },
  {
    label: "Wayfinding Network",
    icon: "navigation-pointer-01",
    section: "wayfinding-network",
  },
  // The rail says IoT Devices; the taxonomy says `positioning-device`, whose one subType is
  // `beacon` — Olcay's *"beacons when beacon selected"*. Same thing under two names.
  { label: "IoT Devices", icon: "wifi", section: "positioning-device" },
];

/**
 * The Settings tab replaces the rail's contents rather than adding a second panel beside it —
 * that is how `2002:41171` draws it, and it is why System Settings has the full page width.
 * Only System Settings is ours; the rest are named so the screen sits in its real context.
 */
const SETTINGS_RAIL: RailItem[] = [
  { label: "Metadata", icon: "alert-circle" },
  { label: "SDK Configuration", icon: "settings-01" },
  { label: "User Management", icon: "users-01" },
  // @kozmos-ds/icons has no translate/language glyph (D9) — the local globe export stands in
  { label: "UI Translation Manager", img: "/icons/globe-01.svg" },
  { label: "System Settings", icon: "settings-01", active: true },
];

/** Left icon rail. NB: uses the limited @kozmos-ds/icons set — swap for the dashboard icon set when available. */
export function LeftRail({
  variant = "maps",
  section = "content",
  onSection,
}: {
  variant?: "maps" | "settings";
  /** Which layer group is selected. Maps rail only — the Settings rail keeps its own `active`. */
  section?: MapSection;
  onSection?: (s: MapSection) => void;
}) {
  const items = variant === "settings" ? SETTINGS_RAIL : RAIL;
  return (
    <div
      style={{
        // matches the header's globe cell, so the rule under it runs straight down the page
        width: RAIL_WIDTH,
        flex: `0 0 ${RAIL_WIDTH}px`,
        borderRight: `1px solid ${LINE}`,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
      }}
    >
      {items.map((it) => {
        const live = !!it.section && !!onSection;
        const on = live ? it.section === section : !!it.active;
        return (
          <div
            key={it.label}
            title={live || it.active ? undefined : "Not part of this prototype"}
            onClick={live ? () => onSection(it.section!) : undefined}
            role={live ? "button" : undefined}
            aria-pressed={live ? on : undefined}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              padding: "16px 8px",
              color: on ? LINK : MUTED,
              background: on ? TINT : "transparent",
              opacity: on ? 1 : 0.85,
              cursor: live ? "pointer" : undefined,
            }}
          >
            {it.img ? (
              <img
                src={it.img}
                alt=""
                width={24}
                height={24}
                style={{ opacity: 0.5 }}
              />
            ) : (
              <Icon name={it.icon!} />
            )}
            <Text
              style={{
                fontSize: 11,
                lineHeight: "14px",
                textAlign: "center",
                color: "inherit",
              }}
            >
              {it.label}
            </Text>
          </div>
        );
      })}
      <div style={{ flex: 1 }} />
      <div
        style={{
          display: "grid",
          placeItems: "center",
          padding: "16px 8px",
          color: MUTED,
        }}
      >
        <Icon name="info-circle" />
      </div>
    </div>
  );
}
