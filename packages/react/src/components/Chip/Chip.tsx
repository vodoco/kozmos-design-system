import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { type VariantProps } from "class-variance-authority";
import { X } from "@kozmos-ds/icons";
import { emotionSurfaceProperties, type Emotion } from "../../utils/emotion";
import {
  CHIP_ICON_CLASS,
  CHIP_LABEL_CLASS,
  CHIP_REMOVE_ICON_CLASS,
  chipClass,
  chipContentClass,
  chipGroupClass,
  chipLabelText,
  chipRemoveClass,
  chipRemoveLabel,
  chipVariants,
} from "../../recipes/chip";

// Moved to recipes/chip.ts, shared with @kozmos-ds/vue's KozmosChip:
// framework-free, so Vue builds it in.
export { chipVariants };

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

function chipLabel(children: React.ReactNode) {
  return chipLabelText(
    typeof children === "string" || typeof children === "number"
      ? String(children)
      : undefined,
  );
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

    const content = (
      <>
        {icon ? (
          <span
            aria-hidden="true"
            className={CHIP_ICON_CLASS}
            data-slot="chip-icon"
          >
            {icon}
          </span>
        ) : null}
        {/* Truncated, named by the whole label (recipes/chip.ts). */}
        <span className={CHIP_LABEL_CLASS} data-slot="chip-label">
          {children}
        </span>
      </>
    );

    return (
      <span
        ref={ref}
        aria-disabled={disabled || undefined}
        className={chipClass(
          {
            variant,
            size,
            emotion,
            selected: isSelected,
            interactive: isInteractive,
            disabled,
            removable: Boolean(onRemove),
            choice: isChoice,
          },
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
            className={chipContentClass(size, Boolean(onRemove), true)}
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
            className={chipContentClass(size, Boolean(onRemove), true)}
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
            className={chipContentClass(size, Boolean(onRemove), false)}
            onKeyDown={onKeyDown}
            tabIndex={onKeyDown && !disabled ? 0 : undefined}
          >
            {content}
          </span>
        )}
        {onRemove && !isChoice ? (
          // Its ring and hover fills: recipes/chip.ts.
          <button
            aria-label={chipRemoveLabel(label, removeLabel)}
            className={chipRemoveClass(variant, emotion, isSelected)}
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
            type="button"
          >
            <X aria-hidden="true" className={CHIP_REMOVE_ICON_CLASS} />
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
    const classes = chipGroupClass(className);

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
