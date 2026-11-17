import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cva, type VariantProps } from "class-variance-authority";
import { FieldWrapper } from "../FieldWrapper";
import { MixedGroupLine } from "../FieldWrapper/MixedGroupLine";
import { useFieldRef } from "../FieldWrapper/mixedValue";
import { cn, mergeAriaIds } from "../../utils";
import { useKozmosAnalytics } from "../../utils/analytics";

export type SegmentedControlItem = {
  disabled?: boolean;
  label: React.ReactNode;
  value: string;
};

const segmentedControlVariants = cva(
  "inline-flex max-w-full overflow-x-auto items-center justify-start rounded-[16px] border border-transparent bg-muted p-1 text-muted-foreground transition-colors aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-destructive data-[disabled=true]:opacity-50",
  {
    variants: {
      fullWidth: {
        true: "w-full",
        false: "w-fit",
      },
      size: {
        sm: "min-h-[52px]",
        default: "min-h-[52px]",
        lg: "min-h-[56px]",
      },
    },
    defaultVariants: {
      fullWidth: false,
      size: "default",
    },
  },
);

const segmentedControlItemVariants = cva(
  // GAP-267 (decision 201): an option is a one-column grid whose column is
  // `minmax(max-content, M)`, M its minimum width less its padding. Its
  // words are its min-content width, and its words or its minimum,
  // whichever is wider, its max-content width: every engine reads both off
  // the grid, so the track asks for the same room it always did, and when
  // it is given less, each option gives up its spare width, down to its
  // words (min-width: min-content) and never past them, so they are never
  // clipped and never run into the next option's. Only when the words alone
  // are wider does the track scroll. A width with a min-width of
  // max-content did the same in Chromium and Firefox, but WebKit counted
  // the width alone in the track's, and scrolled German options with room.
  // The grid centres the label in the option, as the flex box did.
  "inline-grid min-w-min items-center justify-center justify-items-center whitespace-nowrap rounded-[12px] font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-raised",
  {
    variants: {
      fullWidth: {
        true: "flex-1",
        false: "shrink",
      },
      size: {
        sm: "min-h-11 px-3 text-xs",
        default: "min-h-11 px-4 text-sm",
        lg: "min-h-12 px-5 text-sm",
      },
    },
    // The minimum widths, 97, 117 and 137, less each size's padding, 12,
    // 16 and 20 a side.
    compoundVariants: [
      {
        fullWidth: false,
        size: "sm",
        className: "grid-cols-[minmax(max-content,73px)]",
      },
      {
        fullWidth: false,
        size: "default",
        className: "grid-cols-[minmax(max-content,85px)]",
      },
      {
        fullWidth: false,
        size: "lg",
        className: "grid-cols-[minmax(max-content,97px)]",
      },
    ],
    defaultVariants: {
      fullWidth: false,
      size: "default",
    },
  },
);

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
            "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
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
              className={cn(
                segmentedControlItemVariants({ fullWidth, size }),
                hasError && "data-[state=on]:text-destructive-text",
                // A disabled control is drawn at half by its group; its
                // segments must not halve themselves again (they drew at
                // 25%). A segment disabled on its own still dims itself.
                disabled && "disabled:opacity-100",
              )}
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
              <span className="inline-flex items-center justify-center gap-2">
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
