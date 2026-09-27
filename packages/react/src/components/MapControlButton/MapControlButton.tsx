import React from "react";
import { cn } from "../../utils";
import { Button, type ButtonProps } from "../Button";
import { useRevealOnChange } from "../../hooks/useRevealOnChange";

export interface MapControlButtonProps extends Omit<
  ButtonProps,
  "aria-label" | "children"
> {
  /** Decorative icon representing the map action. */
  icon: React.ReactNode;
  /** Localized action name used as the accessible name. */
  label: string;
  /** Optional localized state appended to the accessible name. */
  stateLabel?: string;
  presentation?: "icon-only" | "labelled";
  /**
   * How an active control reads.
   *
   * `tinted` keeps the map surface and colours the icon and the edge, which is
   * what the SDK draws — a control over a map has to stay legible against the
   * tiles behind it, and a solid fill hides the very thing it sits on.
   * `filled` inverts the surface to the Button's primary tier, for callers
   * that want the heavier emphasis. It is what iOS and Android drew for a
   * pressed control before 2026-09-15; in React it was specified but never
   * rendered until 2026-09-17, because the map surface's classes beat the
   * tier's.
   */
  emphasis?: "tinted" | "filled";
  /**
   * `inline` runs the label and its state along one line. `stacked` sets the
   * state under the label, which is how a map pill fits a two-word state into
   * a control that has to stay thumb-sized.
   */
  labelPlacement?: "inline" | "stacked";
  /**
   * Let the control resolve its own presentation: icon-only at rest, widening
   * to `labelled` for a moment whenever `pressed` or `stateLabel` changes, then
   * collapsing so it stops covering the map.
   *
   * This is the behaviour the SDK's map toggles have, and it is a prop rather
   * than only a documented recipe so that a developer reading the props — or
   * the Storybook controls — finds it without being told. `useRevealOnChange`
   * is the same timing as a hook, for anything that is not this component.
   *
   * While this is set, `presentation` is ignored: the control decides.
   */
  revealOnChange?: boolean;
  /** With `revealOnChange`, how long the label stays. Default 2500ms. */
  revealDuration?: number;
  /**
   * With `revealOnChange`, how long to wait before revealing. Default 0.
   * A change that takes time to settle — a route being recalculated — reveals
   * its new state when the work is done rather than while it is still wrong.
   */
  revealDelay?: number;
  pressed?: boolean;
}

const MapControlButton = React.forwardRef<
  HTMLButtonElement,
  MapControlButtonProps
>(
  (
    {
      className,
      icon,
      label,
      stateLabel,
      presentation = "icon-only",
      emphasis = "tinted",
      labelPlacement = "inline",
      revealOnChange = false,
      revealDuration,
      revealDelay,
      pressed,
      type = "button",
      variant,
      ...props
    },
    ref,
  ) => {
    const accessibleLabel = stateLabel ? `${label}, ${stateLabel}` : label;
    // Either half of the state can be what changed: a toggle flips `pressed`,
    // while a control that cycles through modes only changes its stateLabel.
    // `pressed` is read as a boolean, so a caller going from unset to `false`
    // while its state loads does not announce a change nobody made.
    const revealed = useRevealOnChange(
      `${Boolean(pressed)}\u0000${stateLabel ?? ""}`,
      {
        duration: revealDuration,
        delay: revealDelay,
        enabled: revealOnChange,
      },
    );
    const resolvedPresentation = revealOnChange
      ? revealed
        ? "labelled"
        : "icon-only"
      : presentation;
    const isLabelled = resolvedPresentation === "labelled";
    // A filled control inverts its surface, so it needs the Button's primary
    // tier. A tinted one keeps the map chrome and recolours only its icon and
    // ring, so it stays on the ghost tier in both states.
    const isFilled = emphasis === "filled" && pressed;
    const resolvedVariant = variant ?? (isFilled ? "default" : "ghost");

    return (
      <Button
        ref={ref}
        aria-label={accessibleLabel}
        aria-pressed={pressed}
        className={cn(
          "min-h-11 min-w-11 justify-center rounded-control shadow-floating ring-1 ring-border backdrop-blur-xl",
          // The map's own surface and ink — but not on a filled control, whose
          // fill, ink and hover come from the Button's primary tier. They used
          // to be unconditional, and tailwind-merge let them beat the tier's
          // classes, so `filled` never rendered a fill: it was white with black
          // text. `bg-background/90` was here before that and painted nothing,
          // because `background` is a plain `var(...)` that an opacity modifier
          // cannot be applied to; the library's other inert opacity classes
          // are recorded in the gap list, not fixed here.
          !isFilled && "bg-background text-foreground hover:bg-muted",
          // The label reveals and collapses rather than snapping, because the
          // control announces a state change and then gets out of the way.
          "gap-0 transition-[max-width,padding] duration-300 ease-in-out motion-reduce:transition-none",
          isLabelled ? "max-w-64 px-3.5" : "px-0",
          pressed && "shadow-raised",
          pressed && !isFilled && "ring-primary",
          className,
        )}
        data-presentation={resolvedPresentation}
        type={type}
        variant={resolvedVariant}
        {...props}
      >
        <span
          aria-hidden="true"
          className={cn(
            "flex shrink-0 items-center",
            pressed && !isFilled && "text-primary",
          )}
        >
          {icon}
        </span>
        {/*
          Always mounted, and clipped when icon-only, so max-width has something
          to animate between. The button's aria-label is the accessible name in
          both presentations, so clipped text is never what a screen reader
          reads.
        */}
        <span
          className={cn(
            // Logical, not physical: `ml-2` and `text-left` put the gap on the
            // far side of the words right to left, where the mark sits on the
            // right, and the two touched.
            "flex min-w-0 overflow-hidden text-start transition-[max-width,opacity,margin] duration-300 ease-in-out motion-reduce:transition-none",
            labelPlacement === "stacked"
              ? "flex-col items-start leading-tight"
              : "flex-row items-center gap-2",
            isLabelled ? "ms-2 max-w-56 opacity-100" : "max-w-0 opacity-0",
          )}
        >
          {labelPlacement === "stacked" ? (
            <>
              {/*
                The SDK sets these at 11px over 13px/600. The type scale has no
                role at either size yet — §5.11 rounds 11.008 and 13.008 and
                adds 12 and 15 — so this reaches for the nearest roles and the
                deviation is recorded in the gap list rather than hard-coded
                here.
              */}
              <span
                className={cn(
                  "truncate text-xs",
                  // Muted only on the map's surface: on a filled one a muted
                  // grey sits at about 1.9:1 against the theme, so the caption
                  // inherits the on-fill colour as the state line does.
                  !isFilled && "text-muted-foreground",
                )}
              >
                {label}
              </span>
              {stateLabel && (
                <span className="truncate text-sm font-semibold">
                  {stateLabel}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="min-w-0 truncate">{label}</span>
              {stateLabel && (
                <span className="shrink-0 font-semibold">{stateLabel}</span>
              )}
            </>
          )}
        </span>
      </Button>
    );
  },
);

MapControlButton.displayName = "MapControlButton";

export { MapControlButton };
