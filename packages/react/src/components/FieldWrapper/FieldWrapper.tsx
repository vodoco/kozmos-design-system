import React from "react";
import { cn } from "../../utils";
import { Label } from "../Label";

export type FieldStatus = "default" | "error" | "warning" | "success";

/**
 * A field that stands for several values at once (GAP-153): a property of a
 * multi-selection whose features differ. Input, NumberInput, Select and
 * Combobox take it.
 *
 * It is the product's state, as the selection is: `mixed` says the field
 * still stands for the several values, and the field shows none of its own,
 * `mixedLabel` in its place, said once with the field (a text field's
 * placeholder; Select's trigger's description). The visitor's first edit
 * comes through the field's own change callback, and the product then
 * clears `mixed`, so the field keeps its mixed state until it is edited.
 * `onResetMixed`, given for a field whose values differ, offers
 * `resetMixedLabel` once the field is no longer mixed; pressed, it calls
 * back for the product to drop the edit and set `mixed` again, and focus
 * returns to the field.
 *
 * Controlled or not: an uncontrolled Input or NumberInput is emptied as it
 * turns mixed and on reset; a Select given `mixed` always gives Radix a
 * value, holding the visitor's choice itself without the product's `value`.
 * NumberInput's steppers are disabled while it is mixed: a step would start
 * from nothing and write that number over every feature's own.
 */
export interface MixedValueProps {
  /** The field stands for several values that differ, and shows none. */
  mixed?: boolean;
  /** Shown in the empty field, and said with it. Default "Multiple values". */
  mixedLabel?: string;
  /**
   * Offer to go back to the several values: drawn under the field while it
   * is not `mixed`, and never while it is disabled or read-only.
   */
  onResetMixed?: () => void;
  /** The reset's words. Default "Reset to multiple values". */
  resetMixedLabel?: string;
}

export interface FieldWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  description?: React.ReactNode;
  descriptionId?: string;
  error?: boolean | string;
  errorId?: string;
  helperText?: string;
  helperId?: string;
  hideLabel?: boolean;
  label?: string;
  labelAction?: React.ReactNode;
  inputId?: string;
  /** Name a group of individually labelled controls, not one input. */
  group?: boolean;
  optionalText?: string;
  required?: boolean;
  status?: FieldStatus;
  /**
   * A character count, drawn on the message line.
   *
   * It sits BEFORE the message and inside the same element, so the count and
   * the reason read as one thing — "28/512 · Please enter at least 50
   * characters." — rather than as two stray fragments.
   *
   * When there is no message the count is drawn in a plain paragraph with no
   * role. It must not land in the `role="alert"` element: the count changes on
   * every keystroke, and an assertive region would make a screen reader read
   * the number back after each letter typed.
   */
  count?: React.ReactNode;
  countId?: string;
  /**
   * The field is mixed (GAP-153): `mixedLabel` is kept, hidden, under
   * `mixedId`, for the field's aria-describedby.
   */
  mixed?: boolean;
  mixedLabel?: string;
  mixedId?: string;
  /**
   * Draw the reset under the field while it is not mixed. Pressed, focus
   * goes to the element `inputId` names, then this is called.
   */
  onResetMixed?: () => void;
  resetMixedLabel?: string;
  children: React.ReactNode;
}

function fieldMessageClass(status: FieldStatus) {
  return cn(
    "kozmos-reset kozmos-field-message",
    status === "error" && "kozmos-field-error",
    status === "warning" && "kozmos-field-warning",
    status === "success" && "kozmos-field-success",
    status === "default" && "kozmos-field-default",
  );
}

export const FieldWrapper = React.forwardRef<HTMLDivElement, FieldWrapperProps>(
  (
    {
      className,
      description,
      descriptionId,
      error,
      errorId,
      helperText,
      helperId,
      hideLabel,
      label,
      labelAction,
      inputId,
      group = false,
      optionalText,
      required,
      status = "default",
      count,
      countId,
      mixed = false,
      mixedLabel = "Multiple values",
      mixedId,
      onResetMixed,
      resetMixedLabel = "Reset to multiple values",
      children,
      ...props
    },
    ref,
  ) => {
    const groupLabelId = React.useId();
    const LabelElement = group ? "span" : Label;
    const isStringError = typeof error === "string" && error.length > 0;
    const message = isStringError ? error : helperText;
    const messageId = isStringError ? errorId : helperId;
    const messageStatus = isStringError ? "error" : status;
    const showRequiredMark = required && !hideLabel;
    const showOptionalText = Boolean(
      !required && optionalText && label && !hideLabel,
    );

    return (
      <div
        ref={ref}
        className={cn("kozmos-reset kozmos-field", className)}
        data-status={messageStatus}
        role={group ? "group" : undefined}
        aria-labelledby={group && label ? groupLabelId : undefined}
        {...props}
      >
        {label && (
          <div className="kozmos-reset kozmos-field-heading">
            <LabelElement
              {...(group ? { id: groupLabelId } : { htmlFor: inputId })}
              className={cn(
                "kozmos-field-label",
                hideLabel && "kozmos-field-hidden",
              )}
            >
              {label}
              {showRequiredMark && (
                <span
                  aria-hidden="true"
                  className="kozmos-reset kozmos-field-required"
                  data-slot="required-mark"
                >
                  *
                </span>
              )}
            </LabelElement>
            {(showOptionalText || labelAction) && (
              <span className="kozmos-reset kozmos-field-optional">
                {labelAction || optionalText}
              </span>
            )}
          </div>
        )}
        {description && (
          <p
            id={descriptionId}
            className="kozmos-reset kozmos-field-message kozmos-field-default"
          >
            {description}
          </p>
        )}
        {children}
        {/* Hidden, and still the field's description: aria-describedby
          reads a hidden element. Seen, the words are the placeholder. */}
        {mixed && mixedId ? (
          <span id={mixedId} hidden>
            {mixedLabel}
          </span>
        ) : null}
        {!mixed && onResetMixed ? (
          <button
            type="button"
            className="kozmos-reset kozmos-field-reset"
            data-slot="reset-mixed"
            onClick={(event) => {
              // The button goes as the field turns mixed again: focus goes
              // to the field first, which is then read with its several
              // values, not lost to the page.
              if (inputId)
                event.currentTarget.ownerDocument
                  .getElementById(inputId)
                  ?.focus();
              onResetMixed();
            }}
          >
            {resetMixedLabel}
          </button>
        ) : null}
        {message ? (
          <p
            id={messageId}
            className={fieldMessageClass(messageStatus)}
            role={messageStatus === "error" ? "alert" : undefined}
            // Said as well as implied by the role: an open Select hides every
            // box not marked aria-live, its own field's error too (GAP-193).
            aria-live={messageStatus === "error" ? "assertive" : undefined}
          >
            {count != null && (
              <>
                <span data-slot="count">{count}</span>
                <span aria-hidden="true"> · </span>
              </>
            )}
            {message}
          </p>
        ) : (
          count != null && (
            // No role, and no live region: this changes on every keystroke.
            <p
              id={countId}
              data-slot="count"
              className={fieldMessageClass(messageStatus)}
            >
              {count}
            </p>
          )
        )}
      </div>
    );
  },
);

FieldWrapper.displayName = "FieldWrapper";

export type FormFieldProps = FieldWrapperProps;
export const FormField = FieldWrapper;
