/**
 * The option row Listbox, Combobox, MultiSelect and Select draw, and the
 * groups the rows are listed under (GAP-192), for every framework that draws
 * them: React's `OptionRow` and `renderOptionGroups` build their elements
 * from it, and so do Vue's `KozmosListbox` and `KozmosCombobox`, so the rows
 * cannot drift. The look is owned CSS (owned-selection.css). Framework-free
 * (`recipes.framework-free.test.ts`).
 */

/** The row: the widget around it owns its focus and its selection. */
export const OPTION_CLASS = "kozmos-reset kozmos-option";
/** The leading Avatar's class (decision 215). */
export const OPTION_MEDIA_CLASS = "kozmos-option-media";
export const OPTION_CONTENT_CLASS = "kozmos-reset kozmos-option-content";
export const OPTION_LABEL_CLASS = "kozmos-reset kozmos-option-label";
export const OPTION_DESCRIPTION_CLASS =
  "kozmos-reset kozmos-option-description";
export const OPTION_TRAILING_CLASS = "kozmos-reset kozmos-option-trailing";
export const OPTION_CHECK_CLASS = "kozmos-reset kozmos-option-check";
/** A group of options, a `role="group"` named by its label. */
export const OPTION_GROUP_CLASS = "kozmos-reset kozmos-option-group";
export const OPTION_GROUP_LABEL_CLASS =
  "kozmos-reset kozmos-option-group-label";

/**
 * A label's initials: the first letter of its first two words, "PC" for
 * "Pointr Cloud", "A" for "Acme", in the label's own script.
 */
export function optionInitials(label: string) {
  return label
    .trim()
    .split(/\s+/u)
    .slice(0, 2)
    .map((word) => Array.from(word)[0] ?? "")
    .join("")
    .toLocaleUpperCase();
}

/** The id of a row's trailing words, which describe it (GAP-260). */
export const optionTrailingId = (rowId: string) => `${rowId}-trailing`;

/** Whether an option draws trailing words: anything but nothing or false. */
export const hasOptionTrailing = (trailing: unknown) =>
  trailing != null && trailing !== false;

/**
 * Options under their groups (GAP-192), shared by Combobox, Listbox and
 * MultiSelect.
 *
 * Options with no group come first, unlabelled, in their own order; then the
 * groups, in the order they first appear in `all`, the whole list, so
 * filtering never reorders them, each group's options together in their own
 * order. A group's name is trimmed, and a blank one is no group. The widgets
 * index, navigate and point aria-activedescendant at this order, so the keys
 * move through the options as they are drawn, and a label, which is not in
 * it, is never reached.
 */
export function groupOf(option: { group?: string }) {
  return option.group?.trim() || undefined;
}

export function orderByGroup<T extends { group?: string }>(
  options: T[],
  all: { group?: string }[] = options,
): T[] {
  const rank = new Map<string, number>();
  for (const option of all) {
    const group = groupOf(option);
    if (group !== undefined && !rank.has(group)) rank.set(group, rank.size);
  }
  if (rank.size === 0) return options;
  const ungrouped: T[] = [];
  const groups: T[][] = [];
  for (const option of options) {
    const group = groupOf(option);
    const at = group === undefined ? undefined : rank.get(group);
    if (at === undefined) ungrouped.push(option);
    else (groups[at] ??= []).push(option);
  }
  return ungrouped.concat(...groups.filter(Boolean));
}

/** A group label's id: an id may hold no space (aria-labelledby is a list of them). */
export const optionGroupLabelId = (idBase: string, group: string) =>
  `${idBase}-group-${encodeURIComponent(group)}`;

/** One stretch of `entries` as it is drawn: alone, or a group's run of them. */
export type OptionRun<T> =
  | { group: undefined; entry: T; index: number }
  | { group: string; entries: { entry: T; index: number }[] };

/**
 * How `entries`, in the order orderByGroup gave them, are drawn: those with
 * no group on their own, then each group's run together. Each entry keeps
 * its index in `entries`, the index the widget navigates by. The rows with
 * no group come first, as the frameworks draw them.
 */
export function optionRuns<T>(
  entries: T[],
  nameOf: (entry: T) => string | undefined,
): OptionRun<T>[] {
  const ungrouped: OptionRun<T>[] = [];
  const runs: OptionRun<T>[] = [];
  for (let index = 0; index < entries.length; ) {
    const group = nameOf(entries[index]);
    if (!group) {
      ungrouped.push({ group: undefined, entry: entries[index], index });
      index += 1;
      continue;
    }
    const rows: { entry: T; index: number }[] = [];
    while (index < entries.length && nameOf(entries[index]) === group) {
      rows.push({ entry: entries[index], index });
      index += 1;
    }
    runs.push({ group, entries: rows });
  }
  return ungrouped.concat(runs);
}

/**
 * Scrolls the active option into view, and with the first option of a group
 * its group's label too, so moving up into a group shows what it is.
 */
export function scrollOptionIntoView(option: Element | null | undefined) {
  if (!option) return;
  const label = option.previousElementSibling;
  if (label?.classList.contains("kozmos-option-group-label"))
    label.scrollIntoView?.({ block: "nearest" });
  option.scrollIntoView?.({ block: "nearest" });
}

/**
 * The first option that can be chosen, from `currentIndex` on in
 * `direction`, wrapping; -1 when none can.
 */
export function nextEnabledIndex(
  options: { disabled?: boolean }[],
  currentIndex: number,
  direction: 1 | -1,
) {
  if (options.length === 0) return -1;

  for (let offset = 1; offset <= options.length; offset += 1) {
    const index =
      (currentIndex + direction * offset + options.length) % options.length;
    if (!options[index]?.disabled) return index;
  }

  return -1;
}
