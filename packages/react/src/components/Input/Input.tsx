import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, mergeAriaIds } from "../../utils";
import { FieldWrapper } from "../FieldWrapper";
import {
  resolveCharacterCount,
  useUncontrolledValue,
  type CharacterCount,
} from "../FieldWrapper/characterCount";

export type InputStatus = "default" | "error" | "warning" | "success";

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
        <input
          type={type}
          id={inputId}
          className={cn(inputVariants({ status: resolvedStatus }), className)}
          ref={ref}
          aria-invalid={isInvalid ? true : callerInvalid}
          aria-describedby={mergeAriaIds(callerDescribedBy, describedBy)}
          {...props}
          onInput={(event) => {
            mirror.onInput?.(event);
            props.onInput?.(event);
          }}
        />
      </FieldWrapper>
    );
  },
);

Input.displayName = "Input";
