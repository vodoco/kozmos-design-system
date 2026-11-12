import React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Check, Circle } from "@kozmos-ds/icons";
import { cn, mergeAriaIds } from "../../utils";
import { FieldWrapper } from "../FieldWrapper";
import { Label } from "../Label";
import { ControlText } from "../Label/ControlText";
import { useKozmosAnalytics } from "../../utils/analytics";

export interface RadioGroupProps extends React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Root
> {
  label?: string;
  error?: boolean | string;
  wrapperClassName?: string;
}

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ className, label, error, wrapperClassName, ...props }, ref) => {
  const errorId = React.useId();
  const hasError = !!error;
  const { trackEvent } = useKozmosAnalytics();

  return (
    <FieldWrapper
      label={label}
      error={error}
      errorId={errorId}
      className={wrapperClassName}
    >
      <RadioGroupPrimitive.Root
        className={cn("grid gap-2", className)}
        aria-invalid={hasError}
        aria-describedby={
          hasError && typeof error === "string" ? errorId : undefined
        }
        {...props}
        onValueChange={(value) => {
          trackEvent("RadioGroup", "radio_selection_changed", { value });
          props.onValueChange?.(value);
        }}
        ref={ref}
      />
    </FieldWrapper>
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

/**
 * How an option is drawn (GAP-158). `default` is the ring and its label;
 * `card` a bordered box with an image or icon over the ring, the title and
 * the description; `tile` a smaller box of an icon over the title, for a grid
 * of short choices.
 */
export type RadioGroupItemVariant = "default" | "card" | "tile";

// Once a page: a card or tile with no title and no name of its own.
let warnedUntitledBox = false;

export interface RadioGroupItemProps extends React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Item
> {
  /**
   * The option's name; a card's or a tile's title. An icon-only tile, or a
   * card without a title, needs `aria-label` instead: its description is
   * never its name (GAP-158).
   */
  label?: string;
  /**
   * A line under the label, read as the option's description
   * (`aria-describedby`), never as part of its name.
   */
  description?: string;
  /** `card` and `tile` draw the option as a box (GAP-158). */
  variant?: RadioGroupItemVariant;
  /**
   * A card's image or a tile's icon. It is decoration: hidden from assistive
   * technology, as the title names the option. Not drawn by `default`.
   */
  media?: React.ReactNode;
  error?: boolean;
}

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(
  (
    {
      className,
      label,
      description,
      variant = "default",
      media,
      id,
      error = false,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const defaultId = React.useId();
    const inputId = id || defaultId;
    const titleId = `${inputId}-title`;
    const descriptionId = `${inputId}-description`;
    // The caller's description first, then the option's own.
    const describedBy = mergeAriaIds(
      ariaDescribedBy,
      description ? descriptionId : undefined,
    );

    const boxed = variant === "card" || variant === "tile";
    const named = Boolean(
      label || props["aria-label"] || props["aria-labelledby"],
    );
    React.useEffect(() => {
      if (
        process.env.NODE_ENV === "production" ||
        !boxed ||
        named ||
        warnedUntitledBox
      )
        return;
      warnedUntitledBox = true;
      console.warn(
        `RadioGroupItem: a ${variant} has no label and no aria-label, so nothing names it to a screen reader; its description is never its name. Pass label, or aria-label for an icon-only tile.`,
      );
    }, [boxed, named, variant]);

    if (boxed) {
      const tile = variant === "tile";
      // The whole box is the one radio: Radix's button, role="radio", in
      // the group's roving focus (one Tab stop, the arrows move and choose).
      // Its name is the title alone and its description the line under it;
      // the image or icon is hidden, so the box reads as one option. The
      // words are hidden too and reached only by their ids, so a box with
      // no title is never named by its description or its media: it has
      // no name at all, and says so in development.
      return (
        <RadioGroupPrimitive.Item
          ref={ref}
          id={inputId}
          data-variant={variant}
          data-error={error ? "" : undefined}
          aria-invalid={error || undefined}
          aria-labelledby={label ? titleId : undefined}
          aria-describedby={describedBy}
          className={cn(
            // The edge, theme 600 when chosen, is drawn a second pixel
            // heavier by owned CSS (kozmos-radio-card, an inset shadow that
            // the focus ring adds to), and the ring's dot or the tile's
            // check shows: the choice is never colour alone.
            "kozmos-radio-card group relative flex w-full min-w-0 rounded-container border border-border p-3 text-foreground transition-colors hover:bg-hover-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary",
            tile
              ? "min-h-24 flex-col items-center justify-center gap-1 text-center"
              : "flex-col items-stretch gap-3 text-start",
            error &&
              "border-destructive focus-visible:ring-destructive data-[state=checked]:border-destructive",
            className,
          )}
          {...props}
        >
          {media != null && (
            <span
              aria-hidden="true"
              data-slot="media"
              className={cn(
                "flex",
                // A tile's icon turns theme 600 when chosen, as SwiftUI's and
                // Compose's do; a card's image keeps its own colours.
                tile
                  ? "items-center justify-center text-foreground group-data-[state=checked]:text-primary"
                  : "w-full overflow-hidden rounded-control text-foreground",
              )}
            >
              {media}
            </span>
          )}
          {tile ? (
            <>
              {label && (
                <span
                  id={titleId}
                  aria-hidden="true"
                  className="text-sm font-medium leading-5"
                >
                  {label}
                </span>
              )}
              {description && (
                <span
                  id={descriptionId}
                  aria-hidden="true"
                  className="text-xs leading-4 text-muted-foreground"
                >
                  {description}
                </span>
              )}
              <RadioGroupPrimitive.Indicator
                aria-hidden="true"
                data-slot="check"
                className={cn(
                  "absolute end-2 top-2 flex h-5 w-5 items-center justify-center rounded-pill bg-theme-fill text-theme-fill-foreground",
                  error && "bg-destructive",
                )}
              >
                <Check className="h-3.5 w-3.5" />
              </RadioGroupPrimitive.Indicator>
            </>
          ) : (
            <span className="flex w-full items-start gap-2">
              <span
                aria-hidden="true"
                data-slot="mark"
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-pill border border-input text-theme-fill group-data-[state=checked]:border-primary",
                  error &&
                    "border-destructive text-destructive-text group-data-[state=checked]:border-destructive",
                )}
              >
                <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
                  <Circle className="h-2.5 w-2.5 fill-current text-current" />
                </RadioGroupPrimitive.Indicator>
              </span>
              <span
                aria-hidden="true"
                className="flex min-w-0 flex-col gap-0.5"
              >
                {label && (
                  <span id={titleId} className="text-sm font-medium leading-5">
                    {label}
                  </span>
                )}
                {description && (
                  <span
                    id={descriptionId}
                    className="text-sm leading-5 text-muted-foreground"
                  >
                    {description}
                  </span>
                )}
              </span>
            </span>
          )}
        </RadioGroupPrimitive.Item>
      );
    }

    return (
      <div
        className={cn(
          "flex min-h-11 gap-2",
          description ? "items-start" : "items-center",
        )}
      >
        <RadioGroupPrimitive.Item
          ref={ref}
          id={inputId}
          className={cn(
            // The ring is a border on the surface, theme 600; the dot is a fill,
            // the theme fill, theme 500 in both themes (decision 59). The dot
            // draws in currentColor, so the text colour is the dot's.
            "peer aspect-square h-5 w-5 shrink-0 rounded-pill border border-input text-theme-fill ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:text-theme-fill",
            error &&
              "border-destructive text-destructive-text focus-visible:ring-destructive data-[state=checked]:border-destructive data-[state=checked]:text-destructive-text",
            className,
          )}
          aria-invalid={error || undefined}
          aria-describedby={describedBy}
          {...props}
        >
          <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
            <Circle className="h-2.5 w-2.5 fill-current text-current" />
          </RadioGroupPrimitive.Indicator>
        </RadioGroupPrimitive.Item>
        {description ? (
          <ControlText
            inputId={inputId}
            label={label}
            description={description}
            descriptionId={descriptionId}
            labelClassName={cn(error && "text-destructive-text")}
          />
        ) : (
          label && (
            <Label
              htmlFor={inputId}
              className={cn(
                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
                error && "text-destructive-text",
              )}
            >
              {label}
            </Label>
          )
        )}
      </div>
    );
  },
);
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
