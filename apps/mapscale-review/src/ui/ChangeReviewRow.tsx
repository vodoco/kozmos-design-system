import { Warning, Pencil, Reset } from "./icons";
import { useState } from "react";
import {
  SegmentedControl,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@kozmos-ds/react";
import { splitOverrideLines } from "../mock/overrideLines";
import {
  changeAccent,
  warningOf,
  DECISION_INK,
  OVERRIDE_INK,
  WARNING_LABEL,
  WARNING_WHY,
  type Change,
  type Decision,
  type Override,
} from "../mock/diff";

/**
 * Risk is a third axis and is never coloured — traffic-light red/amber/green stays reserved for
 * magnitude, and the four diff colours stay reserved for what a feature *is*. So a warning is a
 * neutral mark, in the same ink as ✓ 🚩 ✗.
 */
/** Exported since 2026-08-13: the floor-warning strip (D16) draws the same mark, and two copies
 *  of one glyph is exactly how the two halves of a statement drift apart. */
export function WarningGlyph({ size = 14 }: { size?: number }) {
  /* `alert-triangle` from the Pointr Icon Library (see `./icons`). Still exported from here: the
     floor-warning strip draws the same mark, and two copies of one glyph is exactly how the two
     halves of a statement drift apart. */
  return <Warning size={size} />;
}

/**
 * The same two marks the map draws on each feature — ✓ / ✗. `currentColor` lets the control tint
 * them when a segment is off.
 *
 * ⚠️ **The 🚩 arm was removed 2026-08-25** with flagging itself. These are still hand-drawn paths
 * on an 18-grid rather than Pointr Icon Library instances, and deliberately: they are **marks**,
 * sized for a 22px badge and for a centroid mark on the map, where the library's 24-grid at
 * stroke 2 renders visibly lighter (`./icons` documents exactly that behaviour). The two *new*
 * controls this row grew — Edit and Revert — are library icons, as the standing rule requires.
 */
export function DecisionGlyph({
  kind,
  size = 18,
}: {
  kind: Decision;
  size?: number;
}) {
  const d =
    kind === "confirm" ? "M4 9.5 L7.5 13 L14 5.5" : "M5 5 L13 13 M13 5 L5 13";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      aria-hidden
      focusable="false"
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * **Every act the row offers, in one tray** (Olcay, 2026-08-26: *"I don't like the edit button being
 * there. Let's put it in place of where flag was."*).
 *
 * Edit used to be a bordered icon button bolted beside the ✓/✗ pair — a second affordance family on
 * a row that has twenty siblings, and the middle segment was standing empty where `flag` had been.
 * Putting it there costs nothing and gives the row's text its width back.
 *
 * ⚠️ **`edit` is not a `Decision` and never becomes one.** It opens the editor; an override is what
 * results, and `outcomeOf()` then supersedes whatever was decided. The tray is a list of *acts*, and
 * only two of them write a decision — see `onTray`.
 */
type TrayAction = Decision | "edit" | "revert";

const TRAY_LABEL: Record<TrayAction, string> = {
  confirm: "Confirm",
  edit: "Edit — put your own value in place of this suggestion",
  reject: "Reject",
  revert: "Revert to MapScale's detected value",
};

export function ChangeReviewRow({
  change,
  onDecide,
  preserved,
  active,
  onActivate,
  edit,
  onOpenEditor,
  editing,
  editBlocked,
  onRevert,
}: {
  change: Change;
  /** `undefined` clears the decision. */
  onDecide: (d: Decision | undefined) => void;
  /**
   * A `preserved` row — **your override from an earlier run**, carried through untouched, so there
   * is no incoming *change* to confirm or reject.
   *
   * ⚠️ **Renamed from `override` 2026-08-25**, because `Override` now means something specific and
   * adjacent: the value the user is putting in place of MapScale's *during this review*. A
   * `preserved` row is the same fact one run older. Two names, so a reader can tell which age is
   * meant.
   *
   * It used to be `readOnly` and render the bare word "Kept" (Olcay, 2026-08-11: *"maybe we should
   * allow flagging the user overrides too?"*), then Kept-or-Flagged. It is now **Kept, with Edit
   * and Reset** (Olcay, 2026-08-25: *"we should have edit and reset for previous user overrides
   * too"*) — which is a better answer to the same question flagging was reaching for. The warned
   * ones are precisely the rows you need to act on: an override that now **overlaps** the new
   * content, that the new floor-plan's boundary **no longer covers**, or whose **source value moved
   * underneath it**. "Kept" was a statement with no affordance; now it has two.
   *
   * **Reset is still not a ✗.** Discarding your own earlier work is a real act, so it says what it
   * discards and reads as its own control rather than hiding inside a triage segment.
   */
  preserved?: boolean;
  /**
   * **The user's own value for this row**, if they have edited it. Lives in the review outcome
   * beside the decisions, never on the change — see `Override`.
   */
  edit?: Override;
  /**
   * ✎ pressed. **The row no longer edits anything itself** (Olcay, 2026-08-26: *"edit should bring
   * in the edit panel as if it's normal feature edit. geometry becomes editable."*) — it asks the
   * screen to open the standard properties panel on this change, and the screen owns the session
   * from there.
   *
   * ⚠️ The inline name/type form that used to live here is **gone**, and with it the separate
   * *"Edit shape on the map"* button. It was the right answer while the review was not allowed a
   * second editing surface; the ruling supersedes it, and the panel does both halves at once.
   */
  onOpenEditor?: () => void;
  /**
   * This row's session is open. **Lifted, not local**: the panel belongs to the screen now, so
   * which row it is on is a fact about the review, not about this row's own UI.
   */
  editing?: boolean;
  /**
   * Why ✎ cannot be pressed, when it cannot. The map answers `beginchange` with *"that change has
   * no feature on this floor yet"*, and with the panel as the only way in, a ✎ that silently does
   * nothing is worse than one that says why.
   */
  editBlocked?: string;
  /**
   * Revert (an ordinary row) or Reset (a `preserved` one) — the screen decides which act it is,
   * because only it knows whether the override belongs to this run or an earlier one.
   */
  onRevert?: () => void;
  /** This is the change the map is showing — the two surfaces share one selection. */
  active?: boolean;
  /** Clicking the row anywhere but the decision control makes it the active one. */
  onActivate?: () => void;
}) {
  const accent = changeAccent(change, edit);
  const warning = warningOf(change);
  const [expanded, setExpanded] = useState(false);
  /**
   * The edit form is open. Local, not lifted: which row you have open is a fact about this row's
   * own UI, and hoisting it would make the changelog re-render every keystroke.
   */

  /**
   * **D17 (approved 2026-08-13, wording settled the same day).** US7 requires "an option to NOT
   * remove a Map Object", and the only mechanism was the generic ✗ with nothing saying that
   * rejecting a removal is *how you keep it*.
   *
   * The affordance is the **words, not a different control** (Olcay: *"I'd like them consistent so
   * X is fine, tooltip could say Keep it"*). Every row keeps the same glyphs — a re-removal must
   * not grow an extra-looking control in a list of twenty — and only the reject tooltip changes.
   * It still writes a plain `reject`, so no new state enters the model.
   */
  const keepIt = change.warning === "re-removed";
  /**
   * **Three of your lines show; the rest go behind the cap that is already there.**
   *
   * The row draws MapScale's own `details` behind `Details ▼` and yours uncapped — which was safe
   * while an override was a name and a type, and stops being safe the moment it carries a whole
   * property bag: eight edited fields would make a ~200px row in a 440px triage list, and the block
   * that exists to make an edit obvious would bury the twenty rows under it.
   *
   * ⚠️ The remainder is **not dropped** — see the cap below, where it is drawn in override ink so it
   * still reads as yours. Putting the whole block behind the cap would be the failure the block was
   * built to prevent.
   */
  const mine = splitOverrideLines(edit?.details ?? []);
  /**
   * ⚠️ **✎ draws in `OVERRIDE_INK` in every state; ✓ ✗ ⟲ stay muted.** It is the override axis, not
   * a decision, and the colour is the only thing that says so — the same split `outcomeInk()` makes.
   * The white pill still means what it always meant: *where this row currently stands*.
   */
  const tray = (actions: TrayAction[]) =>
    actions.map((a) => {
      const label =
        a === "edit" && editBlocked
          ? editBlocked
          : keepIt && a === "reject"
            ? "Keep it — this object stays on the map"
            : TRAY_LABEL[a];
      return {
        value: a,
        label: (
          <Tooltip>
            <TooltipTrigger asChild>
              {/* the label lives in the tooltip, so the glyph still needs an accessible name */}
              <span
                role="img"
                aria-label={label}
                style={{
                  display: "grid",
                  placeItems: "center",
                  color: a === "edit" ? OVERRIDE_INK : DECISION_INK,
                  /* Faded rather than removed: the tray must keep its silhouette (D17), and the
                     tooltip is where the reason lives. `onTray` refuses the press. */
                  opacity: a === "edit" && editBlocked ? 0.35 : 1,
                }}
              >
                {a === "edit" ? (
                  <Pencil size={18} />
                ) : a === "revert" ? (
                  <Reset size={18} />
                ) : (
                  <DecisionGlyph kind={a} />
                )}
              </span>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ),
      };
    });
  /**
   * One dispatcher, because the tray now mixes decisions with acts. Reverting closes the editor
   * first: leaving a form open over a row whose override has just been deleted would offer to save
   * an edit that no longer has anything to supersede.
   */
  const onTray = (v: string | undefined) => {
    /**
     * ⚠️ **A deselect arrives here as `""`, and it used to be written as a decision.**
     * The DS `SegmentedControl` is a Radix `ToggleGroup` with `type="single"`, which *deselects*
     * when you press the segment that already holds the pill — reporting `onValueChange("")`. The
     * DS guards only its own analytics call (`if (val) trackEvent(...)`) and passes the empty
     * string straight through.
     *
     * It then fell to `onDecide(v as Decision)`, and **the cast laundered it past TypeScript**:
     * `Decision` is `"confirm" | "reject"`, so `""` is a value the type says cannot exist. It
     * survived only because `""` is falsy and every reader treats it as "no decision" — working by
     * luck rather than by design.
     *
     * A deselect means the user is taking their decision back, and `undefined` is what the prop
     * already accepts for that. Same behaviour, a value that is actually legal.
     */
    if (!v) return onDecide(undefined);
    // A blocked ✎ is drawn faded and says why in its tooltip; pressing it does nothing rather than
    // opening a panel onto a feature the map could not find.
    if (v === "edit") return editBlocked ? undefined : onOpenEditor?.();
    if (v === "revert") return onRevert?.();
    onDecide(v as Decision);
  };
  return (
    <div
      data-change-row={change.id}
      onClick={onActivate}
      style={{
        /**
         * A COLUMN, not a row (Olcay, 2026-08-11: *"details should be full width — flags could
         * align with what's above details"*). The card used to be one horizontal flex, so the
         * bullets lived inside the left column and wrapped at roughly half the card's width while
         * the empty right column held the decision control; and the control, centred against the
         * whole card, drifted downward as the details expanded — away from the name it decides on.
         *
         * Now the top strip is [identity | control] and the details span the full width below it.
         */
        display: "flex",
        flexDirection: "column",
        gap: 6,
        /**
         * The active row and the map's open tooltip are the same selection seen twice. The
         * treatment is deliberately NOT a colour: §3 reserves colour for what a feature *is* and
         * marks for what you *decided*, and selection is neither. So it reads as a ring and a
         * lift — the row comes forward, keeping its type accent and its decision mark saying
         * exactly what they said before.
         */
        background: active ? "#fff" : "var(--review-surface)",
        borderLeft: `4px solid ${accent}`,
        borderRadius: 8,
        padding: "10px 12px 10px 14px",
        boxShadow: active
          ? "0 0 0 2px var(--primitives-colors-theme-800), 0 2px 8px rgba(0,0,0,.10)"
          : "none",
        cursor: onActivate ? "pointer" : "default",
        transition: "box-shadow .12s, background .12s",
      }}
    >
      {/* top strip — the identity, and the decision that belongs to it, on one baseline */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: "100%",
        }}
      >
        <div style={{ flex: "1 1 0", minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontWeight: 600,
                color: "var(--review-ink)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {change.name}
            </span>
            {/*
            The glyph moved INTO the chip below (Olcay, 2026-08-11). It used to sit here beside the
            name, which meant the same warning was announced twice on two lines — a mark up here and
            its label down there — and the mark was the half with no words on it.
          */}
          </div>
          {warning && (
            /**
             * **A yellow chip** (Olcay, 2026-08-11). This supersedes §3's *"Risk is a third axis, and
             * it is never coloured… never amber"* — the reasoning there was that amber already means
             * *magnitude*, so spending it on risk says two things with one colour. Worth re-reading
             * before it becomes law; the chip is at least confined to the row, where no traffic light
             * appears.
             */
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  role="img"
                  aria-label={`Warning: ${WARNING_LABEL[warning]}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--primitives-colors-emotional-alert-900)",
                    background: "var(--primitives-colors-emotional-alert-0)",
                    border: "1px solid #fde0a8",
                    borderRadius: 999,
                    padding: "1px 8px 1px 6px",
                    margin: "3px 0 1px",
                    cursor: "help",
                  }}
                >
                  <WarningGlyph size={12} />
                  {WARNING_LABEL[warning]}
                </div>
              </TooltipTrigger>
              {/* Bounded, or a single sentence lays itself out as one line wider than the panel
                (Olcay, 2026-08-11) — it overhung the drawer and covered the row above. */}
              <TooltipContent
                style={{ maxWidth: 260, whiteSpace: "normal", lineHeight: 1.4 }}
              >
                {WARNING_WHY[warning]}
              </TooltipContent>
            </Tooltip>
          )}
          {/*
          **Details are behind a toggle** (Olcay, 2026-08-11: *"maybe there could be a 'details'
          button — when clicked the card expands and shows the details much more neatly"*).
          Every bullet used to render inline, so a row with two of them grew tall enough to wrap
          around the decision control and collide with it. Collapsed, a row is one line of summary
          and its decision; the bullets are there when you want them.
        */}
          <div style={{ fontSize: 12.5, color: "var(--review-muted)" }}>
            {change.detail}
          </div>
        </div>
        {/* Deciding is not selecting: without this, every ✓ would also fly the map to that feature,
          and working down the list would become a slideshow. */}
        <div
          style={{
            flex: "0 0 auto",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {edit ? (
            /**
             * **Edited outranks the decision, and takes its place** (Olcay, 2026-08-25: *"edit
             * becomes user override which supersedes the incoming change"*).
             *
             * There is deliberately no ✓/✗ pair here (Olcay, 2026-08-26: *"too many buttons side by
             * side when revert is added too"*). Confirm would mean "apply MapScale's suggestion",
             * and you have just replaced it; reject would mean "keep the published value", and you
             * have just replaced that too. Both segments would be lies about a row whose answer is
             * now yours, and the bar's own law already says **hide what cannot apply**. The way back
             * is **Revert**, which restores the detected value and puts the pair back.
             *
             * ⚠️ **The `EDITED` pill went with them.** Beside a row whose left accent is already
             * purple and whose override line is printed underneath, the pill was the third voice.
             * It also made the edited row the only one with a different silhouette, which is what
             * D17 forbids.
             *
             * ⚠️ **`value` was hard-coded to `"edit"` until 2026-08-28, and that made ✎ unpressable**
             * (Olcay: *"I should be able to edit the edited again if I want to"*). A segment that
             * already holds the pill cannot be *selected* — pressing it **deselects**, so the one
             * act this row exists to offer was the one act it refused. Worse, the deselect reported
             * `""` and was written as a decision; see `onTray`.
             *
             * So the pill now tracks the **session**, exactly as the `preserved` row beneath does —
             * ✎ lights while the editor is open and is pressable at rest. That the row *is* edited
             * is already said three other ways: the purple accent, the override line, and the map
             * card's *"Edited by you"*.
             */
            <SegmentedControl
              items={tray(["edit", "revert"])}
              value={editing ? "edit" : undefined}
              onValueChange={onTray}
            />
          ) : preserved ? (
            /**
             * "Kept" stays a word rather than becoming a ✓, because it is the row's *status* and
             * people read it as one — and because ✓ means "apply this change", which is not what
             * is happening here. Beside it, the two acts Olcay asked for on 2026-08-25: edit your
             * own earlier override, or reset it back to what the source says.
             *
             * ⚠️ **Neither segment is selected at rest**, and that is deliberate — this row stands
             * at *Kept*, which is the word beside the tray, not at either act. ✎ takes the pill only
             * while the editor is open.
             */
            <>
              {/**
               * ⚠️ **The label READS the decision.** It was the literal string `"Kept"` until
               * 2026-08-27, so pressing Reset recorded the decision, the map drew a muted ✗ on the
               * feature — and the row went on saying *Kept*. The row and the map telling different
               * stories is the one failure this screen's whole message protocol exists to prevent.
               */}
              <span
                style={{ fontSize: 12, color: DECISION_INK, padding: "0 2px" }}
              >
                {change.decision === "reject" ? "Dropped" : "Kept"}
              </span>
              <SegmentedControl
                items={tray(["edit", "revert"])}
                value={editing ? "edit" : undefined}
                onValueChange={onTray}
              />
            </>
          ) : (
            /**
             * ⚠️ **`editing` takes the pill**, so pressing ✎ has feedback in the row and not only in
             * the form that opens below it. It is the tray's own grammar — white says where this row
             * currently stands — and it is why the edited state above draws ✎ selected too: the pill
             * appears when the session opens and simply stays if the edit is saved.
             */
            <SegmentedControl
              items={tray(["confirm", "edit", "reject"])}
              value={editing ? "edit" : change.decision}
              onValueChange={onTray}
            />
          )}
        </div>
      </div>

      {/*
        **What the user put in place of the suggestion**, listed the same way MapScale's own
        `details` are and directly under them — so the row reads as one story in two voices rather
        than as a change with a footnote.
      */}
      {mine.shown.length ? (
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          {mine.shown.map((d) => (
            <div
              key={d}
              style={{
                fontSize: 12,
                lineHeight: 1.45,
                color: OVERRIDE_INK,
                borderLeft: `3px solid ${OVERRIDE_INK}`,
                paddingLeft: 8,
              }}
            >
              {d}
            </div>
          ))}
        </div>
      ) : null}

      {/*
        ⚠️ **The inline form stood here until 2026-08-27.** A name + type pair that expanded inside
        the row, plus a separate *"Edit shape on the map"* button that armed the geometry editor.
        Olcay: *"edit should bring in the edit panel as if it's normal feature edit. geometry
        becomes editable."* — so ✎ now opens the **standard properties panel**, which does both
        halves in one movement, and the row is a list again rather than a workspace.

        What it took with it: `onEdit`, `onEditShape`, `onEditEnd` and `shapeDirty`. The row no
        longer commits anything, so it no longer needs a commit point.
      */}
      {/*
        The bullets use the FULL card width, and the toggle is a **full-width bottom cap**
        (Olcay, 2026-08-11). Both come from the same observation: a bullet trapped in the identity
        column wrapped at half the card, and a small inline link buried under the summary read as
        part of the text rather than as the card's own control.

        The cap breaks out of the card's padding with negative margins — hence the odd numbers,
        which are exactly the padding above (`10px 12px 10px 14px`) — so it meets both edges and
        rounds into the card's bottom corners.
      */}
      {change.details?.length || mine.capped.length ? (
        <div style={{ width: "100%" }}>
          {expanded && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                paddingBottom: 8,
              }}
            >
              {(change.details ?? []).map((d) => (
                <div
                  key={d}
                  style={{
                    fontSize: 12,
                    color: "var(--review-muted)",
                    lineHeight: 1.45,
                  }}
                >
                  • {d}
                </div>
              ))}
              {/* Yours, in your ink, so the overflow still reads as yours and not as MapScale's. */}
              {mine.capped.map((d) => (
                <div
                  key={d}
                  style={{
                    fontSize: 12,
                    color: OVERRIDE_INK,
                    lineHeight: 1.45,
                    borderLeft: `3px solid ${OVERRIDE_INK}`,
                    paddingLeft: 8,
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
          )}
          <button
            // stopPropagation: expanding is reading, not selecting — otherwise opening the
            // details would also fly the map to this feature.
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            aria-expanded={expanded}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              width: "calc(100% + 26px)",
              margin: "0 -12px -10px -14px",
              padding: "6px 0",
              border: "none",
              borderTop: "1px solid var(--primitives-colors-background-100)",
              borderRadius: "0 0 8px 8px",
              background: "transparent",
              cursor: "pointer",
              fontSize: 11.5,
              fontWeight: 600,
              color: "var(--primitives-colors-theme-700)",
            }}
          >
            {expanded
              ? "Hide details"
              : mine.capped.length
                ? `Details · ${mine.capped.length} more of yours`
                : "Details"}
            <span style={{ fontSize: 8, lineHeight: 1 }}>
              {expanded ? "▲" : "▼"}
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
