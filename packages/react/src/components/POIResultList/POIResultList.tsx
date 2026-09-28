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
  /**
   * Whether the group is open. Give it to hold the group open yourself —
   * uncontrolled expansion lives in the group's own state, so it cannot
   * survive anything that unmounts the list, such as the panel closing.
   */
  expanded?: boolean;
}

export type POIResultListEntry = POIResultListItem | POIResultListGroup;

const isGroup = (entry: POIResultListEntry): entry is POIResultListGroup =>
  Array.isArray((entry as POIResultListGroup).items);

/** Room left beside a result brought into view: the gap between two results. */
const REVEAL_MARGIN = 12;

/**
 * What the list scrolls to bring a result into view: the nearest ancestor
 * that scrolls, or, when nothing around the list does, the page.
 *
 * A box that hides its overflow scrolls only when it says so with
 * `data-kozmos-scroller`. AdaptiveMapShell's sheet does: below its largest
 * detent it hides its overflow and every touch moves the sheet, so a finger
 * cannot scroll it, yet only script can bring a result into it. Any other box
 * that hides its overflow is clipping — a group's rounded corners — and a
 * pixel of rounding must not make it the one that moves.
 */
function scrollerOf(
  element: HTMLElement,
): { node: HTMLElement; page: boolean } | null {
  const document = element.ownerDocument;
  const view = document.defaultView;
  if (!view) return null;
  for (
    let node = element.parentElement;
    node && node !== document.body && node !== document.documentElement;
    node = node.parentElement
  ) {
    if (node.scrollHeight <= node.clientHeight) continue;
    const { overflowY } = view.getComputedStyle(node);
    if (
      /^(auto|scroll|overlay)$/.test(overflowY) ||
      (overflowY === "hidden" && node.hasAttribute("data-kozmos-scroller"))
    )
      return { node, page: false };
  }
  // A page that hides its overflow is an app frame, not a document to scroll.
  const page = document.scrollingElement ?? document.documentElement;
  if (
    page instanceof view.HTMLElement &&
    page.scrollHeight > page.clientHeight &&
    ![document.documentElement, document.body].some(
      (node) =>
        node && /^(hidden|clip)$/.test(view.getComputedStyle(node).overflowY),
    )
  )
    return { node: page, page: true };
  return null;
}

/**
 * Scroll `target` into its scroller's view by the least distance, and only
 * that scroller: `scrollIntoView` would also move every scrolling ancestor,
 * the sheet and the page included. A result taller than the view keeps its
 * top in view, where its name is.
 */
