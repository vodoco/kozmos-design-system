import React, { useEffect, useRef, useState } from "react";
import { cn } from "../../utils";
import { inputVariants, type InputStatus } from "../Input/inputVariants";
import { FieldWrapper } from "../FieldWrapper";
import { useKozmosAnalytics } from "../../utils/analytics";

export interface OTPInputProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> {
  disabled?: boolean;
  error?: boolean | string;
  helperText?: string;
  label?: string;
  length?: number;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  status?: InputStatus;
  value?: string;
  wrapperClassName?: string;
}

const sanitizeOtpValue = (nextValue: string, length: number) =>
  nextValue.replace(/\D/g, "").slice(0, length);

const normalizeOtpLength = (length: number) =>
  Math.max(1, Math.trunc(Number.isFinite(length) ? length : 1));

const OTPInput = React.forwardRef<HTMLDivElement, OTPInputProps>(
  (
    {
      autoFocus,
      className,
      disabled,
      error,
      helperText,
      id,
      label,
      length = 6,
      onChange,
      readOnly,
      status = "default",
      value,
      wrapperClassName,
      ...props
    },
    ref,
  ) => {
    const cellCount = normalizeOtpLength(length);
    const [otp, setOtp] = useState<string[]>(new Array(cellCount).fill(""));
    const inputs = useRef<(HTMLInputElement | null)[]>([]);
    const errorId = React.useId();
    const helperId = React.useId();
    const defaultInputId = React.useId();
    const inputId = id || defaultInputId;
    const hasError = !!error;
    const resolvedStatus: InputStatus = hasError ? "error" : status;
    const isInvalid = resolvedStatus === "error";
    const describedBy =
      hasError && typeof error === "string"
        ? errorId
        : helperText
          ? helperId
          : undefined;
    const { trackEvent } = useKozmosAnalytics();

    useEffect(() => {
      if (autoFocus) {
        inputs.current[0]?.focus();
      }
    }, [autoFocus]);

    useEffect(() => {
      setOtp((currentOtp) => {
        const source = sanitizeOtpValue(
          value ?? currentOtp.join(""),
          cellCount,
        );
        const nextOtp = source.split("").slice(0, cellCount);
        while (nextOtp.length < cellCount) nextOtp.push("");

        if (
          nextOtp.length === currentOtp.length &&
          nextOtp.join("") === currentOtp.join("")
        ) {
          return currentOtp;
        }

        return nextOtp;
      });
    }, [value, cellCount]);

    const handleChange = (
      event: React.ChangeEvent<HTMLInputElement>,
      index: number,
    ) => {
      if (readOnly) return;

      const nextValue = event.target.value;
      const filteredValue = sanitizeOtpValue(nextValue, cellCount - index);
      if (!filteredValue && nextValue) return;

      const nextOtp = [...otp];
      filteredValue.split("").forEach((digit, offset) => {
        if (index + offset < cellCount) {
          nextOtp[index + offset] = digit;
        }
      });

      if (!filteredValue) {
        nextOtp[index] = "";
      }
      setOtp(nextOtp);

      const joined = nextOtp.join("");
      onChange?.(joined);
      if (joined.length === cellCount && !joined.includes("")) {
        trackEvent("OTPInput", "otp_code_completed", { length: cellCount });
      }

      if (filteredValue && index < cellCount - 1) {
        inputs.current[
          Math.min(index + filteredValue.length, cellCount - 1)
        ]?.focus();
      }
    };

    const handleKeyDown = (
      event: React.KeyboardEvent<HTMLInputElement>,
      index: number,
    ) => {
      if (event.key === "Backspace" && !otp[index] && index > 0) {
        inputs.current[index - 1]?.focus();
      }
    };

    const handlePaste = (event: React.ClipboardEvent) => {
      if (readOnly) return;

      event.preventDefault();
      const pastedData = sanitizeOtpValue(
        event.clipboardData.getData("text/plain"),
        cellCount,
      );
      if (!pastedData) return;

      const nextOtp = pastedData.split("");
      while (nextOtp.length < cellCount) nextOtp.push("");
      setOtp(nextOtp);
      onChange?.(nextOtp.join(""));
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
        <div
          ref={ref}
          className={cn("flex w-full items-center gap-2", className)}
          {...props}
        >
          {otp.map((digit, index) => (
            <input
              key={index}
              id={index === 0 ? inputId : `${inputId}-${index + 1}`}
              ref={(el) => {
                inputs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={digit}
              onChange={(event) => handleChange(event, index)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              onPaste={handlePaste}
              disabled={disabled}
              readOnly={readOnly}
              aria-invalid={isInvalid || undefined}
              aria-describedby={describedBy}
              aria-label={`Digit ${index + 1} of ${cellCount}`}
              // The cell's square, padding and centred digit are owned CSS:
              // WebKit applies no scoped utility to an <input> (GAP-174).
              className={cn(
                inputVariants({ status: resolvedStatus }),
                "kozmos-otp-cell",
              )}
            />
          ))}
        </div>
      </FieldWrapper>
    );
  },
);
OTPInput.displayName = "OTPInput";

export { OTPInput };
