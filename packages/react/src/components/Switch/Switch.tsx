import React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn, mergeAriaIds } from "../../utils";
import { Label } from "../Label";
import { ControlText } from "../Label/ControlText";
import { useKozmosAnalytics } from "../../utils/analytics";
import { Minus } from "@kozmos-ds/icons";
import { useFieldRef } from "../FieldWrapper/mixedValue";

export interface SwitchProps extends React.ComponentPropsWithoutRef<
  typeof SwitchPrimitive.Root
> {
  label?: string;
  /**
   * A line under the label, read as the switch's description
   * (`aria-describedby`), never as part of its name (GAP-162).
   */
  description?: string;
  /**
   * Draws the state in words beside the track: `onLabel` or `offLabel`
   * (GAP-162). The words are not read: the switch's own role says on or off
   * in the reader's language.
   */
  showStateLabel?: boolean;
  /** The word for on, "On" unless given. */
  onLabel?: string;
  /** The word for off, "Off" unless given. */
  offLabel?: string;
  error?: boolean | string;
  wrapperClassName?: string;
  /**
   * The switch stands for several settings that differ (decision 188): a
   * property of a multi-selection whose features are some on and some off.
   * It is drawn neither on nor off, the theme fill with a dash and no thumb,
   * and is off to a screen reader (`role="switch"` has no mixed state), with
   * `mixedLabel` as its description. A click turns it on: `onCheckedChange`
   * gets `true`, and the product clears `mixed`.
   */
  mixed?: boolean;
  /** Said with the mixed switch, and drawn as its state label. Default "Multiple values". */
  mixedLabel?: string;
  /**
   * Offer to go back to the several settings: drawn under the switch while
   * it is not `mixed`, never while it is disabled. Pressed, focus returns
   * to the switch, and the product sets `mixed` again.
   */
  onResetMixed?: () => void;
  /** The reset's words. Default "Reset to multiple values". */
  resetMixedLabel?: string;
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(
  (
    {
      className,
      label,
      description,
      showStateLabel = false,
      onLabel = "On",
      offLabel = "Off",
      error,
      wrapperClassName,
      mixed = false,
      mixedLabel = "Multiple values",
      onResetMixed,
      resetMixedLabel = "Reset to multiple values",
      ...rest
    },
    ref,
  ) => {
    // The caller's description is kept and the error's joins it, and so is the
    // caller's invalid state: both were written after the caller's props, so a
    // product describing the setting lost its description to the component's
    // own, which was undefined without an error.
    const {
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      checked: checkedProp,
      defaultChecked,
      onCheckedChange,
      ...props
    } = rest;
    const defaultId = React.useId();
    const inputId = props.id || defaultId;
    const errorId = React.useId();
    const descriptionId = React.useId();
    const mixedId = React.useId();
    const own = React.useRef<HTMLButtonElement | null>(null);
    const switchRef = useFieldRef(own, ref);
    const hasError = !!error;
    const isStringError = typeof error === "string";
    const { trackEvent } = useKozmosAnalytics();
    // The state words follow the switch whether the caller controls it or
    // not, so an uncontrolled switch's state is kept here, and Radix is
    // always given it. Mixed (decision 188), Radix is given off, so a click
    // turns it on; the state kept here holds while it is mixed, so an
    // uncontrolled switch shows that click's "on" once it is not.
    const [uncontrolledChecked, setUncontrolledChecked] = React.useState(
      defaultChecked ?? false,
    );
    const isChecked = checkedProp ?? uncontrolledChecked;

    return (
      <div className={cn("flex flex-col gap-1.5 w-full", wrapperClassName)}>
        <div
          className={cn(
            "flex min-h-11 gap-2",
            description ? "items-start" : "items-center",
          )}
        >
          <SwitchPrimitive.Root
            id={inputId}
            className={cn(
              "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-pill border-2 border-muted-foreground bg-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-checked:border-theme-fill aria-checked:bg-theme-fill",
              hasError &&
                "border-destructive focus-visible:ring-destructive aria-checked:border-destructive aria-checked:bg-destructive",
              // Mixed (decision 189): the track filled as when on, the
              // destructive fill in error as a checked one's, with the dash
              // centred where the thumb was.
              mixed &&
                cn(
                  "justify-center",
                  hasError
                    ? "border-destructive bg-destructive"
                    : "border-theme-fill bg-theme-fill",
                ),
              className,
            )}
            {...props}
            checked={mixed ? false : isChecked}
            data-mixed={mixed ? "" : undefined}
            onCheckedChange={(checked) => {
              trackEvent("Switch", "switch_toggled", { checked });
              setUncontrolledChecked(checked);
              onCheckedChange?.(checked);
            }}
            ref={switchRef}
            aria-invalid={hasError || ariaInvalid}
            aria-describedby={mergeAriaIds(
              ariaDescribedBy,
              description ? descriptionId : undefined,
              mixed ? mixedId : undefined,
              hasError && isStringError ? errorId : undefined,
            )}
          >
            {mixed ? (
              // Checkbox's mixed mark, the minus at 16, in the colour the
              // thumb would be: the theme foreground on the theme fill,
              // white in both themes (5.6:1), and the surface on an
              // error's fill, as its thumb.
              <Minus
                aria-hidden="true"
                data-slot="mixed-dash"
                className={cn(
                  "pointer-events-none h-4 w-4",
                  hasError ? "text-background" : "text-theme-fill-foreground",
                )}
              />
            ) : (
              <SwitchPrimitive.Thumb
                className={cn(
                  // On, the thumb slides 20 toward the inline end: right, or left
                  // in a right-to-left box, read from --kozmos-rtl as every
                  // direction rule is (never :dir()). A bare translate-x-5 slid
                  // it right in both, out of a right-to-left track.
                  "pointer-events-none block h-5 w-5 rounded-pill bg-background shadow-raised ring-0 transition-transform data-[state=checked]:translate-x-[calc(1.25rem_*_(1_-_2_*_var(--kozmos-rtl,0)))] data-[state=unchecked]:translate-x-0",
                  // The thumb on the checked track is a mark on the theme fill: the
                  // theme foreground, white in both themes (decision 59). On an
                  // error's track it stays the surface, as SwiftUI and Compose
                  // draw it.
                  !hasError && "data-[state=checked]:bg-theme-fill-foreground",
                )}
              />
            )}
          </SwitchPrimitive.Root>
          {showStateLabel && (
            // Hidden from assistive technology: the role="switch" already
            // says its state, and the words would say it twice. Beside the
            // track, 24 tall, so it is centred on it with a description too.
            <span
              aria-hidden="true"
              data-slot="state-label"
              className="flex h-6 shrink-0 items-center text-sm leading-5 text-muted-foreground peer-disabled:opacity-50"
            >
              {mixed ? mixedLabel : isChecked ? onLabel : offLabel}
            </span>
          )}
          {description ? (
            // The track is 24 tall and the label's line 20: 2 down centres
            // them.
            <ControlText
              inputId={inputId}
              label={label}
              description={description}
              descriptionId={descriptionId}
              className="pt-0.5"
              labelClassName={cn(hasError && "text-destructive-text")}
            />
          ) : (
            label && (
              <Label
                htmlFor={inputId}
                className={cn(
                  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
                  hasError && "text-destructive-text",
                )}
              >
                {label}
              </Label>
            )
          )}
        </div>
        {/* Hidden, and still the switch's description: aria-describedby
          reads a hidden element. */}
        {mixed ? (
          <span id={mixedId} hidden>
            {mixedLabel}
          </span>
        ) : null}
        {!mixed && onResetMixed && !props.disabled ? (
          <button
            type="button"
            className="kozmos-reset kozmos-field-reset"
            data-slot="reset-mixed"
            onClick={() => {
              // The button goes as the switch turns mixed again: focus goes
              // to the switch first, which is then read with its several
              // values, not lost to the page.
              own.current?.focus();
              onResetMixed();
            }}
          >
            {resetMixedLabel}
          </button>
        ) : null}
        {isStringError && (
          <p id={errorId} className="text-sm text-destructive-text">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
