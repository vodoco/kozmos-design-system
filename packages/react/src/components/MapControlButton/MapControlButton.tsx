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
  /**
   * Said after the state and never drawn: what the words on the control
   * leave out. The location control's heading mode shows "On", as following
   * does — the SDK's "Focus / On" — and its mark tells the two apart on
   * screen; a screen reader hears "Focus, On, map turns with you". It comes
   * after the words, so the name still begins with what a voice-control user
   * sees (WCAG 2.5.3). It is not a change to reveal: the words did not change.
   */
  stateDescription?: string;
  /**
   * Draw the name beside the state. Default true. Off, a labelled control
   * draws its state alone — the SDK's "No Location" has no "Focus" over it —
   * and the name still starts the accessible name. With no state to draw,
   * the name is drawn anyway.
   */
  showLabel?: boolean;
  presentation?: "icon-only" | "labelled";
  /**
   * How an active control reads.
   *
   * `tinted` keeps the map surface and lets the mark and the words carry the
   * state, which is what the SDK draws — a control over a map has to stay
   * legible against the tiles behind it, and a solid fill hides the very
   * thing it sits on. Off, the mark and the words are grey; on, the mark is
   * the theme's blue and the words navy. No edge, in either (decision 40).
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
  /**
   * A toggle's state. Leave it unset for a control that is not a toggle —
   * zoom, compass, the floor tile — which keeps the ink; `false` is a toggle
   * that is off, drawn grey, and `true` one that is on.
   */
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
      stateDescription,
      showLabel = true,
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
    const accessibleLabel = [label, stateLabel, stateDescription]
      .filter(Boolean)
      .join(", ");
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
    // A filled control inverts its surface, so it needs the Button's primary
    // tier. A tinted one keeps the map chrome and lets its mark and words
    // carry the state, so it stays on the ghost tier in both states.
    const isFilled = emphasis === "filled" && pressed;
    const resolvedVariant = variant ?? (isFilled ? "default" : "ghost");
    const drawsLabel = showLabel || !stateLabel;

    return (
      <Button
        ref={ref}
        aria-label={accessibleLabel}
        aria-pressed={pressed}
        // The surface, its size and padding, the collapse and the tones are
        // the owned map-control rules (styles/owned-map-controls.css), keyed
        // to `data-presentation` and `aria-pressed`: the SDK's Tracking
        // Indicator (decision 40). No utility here restates them, because a
        // scoped utility outweighs an owned rule — the ring that drew a map
        // control's edge also drew its focus ring in the edge's grey. A
        // caller's className still wins, as over every owned rule.
        className={cn("kozmos-map-control", className)}
        data-presentation={resolvedPresentation}
        type={type}
        variant={resolvedVariant}
        {...props}
      >
        <span
          aria-hidden="true"
          className="kozmos-reset kozmos-map-control-mark"
        >
          {icon}
        </span>
        {/*
          Always mounted, and clipped when icon-only, so max-width has something
          to animate between. The button's aria-label is the accessible name in
          both presentations, so clipped text is never what a screen reader
          reads. Two equal lines when stacked, the SDK's "Focus⏎Off": bold 16
          on a 16 line, in the control's tone.
        */}
        <span
          className={cn(
            "kozmos-reset kozmos-map-control-words",
            labelPlacement === "stacked"
              ? "kozmos-map-control-words-stacked"
              : "kozmos-map-control-words-inline",
          )}
        >
          {drawsLabel && (
            <span className="kozmos-reset kozmos-map-control-line">
              {label}
            </span>
          )}
          {stateLabel && (
            <span className="kozmos-reset kozmos-map-control-line">
              {stateLabel}
            </span>
          )}
        </span>
      </Button>
    );
  },
);

MapControlButton.displayName = "MapControlButton";

export { MapControlButton };
