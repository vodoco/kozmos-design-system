import React from "react";
import type { FloorPresentation } from "@kozmos-ds/product-contracts";
import { ChevronDown, ChevronUp } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { MapControlButton } from "../MapControlButton";
import { Popover, PopoverContent, PopoverTrigger } from "../Popover";
import { useKozmosAnalytics } from "../../utils/analytics";

export type FloorSelectorOption = FloorPresentation | string;

/**
 * How the levels are laid out; see `FloorSelectorProps.variant`. Named, as
 * `RatingVariant` is, so the variant-parity check reads it: a union written
 * on the prop itself runs over one line and the check reads only one.
 */
export type FloorSelectorVariant =
  | "vertical-list"
  | "horizontal-list"
  | "compact-stepper"
  | "collapsible";

export interface FloorSelectorProps extends React.HTMLAttributes<HTMLDivElement> {
  floors: readonly FloorSelectorOption[];
  selectedFloor: string;
  onFloorSelect: (floor: string) => void;
  label?: string;
  /**
   * What the compact stepper's two buttons are called, for a visitor who
   * cannot see them: "Floor up" and "Floor down" unless the product passes
   * its own words, as on iOS and Android. The up chevron steps to the previous
   * level in `floors` and the down chevron to the next, so list the levels top
   * first and up goes up. Hard-coded English until row 67, so a German or
   * Japanese device heard English whatever else the product had translated.
   * Only the stepper draws them; the two list variants name each floor by its
   * own label.
   */
  previousFloorLabel?: string;
  /** The down chevron's name, "Floor down" unless the product passes its own. */
  nextFloorLabel?: string;
  /**
   * How a level's result count is said, for a visitor who cannot see the
   * marker. Joined to the floor's own label: "Level 2, 3 results".
   *
   * A function because a count needs a plural rule, and the design system has
   * no locale to pick one with — the product does. The default is English,
   * singular for one, as on iOS and Android.
   */
  resultCountLabel?: (count: number) => string;
  /**
   * The level the visitor is on, by the same id as `selectedFloor`. The
   * collapsible switcher marks it with a dot, as the SDK's level switcher
   * does (decision 38): on the closed tile while the tile shows that level,
   * and on that level in the open column whichever level is shown. Left out,
   * nothing is marked. The product knows where the visitor is; the switcher
   * neither works it out nor chooses a level by it. Only the collapsible
   * draws it; the same parameter on iOS and Android.
   */
  userFloor?: string;
  /**
   * How the dot is said, for a visitor who cannot see it, joined to the
   * level's own label: "Level 1, your level". English until the product
   * passes its own words.
   */
  userFloorLabel?: string;
  /**
   * How the levels are laid out.
   *
   * `vertical-list` and `horizontal-list` show every level; `compact-stepper`
   * shows the current one between a Floor up and a Floor down button.
   *
   * `collapsible` is the SDK's level switcher, for a control parked in a
   * corner of a map (row 79): at rest one map-control tile showing the
   * current level's short label; activated, it grows into a column of every
   * level, top floor first, the current one outlined in the theme's primary.
   * A choice, Escape or a tap outside closes the column, and focus goes back
   * to the tile, which names the level now shown. The same variant,
   * `.collapsible` and `Collapsible`, on iOS and Android.
   */
  variant?: FloorSelectorVariant;
}

function normalizeFloor(floor: FloorSelectorOption): FloorPresentation {
  if (typeof floor === "string") {
    return { id: floor, label: floor, shortLabel: floor };
  }
  return floor;
}

/**
 * The count a level's button marks, or undefined for none: only a count above
 * zero. Absent is unknown, which is not the same as none; a real zero reads as
 * the level itself; and a negative count is no count at all. iOS and Android
 * read it the same way.
 */
function markedResultCount(floor: FloorPresentation): number | undefined {
  const count = floor.resultCount;
  return count !== undefined && count > 0 ? count : undefined;
}

/**
 * What a level's button is called: its label, then what its marks say — the
 * visitor's level, where the switcher marks it, and the count of results.
 */
