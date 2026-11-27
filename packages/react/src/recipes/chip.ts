/**
 * Chip's recipe: the pill a chip draws, its selected and emotion fills, the
 * press area inside it, its remove button and ChipGroup's row, for every
 * framework that draws one. React's `Chip` and `ChipGroup` build their
 * elements from it, and so do Vue's `KozmosChip` and `KozmosChipGroup`.
 * Framework-free (`recipes.framework-free.test.ts`).
 */
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils";
import type { Emotion } from "./emotion";

export const chipVariants = cva(
  // min-w-0 and max-w-full: a chip shrinks to its room, its label truncating,
  // rather than running past it. A flex item's automatic minimum is its
  // content, and the words never wrap, so a long label ran out of its
  // ChipGroup and, in MultiSelect, under the field's clear and open, which
  // covered the chip's remove (#537's audit, WCAG 2.5.8).
  "inline-flex min-w-0 max-w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-pill border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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

export type ChipVariant = NonNullable<
  VariantProps<typeof chipVariants>["variant"]
>;
export type ChipSize = NonNullable<VariantProps<typeof chipVariants>["size"]>;

const chipContentPadding = {
  sm: "px-3 py-0",
  default: "px-4 py-0",
  lg: "px-5 py-0",
};

function selectedChipClasses(variant: ChipVariant | null | undefined) {
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
  variant: ChipVariant | null | undefined,
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

/** What a chip's outer pill is drawn with. */
export interface ChipState {
  variant?: ChipVariant | null;
  size?: ChipSize | null;
  emotion?: Emotion;
  /** Selected: chosen in its group, or `selected` (or `active`) set. */
  selected: boolean;
  /** Pressable: a choice of its group, or given a click listener. */
  interactive: boolean;
  disabled: boolean;
  removable: boolean;
  /** One of a single-choice ChipGroup's choices: it offers no remove. */
  choice: boolean;
}

/** The chip's outer pill, with the caller's class last. */
export function chipClass(state: ChipState, className?: string) {
  const { variant, size, emotion, selected, interactive, disabled } = state;
  const removable = state.removable;
  return cn(
    chipVariants({ variant, size }),
    selected && !emotion && selectedChipClasses(variant),
    emotion && (selected ? EMOTION_CHIP_SELECTED : EMOTION_CHIP_REST),
    interactive && !disabled && "cursor-pointer",
    disabled && "pointer-events-none opacity-50",
    removable && "pr-1",
    removable &&
      !state.choice &&
      restWhileRemoveHovered(variant, emotion, selected),
    className,
  );
}

/** The press area inside the pill: its padding, and its ring when it is pressable. */
export function chipContentClass(
  size: ChipSize | null | undefined,
  removable: boolean,
  pressable: boolean,
) {
  const content = cn(
    "inline-flex min-h-[inherit] min-w-0 items-center justify-center gap-1.5 rounded-pill text-inherit",
    chipContentPadding[size ?? "default"],
    removable && "pr-2",
  );
  return pressable
    ? cn(
        content,
        "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )
    : content;
}

/** The icon before the label, hidden from assistive technology. */
export const CHIP_ICON_CLASS =
  "inline-flex h-4 w-4 shrink-0 items-center justify-center [&_svg]:h-4 [&_svg]:w-4";
/**
 * The words end in an ellipsis when the chip is narrower than them; all of
 * them stay in the DOM, so the chip, and its remove ("Remove …"), are named
 * by the whole label.
 */
export const CHIP_LABEL_CLASS = "min-w-0 truncate";
/** The remove button's X. */
export const CHIP_REMOVE_ICON_CLASS = "h-3 w-3";

/**
 * The remove button. Focused from the keyboard it draws Button's offset
 * ring: a band of the page's colour, then the theme's 600, so the mark reads
 * 3:1 on a selected chip's fill (the band) and on the page (the ring). The
 * bare 600 ring read 1.11:1 on the fill. Hovered on the fill, the theme
 * foreground at a fifth, as ink at a tenth is hovered on a surface.
 */
export function chipRemoveClass(
  variant: ChipVariant | null | undefined,
  emotion: Emotion | undefined,
  selected: boolean,
) {
  return cn(
    "kozmos-chip-remove ml-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-pill transition-colors hover:bg-hover-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    // On a selected chip's fill the hover fill would be a pale disc under
    // ink drawn for the fill. A selected destructive chip is the danger fill,
    // not the theme's: its own foreground at a quarter, 1.40:1 on the light
    // theme's red and 1.63:1 on the dark's (white at a fifth read 1.28:1 and
    // 1.27:1). A selected emotion chip's remove turns to the page's colour
    // with the emotion's text on it, the chip at rest inverted.
    selected &&
      !emotion &&
      (variant === "destructive"
        ? "hover:bg-destructive-foreground/25"
        : "hover:bg-theme-fill-foreground/20"),
    selected &&
      emotion &&
      "hover:bg-background hover:text-[var(--kz-emotion-text)]",
    // At rest, the chip's own deeper tint, on the surface the chip goes back
    // to while its remove is hovered.
    !selected &&
      emotion &&
      "hover:bg-[color-mix(in_srgb,var(--kz-emotion-text)_10%,var(--kz-emotion-surface))]",
  );
}

/** The remove's name: the caller's, or "Remove" and the label. */
export function chipRemoveLabel(label: string, removeLabel?: string) {
  return removeLabel ?? `Remove ${label}`;
}

/** The label a chip's remove names: its text, or "chip" when it is not text. */
export function chipLabelText(text: string | undefined) {
  return text ?? "chip";
}

/** ChipGroup's row, with the caller's class last. */
export function chipGroupClass(className?: string) {
  return cn("flex flex-wrap gap-2", className);
}

export type ChipGroupSelectionMode = "multiple" | "single";
