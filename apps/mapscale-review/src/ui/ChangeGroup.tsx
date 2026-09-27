import { ChevronRight } from "./icons";
import { useState } from "react";
import {
  SegmentedControl,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@kozmos-ds/react";
import { ChangeReviewRow, DecisionGlyph } from "./ChangeReviewRow";
import {
  CHANGE_COLORS,
  DECISION_INK,
  type Change,
  type ChangeGroup,
  type Decision,
  type Override,
} from "../mock/diff";

const LINE = "#e3e4e8";
const MUTED = "var(--review-muted)";

function Chevron({ open }: { open: boolean }) {
  /* `chevron-right` from the Pointr Icon Library, rotated on open — one glyph in two states, not
     two glyphs (see `./icons`). */
  return (
    <ChevronRight
      size={14}
      style={{
        transform: open ? "rotate(90deg)" : "none",
        transition: "transform .12s",
      }}
    />
  );
}

/** The count chip on a group header — "3", in the group's own type colour. */
function Count({ n, color }: { n: number; color: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color,
        background: "var(--review-surface)",
        border: `1px solid ${LINE}`,
        borderRadius: 999,
        padding: "1px 7px",
        whiteSpace: "nowrap",
      }}
    >
      {n}
    </span>
  );
}

const ACTIONS: { value: Decision; label: string }[] = [
  { value: "confirm", label: "Confirm" },
  { value: "reject", label: "Reject" },
];

/**
 * Decide the whole group at once. Unavoidable as soon as grouping lands: "Confirm all 6 metadata
 * updates" is the point of grouping, not a bonus. Shows a value only when the group already agrees,
 * so it never claims a uniformity that isn't there.
 */
function GroupDecision({
  changes,
  onDecide,
}: {
  changes: Change[];
  onDecide: (d: Decision) => void;
}) {
  const first = changes[0]?.decision;
  const uniform = changes.every((c) => c.decision === first)
    ? first
    : undefined;
  const items = ACTIONS.map((a) => ({
    value: a.value,
    label: (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="img"
            aria-label={`${a.label} all ${changes.length}`}
            style={{
              display: "grid",
              placeItems: "center",
              color: DECISION_INK,
            }}
          >
            <DecisionGlyph kind={a.value} size={15} />
          </span>
        </TooltipTrigger>
        <TooltipContent>{`${a.label} all ${changes.length}`}</TooltipContent>
      </Tooltip>
    ),
  }));
  return (
    <SegmentedControl
      items={items}
      value={uniform}
      onValueChange={(v) => onDecide(v as Decision)}
    />
  );
}

/**
 * A collapsed bucket standing in for many rows of one object type — "Added · meeting room chairs
 * 139". Only used when a bucket would otherwise flood its section (see COLLAPSE_ABOVE); the normal
 * case is a plain coloured row, because that is what makes the changelog scannable.
 */
export function ChangeGroupBlock({
  group,
  onDecideOne,
  onDecideGroup,
  overrides,
  onOpenEditor,
  onRevert,
  editingId,
  editBlocked,
}: {
  group: ChangeGroup;
  onDecideOne: (id: string, d: Decision | undefined) => void;
  onDecideGroup: (ids: string[], d: Decision) => void;
  /**
   * The reviewer's own values, keyed by change id. Threaded through rather than looked up here:
   * a bucket is a presentation of rows, and where the overrides live is the screen's business.
   *
   * ⚠️ **A row inside a collapsed bucket is editable like any other.** The alternative — edit only
   * the rows that escaped grouping — would make whether you can fix something depend on how many
   * chairs MapScale happened to add, which is the sort of rule nobody can hold in their head.
   */
  overrides?: Record<string, Override>;
  /**
   * ✎ on a row inside the bucket. ⚠️ **Not gated by change type any more.** It used to skip
   * `deleted` and `metadata` because there was no outline to hand the geometry editor; the panel
   * opens on every row, and Olcay ruled on 2026-08-26 that **a removal may be edited** — an
   * override on one keeps the feature.
   */
  onOpenEditor?: (id: string) => void;
  onRevert?: (id: string) => void;
  /** Which row's panel is open, if any — the session belongs to the screen. */
  editingId?: string | null;
  /** Why ✎ is unavailable, when the map could not resolve a change to a feature. */
  editBlocked?: string;
}) {
  const [open, setOpen] = useState(false);
  const accent = CHANGE_COLORS[group.changes[0].type];
  // A user override is carried through untouched — there is no decision to make on it, so the
  // group-level control would be a lie.
  const decidable = group.changes.filter((c) => c.type !== "preserved");

  return (
    <div
      style={{
        border: `1px solid ${LINE}`,
        borderRadius: 10,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 10px",
        }}
      >
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: 1,
            minWidth: 0,
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            textAlign: "left",
            color: "var(--review-ink)",
          }}
        >
          <span style={{ color: MUTED, display: "grid", placeItems: "center" }}>
            <Chevron open={open} />
          </span>
          {/*
            Wraps rather than truncating: the title is the only thing identifying the group, and
            "Added · food & beverage s…" tells you nothing. The chip rides along at the end of the
            text so it stays attached to the last word instead of floating.
          */}
          <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>
            {group.title} <Count n={group.changes.length} color={accent} />
          </span>
        </button>
        {/* flex:0 0 auto — without it the control grows and shrinks the title to nothing */}
        {decidable.length > 0 && (
          <div style={{ flex: "0 0 auto" }}>
            <GroupDecision
              changes={decidable}
              onDecide={(d) =>
                onDecideGroup(
                  decidable.map((c) => c.id),
                  d,
                )
              }
            />
          </div>
        )}
      </div>
      {open && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: 10,
            borderTop: `1px solid ${LINE}`,
            background: "var(--review-surface)",
          }}
        >
          {group.changes.map((c) => (
            <ChangeReviewRow
              key={c.id}
              change={c}
              preserved={c.type === "preserved"}
              edit={overrides?.[c.id]}
              onDecide={(d) => onDecideOne(c.id, d)}
              onOpenEditor={onOpenEditor && (() => onOpenEditor(c.id))}
              onRevert={onRevert && (() => onRevert(c.id))}
              editing={editingId === c.id}
              editBlocked={editBlocked}
            />
          ))}
        </div>
      )}
    </div>
  );
}
