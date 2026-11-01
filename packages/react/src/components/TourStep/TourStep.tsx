import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { X } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import { OverlayContainerContext } from "../../theme/overlay-container";
import {
  Backdrop,
  type BackdropRect,
  type BackdropTargetItem,
} from "../Backdrop/Backdrop";
import { Button } from "../Button/Button";
import { IconButton } from "../IconButton/IconButton";
import { Popover, PopoverAnchor, PopoverContent } from "../Popover/Popover";
import { Stepper } from "../Stepper/Stepper";

/**
 * What a step points at (GAP-188): an element, a ref to one, a virtual
 * element (anything with `getBoundingClientRect()`, such as a point on a
 * map), a rect in the viewport's coordinates, or nothing. Backdrop's target,
 * one thing at a time.
 */
export type TourStepTarget = BackdropTargetItem;

/** Which side of its target the card prefers; it flips where there is no room. */
export type TourStepSide = "top" | "right" | "bottom" | "left";

/** Where along that side it sits. */
export type TourStepAlign = "start" | "center" | "end";

/** A press outside the card, or focus moving outside it. */
export type TourStepOutsideEvent = Parameters<
  NonNullable<
    React.ComponentPropsWithoutRef<
      typeof PopoverPrimitive.Content
    >["onInteractOutside"]
  >
>[0];

export interface TourStepProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title" | "children"
> {
  /**
   * Whether the step is shown. Defaults to true: render it to show it, or
   * keep it and pass false to let it leave as a popover does.
   */
  open?: boolean;
  /**
   * What the step points at: the card sits beside it and Backdrop's cut-out
   * lights it, while the rest of the page is dimmed. With none, or one that
   * is not on the page (a ref to nothing, an element with no box), the whole
   * page is dimmed and the card places itself in the middle of the window.
   */
  target?: TourStepTarget;
  /** The tour's name, read before its position: "Edit a POI". */
  tourLabel?: React.ReactNode;
  /** This step, from 1. Past `stepCount`, every dot is done. */
  step?: number;
  /**
   * How many steps the tour has. With it, the position ("Step 2 of 5") and
   * the dots are drawn; without it, neither is, and the card is a single
   * hint: a coachmark (GAP-157).
   */
  stepCount?: number;
  /** The step's title: the dialog's name. */
  title: React.ReactNode;
  /** The step's body, any content: text, Tags, a Table. */
  children?: React.ReactNode;
  /** A tip under the body, on the themed surface. */
  hint?: React.ReactNode;
  /**
   * What completes the step, as the tour is waiting for it: "Go ahead and
   * open a building to proceed to the next step." A polite live region, so a
   * change while the step is open is read out, with a pulsing marker that
   * stops when motion is reduced.
   */
  instruction?: React.ReactNode;
  /** Back. With none, there is no Back button. */
  onBack?: () => void;
  /** Next, or Finish on the last step. With none, there is no Next button. */
  onNext?: () => void;
  /** Close and Escape. A press outside the card never closes it. */
  onClose: () => void;
  /** Defaults to "Back". */
  backLabel?: string;
  /** Defaults to "Next"; "Finish" on the last step is the product's to pass. */
  nextLabel?: string;
  /** The close button's name. Defaults to "Close". */
  closeLabel?: string;
  /**
   * The position, drawn after the tour's name and read with the step: a
   * template with `{step}` and `{count}`, or a function of them. Defaults to
   * "Step {step} of {count}"; "Done" for a closing step.
   */
  positionLabel?: string | ((step: number, count: number) => string);
  /** The side of the target the card prefers. Defaults to "bottom". */
  side?: TourStepSide;
  /** Where along that side. Defaults to "center". */
  align?: TourStepAlign;
  /**
   * Called on a press outside the card, on the dim or on the lit target, and
   * when focus moves outside it. The step stays open: the dim and the target
   * are part of the tour. To close on one, call `onClose` from here.
   */
  onInteractOutside?: (event: TourStepOutsideEvent) => void;
}