function spokenLabel(
  floor: FloorPresentation,
  resultCountLabel: (count: number) => string,
  userLevel?: string,
): string {
  const count = markedResultCount(floor);
  return [
    floor.label,
    userLevel,
    count !== undefined ? resultCountLabel(count) : undefined,
  ]
    .filter(Boolean)
    .join(", ");
}

/**
 * The count, drawn once and said once: hidden from assistive technology
 * because the button's own label already carries it, and hearing "3" after
 * "Level 2, 3 results" is noise. Logical inset so it mirrors in Arabic. The
 * lists mark it at the top; the collapsible's column at the bottom, because
 * the top of a level there is where the visitor's dot goes, and the two must
 * never cover each other.
 */
function ResultMarker({
  count,
  corner = "top",
}: {
  count: number;
  corner?: "top" | "bottom";
}) {
  return (
    <span
      aria-hidden="true"
      // Inside the button, not hanging off it. The horizontal list scrolls
      // on one axis, and CSS will not let the other stay visible beside it —
      // `overflow-x: auto` computes `overflow-y` to `auto` too, so a badge two
      // pixels proud of the button would be clipped there, or would raise a
      // scrollbar.
      className={cn(
        "absolute end-0.5 min-w-4 rounded-pill bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground",
        corner === "top" ? "top-0.5" : "bottom-0.5",
      )}
      data-floor-selector-result-count=""
    >
      {count}
    </span>
  );
}

/**
 * The visitor's level (decision 38): a dot in the theme's primary with a halo
 * of the surface, at the top trailing corner, as the SDK's level switcher
 * marks it. Hidden from assistive technology: the level's name says it.
 */
function UserLevelDot() {
  return (
    <span
      aria-hidden="true"
      className="absolute end-1 top-1 h-2.5 w-2.5 rounded-pill border-2 border-background bg-primary"
      data-floor-selector-user-level=""
    />
  );
}

/**
 * How far the column's first level sits inside its edge: its 1px border and
 * its 4px padding. The column is placed so that its bottom level lies exactly
 * over the tile — the tile grows into the column — and its corners stay
 * concentric with the tile's: 16 inside 20, 4 apart.
 */
const COLUMN_INSET = 5;

interface CollapsibleFloorSelectorProps extends React.HTMLAttributes<HTMLDivElement> {
  options: FloorPresentation[];
  selectedFloor: string;
  selectedOption: FloorPresentation | undefined;
  userFloor: string | undefined;
  userFloorLabel: string;
  label: string;
  resultCountLabel: (count: number) => string;
  onChoose: (floor: string) => void;
}

/**
 * The `collapsible` variant (row 79, GAP-080): the SDK's level switcher, as
 * Olcay's board draws it (decision 38).
 *
 * At rest it is one tile, drawn by `MapControlButton` so it is the map's own
 * control, not a lookalike, showing the current level's short label.
 * Activated, it grows into a column of every level in a `Popover`: a portal,
 * so a `MapOverlay`'s scroll box cannot clip a column that grows upwards out
 * of it, and Radix's own Escape, outside press and focus return. The column
 * lies over the tile, its bottom level where the tile was, and turns
 * downwards from the tile's top where there is no room above.
 */
const CollapsibleFloorSelector = React.forwardRef<
  HTMLDivElement,
  CollapsibleFloorSelectorProps