function revealWithin(target: HTMLElement) {
  const scroller = scrollerOf(target);
  if (!scroller) return;
  const view = target.ownerDocument.defaultView!;
  let top = 0;
  let bottom = scroller.node.clientHeight;
  if (!scroller.page) {
    const style = view.getComputedStyle(scroller.node);
    const frame = scroller.node.getBoundingClientRect();
    // The scroller's padding is not somewhere a result can be read: the
    // sheet's bottom padding is the device's home indicator.
    top =
      frame.top + scroller.node.clientTop + (parseFloat(style.paddingTop) || 0);
    bottom =
      frame.top +
      scroller.node.clientTop +
      scroller.node.clientHeight -
      (parseFloat(style.paddingBottom) || 0);
  }
  const box = target.getBoundingClientRect();
  let distance = 0;
  if (box.top < top) distance = box.top - top - REVEAL_MARGIN;
  else if (box.bottom > bottom)
    distance = Math.min(
      box.bottom - bottom + REVEAL_MARGIN,
      box.top - top - REVEAL_MARGIN,
    );
  if (Math.abs(distance) < 1) return;
  const reduced =
    target.closest('[data-kozmos-motion="reduced"]') !== null ||
    view.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
  const behavior: ScrollBehavior = reduced ? "auto" : "smooth";
  if (scroller.page) view.scrollBy({ top: distance, behavior });
  else if (typeof scroller.node.scrollBy === "function")
    scroller.node.scrollBy({ top: distance, behavior });
  else scroller.node.scrollTop += distance;
}

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
  /**
   * Drawn above the results, inside the list's own region: a notice belongs
   * to the results it qualifies, so it is withheld with them rather than
   * left behind as a sibling when the list cannot render.
   */
  header?: React.ReactNode;
  /**
   * A group's two words, in the visitor's language. They are the same words
   * for every group, so the list carries them once rather than each entry
   * repeating them. Left alone, a grouped list reads "Show 1 more" and
   * "Hide" in English whatever the device says.
   */
  showMoreLabel?: (hidden: number) => string;
  hideLabel?: string;
  /** Told which group, so one handler can hold several open. */
  onGroupExpandedChange?: (groupId: string, expanded: boolean) => void;
  /**
   * Bring the selected result into view when `selectedPoiId` changes — by
   * scrolling whatever the list sits in, and nothing further out. On by
   * default (row 70).
   *
   * A pin's tap selects its result, and the result can be anywhere in the
   * list; in AdaptiveMapShell's sheet below its largest detent it cannot even
   * be scrolled to by hand. A list that appears with a result already
   * selected — the pin's tap that opened it — brings that one in too. A
   * result in a collapsed group brings in its group. A box that hides its
   * overflow is scrolled only when it says it scrolls, with
   * `data-kozmos-scroller`, as AdaptiveMapShell's sheet does; with nothing
   * around the list that scrolls, the page does.
   *
   * Turn it off for a product that already scrolls the panel itself.
   */
  scrollSelectedIntoView?: boolean;
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
      header,
      showMoreLabel,
      hideLabel,
      onGroupExpandedChange,
      scrollSelectedIntoView = true,
      ...props
    },
    ref,
  ) => {
    const section = React.useRef<HTMLElement | null>(null);
    const setSection = React.useCallback(
      (node: HTMLElement | null) => {
        section.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );
    // Nothing has been shown yet, so a list that mounts with a selection
    // brings it in as it appears.
    const shownSelection = React.useRef<string | undefined>(undefined);
    // Read through a ref, not the effect's dependencies: a product that
    // builds `items` during its render passes a new array every time, and
    // each re-run would drop the listener still waiting for the selected
    // card's action row to open. Synced in an effect, which runs before the
    // one below reads it.
    const latestItems = React.useRef(items);
    React.useEffect(() => {
      latestItems.current = items;
    });

    React.useEffect(() => {
      const previous = shownSelection.current;
      shownSelection.current = selectedPoiId;
      if (
        !scrollSelectedIntoView ||
        selectedPoiId === undefined ||
        selectedPoiId === previous ||
        !section.current
      )
        return;
      const cards = Array.from(
        section.current.querySelectorAll<HTMLElement>("[data-poi-id]"),
      );
      const group = latestItems.current.find(
        (entry) =>
          isGroup(entry) &&
          entry.items.some((item) => item.poi.id === selectedPoiId),
      ) as POIResultListGroup | undefined;
      const target =
        cards.find((card) => card.dataset.poiId === selectedPoiId) ??
        Array.from(
          section.current.querySelectorAll<HTMLElement>("[data-result-group]"),
        ).find((entry) => entry.dataset.resultGroup === group?.id);
      if (!target) return;

      revealWithin(target);
      // A selected card opens its action row as it animates, so it is only
      // its full height once that ends; bring it in again then, or a card
      // tapped near the bottom opens its actions out of sight.
      const reveal = (event: AnimationEvent) => {
        if (event.target instanceof Node && target.contains(event.target))
          revealWithin(target);
      };
      target.addEventListener("animationend", reveal, { once: true });
      return () => target.removeEventListener("animationend", reveal);
    }, [scrollSelectedIntoView, selectedPoiId]);

    return (
      <section
        ref={setSection}
        aria-label={label}
        // `kozmos-poi-result-list` keeps the grip's clearance above the first
        // result when the list is the top of AdaptiveMapShell's sheet (owned
        // CSS); it adds nothing anywhere else.
        className={cn("kozmos-poi-result-list min-w-0", className)}
        {...props}
      >
        <p aria-live="polite" className="sr-only">
          {resultCountLabel}
        </p>
        {header !== undefined && header !== null && (
          <div className="mb-3">{header}</div>
        )}
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
                  <li data-result-group={entry.id} key={entry.id}>
                    <POIResultGroup
                      actionsLabel={actionsLabel}
                      collapsedCount={entry.collapsedCount}
                      currentFloorId={currentFloorId}
                      defaultExpanded={entry.defaultExpanded}
                      expanded={entry.expanded}
                      featuredLabel={featuredLabel}
                      hideLabel={hideLabel}
                      items={entry.items.map((item) => ({
                        poi: item.poi,
                        result: select(item),
                      }))}
                      label={entry.label}
                      onAction={onAction}
                      onExpandedChange={
                        onGroupExpandedChange &&
                        ((open) => onGroupExpandedChange(entry.id, open))
                      }
                      onSelect={onSelect}
                      showMoreLabel={showMoreLabel}
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