// The card's distance from what it points at, past Backdrop's cut-out: the
// cut-out's padding (Backdrop's default, layout.spacing.100), the 2 of its
// focus ring, and 12 between the ring and the card (layout.spacing.150).
// scripts/check-tour-step.mjs measures the 12 against the drawn ring.
const CUTOUT_PADDING = 8;
const CUTOUT_RING = 2;
const RING_GAP = 12;
const TARGET_OFFSET = CUTOUT_PADDING + CUTOUT_RING + RING_GAP;
// From the window's edges, the card keeps layout.spacing.200.
const EDGE_PADDING = 16;

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

type Measurable = { getBoundingClientRect(): DOMRect };

const isElement = (value: unknown): value is Element =>
  !!value && (value as Node).nodeType === 1;

const measures = (value: unknown): value is Measurable =>
  typeof (value as Measurable | null)?.getBoundingClientRect === "function";

/** What a target names now: a ref is read as it stands. */
function read(
  target: TourStepTarget,
): Element | Measurable | BackdropRect | null {
  let item: unknown = target;
  if (item && typeof item === "object" && !isElement(item) && "current" in item)
    item = (item as React.RefObject<unknown>).current;
  if (isElement(item) || measures(item)) return item;
  if (item && Number.isFinite((item as BackdropRect).width))
    return item as BackdropRect;
  return null;
}

/** The elements that draw an element's box, as Backdrop reads them. */
function drawers(element: Element): Element[] {
  const view = element.ownerDocument.defaultView;
  return view?.getComputedStyle(element).display === "contents"
    ? Array.from(element.children).flatMap(drawers)
    : [element];
}

function rect(left: number, top: number, width: number, height: number) {
  return {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  } as DOMRect;
}

/**
 * Where the target is, as Backdrop lights it: an element's box (or, for one
 * with `display: contents`, the box round its children), a virtual element's
 * rect, or a rect. Null when it is not on the page.
 */
function boxOf(source: Element | Measurable | BackdropRect | null) {
  if (!source) return null;
  if (isElement(source)) {
    const boxes = drawers(source)
      .map((element) => element.getBoundingClientRect())
      .filter((box) => box.width > 0 || box.height > 0);
    if (boxes.length === 0) return null;
    const left = Math.min(...boxes.map((box) => box.left));
    const top = Math.min(...boxes.map((box) => box.top));
    const right = Math.max(...boxes.map((box) => box.right));
    const bottom = Math.max(...boxes.map((box) => box.bottom));
    return rect(left, top, right - left, bottom - top);
  }
  const box = measures(source) ? source.getBoundingClientRect() : source;
  return rect(box.left, box.top, box.width, box.height);
}

const hasContent = (node: React.ReactNode) =>
  node !== undefined && node !== null && node !== false && node !== "";

function formatPosition(
  label: TourStepProps["positionLabel"],
  step: number,
  count: number,
) {
  if (typeof label === "function") return label(step, count);
  return (label ?? "Step {step} of {count}")
    .replace(/\{step\}/g, String(step))
    .replace(/\{count\}/g, String(count));
}

/**
 * One step of a product tour (GAP-188): a card beside the control the step
 * points at, lit by Backdrop's cut-out, with the tour's name and position,
 * a title, any body, a hint, the live status of what completes the step,
 * the progress as Stepper's dots, Back, Next and Close.
 *
 * It is one step and it is controlled: the sequence, pausing and resuming
 * are the product's. Keep one TourStep and change its props as the tour
 * moves on: the cut-out glides to the next target, and the card is drawn
 * anew for each `step`, so a reader hears the new one. A non-modal dialog
 * named by its title and described by its tour, position, body, hint and
 * status, it takes focus when it opens, on Next (else on itself). Escape and
 * Close call `onClose`; a press on the dim or on the lit target does not.
 * Closed with focus lost, PopoverContent gives focus back (GAP-190): to
 * what had it as the step opened, the button that started the tour, or,
 * once that is gone or a step opened with focus on the last one's Next, to
 * the step's target; a virtual element or a rect has none.
 *
 * With no `stepCount`, no Back and no Next, it is a coachmark (GAP-157): a
 * single hint beside a control, closed by its button and by Escape.
 */
