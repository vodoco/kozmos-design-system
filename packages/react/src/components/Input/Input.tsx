import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, Copy01 } from "@kozmos-ds/icons";
import { cn, mergeAriaIds } from "../../utils";
import { FieldWrapper } from "../FieldWrapper";
import {
  resolveCharacterCount,
  useUncontrolledValue,
  type CharacterCount,
} from "../FieldWrapper/characterCount";

export type InputStatus = "default" | "error" | "warning" | "success";

/**
 * A button inside the field's end (GAP-154), drawn as PasswordInput's reveal
 * is: as tall as the field, its ring its own.
 *
 * - `copy` copies the field's value and says so: "Copied" in a polite live
 *   region, and a check in place of the copy icon for two seconds. For a
 *   read-only value a product shows and never edits, a feature's ID.
 * - `toggle` is a pressed button with its own name, as the reveal is: the
 *   Featured star at a field's end. `icon` is the product's; pressed, it is
 *   drawn in the theme's colour.
 */
export type InputAction =
  | {
      kind: "copy";
      /** The button's name. Default "Copy". */
      label?: string;
      /** What is announced once the value is copied. Default "Copied". */
      copiedLabel?: string;
      onCopy?: (value: string) => void;
    }
  | {
      kind: "toggle";
      label: string;
      icon: React.ReactNode;
      pressed: boolean;
      onPressedChange: (pressed: boolean) => void;
    };

export const inputVariants = cva("kozmos-reset kozmos-input", {
  variants: {
    status: {
      default: "",
      error: "kozmos-input-error",
      warning: "kozmos-input-warning",
      success: "kozmos-input-success",
    },
    error: {
      true: "kozmos-input-error",
    },
  },
});

export interface InputProps
  extends
    React.InputHTMLAttributes<HTMLInputElement>,
    Omit<VariantProps<typeof inputVariants>, "error" | "status"> {
  error?: boolean | string;
  helperText?: string;
  label?: string;
  status?: InputStatus;
  wrapperClassName?: string;
  /**
   * Draw a character count under the field, and say when it is wrong.
   *
   * `limit` is a soft maximum: going over is an error the visitor is told
   * about, not a keystroke the browser swallows.
   */
  count?: CharacterCount;
  /** A copy or toggle button inside the field's end (GAP-154). */
  action?: InputAction;
}

/**
 * The button at the field's end: a copy, with the live region that says it
 * copied, or a pressed toggle.
 */
function FieldAction({
  action,
  disabled,
}: {
  action: InputAction;
  disabled?: boolean;
}) {
  const [said, setSaid] = React.useState("");
  React.useEffect(() => {
    if (!said) return;
    const timer = setTimeout(setSaid, 2000, "");
    return () => clearTimeout(timer);
  }, [said]);
  const copy = action.kind === "copy";
  const icon = "kozmos-reset kozmos-field-action-icon";
  return (
    <>
      <button
        type="button"
        aria-label={copy ? (action.label ?? "Copy") : action.label}
        aria-pressed={copy ? undefined : action.pressed}
        className="kozmos-reset kozmos-field-action kozmos-input-action"
        disabled={disabled}
        onClick={async (event) => {
          if (!copy) return action.onPressedChange(!action.pressed);
          const value = (
            event.currentTarget.previousElementSibling as HTMLInputElement
          ).value;
          try {
            await navigator.clipboard.writeText(value);
          } catch {
            return;
          }
          const copied = action.copiedLabel ?? "Copied";
          // The same words twice are not read twice: a second copy changes
          // them by a no-break space.
          setSaid((previous) =>
            previous === copied ? `${copied}\u00a0` : copied,
          );
          action.onCopy?.(value);
        }}
      >
        {!copy ? (
          action.icon
        ) : said ? (
          <Check className={icon} aria-hidden="true" />
        ) : (
          <Copy01 className={icon} aria-hidden="true" />
        )}
      </button>
      {/* In the page from the start, so the change is read. */}
      {copy ? (
        <span className="sr-only" role="status" aria-live="polite">
          {said}
        </span>
      ) : null}
    </>
  );
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      error,
      helperText,
      label,
      status = "default",
      wrapperClassName,
      count,
      action,
      "aria-describedby": callerDescribedBy,
      "aria-invalid": callerInvalid,
      ...props
    },
    ref,
  ) => {
    const errorId = React.useId();
    const helperId = React.useId();
    const countId = React.useId();
    const mirror = useUncontrolledValue(props.value, props.defaultValue);
    const counted = resolveCharacterCount(count, mirror.value);
    // A caller's own error wins: it knows something the count does not.
    const resolvedError = error || counted?.message;
    const hasError = !!resolvedError;
    const resolvedStatus: InputStatus = hasError ? "error" : status;
    const isInvalid = resolvedStatus === "error";
    const describedBy =
      hasError && typeof resolvedError === "string"
        ? errorId
        : helperText
          ? helperId
          : counted
            ? countId
            : undefined;

    const defaultInputId = React.useId();
    const inputId = props.id || defaultInputId;
    const field = (
      <input
        type={type}
        id={inputId}
        className={cn(
          inputVariants({ status: resolvedStatus }),
          // Room for the action, as PasswordInput keeps for its toggle: the
          // utility beats a caller's px-*, the owned rule holds in WebKit.
          action &&
            "kozmos-input-with-action pe-[calc(var(--density-field-height-md,2.75rem)_+_0.25rem)]",
          className,
        )}
        ref={ref}
        aria-invalid={isInvalid ? true : callerInvalid}
        aria-describedby={mergeAriaIds(callerDescribedBy, describedBy)}
        {...props}
        onInput={(event) => {
          mirror.onInput?.(event);
          props.onInput?.(event);
        }}
      />
    );

    return (
      <FieldWrapper
        error={resolvedError}
        errorId={errorId}
        count={counted?.text}
        countId={countId}
        helperId={helperId}
        helperText={helperText}
        label={label}
        inputId={inputId}
        status={resolvedStatus}
        className={wrapperClassName}
      >
        {action ? (
          <div className="kozmos-reset kozmos-password-field">
            {field}
            <FieldAction action={action} disabled={props.disabled} />
          </div>
        ) : (
          field
        )}
      </FieldWrapper>
    );
  },
);

Input.displayName = "Input";
