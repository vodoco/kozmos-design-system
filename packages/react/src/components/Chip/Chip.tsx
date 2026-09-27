import * as React from "react";
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
}

function selectedChipClasses(variant: ChipProps["variant"]) {
  if (variant === "destructive") {
    return "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90";
  }

  return "border-primary bg-primary text-primary-foreground hover:bg-primary/90";
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
      variant,
      ...props
    },
    ref,
  ) => {
    const isSelected = selected ?? active ?? false;
    const isInteractive = Boolean(onClick);
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
        {isInteractive ? (
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
        {onRemove ? (
          <button
            aria-label={removeLabel ?? `Remove ${label}`}
            className={cn(
              "ml-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-pill transition-colors hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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

export type ChipGroupProps = React.HTMLAttributes<HTMLDivElement>;

export const ChipGroup = React.forwardRef<HTMLDivElement, ChipGroupProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-wrap gap-2", className)}
      data-slot="chip-group"
      {...props}
    />
  ),
);

ChipGroup.displayName = "ChipGroup";