const TourStep = React.forwardRef<HTMLDivElement, TourStepProps>(
  (
    {
      open = true,
      target,
      tourLabel,
      step = 1,
      stepCount,
      title,
      children,
      hint,
      instruction,
      onBack,
      onNext,
      onClose,
      backLabel = "Back",
      nextLabel = "Next",
      closeLabel = "Close",
      positionLabel,
      side = "bottom",
      align = "center",
      onInteractOutside,
      className,
      ...props
    },
    forwardedRef,
  ) => {
    const ids = React.useId();
    const titleId = `${ids}-title`;
    const tourId = `${ids}-tour`;
    const positionId = `${ids}-position`;
    const bodyId = `${ids}-body`;
    const hintId = `${ids}-hint`;
    const statusId = `${ids}-status`;

    const card = React.useRef<HTMLDivElement | null>(null);
    const next = React.useRef<HTMLButtonElement | null>(null);
    const setCard = React.useCallback(
      (node: HTMLDivElement | null) => {
        card.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );

    // The anchor Radix places the card by. An element with a box of its own
    // is handed over as itself, so it is the anchor focus can go back to, as
    // is the one element a display: contents wrapper draws; a virtual
    // element, a rect, or an element drawn by several children, through one
    // measuring stand-in that reads the target as it is now; nothing, or a
    // target with no box, through a point in the middle of the window.
    const latest = React.useRef(target);
    latest.current = target;
    const [measured] = React.useState<Measurable>(() => ({
      getBoundingClientRect: () =>
        boxOf(read(latest.current)) ?? rect(0, 0, 0, 0),
    }));
    const [middle] = React.useState<Measurable>(() => ({
      getBoundingClientRect: () => {
        const view = card.current?.ownerDocument.defaultView ?? window;
        const root = view.document.documentElement;
        return rect(
          (root.clientWidth || view.innerWidth) / 2,
          (root.clientHeight || view.innerHeight) / 2,
          0,
          0,
        );
      },
    }));
    const resolve = React.useCallback((): Measurable => {
      if (typeof window === "undefined") return middle;
      const source = read(latest.current);
      if (!boxOf(source)) return middle;
      if (isElement(source)) {
        // One element draws it (itself, or the one child of a wrapper with
        // display: contents, as a Vue component's is): that element.
        const drawn = drawers(source);
        if (drawn.length === 1) return drawn[0] as unknown as Measurable;
      }
      return measured;
    }, [measured, middle]);
    const [anchor, setAnchor] = React.useState<Measurable>(middle);
    const anchorRef = React.useRef<Measurable>(anchor);
    anchorRef.current = anchor;
    // After every render, and every frame while the step is open: a ref
    // filled later, or a target that leaves the page, moves the card.
    useIsomorphicLayoutEffect(() => {
      const found = resolve();
      if (found !== anchor) setAnchor(found);
    });
    React.useEffect(() => {
      if (!open) return;
      let frame = 0;
      const loop = () => {
        const found = resolve();
        setAnchor((current) => (current === found ? current : found));
        frame = window.requestAnimationFrame(loop);
      };
      frame = window.requestAnimationFrame(loop);
      return () => window.cancelAnimationFrame(frame);
    }, [open, resolve]);
    const placed = anchor === middle;
    // Inside a modal (Dialog, Drawer, BottomSheet) whose content is still
    // mounting, the card waits for it: opened after the modal's own layer,
    // focus trap and hiding of the rest, it is above them, takes focus from
    // the trap and is not hidden, as a popover opened in a modal is.
    const modal = React.useContext(OverlayContainerContext);

    const count =
      typeof stepCount === "number" && Number.isFinite(stepCount)
        ? Math.max(0, Math.floor(stepCount))
        : 0;
    const at = Number.isFinite(step) ? Math.floor(step) : 1;
    const shown = Math.min(Math.max(at, 1), count);
    const position =
      count > 0 ? formatPosition(positionLabel, shown, count) : null;
    const dots = React.useMemo(
      () =>
        Array.from({ length: count }, (_, index) =>
          formatPosition(positionLabel, index + 1, count),
        ),
      [count, positionLabel],
    );

    const hasTour = hasContent(tourLabel);
    const hasBody = hasContent(children);
    const hasHint = hasContent(hint);
    const hasInstruction = hasContent(instruction);
    const describedBy = [
      hasTour && tourId,
      position && positionId,
      hasBody && bodyId,
      hasHint && hintId,
      statusId,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <Popover
        open={open}
        onOpenChange={(isOpen) => {
          // Escape: a press outside never asks (onInteractOutside below).
          if (!isOpen) onClose();
        }}
      >
        <PopoverAnchor virtualRef={anchorRef} />
        {/* Drawn in the theme's portal by Backdrop itself, beside the card,
            one layer under it. */}
        <Backdrop
          className="kozmos-tour-step-backdrop"
          visible={open}
          target={target ?? null}
        />
        {modal === null ? null : (
          <PopoverContent
            // Each step is a dialog of its own, so moving on is heard as a
            // dialog opening, its title, position and status read again.
            key={at}
            ref={setCard}
            aria-labelledby={titleId}
            aria-describedby={describedBy}
            data-placement={placed ? "centre" : "target"}
            side={placed ? "bottom" : side}
            align={placed ? "center" : align}
            sideOffset={placed ? 0 : TARGET_OFFSET}
            avoidCollisions={!placed}
            collisionPadding={EDGE_PADDING}
            // The target is read every frame, as Backdrop reads it, so the card
            // and the cut-out move together, whatever moves the target.
            updatePositionStrategy="always"
            className={cn("kozmos-tour-step", className)}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              (next.current ?? card.current)?.focus({ preventScroll: true });
            }}
            onInteractOutside={(event) => {
              onInteractOutside?.(event);
              event.preventDefault();
            }}
            {...props}
          >
            <div className="kozmos-tour-step-header">
              <div className="kozmos-tour-step-heading">
                {hasTour || position ? (
                  <p className="kozmos-tour-step-eyebrow">
                    {hasTour ? <span id={tourId}>{tourLabel}</span> : null}
                    {hasTour && position ? (
                      <>
                        {" "}
                        <span aria-hidden="true">·</span>{" "}
                      </>
                    ) : null}
                    {position ? <span id={positionId}>{position}</span> : null}
                  </p>
                ) : null}
                <h2 id={titleId} className="kozmos-tour-step-title">
                  {title}
                </h2>
              </div>
              <IconButton
                type="button"
                variant="outline"
                className="kozmos-tour-step-close"
                aria-label={closeLabel}
                onClick={onClose}
              >
                <X aria-hidden="true" />
              </IconButton>
            </div>
            {hasBody ? (
              <div id={bodyId} className="kozmos-tour-step-body">
                {children}
              </div>
            ) : null}
            {hasHint ? (
              <div id={hintId} className="kozmos-tour-step-hint">
                {hint}
              </div>
            ) : null}
            {/* Mounted with each step, empty or not, so a status that arrives
              or changes while the step is open is read out; the one it opens
              with is read in the dialog's description. aria-live is written
              out, not left to the role: a modal opening beside the tour
              (Radix's Select, Dialog, Menu) hides all but [aria-live] boxes. */}
            <div
              id={statusId}
              role="status"
              aria-live="polite"
              className="kozmos-tour-step-status"
            >
              {hasInstruction ? (
                <div className="kozmos-tour-step-instruction">
                  <span
                    className="kozmos-tour-step-marker"
                    aria-hidden="true"
                  />
                  <span className="kozmos-tour-step-instruction-text">
                    {instruction}
                  </span>
                </div>
              ) : null}
            </div>
            {count > 0 || onBack || onNext ? (
              <div className="kozmos-tour-step-footer">
                {count > 0 ? (
                  // The position is the eyebrow's words, so the dots are for
                  // the eye only.
                  <Stepper
                    variant="dots"
                    steps={dots}
                    currentStep={at - 1}
                    positionLabel={positionLabel}
                    aria-hidden="true"
                    className="kozmos-tour-step-dots"
                  />
                ) : null}
                {onBack || onNext ? (
                  <div className="kozmos-tour-step-actions">
                    {onBack ? (
                      <Button type="button" variant="ghost" onClick={onBack}>
                        {backLabel}
                      </Button>
                    ) : null}
                    {onNext ? (
                      <Button ref={next} type="button" onClick={onNext}>
                        {nextLabel}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </PopoverContent>
        )}
      </Popover>
    );
  },
);
TourStep.displayName = "TourStep";

export { TourStep };
