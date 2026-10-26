import React from "react";

/**
 * Options under their groups (GAP-192), shared by Combobox, Listbox and
 * MultiSelect.
 *
 * The groups come in the order they first appear in `all`, the whole list,
 * so filtering never reorders them; each group's options come together, in
 * their own order. An option with no group is a group with no label. The
 * widgets index, navigate and point aria-activedescendant at this order, so
 * the keys move through the options as they are drawn, and a label, which is
 * not in it, is never reached.
 */
export function orderByGroup<T extends { group?: string }>(
  options: T[],
  all: { group?: string }[] = options,
): T[] {
  // A blank group is no group. `options` is always drawn from `all`.
  const groups = [...new Set(all.map((option) => option.group || undefined))];
  return groups.length > 1 || groups[0]
    ? groups.flatMap((group) =>
        options.filter((option) => (option.group || undefined) === group),
      )
    : options;
}

/**
 * Draws `entries`, in the order orderByGroup gave them, each run of one group
 * inside a `role="group"` named by its label. `render` is given each entry
 * and its index in `entries`, the index the widget navigates by. An entry
 * whose `groupOf` is undefined is drawn on its own, as before.
 */
export function renderOptionGroups<T>(
  entries: T[],
  groupOf: (entry: T) => string | undefined,
  idBase: string,
  render: (entry: T, index: number) => React.ReactNode,
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  for (let index = 0; index < entries.length; ) {
    const group = groupOf(entries[index]);
    const start = index;
    const rows: React.ReactNode[] = [];
    do rows.push(render(entries[index], index++));
    while (
      group &&
      index < entries.length &&
      groupOf(entries[index]) === group
    );
    if (!group) {
      nodes.push(...rows);
      continue;
    }
    const labelId = `${idBase}-group-${start}`;
    nodes.push(
      <div
        key={`group:${start}`}
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
  return nodes;
}
