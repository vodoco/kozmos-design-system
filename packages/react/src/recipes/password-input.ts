/**
 * PasswordInput's recipe: its field, the room it keeps for its reveal and
 * the reveal itself, for every framework that draws one. React's
 * `PasswordInput` and Vue's `KozmosPasswordInput` both build their element
 * from it, on Input's recipe. Framework-free
 * (`recipes.framework-free.test.ts`).
 */

export const PASSWORD_FIELD_CLASS = "kozmos-reset kozmos-password-field";
/**
 * Room for the toggle (decision 82): the utility beats a caller's px-*; the
 * owned rule holds it where no @scope rule reaches an <input> (WebKit).
 */
export const PASSWORD_WITH_TOGGLE_CLASS =
  "kozmos-password-with-toggle pe-[calc(var(--density-field-height-md,2.75rem)_+_0.25rem)]";
export const PASSWORD_TOGGLE_CLASS =
  "kozmos-reset kozmos-field-action kozmos-password-toggle";
