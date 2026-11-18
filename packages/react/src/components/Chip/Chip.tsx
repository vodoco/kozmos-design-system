import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import { emotionSurfaceProperties, type Emotion } from "../../utils/emotion";

export const chipVariants = cva(
  // min-w-0 and max-w-full: a chip shrinks to its room, its label truncating,
  // rather than running past it. A flex item's automatic minimum is its
  // content, and the words never wrap, so a long label ran out of its
  // ChipGroup and, in MultiSelect, under the field's clear and open, which
  // covered the chip's remove (#537's audit, WCAG 2.5.8).
  "inline-flex min-w-0 max-w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-pill border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        neutral:
          "border-input bg-background text-foreground hover:bg-hover-fill",
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
  /**
   * What the chip means (GAP-170, decision 200): one of Tag's six emotions.
   * Set, it decides the colour whatever the `variant`: at rest the emotion's
   * quiet surface and its ink, edged in the emotion's text colour; selected,
   * filled with that text colour, with the page's colour as its ink. Both
   * read 4.5:1 in both themes. Unset, the variant draws as it always has.
   *
   * The variants read as emotions: `neutral` is the neutral emotion, `brand`
   * is `themed` and `destructive` is `danger`. They keep their own drawing,
   * so nothing set today changes; a new chip that means something takes
   * `emotion`.
   */
  emotion?: Emotion;
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
  // foreground, the same in both themes (decision 59). Hovered, the themed
  // Button's hover token, opaque: /90 of the fill let the page through,
  // lighter in the light and darker in the dark, see-through on glass.
  return "border-theme-fill bg-theme-fill text-theme-fill-foreground hover:bg-[var(--components-primary-buttons-themed-button-background-hover)]";
}

/**
 * An emotion chip at rest: its surface and ink, edged in its text colour.
 * Under the pointer its tint deepens, the emotion's text mixed into its
 * surface, as `brand` and `destructive` deepen theirs. Not the hover fill
 * (decision 173): the neutral emotion's surface in dark IS the hover fill,
 * background/200, so its hover would not show.
 */
// Written out whole, here and on the remove, for Tailwind to find.
const EMOTION_CHIP_REST =
  "border-[var(--kz-emotion-text)] bg-[var(--kz-emotion-surface)] text-[var(--kz-emotion-on-surface)] hover:bg-[color-mix(in_srgb,var(--kz-emotion-text)_10%,var(--kz-emotion-surface))]";

/**
 * An emotion chip selected: filled with the emotion's text colour, which
 * reads 4.5:1 on the page in both themes, so the page's colour reads 4.5:1
 * on it. It holds its fill under the pointer, as a selected Tree row does.
 */
const EMOTION_CHIP_SELECTED =
  "border-[var(--kz-emotion-text)] bg-[var(--kz-emotion-text)] text-background hover:bg-[var(--kz-emotion-text)]";

/**
 * Under the pointer the remove button takes the hover fill (decision 173),
 * and the chip, hovered too, would be the same fill round it: the button's
 * hover did not show (GAP-251). So while its remove is hovered, the chip
 * goes back to its fill at rest, and the button's hover fill shows on it as
 * any hover shows on the page, in both themes.
 */
function restWhileRemoveHovered(
  variant: ChipProps["variant"],
  emotion: Emotion | undefined,
  selected: boolean,
) {
  if (emotion)
    return selected
      ? "has-[.kozmos-chip-remove:hover]:bg-[var(--kz-emotion-text)]"
      : "has-[.kozmos-chip-remove:hover]:bg-[var(--kz-emotion-surface)]";
  if (selected)
    return variant === "destructive"
      ? "has-[.kozmos-chip-remove:hover]:bg-destructive"
      : "has-[.kozmos-chip-remove:hover]:bg-theme-fill";
  if (variant === "brand")
    return "has-[.kozmos-chip-remove:hover]:bg-primary/10";
  if (variant === "destructive")
    return "has-[.kozmos-chip-remove:hover]:bg-destructive/10";
  return "has-[.kozmos-chip-remove:hover]:bg-background";
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
      emotion,
      icon,
      onClick,
      onKeyDown,
      onRemove,
      removeLabel,
      selected,
      size,
      style,
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
      "inline-flex min-h-[inherit] min-w-0 items-center justify-center gap-1.5 rounded-pill text-inherit",
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
        {/* The words end in an ellipsis when the chip is narrower than
            them; all of them stay in the DOM, so the chip, and its remove
            ("Remove …"), are named by the whole label. */}
        <span className="min-w-0 truncate" data-slot="chip-label">
          {children}
        </span>
      </>
    );

    return (
      <span
        ref={ref}
        aria-disabled={disabled || undefined}
        className={cn(
          chipVariants({ variant, size }),
          isSelected && !emotion && selectedChipClasses(variant),
          emotion && (isSelected ? EMOTION_CHIP_SELECTED : EMOTION_CHIP_REST),
          isInteractive && !disabled && "cursor-pointer",
          disabled && "pointer-events-none opacity-50",
          onRemove && "pr-1",
          onRemove &&
            !isChoice &&
            restWhileRemoveHovered(variant, emotion, isSelected),
          className,
        )}
        data-slot="chip"
        data-emotion={emotion}
        // The caller's own style wins, as on Tag: the emotion sets a default.
        style={
          emotion ? { ...emotionSurfaceProperties(emotion), ...style } : style
        }
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
          // Focused from the keyboard it draws Button's offset ring: a band
          // of the page's colour, then the theme's 600, so the mark reads
          // 3:1 on a selected chip's fill (the band) and on the page (the
          // ring). The bare 600 ring read 1.11:1 on the fill. Hovered on the
          // fill, the theme foreground at a fifth, as ink at a tenth is
          // hovered on a surface.
          <button
            aria-label={removeLabel ?? `Remove ${label}`}
            className={cn(
              "kozmos-chip-remove ml-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-pill transition-colors hover:bg-hover-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              // On a selected chip's fill the hover fill would be a pale
              // disc under ink drawn for the fill. A selected destructive
              // chip is the danger fill, not the theme's: its own foreground
              // at a quarter, 1.40:1 on the light theme's red and 1.63:1 on
              // the dark's (white at a fifth read 1.28:1 and 1.27:1). A
              // selected emotion chip's remove turns to the page's colour
              // with the emotion's text on it, the chip at rest inverted.
              isSelected &&
                !emotion &&
                (variant === "destructive"
                  ? "hover:bg-destructive-foreground/25"
                  : "hover:bg-theme-fill-foreground/20"),
              isSelected &&
                emotion &&
                "hover:bg-background hover:text-[var(--kz-emotion-text)]",
              // At rest, the chip's own deeper tint, on the surface the
              // chip goes back to while its remove is hovered.
              !isSelected &&
                emotion &&
                "hover:bg-[color-mix(in_srgb,var(--kz-emotion-text)_10%,var(--kz-emotion-surface))]",
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
