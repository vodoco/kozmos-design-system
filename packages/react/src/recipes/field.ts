/**
 * FieldWrapper's recipe: the field a label, a description, a control and its
 * message are drawn in, for every framework that draws one. React's
 * `FieldWrapper` and Vue's `KozmosFieldWrapper` both build their element
 * from it, and every field drawn inside one (Input, Textarea, PasswordInput,
 * NumberInput, OTPInput) with them. Framework-free
 * (`recipes.framework-free.test.ts`).
 */
import { cn } from "../utils";

export type FieldStatus = "default" | "error" | "warning" | "success";

/** The field, its heading (the label and what sits at its end) and its parts. */
export const FIELD_CLASS = "kozmos-reset kozmos-field";
export const FIELD_HEADING_CLASS = "kozmos-reset kozmos-field-heading";
export const FIELD_REQUIRED_CLASS = "kozmos-reset kozmos-field-required";
export const FIELD_OPTIONAL_CLASS = "kozmos-reset kozmos-field-optional";
export const FIELD_DESCRIPTION_CLASS =
  "kozmos-reset kozmos-field-message kozmos-field-default";
export const FIELD_RESET_CLASS = "kozmos-reset kozmos-field-reset";

/** The label's class: hidden, it is still the field's name. */
export function fieldLabelClass(hideLabel?: boolean) {
  return cn("kozmos-field-label", hideLabel && "kozmos-field-hidden");
}

/** The message line's class, in the message's status. */
export function fieldMessageClass(status: FieldStatus) {
  return cn(
    "kozmos-reset kozmos-field-message",
    status === "error" && "kozmos-field-error",
    status === "warning" && "kozmos-field-warning",
    status === "success" && "kozmos-field-success",
    status === "default" && "kozmos-field-default",
  );
}

/**
 * What the message line says, and how: a string error wins over the helper
 * text and is said in the error's status; an empty or a boolean error leaves
 * the helper, in the field's own status.
 */
export function fieldMessage({
  error,
  errorId,
  helperText,
  helperId,
  status,
}: {
  error?: boolean | string;
  errorId?: string;
  helperText?: string;
  helperId?: string;
  status: FieldStatus;
}) {
  const isStringError = typeof error === "string" && error.length > 0;
  return {
    message: isStringError ? error : helperText,
    messageId: isStringError ? errorId : helperId,
    messageStatus: (isStringError ? "error" : status) as FieldStatus,
  };
}

/**
 * The id a field's control is described by: its string error's, else its
 * helper's. Input, PasswordInput, NumberInput and OTPInput say it alike.
 */
export function fieldDescribedBy({
  error,
  errorId,
  helperText,
  helperId,
}: {
  error?: boolean | string;
  errorId: string;
  helperText?: string;
  helperId: string;
}) {
  return error && typeof error === "string"
    ? errorId
    : helperText
      ? helperId
      : undefined;
}
