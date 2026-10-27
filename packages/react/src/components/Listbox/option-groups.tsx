import React from "react";

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

/**
 * Draws `entries`, in the order orderByGroup gave them: those with no group
 * on their own, then each group's inside a `role="group"` named by its
 * label. `render` is given each entry and its index in `entries`, the index
 * the widget navigates by. A group and its label are keyed by the group's
 * name, so filtering that moves a group keeps its element and its label's id.
 */
export function renderOptionGroups<T>(
  entries: T[],
  nameOf: (entry: T) => string | undefined,
  idBase: string,
  render: (entry: T, index: number) => React.ReactNode,
): React.ReactNode[] {
  const ungrouped: React.ReactNode[] = [];
  const nodes: React.ReactNode[] = [];
  for (let index = 0; index < entries.length; ) {
    const group = nameOf(entries[index]);
    if (!group) {
      ungrouped.push(render(entries[index], index));
      index += 1;
      continue;
    }
    const rows: React.ReactNode[] = [];
    while (index < entries.length && nameOf(entries[index]) === group) {
      rows.push(render(entries[index], index));
      index += 1;
    }
    // An id may hold no space (aria-labelledby is a list of them).
    const labelId = `${idBase}-group-${encodeURIComponent(group)}`;
    nodes.push(
      <div
        key={`group:${group}`}
        role="group"
        aria-labelledby={labelId}
        className="kozmos-reset kozmos-option-group"
      >
        {/* Drawn as SelectLabel draws its label; presentation, as the
            WAI-ARIA grouped listbox has it, so it is the group's name and
            nothing a screen reader lists as an item. */}
        <div
          id={labelId}
          role="presentation"
          className="kozmos-reset kozmos-option-group-label"
        >
          {group}
        </div>
        {rows}
      </div>,
    );
  }
  // The rows with no group are keyed by their values, in a fragment of their
  // own, so no value can collide with a group's key.
  if (ungrouped.length)
    nodes.unshift(<React.Fragment key="ungrouped">{ungrouped}</React.Fragment>);
  return nodes;
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
