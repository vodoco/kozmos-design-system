import React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Check, Circle } from "@kozmos-ds/icons";
import { cn, mergeAriaIds } from "../../utils";
import { FieldWrapper } from "../FieldWrapper";
import { MixedGroupLine } from "../FieldWrapper/MixedGroupLine";
import { useFieldRef } from "../FieldWrapper/mixedValue";
import { Label } from "../Label";
import { ControlText } from "../Label/ControlText";
import { useKozmosAnalytics } from "../../utils/analytics";
// The recipe is shared with Vue's KozmosRadioGroup (recipes/radio.ts).
import {
  RADIO_CARD_DESCRIPTION_CLASS,
  RADIO_CARD_LINE_CLASS,
  RADIO_CARD_TITLE_CLASS,
  RADIO_CARD_WORDS_CLASS,
  RADIO_CLASS,
  RADIO_DOT_CLASS,
  RADIO_ERROR_CLASS,
  RADIO_GROUP_CLASS,
  RADIO_INDICATOR_CLASS,
  RADIO_LABEL_CLASS,
  RADIO_LABEL_ERROR_CLASS,
  RADIO_TILE_CHECK_MARK_CLASS,
  RADIO_TILE_DESCRIPTION_CLASS,
  RADIO_TILE_TITLE_CLASS,
  radioBoxClass,
  radioCardMarkClass,
  radioMediaClass,
  radioRowClass,
  radioTileCheckClass,
  untitledRadioBoxWarning,
} from "../../recipes/radio";

