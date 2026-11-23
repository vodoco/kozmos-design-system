import * as React from "react";
import { cn } from "../../utils";
import { Text } from "../Text";
import { Progress } from "../Progress/Progress";
import { emotionSurfaceProperties, type Emotion } from "../../utils/emotion";
import {
  EMPTY_STATE_PROGRESS_LABELS_CLASS,
  emptyStateActionClasses,
  emptyStateClampPercent,
  emptyStateClasses,
  emptyStateDescriptionClasses,
  emptyStateIconClasses,
  emptyStateListClasses,
  emptyStateProgressClasses,
  emptyStateProgressLabelClasses,
  emptyStateProgressValueClasses,
  emptyStateTitleClasses,
} from "../../recipes/empty-state";

/**
 * The density a surrounding slot asks for.
 *
 * A slot that already draws a padded box around its child knows the child
 * should not pad itself again; the product placing an EmptyState there does
 * not, and would have no reason to look. So the slot says so, and an explicit
 * `size` on the component still wins.
 */
const EmptyStateDensityContext = React.createContext<
  "default" | "compact" | undefined
>(undefined);

/** Used by slots that draw their own box — see `POIResultList`. */
export const EmptyStateDensity = EmptyStateDensityContext.Provider;

/**
 * A long wait the empty state is explaining, such as a download, and how far
 * it has got (GAP-115).
 */
export interface EmptyStateProgress {
  /** How far it has got, from 0 to 100. Outside that it is clamped, and NaN is 0. */
  value: number;
  /** What is in progress, shown above the bar and naming it: "Downloading the assistant". */
  label: string;
  /** How far, in words, shown beside the label and said as the bar's value: "40%", "12 of 30 MB". */
  valueText?: string;
}

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** A wait it explains, drawn under the description and above the action. */
  progress?: EmptyStateProgress;
  /**
   * A list under the description (GAP-165): what to try, or what is to come,
   * one item a line, drawn as a bulleted list and read in order, with its
   * count. Each item is a line of text, or the product's own inline content,
   * such as a Link. An empty list draws nothing.
   */
  list?: React.ReactNode[];
  /** The list's name, said as a screen reader enters it. */
  listLabel?: string;
  /**
   * How much room it takes.
   *
   * `default` fills its region and pads itself by 32, which is right when the
   * empty state IS the screen. `compact` is for a slot that already draws a
   * box around it — a result list's empty slot, a card, a panel section.
   *
   * Measured on the MAP-474 boards: a no-result state with an icon came to
   * 258px inside `POIResultList`, of which 48 was the slot's own padding
   * (removed 2026-09-25) and 64 this component's. `compact` brings the same
   * content to about 150 (GAP-009).
   */
  size?: "default" | "compact";
  /**
   * What the empty state means (GAP-213, decision 194): one of Tag's six
   * emotions. Set, it is a card of its own: the emotion's quiet surface,
   * edged in the emotion's text colour as Tag's outline is, with its words
   * in the ink that pairs with that surface (4.5:1 in both themes) and its
   * icon in the emotion's text colour on a disc of the page's colour.
   * "No Map Content Found" is the alert tone. Unset, it draws as it always
   * has, on the page with no edge.
   */
  tone?: Emotion;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      icon,
      title,
      description,
      action,
      progress,
      list,
      listLabel,
      size,
      tone,
      style,
      ...props
    },
    ref,
  ) => {
    const fromSlot = React.useContext(EmptyStateDensityContext);
    const resolved = size ?? fromSlot ?? "default";
    // Every compact class is layered after the default one (the recipe).
    const compact = resolved === "compact";
    const toned = !!tone;
    const progressLabelId = React.useId();
    return (
      <div
        ref={ref}
        data-size={resolved}
        data-tone={tone}
        className={cn(...emptyStateClasses(compact, toned), className)}
        // The caller's own style wins, as on Tag: the tone sets a default.
        style={tone ? { ...emotionSurfaceProperties(tone), ...style } : style}
        {...props}
      >
        {icon && (
          <div className={cn(...emptyStateIconClasses(compact, toned))}>
            {icon}
          </div>
        )}
        {/* align="center" on both, explicitly: Text aligns from the start, and
          a block that centres itself does not centre the text inside it. The
          description wrapped to two lines and the second sat against the
          leading edge. */}
        <Text
          align="center"
          size="base"
          weight="medium"
          className={cn(...emptyStateTitleClasses(compact, toned))}
        >
          {title}
        </Text>
        {description && (
          <Text
            align="center"
            size="sm"
            className={cn(...emptyStateDescriptionClasses(compact, toned))}
          >
            {description}
          </Text>
        )}
        {/* Under the description, starting at the leading edge as the
          progress label does: a list read centred is hard to follow. The
          list's own role is kept where a list-style of none would drop it
          (WebKit), so it is said as a list of so many items. */}
        {list && list.length > 0 && (
          <ul
            role="list"
            aria-label={listLabel}
            data-empty-state-list=""
            className={cn(
              ...emptyStateListClasses(compact, toned, !!description),
            )}
          >
            {list.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )}
        {/* The natives leave their stack's gap above the bar, 16 or 8
          compact, from the description or, without one, from the title,
          whose own margin is 4 (2 compact): the bar tops it up. The label
          starts at the leading edge, as on the natives, not centred. */}
        {progress && (
          <div
            data-empty-state-progress=""
            className={cn(...emptyStateProgressClasses(compact, !!description))}
          >
            {/* Hidden, and still the bar's name: aria-labelledby reads a
              hidden element. Read as text as well, the label was said twice
              in browse mode; the natives expose one element. */}
            <div
              aria-hidden="true"
              className={EMPTY_STATE_PROGRESS_LABELS_CLASS}
            >
              <span
                id={progressLabelId}
                className={cn(...emptyStateProgressLabelClasses(toned))}
              >
                {progress.label}
              </span>
              {progress.valueText && (
                <span className={cn(...emptyStateProgressValueClasses(toned))}>
                  {progress.valueText}
                </span>
              )}
            </div>
            <Progress
              value={emptyStateClampPercent(progress.value)}
              aria-labelledby={progressLabelId}
              getValueLabel={
                progress.valueText ? () => progress.valueText! : undefined
              }
            />
          </div>
        )}
        {action && (
          <div className={cn(...emptyStateActionClasses(compact))}>
            {action}
          </div>
        )}
      </div>
    );
  },
);
EmptyState.displayName = "EmptyState";

export { EmptyState };
