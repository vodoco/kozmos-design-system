import React from "react";
import type {
  POIPresentation,
  POIResultAction,
  POIResultPresentation,
} from "@kozmos-ds/product-contracts";
import { ChevronDown } from "@kozmos-ds/icons";
import { POIResultCard } from "../POIResultCard";
import { cn } from "../../utils";

export interface POIResultGroupItem {
  poi: POIPresentation;
  result: POIResultPresentation;
}

export interface POIResultGroupProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onSelect"> {
  /**
   * Every member, representative first.
   *
   * Which one represents the group is the product's decision — nearest by
   * walking distance when there is a blue dot, otherwise the one on the
   * current level — so this takes them in the order it should show them and
   * does not reorder.
   */
  items: readonly POIResultGroupItem[];
  onSelect: (poiId: string) => void;
  onAction?: (action: POIResultAction, poiId: string) => void;
  /** How many members show while collapsed. */
  collapsedCount?: number;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Given the number still hidden. */
  showMoreLabel?: (hidden: number) => string;
  hideLabel?: string;
  /** Names the group for assistive technology, e.g. "Starbucks, 9 results". */
  label?: string;
  featuredLabel?: string;
  actionsLabel?: string;
  currentFloorId?: string;
}

/**
 * One venue, many branches.
 *
 * An airport has five Starbucks and a visitor asking for coffee does not want
 * five rows, nor the same name scattered through the list. The group shows one
 * — the product's choice of representative — and folds the rest behind a
 * count, which is the count of what is HIDDEN, not of the group.
 *
 * The container draws the border and the members draw none, separated by
 * dividers: nine bordered cards inside one bordered box reads as a mistake.
 * The members are ordinary POIResultCards, so a grouped result opens the same
 * details and offers the same actions as an ungrouped one.
 *
 * Nothing here is specific to a brand. A group is a list with a representative
 * and a remainder, which is as true of "other floors" or "similar places" as
 * it is of Starbucks.
 */
const POIResultGroup = React.forwardRef<HTMLElement, POIResultGroupProps>(
  (
    {
      className,
      items,
      onSelect,
      onAction,
      collapsedCount = 1,
      defaultExpanded = false,
      expanded,
      onExpandedChange,
      showMoreLabel = (hidden) => `Show ${hidden} more`,
      hideLabel = "Hide",
      label,
      featuredLabel,
      actionsLabel,
      currentFloorId,
      ...props
    },
    ref,
  ) => {
    const [uncontrolled, setUncontrolled] = React.useState(defaultExpanded);
    const isControlled = expanded !== undefined;
    const open = isControlled ? expanded : uncontrolled;
    const listId = React.useId();

    const hidden = Math.max(items.length - collapsedCount, 0);
    const shown = open ? items : items.slice(0, collapsedCount);

    const toggle = () => {
      const next = !open;
      if (!isControlled) setUncontrolled(next);
      onExpandedChange?.(next);
    };

    return (
      <section
        aria-label={label}
        className={cn(
          "overflow-hidden rounded-control border border-border bg-card",
          className,
        )}
        data-expanded={open || undefined}
        ref={ref}
        {...props}
      >
        <ul className="m-0 flex list-none flex-col p-0" id={listId}>
          {shown.map(({ poi, result }, index) => (
            <li
              className={cn(index > 0 && "border-t border-border")}
              key={poi.id}
            >
              <POIResultCard
                actionsLabel={actionsLabel}
                appearance="row"
                currentFloorId={currentFloorId}
                featuredLabel={featuredLabel}
                onAction={onAction}
                onSelect={onSelect}
                poi={poi}
                result={result}
              />
            </li>
          ))}
        </ul>
        {hidden > 0 && (
          <button
            aria-controls={listId}
            aria-expanded={open}
            className="w-full border-t border-border bg-muted px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            onClick={toggle}
            type="button"
          >
            <span className="inline-flex items-center gap-1.5">
              {open ? hideLabel : showMoreLabel(hidden)}
              <ChevronDown
                aria-hidden="true"
                className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
              />
            </span>
          </button>
        )}
      </section>
    );
  },
);
POIResultGroup.displayName = "POIResultGroup";

export { POIResultGroup };
