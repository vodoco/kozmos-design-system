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

const isDecimalDigit = (character: string) => /^\p{Nd}$/u.test(character);

/**
 * The ASCII digit of a decimal digit's value, in any script: "٣" (Arabic-
 * Indic), "۳" (Extended Arabic-Indic), "३" (Devanagari) and "３" (full-width)
 * are all "3". Unicode encodes every script's decimal digits as ten contiguous
 * code points, zero first, and some sets sit back to back (five sets of
 * mathematical digits run as one), so a digit's value is its distance from
 * the start of its run of digits, modulo ten.
 */
const toAsciiDigit = (digit: string) => {
  const codePoint = digit.codePointAt(0)!;
  let zero = codePoint;
  while (isDecimalDigit(String.fromCodePoint(zero - 1))) zero -= 1;
  return String((codePoint - zero) % 10);
};

/**
 * Keeps the decimal digits (general category Nd, in any script) as their
 * ASCII values, at most `length` of them, and drops everything else, so the
 * cells and `onChange` only ever hold "0"-"9". "²" and "½" are numbers but not
 * decimal digits, so they are dropped.
 */
const sanitizeOtpValue = (nextValue: string, length: number) =>
  Array.from(nextValue.replace(/\P{Nd}/gu, ""))
    .slice(0, length)
    .map(toAsciiDigit)
    .join("");

const normalizeOtpLength = (length: number) =>
  Math.max(1, Math.trunc(Number.isFinite(length) ? length : 1));

const toOtpCells = (source: string, cellCount: number) => {
  const cells = sanitizeOtpValue(source, cellCount).split("");
  while (cells.length < cellCount) cells.push("");
  return cells;
};

const isOtpComplete = (cells: string[]) => cells.every((cell) => cell !== "");

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
    const [otp, setOtp] = useState(() => toOtpCells(value ?? "", cellCount));
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
              value={composition?.index === index ? composition.text : digit}
              onChange={(event) => handleChange(event, index)}
              onCompositionStart={() => handleCompositionStart(index)}
              onCompositionEnd={(event) => handleCompositionEnd(event, index)}
              onBlur={() => handleBlur(index)}
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
