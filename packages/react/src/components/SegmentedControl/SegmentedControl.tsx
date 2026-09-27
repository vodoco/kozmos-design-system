import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cva, type VariantProps } from "class-variance-authority";
import { FieldWrapper } from "../FieldWrapper";
import { cn } from "../../utils";
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
  // Eight between an item's parts, as `Button` and `ToggleButton` space
  // theirs: an item's label is a ReactNode and may be an icon beside text.
  // No platform had an opinion — iOS spaces the track, not the item, and
  // Compose's options are plain strings — so this follows the control scale
  // rather than inventing a number. It costs nothing where the label is one
  // node, which is every use today: a gap applies between children.
  "inline-flex min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-[12px] font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-raised",
  {
    variants: {
      fullWidth: {
        true: "flex-1",
        false: "shrink-0",
      },
      size: {
        sm: "min-h-11 px-3 text-xs",
        default: "min-h-11 px-4 text-sm",
        lg: "min-h-12 px-5 text-sm",
      },
    },
    compoundVariants: [
      {
        fullWidth: false,
        size: "sm",
        className: "min-w-[97px]",
      },
      {
        fullWidth: false,
        size: "default",
        className: "min-w-[117px]",
      },
      {
        fullWidth: false,
        size: "lg",
        className: "min-w-[137px]",
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
  value?: string;
  wrapperClassName?: string;
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
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const generatedErrorId = React.useId();
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
          ref={ref}
          aria-describedby={
            hasError && isStringError ? generatedErrorId : undefined
          }
          aria-invalid={hasError || undefined}
          aria-label={ariaLabel ?? label ?? "Segmented control"}
          className={cn(
            segmentedControlVariants({ fullWidth, size }),
            "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
            className,
          )}
          data-disabled={disabled ? "true" : undefined}
          defaultValue={defaultValue}
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
          value={value}
          {...props}
        >
          {items.map((item) => (
            <ToggleGroupPrimitive.Item
              key={item.value}
              className={cn(
                segmentedControlItemVariants({ fullWidth, size }),
                hasError && "data-[state=on]:text-destructive-text",
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
              {item.label}
            </ToggleGroupPrimitive.Item>
          ))}
        </ToggleGroupPrimitive.Root>
      </FieldWrapper>
    );
  },
);

SegmentedControl.displayName = "SegmentedControl";