>(
  (
    {
      className,
      options,
      selectedFloor,
      selectedOption,
      userFloor,
      userFloorLabel,
      label,
      resultCountLabel,
      onChoose,
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();
    const [open, setOpen] = React.useState(false);
    // The map control's own size, read off the tile as the column opens: the
    // column's levels take it and the column is placed by it, so its bottom
    // level lies exactly over the tile whatever size the shared map-control
    // surface — or text zoom — gives it. iOS and Android read it the same way.
    const [tileSize, setTileSize] = React.useState({ width: 44, height: 44 });
    const tileRef = React.useRef<HTMLButtonElement>(null);
    const currentRef = React.useRef<HTMLButtonElement>(null);

    const setOpenState = (next: boolean) => {
      if (next && !open) {
        trackEvent("FloorSelector", "floor_selector_expanded", {
          floor: selectedOption?.id ?? selectedFloor,
        });
        const tile = tileRef.current;
        setTileSize({
          width: tile?.offsetWidth || 44,
          height: tile?.offsetHeight || 44,
        });
      }
      setOpen(next);
    };

    // The closed tile marks the visitor's level only while it shows it.
    const tileIsUserLevel =
      userFloor !== undefined && selectedFloor === userFloor;
    const tileLabel = selectedOption?.label ?? selectedFloor;

    return (
      <div
        ref={ref}
        aria-label={label}
        className={cn("w-fit", className)}
        role="group"
        {...props}
      >
        <Popover open={open} onOpenChange={setOpenState}>
          <PopoverTrigger asChild>
            {/* The map's own control, surface and states and all: nothing
                here restyles it, so the tile follows the shared map-control
                surface wherever it goes. `relative` only places the dot.
                Named by the level it shows, as iOS's is: the group says what
                the control is, the tile which level is on. It marks no
                result count — it is the level already in view. */}
            <MapControlButton
              ref={tileRef}
              className="relative"
              icon={
                <>
                  <span className="text-sm font-semibold leading-5">
                    {selectedOption?.shortLabel ?? selectedFloor}
                  </span>
                  {tileIsUserLevel ? <UserLevelDot /> : null}
                </>
              }
              label={
                tileIsUserLevel ? `${tileLabel}, ${userFloorLabel}` : tileLabel
              }
            />
          </PopoverTrigger>
          <PopoverContent
            align="end"
            alignOffset={-COLUMN_INSET}
            aria-label={label}
            className="kozmos-floor-selector-list flex w-auto flex-col gap-1 rounded-container bg-background p-1 shadow-floating"
            side="top"
            sideOffset={-(tileSize.height + COLUMN_INSET)}
            onCloseAutoFocus={(event) => {
              // Back to the tile after a choice, Escape, or a tap on the map
              // that took focus nowhere. Not after a tap that put it on
              // another control: the search field a visitor tapped is where
              // they are typing next, and taking focus back would close their
              // keyboard. Radix itself returns it only when nothing was
              // pressed outside.
              event.preventDefault();
              const active = tileRef.current?.ownerDocument.activeElement;
              if (!active || active === active.ownerDocument.body) {
                tileRef.current?.focus();
              }
            }}
            onOpenAutoFocus={(event) => {
              // The current level, where a visitor who opened the column to
              // look around already is, rather than the top floor.
              const current = currentRef.current;
              if (current && !current.disabled) {
                event.preventDefault();
                current.focus();
              }
            }}
          >
            {options.map((floor) => {
              const isCurrent = floor.id === selectedFloor;
              const isUserLevel =
                userFloor !== undefined && floor.id === userFloor;
              const count = markedResultCount(floor);
              return (
                <Button
                  key={floor.id}
                  ref={isCurrent ? currentRef : undefined}
                  aria-label={spokenLabel(
                    floor,
                    resultCountLabel,
                    isUserLevel ? userFloorLabel : undefined,
                  )}
                  aria-pressed={isCurrent}
                  // The board's states: the current level outlined in the
                  // theme's primary; on hover a light primary outline, and
                  // pressed a full one; a closed level on the muted surface.
                  className={cn(
                    "relative border border-transparent p-0 text-sm font-semibold text-foreground hover:bg-transparent active:border-primary active:text-primary disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100",
                    isCurrent
                      ? "border-primary text-primary"
                      : "hover:border-primary/40 hover:text-primary",
                  )}
                  disabled={floor.disabled}
                  onClick={() => {
                    onChoose(floor.id);
                    setOpen(false);
                  }}
                  size="icon"
                  style={{ height: tileSize.height, minWidth: tileSize.width }}
                  type="button"
                  variant="ghost"
                >
                  {floor.shortLabel}
                  {isUserLevel ? <UserLevelDot /> : null}
                  {count !== undefined ? (
                    <ResultMarker corner="bottom" count={count} />
                  ) : null}
                </Button>
              );
            })}
          </PopoverContent>
        </Popover>
      </div>
    );
  },
);
CollapsibleFloorSelector.displayName = "CollapsibleFloorSelector";

const FloorSelector = React.forwardRef<HTMLDivElement, FloorSelectorProps>(
  (
    {
      className,
      floors,
      selectedFloor,
      onFloorSelect,
      label = "Floor selector",
      previousFloorLabel = "Floor up",
      nextFloorLabel = "Floor down",
      resultCountLabel = (count) =>
        count === 1 ? "1 result" : `${count} results`,
      userFloor,
      userFloorLabel = "your level",
      variant = "vertical-list",
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();

    const handleFloorSelect = (floor: string) => {
      trackEvent("FloorSelector", "floor_selected", { floor });
      onFloorSelect(floor);
    };

    const options = floors.map(normalizeFloor);
    const selectedIndex = options.findIndex(
      (floor) => floor.id === selectedFloor,
    );
    const selectedOption = options[selectedIndex];
    const previousOption =
      selectedIndex > 0
        ? [...options.slice(0, selectedIndex)]
            .reverse()
            .find((floor) => !floor.disabled)
        : undefined;
    const nextOption =
      selectedIndex >= 0
        ? options.slice(selectedIndex + 1).find((floor) => !floor.disabled)
        : undefined;

    if (variant === "collapsible") {
      return (
        <CollapsibleFloorSelector
          ref={ref}
          className={className}
          label={label}
          onChoose={handleFloorSelect}
          options={options}
          resultCountLabel={resultCountLabel}
          selectedFloor={selectedFloor}
          selectedOption={selectedOption}
          userFloor={userFloor}
          userFloorLabel={userFloorLabel}
          {...props}
        />
      );
    }

    if (variant === "compact-stepper") {
      return (
        <div
          ref={ref}
          aria-label={
            selectedOption ? `${label}: ${selectedOption.label}` : label
          }
          className={cn(
            "flex min-h-11 w-fit items-center overflow-hidden rounded-container border border-border bg-background/90 shadow-floating backdrop-blur-sm",
            className,
          )}
          role="group"
          {...props}
        >
          <span
            aria-live="polite"
            className="min-w-14 px-3 text-center text-sm font-semibold text-foreground"
          >
            {selectedOption?.shortLabel ?? selectedFloor}
          </span>
          <span className="flex border-l border-border/70">
            <IconButton
              aria-label={previousFloorLabel}
              className="h-11 w-11 rounded-none border-r border-border/70 bg-transparent p-0 shadow-none"
              disabled={!previousOption}
              onClick={() =>
                previousOption && handleFloorSelect(previousOption.id)
              }
              type="button"
              variant="ghost"
            >
              <ChevronUp aria-hidden="true" className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton
              aria-label={nextFloorLabel}
              className="h-11 w-11 rounded-none bg-transparent p-0 shadow-none"
              disabled={!nextOption}
              onClick={() => nextOption && handleFloorSelect(nextOption.id)}
              type="button"
              variant="ghost"
            >
              <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />
            </IconButton>
          </span>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        aria-label={label}
        className={cn(
          "flex w-fit rounded-container border border-border bg-background/80 p-1 shadow-floating backdrop-blur-sm",
          variant === "vertical-list"
            ? "flex-col"
            : "max-w-full flex-row overflow-x-auto",
          className,
        )}
        role="group"
        {...props}
      >
        {options.map((floor) => {
          const count = markedResultCount(floor);
          return (
            <Button
              key={floor.id}
              variant={selectedFloor === floor.id ? "default" : "ghost"}
              size="sm"
              aria-label={spokenLabel(floor, resultCountLabel)}
              aria-pressed={selectedFloor === floor.id}
              className={cn(
                "relative h-11 w-11 p-0 font-medium",
                variant === "horizontal-list" && "w-auto min-w-11 px-3",
                selectedFloor === floor.id && "shadow-raised",
              )}
              disabled={floor.disabled}
              onClick={() => handleFloorSelect(floor.id)}
              type="button"
            >
              {floor.shortLabel}
              {/* Only where the product gave a count above zero — absent is
                unknown, which is not the same as none. */}
              {count !== undefined ? <ResultMarker count={count} /> : null}
            </Button>
          );
        })}
      </div>
    );
  },
);
FloorSelector.displayName = "FloorSelector";

export { FloorSelector };
