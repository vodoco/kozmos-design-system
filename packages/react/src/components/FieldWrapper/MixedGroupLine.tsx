import * as React from "react";

// The mixed state of a group of options (decisions 188 and 191): a
// RadioGroup or a SegmentedControl that stands for several values. A module
// of its own that the package does not export, beside the fields' helpers
// (mixedValue.ts).

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
        className="kozmos-reset kozmos-field-message kozmos-field-default"
      >
        {mixedLabel}
      </p>
    );
  if (!onResetMixed || disabled) return null;
  return (
    <button
      type="button"
      className="kozmos-reset kozmos-field-reset"
      data-slot="reset-mixed"
      onClick={() => {
        // The button goes as the group turns mixed again: focus goes to the
        // option the group's Tab stop is on (or its first usable one), which
        // is then read in the group with its several values, not lost to
        // the page. Focus alone never chooses: Radix chooses on focus only
        // while an arrow key is held.
        const root = group.current;
        const options = root
          ? [
              ...root.querySelectorAll<HTMLElement>(
                '[role="radio"]:not([disabled])',
              ),
            ]
          : [];
        (
          options.find((option) => option.tabIndex === 0) ?? options[0]
        )?.focus();
        onResetMixed();
      }}
    >
      {resetMixedLabel}
    </button>
  );
}
