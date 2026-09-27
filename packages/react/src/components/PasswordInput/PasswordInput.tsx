import React from "react";
import { Eye, EyeOff } from "@kozmos-ds/icons";
import { cn, mergeAriaIds } from "../../utils";
import { FieldWrapper } from "../FieldWrapper";
import { inputVariants, type InputStatus } from "../Input/Input";

export interface PasswordInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  defaultVisible?: boolean;
  error?: boolean | string;
  helperText?: string;
  hidePasswordLabel?: string;
  label?: string;
  onVisibleChange?: (visible: boolean) => void;
  showPasswordLabel?: string;
  showToggle?: boolean;
  status?: InputStatus;
  visible?: boolean;
  wrapperClassName?: string;
}

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  PasswordInputProps
>(
  (
    {
      className,
      defaultVisible = false,
      disabled,
      error,
      helperText,
      hidePasswordLabel = "Hide password",
      label,
      onVisibleChange,
      showPasswordLabel = "Show password",
      showToggle = true,
      status = "default",
      visible,
      wrapperClassName,
      "aria-describedby": callerDescribedBy,
      "aria-invalid": callerInvalid,
      ...props
    },
    ref,
  ) => {
    const [internalVisible, setInternalVisible] =
      React.useState(defaultVisible);
    const isVisible = visible ?? internalVisible;
    const errorId = React.useId();
    const helperId = React.useId();
    const defaultInputId = React.useId();
    const inputId = props.id || defaultInputId;
    const hasError = !!error;
    const resolvedStatus: InputStatus = hasError ? "error" : status;
    const isInvalid = resolvedStatus === "error";
    const describedBy =
      hasError && typeof error === "string"
        ? errorId
        : helperText
          ? helperId
          : undefined;

    const handleToggle = () => {
      const nextVisible = !isVisible;
      if (visible === undefined) {
        setInternalVisible(nextVisible);
      }
      onVisibleChange?.(nextVisible);
    };

    return (
      <FieldWrapper
        error={error}
        errorId={errorId}
        helperId={helperId}
        helperText={helperText}
        label={label}
        inputId={inputId}
        status={resolvedStatus}
        className={wrapperClassName}
      >
        <div className="kozmos-reset kozmos-password-field">
          <input
            {...props}
            type={isVisible ? "text" : "password"}
            id={inputId}
            className={cn(
              inputVariants({ status: resolvedStatus }),
              showToggle && "kozmos-password-with-toggle",
              className,
            )}
            ref={ref}
            disabled={disabled}
            aria-invalid={isInvalid ? true : callerInvalid}
            aria-describedby={mergeAriaIds(callerDescribedBy, describedBy)}
          />
          {showToggle && (
            <button
              type="button"
              aria-label={isVisible ? hidePasswordLabel : showPasswordLabel}
              aria-pressed={isVisible}
              className="kozmos-reset kozmos-field-action kozmos-password-toggle"
              disabled={disabled}
              onClick={handleToggle}
            >
              {isVisible ? (
                <EyeOff
                  className="kozmos-reset kozmos-field-action-icon"
                  aria-hidden="true"
                />
              ) : (
                <Eye
                  className="kozmos-reset kozmos-field-action-icon"
                  aria-hidden="true"
                />
              )}
            </button>
          )}
        </div>
      </FieldWrapper>
    );
  },
);

PasswordInput.displayName = "PasswordInput";
