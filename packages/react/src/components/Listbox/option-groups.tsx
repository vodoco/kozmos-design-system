import React from "react";
import {
  OPTION_GROUP_CLASS,
  OPTION_GROUP_LABEL_CLASS,
  optionGroupLabelId,
  optionRuns,
} from "../../recipes/option";

// Moved to recipes/option.ts, shared with @kozmos-ds/vue's KozmosListbox and
// KozmosCombobox: framework-free, so Vue builds them in.
export {
  groupOf,
  orderByGroup,
  scrollOptionIntoView,
} from "../../recipes/option";

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
  for (const run of optionRuns(entries, nameOf)) {
    if (run.group === undefined) {
      ungrouped.push(render(run.entry, run.index));
      continue;
    }
    const group = run.group;
    const labelId = optionGroupLabelId(idBase, group);
    nodes.push(
      <div
        key={`group:${group}`}
        role="group"
        aria-labelledby={labelId}
        className={OPTION_GROUP_CLASS}
      >
        {/* Drawn as SelectLabel draws its label; presentation, as the
            WAI-ARIA grouped listbox has it, so it is the group's name and
            nothing a screen reader lists as an item. */}
        <div
          id={labelId}
          role="presentation"
          className={OPTION_GROUP_LABEL_CLASS}
        >
          {group}
        </div>
        {run.entries.map(({ entry, index }) => render(entry, index))}
      </div>,
    );
  }
  // The rows with no group are keyed by their values, in a fragment of their
  // own, so no value can collide with a group's key.
  if (ungrouped.length)
    nodes.unshift(<React.Fragment key="ungrouped">{ungrouped}</React.Fragment>);
  return nodes;
}
