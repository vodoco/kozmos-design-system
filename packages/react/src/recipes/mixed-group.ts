/**
 * The mixed state of a group of options (decisions 188 and 191): a
 * RadioGroup or a SegmentedControl that stands for several values. What it
 * draws under its options, and where its reset sends focus, for every
 * framework that draws one: React's `MixedGroupLine` and Vue's own draw the
 * same line from it. Framework-free (`recipes.framework-free.test.ts`).
 */

/**
 * While mixed, the line of `mixedLabel`, "Multiple values", seen and said as
 * the group's description: a field's default message.
 */
export const MIXED_GROUP_LABEL_CLASS =
  "kozmos-reset kozmos-field-message kozmos-field-default";

/**
 * Where focus goes as the reset is pressed: the button goes as the group
 * turns mixed again, so focus goes to the option the group's Tab stop is on
 * (or its first usable one), which is then read in the group with its
 * several values, not lost to the page. Focus alone never chooses: Radix
 * chooses on focus only while an arrow key is held.
 */
export function mixedGroupFocusTarget(
  group: HTMLElement | null,
): HTMLElement | undefined {
  const options = group
    ? [...group.querySelectorAll<HTMLElement>('[role="radio"]:not([disabled])')]
    : [];
  return options.find((option) => option.tabIndex === 0) ?? options[0];
}
