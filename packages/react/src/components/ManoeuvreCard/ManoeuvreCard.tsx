import React from "react";
import type { Instruction } from "@kozmos-ds/product-contracts";
import { InstructionText, instructionText } from "../../utils/instruction";
import { cn } from "../../utils";
import { surfaceClass, type SurfaceVariant } from "../Surface";
import {
  DirectionIcon,
  type DirectionType,
} from "../DirectionStep/DirectionStep";

export interface ManoeuvreCardProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "children"
> {
  /**
   * Theme-filled by default. Background restores the neutral solid/glass
   * presentation, and is what a caller that sets `surface` gets unless it
   * also sets an appearance.
   */
  appearance?: "theme" | "background";
  /** Material for background appearance: solid by default. Setting it asks for background. */
  surface?: SurfaceVariant;
  type: DirectionType;
  /** Legacy text or ordered inline parts; caller owns spacing, word order and language. */
  instruction: Instruction;
  detail?: string;
  /**
   * The most lines the instruction is drawn in before it ends in an
   * ellipsis. Unset, the whole instruction shows and the card grows with
   * it: a cut instruction can lose the turn itself (GAP-094). A value
   * under one line shows the whole instruction. Assistive technology hears
   * the whole instruction either way.
   */
  instructionLines?: number;
  /** Open into the itinerary instead of the manoeuvre. */
  expanded: boolean;
  onToggle: () => void;
  expandLabel?: string;
  collapseLabel?: string;
  /**
   * The card's accessible name in both states, including with custom
   * itinerary content. Use a name distinct from the itinerary's own label.
   */
  manoeuvreLabel?: string;
  /**
   * What the open card's scrolling itinerary is called when it takes focus:
   * the name the product gives the itinerary it holds (`Itinerary`'s
   * `label`).
   */
  itineraryLabel?: string;
  /** Past this height, in pixels, the itinerary scrolls. */
  maxItineraryHeight?: number;
  /** The itinerary the card opens into — `Itinerary`, in the products. */
  children?: React.ReactNode;
}

/** What assistive technology hears for the closed card: the instruction, then the detail. */
export function manoeuvreDescription(
  instruction: Instruction,
  detail?: string,
) {
  const text = instructionText(instruction);
  return detail ? `${text}, ${detail}` : text;
}

/** The whole lines a product's `instructionLines` asks for, or none. */
function instructionLineLimit(lines: number | undefined) {
  return lines !== undefined && Number.isFinite(lines) && lines >= 1
    ? Math.floor(lines)
    : undefined;
}

/** The parts of the card that can hold focus. */
type FocusedPart = "instruction" | "itinerary" | "bar";

const useLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/**
 * The current manoeuvre, floating over the map during navigation: its arrow,
 * the instruction, how far and how long, and a grab bar that opens the full
 * itinerary in its place. The card owns the toggle and what assistive
 * technology hears of it; the itinerary it opens into is the caller's, so
 * the card never decides what a route is made of. Open, the card is as tall
 * as the itinerary up to `maxItineraryHeight`, past which the itinerary
 * scrolls: a long route must not cover the map.
 *
 * Focus goes with the disclosure (review T4). Opening takes away the
 * instruction, and closing hides the grab bar; focus that was on the part
 * that went moves to the part that took its place — the itinerary on
 * opening, the instruction on closing. Focus anywhere else, or none, is
 * left where it is, whether the change came from the card, a pointer or
 * the product.
 */
