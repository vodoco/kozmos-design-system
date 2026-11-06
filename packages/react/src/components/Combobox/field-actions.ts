/**
 * The clear and open buttons Combobox and MultiSelect draw at their field's
 * end, from one copy so the two cannot drift (decision 82; owner, 24 Oct
 * 2026). Internal.
 *
 * - The row sits out of the field's line, at its end, so the field keeps its
 *   height; it lets presses through between the buttons.
 * - Each button is as tall as the field, its hit target: 44 in touch, 40 in
 *   compact. It fills nothing of its own, so the field's edge it lies over
 *   stays drawn. Hovered, it draws a fill inside itself, 4 in from its edges
 *   and its corners the field's less 4, as Input's, PasswordInput's,
 *   DatePicker's and TimePicker's buttons do (decision 164): the owned rule
 *   on `kozmos-combobox-action` in owned-native-fields.css, with no fill at
 *   rest, disabled or in forced colours. MultiSelect's field draws no ring
 *   of its own while one of them has focus (owned-selection.css).
 * - The room is the field's padding at its end, after its own padding, so a
 *   caller's `px-*` sets the start and this end stays; a caller's `p-*` or
 *   `pe-*` replaces it, and content then runs under the buttons.
 */
export const FIELD_ACTIONS_ROW =
  "kozmos-combobox-actions pointer-events-none absolute inset-y-0 end-0 flex items-center";

export const FIELD_ACTION =
  "kozmos-combobox-action pointer-events-auto inline-flex h-field w-field items-center justify-center rounded-control text-muted-foreground ring-offset-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

/** Room for the open button, and the clear beside it when there is one. */
export function fieldActionsRoom(withClear: boolean) {
  return withClear
    ? "pe-[calc(var(--density-field-height-md,2.75rem)_*_2_+_0.5rem)]"
    : "pe-[calc(var(--density-field-height-md,2.75rem)_+_0.25rem)]";
}
