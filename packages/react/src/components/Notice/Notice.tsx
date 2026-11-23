import React from "react";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  ChevronDown,
  InfoCircle,
} from "@kozmos-ds/icons";
import { cn } from "../../utils";
import { impliedLive, LIVE_ROLES } from "../../recipes/live-region";
import {
  NOTICE_CLASS,
  NOTICE_DETAIL_TEXT_CLASS,
  NOTICE_MARK_CLASS,
  NOTICE_MARK_SIZE,
  NOTICE_MORE_CLASS,
  NOTICE_SUMMARY_CLASS,
  NOTICE_TONES,
  noticeActionClass,
  noticeChevronClass,
  noticeDetailClass,
  noticeDoneClass,
  noticeMarkClass,
  noticeRowClass,
  noticeTone,
  type NoticeLiveness,
  type NoticeStatus,
  type NoticeTone,
} from "../../recipes/notice";
import { SpinnerArc } from "../Spinner/SpinnerArc";

export type { NoticeLiveness, NoticeStatus, NoticeTone };

export interface NoticeProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onToggle"
> {
  /**
   * The one line that is always visible. Keep it informative on its own: a
   * collapsed notice that only says "Important" tells the reader nothing, and
   * Story 14 requires the notice to stand before any result is shown.
   */
  summary: React.ReactNode;
  /** The full wording, revealed on tap. */
  children?: React.ReactNode;
  tone?: NoticeTone;
  /**
   * Where the work the notice reports on has got (GAP-160): `"progress"`
   * while it runs, `"done"` when it has finished, as "Geometry is set" ends
   * in a check. Left out, the notice reports no work.
   *
   * `progress` draws the system's loading arc, Spinner's, in the icon's
   * column (still under reduced motion). The notice is not marked busy: on
   * its own live region `aria-busy` would hold back the words that say what
   * is running ("Saving the geometry"). `done` draws a
   * check at the summary's inline end and no mark at its start unless `icon`
   * gives one. The summary's words say what happened; the marks are hidden
   * from assistive technology.
   */
  status?: NoticeStatus;
  /**
   * Replaces the tone's own mark: a triangle for `warning`, an info circle for
   * `info`, an alert circle for `critical`, a check for `success`. `null` or
   * `false` draws none, and leaves no empty column before the summary
   * (GAP-118). While `status` is `"progress"` the loading arc takes its
   * place.
   */
  icon?: React.ReactNode;
  /**
   * Where the icon sits beside the summary. `start`, the default, puts it on
   * the first line of a summary that wraps. `center` centres it on a one-line
   * summary that holds a control, as "Not finding it? [Search with AI]" does
   * (GAP-118).
   */
  iconAlign?: "start" | "center";
  /** Uncontrolled starting state. */
  defaultExpanded?: boolean;
  /** Controlled state. Pass with `onExpandedChange`. */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Names the disclosure for assistive technology. */
  expandLabel?: string;
  /**
   * A control under the text — "Call 112" on the emergency notice.
   *
   * A slot rather than a button prop: the design system does not know how a
   * venue places an emergency call, and a notice that guessed would be the
   * worst possible place to be wrong.
   */
  action?: React.ReactNode;
  /**
   * Whether the detail hides behind a disclosure. Defaults to true when there
   * is detail to hide.
   *
   * An emergency notice sets this false: "help first, not a result list"
   * means the instruction and the way to act on it are both already visible.
   * Nobody in an emergency should have to discover a "More" link.
   */
  collapsible?: boolean;
  /** Defaults to `polite`. Use `assertive` only for an emergency. */
  live?: NoticeLiveness;
}

/** Each tone's own mark, the ones Toast draws for the same four tones. */
const toneMarks: Record<NoticeTone, typeof AlertTriangle> = {
  warning: AlertTriangle,
  info: InfoCircle,
  critical: AlertCircle,
  success: Check,
};

/**
 * A short notice that opens for the long version.
 *
 * MAP-474 Story 14 needs a dietary notice above every AI-assisted result list,
 * and the full legal wording runs to four lines — 114px above results that are
 * themselves the answer. Collapsed, this is one line: an icon, a sentence
 * large enough to read first, and a clear affordance that there is more.
 *
 * Not `Alert` with a `collapsible` flag, and not an Accordion inside an Alert:
 * AccordionItem draws its own border, so the notice gained a divider through
 * its middle and barely shrank. This owns its disclosure.
 *
 * `role="status"` rather than `alert`: the notice must be announced when
 * results arrive, and an assertive alert would cut across whatever the visitor
 * was already being told.
 *
 * Expansion is uncontrolled by default and controllable when a product wants
 * to remember it for the session — persistence belongs to the app, not to a
 * component that cannot know which storage is allowed.
 */
