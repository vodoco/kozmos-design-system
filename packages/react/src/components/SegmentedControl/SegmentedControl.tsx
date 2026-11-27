import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { type VariantProps } from "class-variance-authority";
import { FieldWrapper } from "../FieldWrapper";
import { MixedGroupLine } from "../FieldWrapper/MixedGroupLine";
import { useFieldRef } from "../FieldWrapper/mixedValue";
import { cn, mergeAriaIds } from "../../utils";
import { useKozmosAnalytics } from "../../utils/analytics";
// The recipe is shared with Vue's KozmosSegmentedControl
// (recipes/segmented-control.ts).
import {
  SEGMENTED_CONTROL_FOCUS_CLASS,
  SEGMENTED_CONTROL_LABEL_CLASS,
  segmentedControlItemClass,
  segmentedControlVariants,
} from "../../recipes/segmented-control";

export type SegmentedControlItem = {
  disabled?: boolean;
  label: React.ReactNode;
  value: string;
};

export interface SegmentedControlProps
  extends
    Omit<
      React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>,
      "defaultValue" | "onValueChange" | "type" | "value"
    >,
    VariantProps<typeof segmentedControlVariants> {
  defaultValue?: string;
  error?: boolean | string;
  fullWidth?: boolean;
  items: SegmentedControlItem[];
  label?: string;
  /**
   * Called with the pressed value, or `undefined` when the reviewer presses the
   * segment that already holds the pill and takes their choice back.
   *
   * The `undefined` is the point. Radix reports a deselect as `""`, which is a
   * value no `items` entry can ever have, and every consumer had to know that
   * and guard it. One of them cast it to a union that did not include it, and
   * the cast laundered an impossible value past TypeScript — it survived only
   * because `""` is falsy and every reader happened to treat it as "nothing
   * chosen". Normalising to `undefined` makes the empty case something the type
   * system can see, so the compiler asks the question instead of the reviewer
   * discovering it.
   *
   * A consumer that wants "exactly one, always" should control `value` and
   * ignore the `undefined` rather than expect the component to refuse it.
   */
  onValueChange?: (value: string | undefined) => void;
  size?: "sm" | "default" | "lg";
  /**
   * The chosen segment, for a product that holds the choice itself; `null`
   * is nothing chosen. `onValueChange` hands over `undefined` when the choice
   * is taken back, so a product holding the choice passes
   * `value={choice ?? null}`.
   *
   * `undefined`, or no `value` at all, leaves the choice to the control, as
   * it always has: a wrapper that passes its own optional `value` on works
   * used without one. Give `defaultValue` for the control's first choice.
   */
  value?: string | null;
  wrapperClassName?: string;
  /**
   * The control stands for several values that differ (decisions 188 and
   * 191): a property of a multi-selection whose features chose different
   * options. No option is on, and `mixedLabel` is drawn under the control
   * and said as its description: a segment has no mixed state to announce.
   * Choosing an option calls `onValueChange`, and the product clears
   * `mixed`. Given at all, true or false, the control holds an uncontrolled
   * choice itself: none while mixed, the visitor's after.
   */
  mixed?: boolean;
  /** Drawn under the mixed control, and said with it. Default "Multiple values". */
  mixedLabel?: string;
  /**
   * Offer to go back to the several values: drawn under the control while
   * it is not `mixed`, never while it is disabled. Pressed, focus returns
   * to the control's option, and the product sets `mixed` again.
   */
  onResetMixed?: () => void;
  /** The reset's words. Default "Reset to multiple values". */
  resetMixedLabel?: string;
}

