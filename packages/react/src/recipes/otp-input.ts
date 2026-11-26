/**
 * OTPInput's recipe: its row of cells and how a code is read into them, for
 * every framework that draws one. React's `OTPInput` and Vue's
 * `KozmosOTPInput` both build their element from it, on Input's recipe.
 * Framework-free (`recipes.framework-free.test.ts`).
 */

/** The row of cells: it fills its parent. */
export const OTP_ROW_CLASS = "flex w-full items-center gap-2";
/**
 * The cell's square, padding and centred digit are owned CSS: WebKit
 * applies no scoped utility to an <input> (GAP-174).
 */
export const OTP_CELL_CLASS = "kozmos-otp-cell";

/** A cell's id: the field's own for the first, which its label names. */
export const otpCellId = (inputId: string, index: number) =>
  index === 0 ? inputId : `${inputId}-${index + 1}`;

/** A cell's name: "Digit 2 of 6". */
export const otpCellLabel = (index: number, cellCount: number) =>
  `Digit ${index + 1} of ${cellCount}`;

export const isDecimalDigit = (character: string) =>
  /^\p{Nd}$/u.test(character);

/**
 * The ASCII digit of a decimal digit's value, in any script: "٣" (Arabic-
 * Indic), "۳" (Extended Arabic-Indic), "३" (Devanagari) and "３" (full-width)
 * are all "3". Unicode encodes every script's decimal digits as ten contiguous
 * code points, zero first, and some sets sit back to back (five sets of
 * mathematical digits run as one), so a digit's value is its distance from
 * the start of its run of digits, modulo ten.
 */
export const toAsciiDigit = (digit: string) => {
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
export const sanitizeOtpValue = (nextValue: string, length: number) =>
  Array.from(nextValue.replace(/\P{Nd}/gu, ""))
    .slice(0, length)
    .map(toAsciiDigit)
    .join("");

export const normalizeOtpLength = (length: number) =>
  Math.max(1, Math.trunc(Number.isFinite(length) ? length : 1));

export const toOtpCells = (source: string, cellCount: number) => {
  const cells = sanitizeOtpValue(source, cellCount).split("");
  while (cells.length < cellCount) cells.push("");
  return cells;
};

export const isOtpComplete = (cells: string[]) =>
  cells.every((cell) => cell !== "");
