import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, mergeAriaIds } from "../../utils";
import { FieldWrapper } from "../FieldWrapper";
import {
  resolveCharacterCount,
  useUncontrolledValue,
  type CharacterCount,
} from "../FieldWrapper/characterCount";

const textareaVariants = cva("kozmos-reset kozmos-textarea");

export interface TextareaProps
  extends
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  error?: boolean | string;
  label?: string;
  wrapperClassName?: string;
  /**
   * Draw a character count under the field, and say when it is wrong.
   *
   * `limit` is a soft maximum: going over is an error the visitor is told
   * about, not a keystroke the browser swallows. Use `maxLength` as well only
   * when truncating silently is genuinely what you want.
   */
  count?: CharacterCount;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      wrapperClassName,
      error,
      label,
      count,
      "aria-describedby": callerDescribedBy,
      "aria-invalid": callerInvalid,
      ...props
    },
    ref,
  ) => {
    const errorId = React.useId();
    const countId = React.useId();
    const mirror = useUncontrolledValue(props.value, props.defaultValue);
    const counted = resolveCharacterCount(count, mirror.value);
    // A caller's own error wins: it knows something the count does not.
    const resolvedError = error || counted?.message;
    const hasError = !!resolvedError;
    const isStringError = typeof resolvedError === "string";

    const defaultInputId = React.useId();
    const inputId = props.id || defaultInputId;

    return (
      <FieldWrapper
        error={resolvedError}
        errorId={errorId}
        label={label}
        inputId={inputId}
        count={counted?.text}
        countId={countId}
        className={wrapperClassName}
      >
        <textarea
          id={inputId}
          className={cn(
            textareaVariants(),
            hasError && "kozmos-textarea-error",
            className,
          )}
          ref={ref}
          aria-invalid={hasError ? true : (callerInvalid ?? false)}
          aria-describedby={mergeAriaIds(
            callerDescribedBy,
            hasError && isStringError ? errorId : undefined,
            !hasError && counted ? countId : undefined,
          )}
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

Textarea.displayName = "Textarea";
