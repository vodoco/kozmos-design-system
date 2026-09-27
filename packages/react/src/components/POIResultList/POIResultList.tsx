import React from "react";
import type {
  POIPresentation,
  POIResultAction,
  POIResultPresentation,
} from "@kozmos-ds/product-contracts";
import { cn } from "../../utils";
import { EmptyStateDensity } from "../EmptyState/EmptyState";
import { POIResultCard } from "../POIResultCard";
import { POIResultGroup } from "../POIResultGroup";

export interface POIResultListItem {
  poi: POIPresentation;
  result: POIResultPresentation;
}

/**
 * Several results that are one place to a visitor — five Starbucks in an
 * airport. The list draws these as a POIResultGroup: one representative, the
 * rest behind a count.
 */
export interface POIResultListGroup {
  /** Stable across renders; the group's key. */
  id: string;
  /** Names the group for assistive technology, e.g. "Starbucks, 9 results". */
  label?: string;
  /** Members, representative first. The list does not reorder them. */
  items: readonly POIResultListItem[];
  /** How many show while collapsed. */
  collapsedCount?: number;
  defaultExpanded?: boolean;
}

export type POIResultListEntry = POIResultListItem | POIResultListGroup;

const isGroup = (entry: POIResultListEntry): entry is POIResultListGroup =>
  Array.isArray((entry as POIResultListGroup).items);

export interface POIResultListProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "onSelect"
> {
  /**
   * Rows, groups, or both. A plain item is one result; a group is several
   * that read as one place.
   */
  items: readonly POIResultListEntry[];
  onSelect: (poiId: string) => void;
  /** Run an action from the selected result's action row. */
  onAction?: (action: POIResultAction, poiId: string) => void;
  selectedPoiId?: string;
  label?: string;
  resultCountLabel: string;
  emptyState?: React.ReactNode;
  featuredLabel?: string;
  /** Names each result's action row for assistive technology. */
  actionsLabel?: string;
  /** The floor the map shows: a result on it carries a dot before its floor. */
  currentFloorId?: string;
}

const POIResultList = React.forwardRef<HTMLElement, POIResultListProps>(
  (
    {
      className,
      items,
      onSelect,
      onAction,
      selectedPoiId,
      label = "Points of interest",
      resultCountLabel,
      emptyState,
      featuredLabel,
      actionsLabel,
      currentFloorId,
      ...props
    },
    ref,
  ) => {
    return (
      <section
        ref={ref}
        aria-label={label}
        className={cn("min-w-0", className)}
        {...props}
      >
        <p aria-live="polite" className="sr-only">
          {resultCountLabel}
        </p>
        {items.length === 0 ? (
          // Pad a string; never pad a component.
          //
          // The slot used to add p-6 whatever it held. A string needs that -
          // "Try removing a filter." against a dashed border with no room is
          // not a message, it is a mistake. A component pads itself, and
          // EmptyState adds p-8, so the two together made a one-line
          // no-result into a 222px box.
          //
          // Deciding on the CHILD rather than on a prop means a product gets
          // the right answer without knowing this rule exists, which is the
          // only version of this fix that actually fixes anything: nothing in
          // this repository was passing a flag, and nothing would have.
          <div
            className={cn(
              "rounded-container border border-dashed border-border bg-muted/40 text-center text-sm text-muted-foreground",
              typeof emptyState === "string" && "p-6",
            )}
          >
            {/* The slot draws the box, so a component inside it should not
                draw another. A product passing an EmptyState here has no
                reason to know that; the slot does, so the slot says so, and
                an explicit size on the EmptyState still wins. */}
            <EmptyStateDensity value="compact">{emptyState}</EmptyStateDensity>
          </div>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {items.map((entry) => {
              // Selection is the list's to decide when it was given a
              // selectedPoiId, and a member of a group is no exception: a
              // grouped result must highlight the same way an ungrouped one
              // does, or the map and the list disagree.
              const select = (item: POIResultListItem) => ({
                ...item.result,
                selected:
                  selectedPoiId === undefined
                    ? item.result.selected
                    : selectedPoiId === item.poi.id,
              });

              if (isGroup(entry)) {
                return (
                  <li key={entry.id}>
                    <POIResultGroup
                      actionsLabel={actionsLabel}
                      collapsedCount={entry.collapsedCount}
                      currentFloorId={currentFloorId}
                      defaultExpanded={entry.defaultExpanded}
                      featuredLabel={featuredLabel}
                      items={entry.items.map((item) => ({
                        poi: item.poi,
                        result: select(item),
                      }))}
                      label={entry.label}
                      onAction={onAction}
                      onSelect={onSelect}
                    />
                  </li>
                );
              }

              const { poi } = entry;
              return (
                <li key={poi.id}>
                  <POIResultCard
                    actionsLabel={actionsLabel}
                    currentFloorId={currentFloorId}
                    featuredLabel={featuredLabel}
                    onAction={onAction}
                    onSelect={onSelect}
                    poi={poi}
                    result={select(entry)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  },
);

POIResultList.displayName = "POIResultList";

export { POIResultList };
