import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "@kozmos-ds/icons";
import { cn } from "../../utils";

export const chipVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-pill border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        neutral: "border-input bg-background text-foreground hover:bg-muted",
        brand:
          "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15",
        destructive:
          "border-destructive/30 bg-destructive/10 text-[var(--semantics-emotion-danger-on-surface)] hover:bg-destructive/15",
      },
      size: {
        sm: "h-7 text-xs",
        default: "h-8 text-sm",
        lg: "h-9 text-sm",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "default",
    },
  },
);

const chipContentPadding = {
  sm: "px-3 py-0",
  default: "px-4 py-0",
  lg: "px-5 py-0",
};

export interface ChipProps
  extends
    Omit<React.HTMLAttributes<HTMLSpanElement>, "onSelect">,
    VariantProps<typeof chipVariants> {
  active?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
  selected?: boolean;
  /**
   * In a single-choice `ChipGroup`, what choosing this chip picks. The group
   * then decides whether it is selected, so `selected` and `active` are not
   * read, and a chip that is one of a choice offers no remove control — a
   * second stop inside a radio group is not one the arrow keys can reach.
   */
  value?: string;
}

/** The chosen value of the single-choice ChipGroup a chip is in, if any. */
const ChipChoiceContext = React.createContext<{ value?: string } | null>(null);

function selectedChipClasses(variant: ChipProps["variant"]) {
  if (variant === "destructive") {
    return "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90";
  }

  // A selected chip is a prominent fill: the theme fill and the theme
  // foreground, the same in both themes (decision 59).
  return "border-theme-fill bg-theme-fill text-theme-fill-foreground hover:bg-theme-fill/90";
}

function chipLabel(children: React.ReactNode) {
  return typeof children === "string" || typeof children === "number"
    ? String(children)
    : "chip";
}

export const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(
  (
    {
      active,
      children,
      className,
      disabled = false,
      icon,
      onClick,
      onKeyDown,
      onRemove,
      removeLabel,
      selected,
      size,
      value,
      variant,
      ...props
    },
    ref,
  ) => {
    const choice = React.useContext(ChipChoiceContext);
    const isChoice = choice !== null && value !== undefined;
    const isSelected = isChoice
      ? choice.value === value
      : (selected ?? active ?? false);
    const isInteractive = isChoice || Boolean(onClick);
    const label = chipLabel(children);
    const contentClassName = cn(
      "inline-flex min-h-[inherit] items-center justify-center gap-1.5 rounded-pill text-inherit",
      chipContentPadding[size ?? "default"],
      onRemove && "pr-2",
    );

    const content = (
      <>
        {icon ? (
          <span
            aria-hidden="true"
            className="inline-flex h-4 w-4 shrink-0 items-center justify-center [&_svg]:h-4 [&_svg]:w-4"
            data-slot="chip-icon"
          >
            {icon}
          </span>
        ) : null}
        <span data-slot="chip-label">{children}</span>
      </>
    );

    return (
      <span
        ref={ref}
        aria-disabled={disabled || undefined}
        className={cn(
          chipVariants({ variant, size }),
          isSelected && selectedChipClasses(variant),
          isInteractive && !disabled && "cursor-pointer",
          disabled && "pointer-events-none opacity-50",
          onRemove && "pr-1",
          className,
        )}
        data-slot="chip"
        {...props}
      >
        {isChoice ? (
          // A radio of the group's radio group: Radix gives it the checked
          // state, the one Tab stop and the arrow keys, in the direction the
          // ThemeProvider sets.
          <RadioGroupPrimitive.Item
            className={cn(
              contentClassName,
              "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
            disabled={disabled}
            onClick={(event) => {
              onClick?.(event as unknown as React.MouseEvent<HTMLSpanElement>);
            }}
            onKeyDown={(event) => {
              onKeyDown?.(
                event as unknown as React.KeyboardEvent<HTMLSpanElement>,
              );
            }}
            value={value}
          >
            {content}
          </RadioGroupPrimitive.Item>
        ) : isInteractive ? (
          <button
            aria-pressed={isSelected}
            className={cn(
              contentClassName,
              "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
            disabled={disabled}
            onClick={(event) => {
              onClick?.(event as unknown as React.MouseEvent<HTMLSpanElement>);
            }}
            onKeyDown={(event) => {
              onKeyDown?.(
                event as unknown as React.KeyboardEvent<HTMLSpanElement>,
              );
            }}
            type="button"
          >
            {content}
          </button>
        ) : (
          <span
            className={contentClassName}
            onKeyDown={onKeyDown}
            tabIndex={onKeyDown && !disabled ? 0 : undefined}
          >
            {content}
          </span>
        )}
        {onRemove && !isChoice ? (
          <button
            aria-label={removeLabel ?? `Remove ${label}`}
            className={cn(
              "kozmos-chip-remove ml-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-pill transition-colors hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSelected && "hover:bg-background/20",
            )}
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
            type="button"
          >
            <X aria-hidden="true" className="h-3 w-3" />
          </button>
        ) : null}
      </span>
    );
  },
);

Chip.displayName = "Chip";

export interface ChipGroupProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "dir"
> {
  /**
   * `multiple`, the default: each chip is its own toggle, as it always was.
   * `single`: the chips are one choice — a radio group, with one Tab stop and
   * the arrow keys moving the choice — for a one-of-several such as "Whole
   * airport / Terminal 2" (row 37). Give each chip a `value`, and the group
   * an `aria-label` that names the choice.
   */
  selectionMode?: "multiple" | "single";
  /** The chosen chip's value, with `selectionMode="single"`: controlled. */
  value?: string;
  /** The chip chosen at first, when the group holds its own choice. */
  defaultValue?: string;
  /** Called with the chosen chip's value. A choice cannot be emptied. */
  onValueChange?: (value: string) => void;
  /** Reading direction for the arrow keys; the ThemeProvider's otherwise. */
  dir?: "ltr" | "rtl";
}

export const ChipGroup = React.forwardRef<HTMLDivElement, ChipGroupProps>(
  (
    {
      className,
      defaultValue,
      dir,
      onValueChange,
      selectionMode = "multiple",
      value,
      ...props
    },
    ref,
  ) => {
    const [held, setHeld] = React.useState(defaultValue);
    const chosen = value !== undefined ? value : held;
    const classes = cn("flex flex-wrap gap-2", className);

    if (selectionMode !== "single")
      return (
        <div
          ref={ref}
          className={classes}
          data-slot="chip-group"
          dir={dir}
          {...props}
        />
      );

    return (
      <ChipChoiceContext.Provider value={{ value: chosen }}>
        <RadioGroupPrimitive.Root
          ref={ref}
          className={classes}
          data-slot="chip-group"
          dir={dir}
          // Always a string, so Radix never takes an empty choice for an
          // uncontrolled group and starts keeping a value of its own.
          value={chosen ?? ""}
          onValueChange={(next) => {
            if (value === undefined) setHeld(next);
            onValueChange?.(next);
          }}
          {...props}
        />
      </ChipChoiceContext.Provider>
    );
  },
);

ChipGroup.displayName = "ChipGroup";