const Notice = React.forwardRef<HTMLDivElement, NoticeProps>(
  (
    {
      className,
      summary,
      children,
      tone = "warning",
      status,
      icon,
      iconAlign = "start",
      defaultExpanded = false,
      expanded,
      onExpandedChange,
      expandLabel = "More",
      action,
      collapsible,
      live = "polite",
      role,
      ...props
    },
    ref,
  ) => {
    const [uncontrolled, setUncontrolled] = React.useState(defaultExpanded);
    const isControlled = expanded !== undefined;
    const open = isControlled ? expanded : uncontrolled;
    const detailId = React.useId();
    const hasDetail = Boolean(children);
    const canCollapse = collapsible ?? true;
    // Not collapsible means always shown, whatever `expanded` says.
    const detailVisible = hasDetail && (!canCollapse || open);

    const toggle = () => {
      const next = !open;
      if (!isControlled) setUncontrolled(next);
      onExpandedChange?.(next);
    };

    const resolvedTone: NoticeTone = noticeTone(tone);
    const working = status === "progress";
    const done = status === "done";
    // No icon, no column: the detail and the action then start where the
    // summary does. Done moves the mark to the inline end, so its start has
    // none unless the product gives one; progress always turns the arc.
    const drawsIcon =
      working || (icon !== null && icon !== false && !(done && icon == null));
    const resolvedRole = role ?? LIVE_ROLES[live];
    const ToneMark = toneMarks[resolvedTone];

    return (
      <div
        className={cn(NOTICE_CLASS, NOTICE_TONES[resolvedTone], className)}
        data-tone={resolvedTone}
        data-status={status}
        ref={ref}
        // Fixed at `status` until row 54: a notice could be read politely or
        // not at all, and an emergency had no way to interrupt. A caller's own
        // `role` still wins.
        role={resolvedRole}
        // The role's own liveness, said as well: a Select or Menu open hides
        // every box but those marked aria-live, and the "More" button in this
        // one stayed focusable inside the hidden box (GAP-193).
        aria-live={impliedLive(resolvedRole)}
        {...props}
      >
        <div className={noticeRowClass(iconAlign)}>
          {drawsIcon && (
            <span aria-hidden="true" className={noticeMarkClass(iconAlign)}>
              {working ? (
                <SpinnerArc
                  className={NOTICE_MARK_CLASS}
                  size={NOTICE_MARK_SIZE}
                />
              ) : (
                (icon ?? <ToneMark className={NOTICE_MARK_CLASS} />)
              )}
            </span>
          )}
          {/* Boxes, not paragraphs: a summary or detail may hold a control or
              a framework's wrapper (Vue's bridge draws a slot in a div), which
              a <p> may not hold. */}
          <div className={NOTICE_SUMMARY_CLASS}>{summary}</div>
          {done && (
            <Check
              aria-hidden="true"
              focusable="false"
              data-kozmos-notice-done=""
              className={noticeDoneClass(iconAlign)}
            />
          )}
          {hasDetail && canCollapse && (
            <button
              aria-controls={detailId}
              aria-expanded={open}
              className={NOTICE_MORE_CLASS}
              onClick={toggle}
              type="button"
            >
              {expandLabel}
              <ChevronDown
                aria-hidden="true"
                className={noticeChevronClass(open)}
              />
            </button>
          )}
        </div>
        {hasDetail && (
          // Kept in the DOM so the expanded text is read where it sits,
          // rather than arriving as a new region the reader has to find.
          //
          // Hidden by the ATTRIBUTE, not a class: a class needs the
          // stylesheet to have loaded, and a notice whose collapsed text
          // appears when CSS fails is the 114px problem this exists to solve.
          // The attribute also takes it out of the accessibility tree.
          <div
            className={noticeDetailClass(drawsIcon, detailVisible)}
            hidden={!detailVisible}
            id={detailId}
          >
            <div className={NOTICE_DETAIL_TEXT_CLASS}>{children}</div>
          </div>
        )}
        {action && <div className={noticeActionClass(drawsIcon)}>{action}</div>}
      </div>
    );
  },
);
Notice.displayName = "Notice";

export { Notice };
