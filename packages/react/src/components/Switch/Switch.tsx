import React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn, mergeAriaIds } from "../../utils";
import { Label } from "../Label";
import { ControlText } from "../Label/ControlText";
import { useKozmosAnalytics } from "../../utils/analytics";

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
      ...props
    } = rest;
    const defaultId = React.useId();
    const inputId = props.id || defaultId;
    const errorId = React.useId();
    const descriptionId = React.useId();
    const hasError = !!error;
    const isStringError = typeof error === "string";
    const { trackEvent } = useKozmosAnalytics();
    // The state words follow the switch whether the caller controls it or
    // not: an uncontrolled switch's state is Radix's, so it is kept here too.
    const [uncontrolledChecked, setUncontrolledChecked] = React.useState(
      props.defaultChecked ?? false,
    );
    const isChecked = props.checked ?? uncontrolledChecked;

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
              "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-pill border-2 border-muted-foreground bg-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-theme-fill data-[state=checked]:bg-theme-fill",
              hasError &&
                "border-destructive focus-visible:ring-destructive data-[state=checked]:border-destructive data-[state=checked]:bg-destructive",
              className,
            )}
            {...props}
            onCheckedChange={(checked) => {
              trackEvent("Switch", "switch_toggled", { checked });
              setUncontrolledChecked(checked);
              props.onCheckedChange?.(checked);
            }}
            ref={ref}
            aria-invalid={hasError || ariaInvalid}
            aria-describedby={mergeAriaIds(
              ariaDescribedBy,
              description ? descriptionId : undefined,
              hasError && isStringError ? errorId : undefined,
            )}
          >
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
              {isChecked ? onLabel : offLabel}
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