export const SegmentedControl = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  SegmentedControlProps
>(
  (
    {
      "aria-label": ariaLabel,
      className,
      defaultValue,
      disabled = false,
      error,
      fullWidth = false,
      items,
      label,
      onValueChange,
      size = "default",
      value,
      wrapperClassName,
      mixed,
      mixedLabel = "Multiple values",
      onResetMixed,
      resetMixedLabel = "Reset to multiple values",
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const generatedErrorId = React.useId();
    const mixedId = React.useId();
    const own = React.useRef<HTMLDivElement | null>(null);
    const groupRef = useFieldRef(own, ref);
    // A control given `mixed` at all is the field of a multi-selection, and
    // holds an uncontrolled choice itself, as Select does: `defaultValue`
    // while it is not mixed, none while it is, and the visitor's choice
    // after. A choice held before it turned mixed is dropped, never shown
    // again when it stops being mixed. Without `mixed`, Radix holds it, as
    // it always has.
    const takesMixed = mixed !== undefined;
    const isMixed = mixed === true;
    const [held, setHeld] = React.useState(isMixed ? "" : (defaultValue ?? ""));
    if (takesMixed && isMixed && held !== "") setHeld("");
    const inputId = props.id || generatedId;
    const hasError = Boolean(error);
    const isStringError = typeof error === "string";
    const { trackEvent } = useKozmosAnalytics();

    return (
      <FieldWrapper
        className={wrapperClassName}
        error={error}
        errorId={generatedErrorId}
        inputId={inputId}
        label={label}
      >
        <ToggleGroupPrimitive.Root
          ref={groupRef}
          aria-describedby={mergeAriaIds(
            ariaDescribedBy,
            isMixed ? mixedId : undefined,
            hasError && isStringError ? generatedErrorId : undefined,
          )}
          aria-invalid={hasError || undefined}
          aria-label={ariaLabel ?? label ?? "Segmented control"}
          className={cn(
            segmentedControlVariants({ fullWidth, size }),
            SEGMENTED_CONTROL_FOCUS_CLASS,
            className,
          )}
          data-disabled={disabled ? "true" : undefined}
          data-mixed={isMixed ? "" : undefined}
          disabled={disabled}
          {...(disabled || items.every((item) => item.disabled)
            ? { tabIndex: 0 }
            : {})}
          id={inputId}
          onValueChange={(nextValue) => {
            // Radix's single-mode toggle group reports a deselect as "".
            // Forward it as undefined: "" is not a selection, and passing it on
            // as a string makes every consumer responsible for knowing that.
            //
            // The analytics guard stays deliberately — an un-decide is a real
            // action, but "segmented_control_toggled" with no value would change
            // what that event means for anything already counting it. Worth
            // revisiting as its own decision rather than as a side effect here.
            if (takesMixed) setHeld(nextValue);
            if (!nextValue) {
              onValueChange?.(undefined);
              return;
            }
            trackEvent("SegmentedControl", "segmented_control_toggled", {
              value: nextValue,
            });
            onValueChange?.(nextValue);
          }}
          type="single"
          {...(takesMixed
            ? // Mixed, no option is the value: none is on, and the first
              // the visitor chooses is reported.
              {
                value: isMixed
                  ? ""
                  : value === undefined
                    ? held
                    : (value ?? ""),
              }
            : {
                // `null` is a held empty choice, which Radix calls "" (R1).
                // `undefined` leaves the choice to the control, as in 0.5.0:
                // a wrapper forwarding its optional `value` must keep working.
                value: value === null ? "" : value,
                defaultValue,
              })}
          {...props}
        >
          {items.map((item) => (
            <ToggleGroupPrimitive.Item
              key={item.value}
              // A disabled control is drawn at half by its group; its
              // segments are not halved again.
              className={segmentedControlItemClass({
                fullWidth,
                size,
                hasError,
                disabled,
              })}
              disabled={disabled || item.disabled}
              value={item.value}
              onFocus={(event) =>
                event.currentTarget.scrollIntoView?.({
                  block: "nearest",
                  inline: "nearest",
                })
              }
            >
              {/* One grid item, whatever the label holds: eight between
                its parts, as Button and ToggleButton space theirs (an
                icon beside its words). No platform had an opinion, so this
                follows the control scale. */}
              <span className={SEGMENTED_CONTROL_LABEL_CLASS}>
                {item.label}
              </span>
            </ToggleGroupPrimitive.Item>
          ))}
        </ToggleGroupPrimitive.Root>
        {takesMixed ? (
          <MixedGroupLine
            mixed={isMixed}
            mixedLabel={mixedLabel}
            mixedId={mixedId}
            onResetMixed={onResetMixed}
            resetMixedLabel={resetMixedLabel}
            disabled={disabled}
            group={own}
          />
        ) : null}
      </FieldWrapper>
    );
  },
);

SegmentedControl.displayName = "SegmentedControl";
