import * as React from "react";
import { FIELD_RESET_CLASS } from "../../recipes/field";
import {
  MIXED_GROUP_LABEL_CLASS,
  mixedGroupFocusTarget,
} from "../../recipes/mixed-group";

// The mixed state of a group of options (decisions 188 and 191): a
// RadioGroup or a SegmentedControl that stands for several values. A module
// of its own that the package does not export, beside the fields' helpers
// (mixedValue.ts). The recipe is shared with Vue's RadioGroup and
// SegmentedControl (recipes/mixed-group.ts).

/**
 * What a mixed group draws under its options, as a field draws it (GAP-153):
 * while mixed, a line of `mixedLabel`, "Multiple values", seen and said as
 * the group's description (`mixedId`, for the group's aria-describedby; a
 * radio or a segment has no mixed state of its own to announce); once a
 * choice ends it, the reset, `resetMixedLabel`, if `onResetMixed` is given
 * and the group is usable. Pressed, focus goes to the group's option that
 * holds its Tab stop, then the product is called back to set `mixed` again.
 */
export function MixedGroupLine({
  mixed,
  mixedLabel,
  mixedId,
  onResetMixed,
  resetMixedLabel,
  disabled,
  group,
}: {
  mixed: boolean;
  mixedLabel: string;
  mixedId: string;
  onResetMixed?: () => void;
  resetMixedLabel: string;
  disabled?: boolean;
  group: React.RefObject<HTMLElement | null>;
}) {
  if (mixed)
    return (
      <p
        id={mixedId}
        data-slot="mixed-label"
        className={MIXED_GROUP_LABEL_CLASS}
      >
        {mixedLabel}
      </p>
    );
  if (!onResetMixed || disabled) return null;
  return (
    <button
      type="button"
      className={FIELD_RESET_CLASS}
      data-slot="reset-mixed"
      onClick={() => {
        // The button goes as the group turns mixed again: focus goes to the
        // option holding the group's Tab stop, never lost to the page.
        mixedGroupFocusTarget(group.current)?.focus();
        onResetMixed();
      }}
    >
      {resetMixedLabel}
    </button>
  );
}
