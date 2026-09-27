import React from "react";
import { AlertTriangle, ChevronDown } from "@kozmos-ds/icons";
import { cn } from "../../utils";

export type NoticeTone = "warning" | "info" | "critical";

export interface NoticeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onToggle"> {
  /**
   * The one line that is always visible. Keep it informative on its own: a
   * collapsed notice that only says "Important" tells the reader nothing, and
   * Story 14 requires the notice to stand before any result is shown.
   */
  summary: React.ReactNode;
  /** The full wording, revealed on tap. */
  children?: React.ReactNode;
  tone?: NoticeTone;
  /** Replaces the default tone icon. */
  icon?: React.ReactNode;
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
}

const toneStyles: Record<NoticeTone, string> = {
  warning: "border-warning/50 bg-warning/5 text-warning-text",
  info: "border-info/50 bg-info/5 text-info-text",
  critical: "border-destructive/60 bg-destructive/5 text-destructive-text",
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
      icon,
      defaultExpanded = false,
      expanded,
      onExpandedChange,
      expandLabel = "More",
      action,
      collapsible,
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

    return (
      <div
        className={cn(
          "w-full rounded-container border px-3 py-2",
          toneStyles[tone],
          className,
        )}
        ref={ref}
        role="status"
        {...props}
      >
        <div className="flex items-start gap-2">
          <span aria-hidden="true" className="mt-0.5 shrink-0">
            {icon ?? <AlertTriangle className="h-4 w-4" />}
          </span>
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            {summary}
          </p>
          {hasDetail && canCollapse && (
            <button
              aria-controls={detailId}
              aria-expanded={open}
              className="-mr-1 inline-flex shrink-0 items-center gap-1 rounded-control px-1 py-0.5 text-xs font-semibold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={toggle}
              type="button"
            >
              {expandLabel}
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  open && "rotate-180",
                )}
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
            className={cn("pl-6 pr-1", detailVisible && "mt-1.5")}
            hidden={!detailVisible}
            id={detailId}
          >
            <p className="text-sm leading-snug">{children}</p>
          </div>
        )}
        {action && <div className="mt-3 pl-6">{action}</div>}
      </div>
    );
  },
);
Notice.displayName = "Notice";

export { Notice };