const ManoeuvreCard = React.forwardRef<HTMLElement, ManoeuvreCardProps>(
  (
    {
      className,
      type,
      instruction,
      detail,
      instructionLines,
      expanded,
      onToggle,
      expandLabel = "Show itinerary",
      collapseLabel = "Hide itinerary",
      manoeuvreLabel = "Current manoeuvre",
      itineraryLabel = "Itinerary",
      surface: surfaceProp,
      appearance: appearanceProp,
      maxItineraryHeight = 320,
      children,
      ...props
    },
    ref,
  ) => {
    // A caller that sets a surface asked for it: theme fill is the default
    // only where nothing was asked for (Olcay, 2026-10-04).
    const appearance =
      appearanceProp ?? (surfaceProp !== undefined ? "background" : "theme");
    const surface = surfaceProp ?? "solid";
    const instructionRef = React.useRef<HTMLButtonElement>(null);
    const itineraryRef = React.useRef<HTMLDivElement>(null);
    const barRef = React.useRef<HTMLButtonElement>(null);

    // Which part had focus as `expanded` changed, read while the card
    // renders the change: once it commits, the part holding focus may
    // already be gone, and focus with it, to the page. The same reading
    // AICompanionPanel makes of its opener.
    const focusedPart = (): FocusedPart | null => {
      // The card's own document: the bar is always drawn, so once the card
      // has mounted it says which.
      const active = barRef.current?.ownerDocument.activeElement;
      if (!active) return null;
      if (instructionRef.current?.contains(active)) return "instruction";
      if (itineraryRef.current?.contains(active)) return "itinerary";
      if (barRef.current?.contains(active)) return "bar";
      return null;
    };
    const [change, setChange] = React.useState<{
      expanded: boolean;
      focused: FocusedPart | null;
    }>(() => ({ expanded, focused: null }));
    if (change.expanded !== expanded)
      setChange({ expanded, focused: focusedPart() });

    useLayoutEffect(() => {
      const from = change.focused;
      if (!from) return;
      const doc = barRef.current?.ownerDocument;
      if (!doc) return;
      const active = doc.activeElement;
      // Focus the change took away: dropped to the page with the part that
      // held it, or left on the grab bar it hid. Focus the product has put
      // somewhere since then stays there.
      const lost = !active || active === doc.body || !active.isConnected;
      if (expanded) {
        if (from === "instruction" && lost)
          itineraryRef.current?.focus({ preventScroll: true });
      } else if (
        (from === "itinerary" || from === "bar") &&
        (lost || active === barRef.current)
      ) {
        instructionRef.current?.focus({ preventScroll: true });
      }
      // `change` is set in the same render as `expanded` changes.
    }, [change]);

    const lines = instructionLineLimit(instructionLines);

    return (
      <section
        ref={ref}
        aria-label={manoeuvreLabel}
        className={cn(
          `kozmos-manoeuvre-card ${appearance === "background" ? surfaceClass(surface) : "kozmos-reset"} kozmos-guidance-text flex w-full flex-col gap-3 rounded-container px-4 pb-1 pt-4 shadow-floating`,
          className,
        )}
        {...props}
        data-appearance={appearance}
      >
        {expanded ? (
          // The itinerary scrolls here past the cap, so the keyboard must be
          // able to reach it (GAP-100, axe's scrollable-region-focusable): a
          // stop of its own, named after the itinerary it holds. A group,
          // not another landmark: the card already supplies one, and a
          // nested Itinerary may supply its own distinct landmark.
          <div
            ref={itineraryRef}
            role="group"
            aria-label={itineraryLabel}
            tabIndex={0}
            className="kozmos-manoeuvre-itinerary overflow-y-auto"
            style={{ maxHeight: maxItineraryHeight }}
          >
            {children}
          </div>
        ) : (
          // The instruction row is the button: a click anywhere on it opens
          // the itinerary, and assistive technology hears the manoeuvre.
          <button
            ref={instructionRef}
            type="button"
            className="flex w-full items-start gap-3 bg-transparent p-0 text-start text-inherit"
            onClick={onToggle}
            aria-expanded={false}
            // A flattened label would discard the inline foreign-language spans.
            // Keep the legacy string name unchanged; rich names come from content.
            aria-label={
              typeof instruction === "string"
                ? manoeuvreDescription(instruction, detail)
                : undefined
            }
          >
            <span className="kozmos-guidance-accent flex h-8 w-8 shrink-0 items-center justify-center">
              <DirectionIcon type={type} className="h-6 w-6" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              {/* Whole unless the product asks for a limit (GAP-094):
                  owned CSS draws the limit, `data-lines`. */}
              <span
                className="kozmos-manoeuvre-instruction kozmos-guidance-text text-xl font-semibold leading-tight"
                data-lines={lines}
                style={
                  lines === undefined
                    ? undefined
                    : ({
                        "--kozmos-manoeuvre-instruction-lines": lines,
                      } as React.CSSProperties)
                }
              >
                <InstructionText instruction={instruction} />
              </span>
              {/* Muted, and on glass the foreground colour (decision 48). */}
              {detail ? (
                <span className="kozmos-muted-text text-sm">{detail}</span>
              ) : null}
            </span>
          </button>
        )}
        {/* The grab bar: the sign that the card opens, and the way to close
            it. Closed, the instruction row already offers the way in, so the
            bar is silent then — and a pointer pressing it leaves focus where
            it was, so focus never rests on something assistive technology
            cannot hear. */}
        <button
          ref={barRef}
          type="button"
          className="kozmos-manoeuvre-disclosure flex min-h-11 w-full items-center justify-center bg-transparent py-1"
          onClick={onToggle}
          onMouseDown={expanded ? undefined : (event) => event.preventDefault()}
          aria-label={expanded ? collapseLabel : expandLabel}
          aria-expanded={expanded}
          aria-hidden={expanded ? undefined : true}
          tabIndex={expanded ? 0 : -1}
        >
          <span className="kozmos-manoeuvre-grip h-[5px] w-9 rounded-pill" />
        </button>
      </section>
    );
  },
);
ManoeuvreCard.displayName = "ManoeuvreCard";

export { ManoeuvreCard };
