import { useState } from "react";
import { Icon } from "@kozmos-ds/react";
import { EXPERT_HOLD, HOLD_TONE } from "../mock/diff";

/**
 * S2 — the expert-review hold (Figma node 2449:64, treatment since reversed to warn-but-allow —
 * Olcay, 2026-08-10). Not a lock: the customer keeps editing, told that the mapping team's
 * corrections may override what they do. Only frame-changing operations stay locked, each with
 * its own reason (see EXPERT_HOLD in mock/diff.ts).
 *
 * The hold is said twice because the screen has two halves and they are read independently: the
 * banner speaks for the panel, the chip speaks for the map. Neither covers the other's half.
 * Both take their words from EXPERT_HOLD rather than holding their own, so the panel, the map and
 * the tooltips on the locked controls can't drift apart.
 */

const DOT = (size: number) => ({
  width: size,
  height: size,
  borderRadius: size / 2,
  background: HOLD_TONE.dot,
  flex: "0 0 auto" as const,
});

/** The full-width caution across the top of the panel, above everything including the breadcrumb. */
export function ExpertHoldBanner() {
  return (
    <div
      role="status"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 16px",
        background: HOLD_TONE.tint,
        borderBottom: `1px solid ${HOLD_TONE.border}`,
        flex: "0 0 auto",
      }}
    >
      <span style={DOT(10)} />
      <span
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          lineHeight: 1.3,
          color: HOLD_TONE.ink,
        }}
      >
        {EXPERT_HOLD.banner}
      </span>
    </div>
  );
}

/**
 * The map's echo of the hold — a corner card, not a centrepiece (Olcay, 2026-08-10 evening,
 * pointing at Figma `2090:16103`: *"Awaiting expert review should not be in the middle of the
 * screen — the user may edit the map regardless"*). A notice in the middle of the map reads as a
 * lock however carefully it's worded; the design puts it bottom-right, in the hold's amber, with
 * an alert triangle and a Dismiss link, and the user edits around it.
 *
 * Dismiss COLLAPSES rather than removes (Olcay + Figma `2103:22178`): the card folds into a small
 * amber triangle chip in the same corner, clickable to re-expand — the warning stays reachable
 * without renting the map. Safe either way because the chip is only the *echo*: the panel banner,
 * the status card and every locked control keep saying the hold. The copy stays ours
 * (EXPERT_HOLD), not the frame's — Olcay: "I like the UI text though."
 *
 * Both states sit ABOVE the map page's zoom control (same design frame: warning chip stacked over
 * + / −), hence the bottom offset. The title wears HOLD_TONE.ink, not the frame's bright alert
 * amber — #f9a707 on this tint is the same ~2:1 contrast mistake the status-card caption already
 * corrected to alert/900 (§0).
 */

/** Clears the zoom control the map page draws at right 16 / bottom 16 (44px + 6px gap + 44px —
    sized like the Map Settings trigger; every over-map button one size). */
const ABOVE_ZOOM = 16 + 44 + 6 + 44 + 12;

export function ExpertHoldChip() {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        aria-label={EXPERT_HOLD.mapTitle}
        aria-expanded={false}
        title={`${EXPERT_HOLD.mapTitle} — ${EXPERT_HOLD.mapDetail}`}
        style={{
          position: "absolute",
          right: 16,
          bottom: ABOVE_ZOOM,
          width: 46,
          height: 40,
          borderRadius: 999,
          background: HOLD_TONE.tint,
          border: `1.5px solid ${HOLD_TONE.border}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          color: HOLD_TONE.dot,
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          zIndex: 4,
          padding: 0,
        }}
      >
        <Icon name="alert-triangle" size="lg" />
      </button>
    );
  }

  return (
    <div
      role="status"
      style={{
        position: "absolute",
        right: 16,
        bottom: ABOVE_ZOOM,
        display: "flex",
        alignItems: "center",
        gap: 12,
        maxWidth: 340,
        padding: "10px 12px",
        background: HOLD_TONE.tint,
        border: `1px solid ${HOLD_TONE.border}`,
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        zIndex: 4,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          minWidth: 0,
        }}
      >
        <span style={{ fontSize: 12.5, fontWeight: 700, color: HOLD_TONE.ink }}>
          {EXPERT_HOLD.mapTitle}
        </span>
        <span style={{ fontSize: 12, lineHeight: 1.35, color: "#464a53" }}>
          {EXPERT_HOLD.mapDetail}
        </span>
        <button
          onClick={() => setCollapsed(true)}
          aria-expanded
          style={{
            alignSelf: "flex-start",
            marginTop: 2,
            padding: 0,
            border: "none",
            background: "none",
            fontSize: 11.5,
            color: "#5d626f",
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          Dismiss
        </button>
      </div>
      <span
        style={{
          color: HOLD_TONE.dot,
          display: "grid",
          placeItems: "center",
          flex: "0 0 auto",
        }}
      >
        <Icon name="alert-triangle" size="lg" />
      </span>
    </div>
  );
}
