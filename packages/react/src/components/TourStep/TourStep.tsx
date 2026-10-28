import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Cursor02, X } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import { OverlayContainerContext } from "../../theme/overlay-container";
import {
  Backdrop,
  type BackdropRect,
  type BackdropTargetItem,
} from "../Backdrop/Backdrop";
import { Button } from "../Button/Button";
import { Heading } from "../Heading/Heading";
import { IconButton } from "../IconButton/IconButton";
import { Notice } from "../Notice/Notice";
import {
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverContent,
} from "../Popover/Popover";
import { Progress } from "../Progress/Progress";
import { Text } from "../Text/Text";

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

/** The instruction's tone: what to do (info), or that something is wrong (warning). */
export type TourStepInstructionTone = "info" | "warning";

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
   * What the step points at: the card sits beside it, its arrow pointing at
   * it, and Backdrop's cut-out lights it, while the rest of the page is
   * dimmed. With none, or one that is not on the page (a ref to nothing, an
   * element with no box), the whole page is dimmed and the card, with no
   * arrow, places itself in the middle of the window.
   */
  target?: TourStepTarget;
  /**
   * The tour's name, the eyebrow's words before the position: "Edit a POI".
   * A closing step with no `stepCount` may carry its own state: "Edit a POI ·
   * completed".
   */
  tourLabel?: React.ReactNode;
  /** This step, from 1. Past `stepCount`, it reads as the last. */
  step?: number;
  /**
   * How many steps the tour has. With it, the position ("2 of 5") and the
   * progress bar are drawn; without it, neither is, and the card is a single
   * hint (a coachmark, GAP-157), a welcome or a closing card.
   */
  stepCount?: number;
  /** The step's title: the dialog's name, a level 2 heading. */
  title: React.ReactNode;
  /** The step's words under the title, in the muted ink. */
  body?: React.ReactNode;
  /**
   * What to do now, as the tour is waiting for it: "Open Settings, then User
   * Management, or select Next to go there." A Notice in `instructionTone`,
   * in a polite live region mounted with each step, so a change while the
   * step is open is read out.
   */
  instruction?: React.ReactNode;
  /**
   * The instruction's tone. Defaults to "info", with a pointer; "warning",
   * with the warning's own mark, says the step cannot go on as it should
   * ("This step can't be shown on this version of the Dashboard").
   */
  instructionTone?: TourStepInstructionTone;
  /** Any content after the instruction: Tags, a Table, a link. */
  children?: React.ReactNode;
  /** Back. With none, there is no Back button. */
  onBack?: () => void;
  /** Next, or Done on the last step. With none, there is no Next button. */
  onNext?: () => void;
  /**
   * Next drawn disabled, not hidden (MAP-64 D11): on a step its own action
   * completes ("Add the user"), or one waiting for a valid value, so the
   * footer keeps one shape on every step. Focus then opens on the card.
   */
  nextDisabled?: boolean;
  /**
   * A second way on, an outline button between Back and Next: "Not now",
   * "Close tour", "Finish without adding". With none, there is none.
   */
  onSecondary?: () => void;
  /**
   * A link at the footer's start: "Don't show again" (MAP-64 D20). With it,
   * the card is wider, so its three actions sit on one line.
   */
  onDismiss?: () => void;
  /**
   * Close and Escape. With none, there is no Close button and Escape does
   * nothing (a welcome card, closed by its own actions). A press outside the
   * card never closes it.
   */
  onClose?: () => void;
  /** Defaults to "Back". */
  backLabel?: string;
  /** Defaults to "Next"; "Done" on the last step is the product's to pass. */
  nextLabel?: string;
  /** The secondary button's words. Defaults to "Not now". */
  secondaryLabel?: string;
  /** The dismiss link's words. Defaults to "Don't show again". */
  dismissLabel?: string;
  /** The close button's name. Defaults to "Close". */
  closeLabel?: string;
  /** The progress bar's name. Defaults to "Tour progress". */
  progressLabel?: string;
  /**
   * The position, drawn after the tour's name, read with the step, and drawn
   * beside the progress bar, whose value it says: a template with `{step}`
   * and `{count}`, or a function of them. Defaults to "{step} of {count}".
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

// The arrow's tip from what it points at, past Backdrop's cut-out: the
// cut-out's padding (Backdrop's default, layout.spacing.100), the 2 of its
// focus ring, and 3 between the ring and the tip, as the MAP-64 boards
// draw the arrow beside their ring (09, 22 and 43, measured). PopoverArrow
// overlaps the card by 1, over its border (site GAP-74), so Radix, which
// sets the card the arrow's 12 past its offset, sets it 14 past the ring.
// scripts/check-tour-step.mjs measures the 3 against the drawn ring.
const CUTOUT_PADDING = 8;
const CUTOUT_RING = 2;
const ARROW_GAP = 3;
const ARROW_OVERLAP = 1;
const TARGET_OFFSET = CUTOUT_PADDING + CUTOUT_RING + ARROW_GAP - ARROW_OVERLAP;
// The arrow: 24 across and 12 deep, as the boards draw it.
const ARROW_WIDTH = 24;
const ARROW_HEIGHT = 12;
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
  return (label ?? "{step} of {count}")
    .replace(/\{step\}/g, String(step))
    .replace(/\{count\}/g, String(count));
}

/**
 * One step of a product tour (GAP-188), as the MAP-64 design draws it: a card
 * beside the control the step points at, its arrow pointing at it, lit by
 * Backdrop's cut-out. The tour's name and position, Close, a title, a body,
 * what to do now as a Notice in a live region, any content, the progress as
 * a bar, and the footer: a dismiss link at the start, then Back, a secondary
 * action and Next.
 *
 * It is one step and it is controlled: the sequence, pausing and resuming
 * are the product's. Keep one TourStep and change its props as the tour
 * moves on: the cut-out glides to the next target, and the card is drawn
 * anew for each `step`, so a reader hears the new one. A non-modal dialog
 * named by its title and described by its tour, position, body and
 * instruction, it takes focus when it opens, on Next (else on itself, as
 * when Next is disabled). Escape and Close call `onClose`; a press on the dim
 * or on the lit target does not. Closed with focus lost, PopoverContent gives
 * focus back (GAP-190): to what had it as the step opened, the button that
 * started the tour, or, once that is gone or a step opened with focus on the
 * last one's Next, to the step's target; a virtual element or a rect has
 * none.
 *
 * With no `stepCount` it draws no position and no progress: with no Back and
 * no Next it is a coachmark (GAP-157), a single hint beside a control.
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
      body,
      instruction,
      instructionTone = "info",
      children,
      onBack,
      onNext,
      nextDisabled = false,
      onSecondary,
      onDismiss,
      onClose,
      backLabel = "Back",
      nextLabel = "Next",
      secondaryLabel = "Not now",
      dismissLabel = "Don't show again",
      closeLabel = "Close",
      progressLabel = "Tour progress",
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

    const hasTour = hasContent(tourLabel);
    const hasBody = hasContent(body);
    const hasInstruction = hasContent(instruction);
    const hasContentAfter = hasContent(children);
    const hasEyebrow = hasTour || position !== null;
    const describedBy = [
      hasTour && tourId,
      position && positionId,
      hasBody && bodyId,
      statusId,
    ]
      .filter(Boolean)
      .join(" ");
    const hasActions = Boolean(onBack || onSecondary || onNext);

    return (
      <Popover
        open={open}
        onOpenChange={(isOpen) => {
          // Escape: a press outside never asks (onInteractOutside below).
          // With no onClose, Escape leaves the step as it is.
          if (!isOpen) onClose?.();
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
            // The dismiss link makes three actions: the card is wider, so
            // they sit on one line (owned-tour-step.css).
            data-width={onDismiss ? "wide" : undefined}
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
              // A disabled Next takes no focus: the card does.
              const button = next.current;
              (button && !button.disabled ? button : card.current)?.focus({
                preventScroll: true,
              });
            }}
            onInteractOutside={(event) => {
              onInteractOutside?.(event);
              event.preventDefault();
            }}
            {...props}
          >
            {placed ? null : (
              <PopoverArrow
                width={ARROW_WIDTH}
                height={ARROW_HEIGHT}
                className="kozmos-tour-step-arrow"
              />
            )}
            {/* The sections scroll inside the card, so the arrow, drawn
                outside the card's box, is never clipped by the scroll. */}
            <div className="kozmos-tour-step-sections">
              {hasEyebrow || onClose ? (
                <div className="kozmos-tour-step-header">
                  {hasEyebrow ? (
                    <Text
                      size="xs"
                      weight="semibold"
                      color="primary"
                      className="kozmos-tour-step-eyebrow"
                    >
                      {hasTour ? <span id={tourId}>{tourLabel}</span> : null}
                      {hasTour && position ? (
                        <>
                          {" "}
                          <span aria-hidden="true">·</span>{" "}
                        </>
                      ) : null}
                      {position ? (
                        <span id={positionId}>{position}</span>
                      ) : null}
                    </Text>
                  ) : null}
                  {onClose ? (
                    <IconButton
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="kozmos-tour-step-close"
                      aria-label={closeLabel}
                      onClick={onClose}
                    >
                      <X aria-hidden="true" size={16} />
                    </IconButton>
                  ) : null}
                </div>
              ) : null}
              <Heading
                level={4}
                as="h2"
                id={titleId}
                className="kozmos-tour-step-title"
              >
                {title}
              </Heading>
              {hasBody ? (
                <Text
                  as="div"
                  size="sm"
                  color="muted"
                  id={bodyId}
                  className="kozmos-tour-step-body"
                >
                  {body}
                </Text>
              ) : null}
              {/* Mounted with each step, empty or not, so an instruction that
                arrives or changes while the step is open is read out; the one
                it opens with is read in the dialog's description. aria-live is
                written out, not left to the role: a modal opening beside the
                tour (Radix's Select, Dialog, Menu) hides all but [aria-live]
                boxes (GAP-193). The Notice in it is no region of its own. */}
              <div
                id={statusId}
                role="status"
                aria-live="polite"
                className="kozmos-tour-step-status"
              >
                {hasInstruction ? (
                  <Notice
                    tone={instructionTone}
                    // What to do points; a warning keeps its own mark.
                    icon={
                      instructionTone === "warning" ? undefined : (
                        <Cursor02
                          aria-hidden="true"
                          size={16}
                          className="h-4 w-4"
                        />
                      )
                    }
                    iconAlign="center"
                    collapsible={false}
                    live="off"
                    summary={instruction}
                    data-tone={instructionTone}
                    className="kozmos-tour-step-instruction"
                  />
                ) : null}
              </div>
              {hasContentAfter ? (
                <div className="kozmos-tour-step-content">{children}</div>
              ) : null}
              {count > 0 ? (
                <div className="kozmos-tour-step-progress">
                  <Progress
                    value={shown}
                    max={count}
                    aria-label={progressLabel}
                    // Read as the position, "2 of 5", not as a percentage.
                    getValueLabel={() => position ?? ""}
                    className="kozmos-tour-step-progress-bar"
                  />
                  {/* The bar's own value and the eyebrow say it to a reader. */}
                  <Text
                    as="span"
                    size="xs"
                    color="muted"
                    aria-hidden="true"
                    className="kozmos-tour-step-progress-text"
                  >
                    {position}
                  </Text>
                </div>
              ) : null}
              {onDismiss || hasActions ? (
                <div className="kozmos-tour-step-footer">
                  {onDismiss ? (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="kozmos-tour-step-dismiss"
                      onClick={onDismiss}
                    >
                      {dismissLabel}
                    </Button>
                  ) : null}
                  {hasActions ? (
                    <div className="kozmos-tour-step-actions">
                      {onBack ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={onBack}
                        >
                          {backLabel}
                        </Button>
                      ) : null}
                      {onSecondary ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={onSecondary}
                        >
                          {secondaryLabel}
                        </Button>
                      ) : null}
                      {onNext ? (
                        <Button
                          ref={next}
                          type="button"
                          size="sm"
                          disabled={nextDisabled}
                          onClick={onNext}
                        >
                          {nextLabel}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </PopoverContent>
        )}
      </Popover>
    );
  },
);
TourStep.displayName = "TourStep";

export { TourStep };
