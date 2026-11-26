import React, { useEffect, useRef, useState } from "react";
import { cn } from "../../utils";
import { inputVariants, type InputStatus } from "../Input/inputVariants";
import { FieldWrapper } from "../FieldWrapper";
import { fieldDescribedBy } from "../../recipes/field";
import {
  OTP_CELL_CLASS,
  OTP_ROW_CLASS,
  isDecimalDigit,
  isOtpComplete,
  normalizeOtpLength,
  otpCellId,
  otpCellLabel,
  sanitizeOtpValue,
  toOtpCells,
} from "../../recipes/otp-input";
import { useKozmosAnalytics } from "../../utils/analytics";

export interface OTPInputProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onChange"
> {
  /**
   * The code an uncontrolled field starts with, read on mount only: its
   * decimal digits in any script, as ASCII and at most `length` of them, as
   * `value`'s are. `value` wins when both are given. It calls no `onChange`
   * and is no completion the user made, so it tracks no `otp_code_completed`;
   * a full one the user edits is a full code. A new `key` starts the field
   * with it again.
   */
  defaultValue?: string;
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

const OTPInput = React.forwardRef<HTMLDivElement, OTPInputProps>(
  (
    {
      autoFocus,
      className,
      defaultValue,
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
    const [otp, setOtp] = useState(() =>
      toOtpCells(value ?? defaultValue ?? "", cellCount),
    );
    // The cells follow `value` and the cell count during render, so no
    // frame, the first included, draws cells the props have moved past
    // (React's pattern for adjusting state when a prop changes). Without a
    // value, a new count keeps the digits typed so far, closed up into the
    // first cells and as many as fit, as it always has. Cells that already
    // spell the new code stay as they are, so a digit typed into a later
    // cell keeps its place when its code comes back as `value`.
    const [drawnFrom, setDrawnFrom] = useState({ value, cellCount });
    if (drawnFrom.value !== value || drawnFrom.cellCount !== cellCount) {
      setDrawnFrom({ value, cellCount });
      setOtp((currentOtp) => {
        const nextOtp = toOtpCells(value ?? currentOtp.join(""), cellCount);

        if (
          nextOtp.length === currentOtp.length &&
          nextOtp.join("") === currentOtp.join("")
        ) {
          return currentOtp;
        }

        return nextOtp;
      });
    }
    const inputs = useRef<(HTMLInputElement | null)[]>([]);
    const errorId = React.useId();
    const helperId = React.useId();
    const defaultInputId = React.useId();
    const inputId = id || defaultInputId;
    const hasError = !!error;
    const resolvedStatus: InputStatus = hasError ? "error" : status;
    const isInvalid = resolvedStatus === "error";
    const describedBy = fieldDescribedBy({
      error,
      errorId,
      helperText,
      helperId,
    });
    const { trackEvent } = useKozmosAnalytics();

    // autoFocus puts the caret where the next digit goes: the first empty
    // cell, or the last when the code is full. A filled cell takes no key
    // (each holds one digit), so focusing the first cell of a code the host
    // started, by `value` or `defaultValue`, left typing doing nothing.
    useEffect(() => {
      if (autoFocus) {
        const cells = inputs.current.filter(
          (input): input is HTMLInputElement => !!input?.isConnected,
        );
        const firstEmpty = cells.findIndex((input) => input.value === "");
        cells[firstEmpty === -1 ? cells.length - 1 : firstEmpty]?.focus();
      }
    }, [autoFocus]);

    // Analytics hears a code completed once: when the user's typing or paste
    // fills the last empty cell. Editing a full code is the same completion,
    // and a controlled value from the parent is not the user's.
    const trackCompletion = (nextOtp: string[]) => {
      if (!isOtpComplete(otp) && isOtpComplete(nextOtp)) {
        trackEvent("OTPInput", "otp_code_completed", { length: cellCount });
      }
    };

    // An IME's composition is entered once, when it ends. A Japanese or
    // Chinese IME composes a full-width digit, and the browser sends input
    // events while it does: entering each one moved the focus on while the
    // IME was still composing, so its commit landed in the next cell as well
    // ("１" composed in Chromium gave 1 1 _ _, and onChange "1" then "11").
    // Until compositionend, the cell draws the IME's text as it is, so React
    // does not write over it, and the focus stays.
    const composingCell = useRef<number | null>(null);
    const [composition, setComposition] = useState<{
      index: number;
      text: string;
    } | null>(null);
    // A composition React never hears end leaves no cell composing: one in a
    // cell that is disabled or made read-only (no compositionend reaches
    // React then), or in a cell a shorter `length` removes.
    const composingGone = (index: number | null) =>
      index !== null && (!!disabled || !!readOnly || index >= cellCount);
    if (composingGone(composingCell.current)) composingCell.current = null;
    if (composition && composingGone(composition.index)) setComposition(null);

    const enterDigits = (nextValue: string, index: number) => {
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

      onChange?.(nextOtp.join(""));
      trackCompletion(nextOtp);

      if (filteredValue && index < cellCount - 1) {
        inputs.current[
          Math.min(index + filteredValue.length, cellCount - 1)
        ]?.focus();
      }
    };

    const handleChange = (
      event: React.ChangeEvent<HTMLInputElement>,
      index: number,
    ) => {
      if (readOnly) return;

      const { inputType, isComposing } = event.nativeEvent as InputEvent;
      if (isComposing || composingCell.current === index) {
        setComposition({ index, text: event.target.value });
        return;
      }
      // Input Events Level 2 sends a composition's text again after
      // compositionend, which has already entered it.
      if (
        inputType === "insertFromComposition" ||
        inputType === "deleteCompositionText"
      )
        return;

      enterDigits(event.target.value, index);
    };

    const handleCompositionStart = (index: number) => {
      composingCell.current = index;
    };

    const handleCompositionEnd = (
      event: React.CompositionEvent<HTMLInputElement>,
      index: number,
    ) => {
      composingCell.current = null;
      setComposition(null);
      if (readOnly) return;

      // A composition cancelled, or one that left the cell as it was,
      // enters nothing.
      const { value } = event.currentTarget;
      if (value === otp[index]) return;
      enterDigits(value, index);
    };

    // A composition the focus leaves without its compositionend reaching
    // React is over too.
    const handleBlur = (index: number) => {
      if (composingCell.current !== index) return;
      composingCell.current = null;
      setComposition(null);
    };

    const handleKeyDown = (
      event: React.KeyboardEvent<HTMLInputElement>,
      index: number,
    ) => {
      // Backspace inside a composition edits the IME's text. Safari's
      // keydown that ends a composition has keyCode 229 and no isComposing.
      if (event.nativeEvent.isComposing || event.keyCode === 229) return;
      // A digit typed into a filled cell replaces its digit and moves on
      // (GAP-239): each cell holds one, so with its digit unselected the key
      // was dropped, and the same digit typed over itself changed nothing,
      // so the focus stayed. A keyboard's digit is entered here; a touch
      // keyboard's, which names no key, through the selection (below).
      if (
        !readOnly &&
        otp[index] &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        isDecimalDigit(event.key)
      ) {
        event.preventDefault();
        enterDigits(event.key, index);
        return;
      }
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
      trackCompletion(nextOtp);
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
        <div ref={ref} className={cn(OTP_ROW_CLASS, className)} {...props}>
          {otp.map((digit, index) => (
            <input
              key={index}
              id={otpCellId(inputId, index)}
              ref={(el) => {
                inputs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={composition?.index === index ? composition.text : digit}
              onChange={(event) => handleChange(event, index)}
              onCompositionStart={() => handleCompositionStart(index)}
              onCompositionEnd={(event) => handleCompositionEnd(event, index)}
              onBlur={() => handleBlur(index)}
              // A focused cell's digit is selected, as Tab selects it, so
              // typing replaces it: after a click, and when the field moves
              // the focus on as each digit is typed (GAP-239).
              onFocus={(event) => event.currentTarget.select()}
              onInput={(event) => {
                // The same digit typed over a selected one changes nothing,
                // so no change is heard: the focus still moves on.
                const { data, inputType } = event.nativeEvent as InputEvent;
                if (
                  inputType === "insertText" &&
                  data &&
                  otp[index] &&
                  sanitizeOtpValue(data, 1) === otp[index] &&
                  event.currentTarget.value === otp[index] &&
                  index < cellCount - 1
                )
                  inputs.current[index + 1]?.focus();
              }}
              onMouseUp={(event) => {
                // A click places the caret after the focus selected the
                // digit: WebKit as its mouseup ends, unless it is refused.
                const cell = event.currentTarget;
                if (cell.value) {
                  event.preventDefault();
                  cell.select();
                }
              }}
              onKeyDown={(event) => handleKeyDown(event, index)}
              onPaste={handlePaste}
              disabled={disabled}
              readOnly={readOnly}
              aria-invalid={isInvalid || undefined}
              aria-describedby={describedBy}
              aria-label={otpCellLabel(index, cellCount)}
              // The cell's square, padding and centred digit are owned CSS
              // (GAP-174).
              className={cn(
                inputVariants({ status: resolvedStatus }),
                OTP_CELL_CLASS,
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