export interface RadioGroupProps extends React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Root
> {
  label?: string;
  error?: boolean | string;
  wrapperClassName?: string;
  /**
   * The group stands for several values that differ (decisions 188 and
   * 191): a property of a multi-selection whose features chose different
   * options. No option is chosen, and `mixedLabel` is drawn under the group
   * and said as its description: a radio has no mixed state to announce.
   * Choosing an option calls `onValueChange`, and the product clears
   * `mixed`. Given at all, true or false, the group holds an uncontrolled
   * choice itself: none while mixed, the visitor's after.
   */
  mixed?: boolean;
  /** Drawn under the mixed group, and said with it. Default "Multiple values". */
  mixedLabel?: string;
  /**
   * Offer to go back to the several values: drawn under the group while it
   * is not `mixed`, never while it is disabled. Pressed, focus returns to
   * the group's option, and the product sets `mixed` again.
   */
  onResetMixed?: () => void;
  /** The reset's words. Default "Reset to multiple values". */
  resetMixedLabel?: string;
}

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(
  (
    {
      className,
      label,
      error,
      wrapperClassName,
      mixed,
      mixedLabel = "Multiple values",
      onResetMixed,
      resetMixedLabel = "Reset to multiple values",
      value,
      defaultValue,
      onValueChange,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const errorId = React.useId();
    const mixedId = React.useId();
    const hasError = !!error;
    const { trackEvent } = useKozmosAnalytics();
    const own = React.useRef<HTMLDivElement | null>(null);
    const groupRef = useFieldRef(own, ref);
    // A group given `mixed` at all is the field of a multi-selection, and
    // holds an uncontrolled choice itself, as Select does: `defaultValue`
    // while it is not mixed, none while it is, and the visitor's choice
    // after. A choice held before it turned mixed is dropped, never shown
    // again when it stops being mixed. Without `mixed`, Radix holds it, as
    // it always has.
    const takesMixed = mixed !== undefined;
    const isMixed = mixed === true;
    const [held, setHeld] = React.useState(isMixed ? "" : (defaultValue ?? ""));
    if (takesMixed && isMixed && held !== "") setHeld("");

    return (
      <FieldWrapper
        label={label}
        error={error}
        errorId={errorId}
        className={wrapperClassName}
      >
        <RadioGroupPrimitive.Root
          className={cn(RADIO_GROUP_CLASS, className)}
          aria-invalid={hasError}
          aria-describedby={mergeAriaIds(
            ariaDescribedBy,
            isMixed ? mixedId : undefined,
            hasError && typeof error === "string" ? errorId : undefined,
          )}
          data-mixed={isMixed ? "" : undefined}
          {...props}
          // Mixed, no option is the value: none is checked, and the first
          // the visitor chooses is reported.
          {...(takesMixed
            ? { value: isMixed ? "" : (value ?? held) }
            : { value, defaultValue })}
          onValueChange={(next) => {
            trackEvent("RadioGroup", "radio_selection_changed", {
              value: next,
            });
            if (takesMixed) setHeld(next);
            onValueChange?.(next);
          }}
          ref={groupRef}
        />
        {takesMixed ? (
          <MixedGroupLine
            mixed={isMixed}
            mixedLabel={mixedLabel}
            mixedId={mixedId}
            onResetMixed={onResetMixed}
            resetMixedLabel={resetMixedLabel}
            disabled={props.disabled}
            group={own}
          />
        ) : null}
      </FieldWrapper>
    );
  },
);
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
      console.warn(untitledRadioBoxWarning(variant as "card" | "tile"));
    }, [boxed, named, variant]);

    if (boxed) {
      const tile = variant === "tile";
      const box = variant as "card" | "tile";
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
          // The edge is heavier when chosen, and the ring's dot or the
          // tile's check shows: the choice is never colour alone.
          className={radioBoxClass(box, error, className)}
          {...props}
        >
          {media != null && (
            <span
              aria-hidden="true"
              data-slot="media"
              className={radioMediaClass(box)}
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
                  className={RADIO_TILE_TITLE_CLASS}
                >
                  {label}
                </span>
              )}
              {description && (
                <span
                  id={descriptionId}
                  aria-hidden="true"
                  className={RADIO_TILE_DESCRIPTION_CLASS}
                >
                  {description}
                </span>
              )}
              <RadioGroupPrimitive.Indicator
                aria-hidden="true"
                data-slot="check"
                className={radioTileCheckClass(error)}
              >
                <Check className={RADIO_TILE_CHECK_MARK_CLASS} />
              </RadioGroupPrimitive.Indicator>
            </>
          ) : (
            <span className={RADIO_CARD_LINE_CLASS}>
              <span
                aria-hidden="true"
                data-slot="mark"
                className={radioCardMarkClass(error)}
              >
                <RadioGroupPrimitive.Indicator
                  className={RADIO_INDICATOR_CLASS}
                >
                  <Circle className={RADIO_DOT_CLASS} />
                </RadioGroupPrimitive.Indicator>
              </span>
              <span aria-hidden="true" className={RADIO_CARD_WORDS_CLASS}>
                {label && (
                  <span id={titleId} className={RADIO_CARD_TITLE_CLASS}>
                    {label}
                  </span>
                )}
                {description && (
                  <span
                    id={descriptionId}
                    className={RADIO_CARD_DESCRIPTION_CLASS}
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
      <div className={radioRowClass(!!description)}>
        <RadioGroupPrimitive.Item
          ref={ref}
          id={inputId}
          className={cn(RADIO_CLASS, error && RADIO_ERROR_CLASS, className)}
          aria-invalid={error || undefined}
          aria-describedby={describedBy}
          {...props}
        >
          <RadioGroupPrimitive.Indicator className={RADIO_INDICATOR_CLASS}>
            <Circle className={RADIO_DOT_CLASS} />
          </RadioGroupPrimitive.Indicator>
        </RadioGroupPrimitive.Item>
        {description ? (
          <ControlText
            inputId={inputId}
            label={label}
            description={description}
            descriptionId={descriptionId}
            labelClassName={cn(error && RADIO_LABEL_ERROR_CLASS)}
          />
        ) : (
          label && (
            <Label
              htmlFor={inputId}
              className={cn(
                RADIO_LABEL_CLASS,
                error && RADIO_LABEL_ERROR_CLASS,
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
