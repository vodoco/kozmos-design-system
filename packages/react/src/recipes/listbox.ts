/**
 * Listbox's recipe: the list's classes and the arithmetic its keys move by,
 * for every framework that draws one. React's `Listbox` builds its element
 * from it, and so does Vue's `KozmosListbox`. Framework-free
 * (`recipes.framework-free.test.ts`).
 */
import { orderByGroup } from "./option";

export const LISTBOX_CLASS = "kozmos-reset kozmos-listbox";
/** Embedded (GAP-271): no panel of its own, inside a box that is one. */
export const LISTBOX_EMBEDDED_CLASS = "kozmos-listbox-embedded";

/** A row's id in a list whose id is `listboxId`, by its drawn index. */
export const listboxRowId = (listboxId: string, index: number) =>
  `${listboxId}-option-${index}`;

/**
 * The id of the option `value` names in a Listbox whose `id` is
 * `listboxId`, for a field's `aria-activedescendant` (GAP-260); undefined
 * for a value it does not list. Options are drawn under their groups, so
 * pass the same options the Listbox is given.
 */
export function listboxOptionId(
  listboxId: string,
  options: { group?: string; value: string }[],
  value: string | null | undefined,
) {
  if (value == null) return undefined;
  const index = orderByGroup(options).findIndex(
    (option) => option.value === value,
  );
  return index >= 0 ? listboxRowId(listboxId, index) : undefined;
}

/** A Listbox's value as the list of values it selects. */
export function asValueArray(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

/**
 * Where the list starts: a chosen option, as the WAI-ARIA listbox has it,
 * else the first that can be chosen; -1 when none can.
 */
export function firstEnabledIndex(
  options: { disabled?: boolean; value?: string }[],
  selected?: string[],
) {
  const chosen = options.findIndex(
    (option) =>
      !option.disabled &&
      option.value !== undefined &&
      !!selected?.includes(option.value),
  );
  return chosen >= 0 ? chosen : options.findIndex((option) => !option.disabled);
}

/**
 * The value a choice of `optionValue` makes: a multiple list toggles it in
 * or out of its values, a single one takes it.
 */
export function listboxNextValue(
  selectedValues: string[],
  optionValue: string,
  multiple: boolean | undefined,
): string | string[] {
  if (!multiple) return optionValue;
  return selectedValues.includes(optionValue)
    ? selectedValues.filter((selected) => selected !== optionValue)
    : [...selectedValues, optionValue];
}
