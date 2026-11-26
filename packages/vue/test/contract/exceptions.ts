/**
 * Where a Vue part says something differently from its React part on
 * purpose, by the finding's id (`KozmosButton.size:type`), with the reason.
 * An exception that no longer matches a finding fails the contract, so the
 * list never outlives what it excuses.
 */
export const EXCEPTIONS: Record<string, string> = {
  // A component type is a value (read-contract.ts, isRenderProp): React's
  // Icon takes a glyph from `@kozmos-ds/icons`, a React component; Vue's
  // takes the same glyph from `@kozmos-ds/icons/vue`, its Vue functional
  // component, which draws the same <svg> (icon.parity.spec.ts, Colors).
  // `@kozmos-ds/vue` imports no React, so it cannot take React's type.
  "KozmosIcon.icon:type":
    "Vue's Icon takes the glyph as @kozmos-ds/icons/vue's Vue component, where React's takes the React entry's; the same <svg> is drawn (icon.parity.spec.ts, Colors)",
  // React's renderItem(index) is a render prop; Vue's is the scoped slot
  // render-item, given one props object, `{ index }`, as a Vue slot is.
  "KozmosGrid.renderItem:render-prop":
    "React's renderItem(index) is Vue's render-item scoped slot, given { index }: a Vue slot takes one props object, not arguments",
  // React's list is ReactNode[]; Vue's has no ReactNode. Each item is a line
  // of text or a VNode (a KozmosLink), what Vue draws inside an <li>, so the
  // same items reach the list in the type Vue writes them in. A slot per item
  // would not be a list prop, and a scoped slot would lose React's shape.
  "KozmosEmptyState.list:type":
    "React's ReactNode[] is Vue's (string | VNode)[]: each item a line of text or a VNode such as a KozmosLink, the same items in the type Vue writes them in",
  // React's DescriptionListItem takes `value` as a node or as `true` and
  // `false`, a yes and a no written in `yesLabel` and `noLabel` (GAP-221).
  // The contract makes the node a `#value` slot, and a slot carries nodes,
  // not a boolean: without a prop, Vue's `yes-label` and `no-label` would
  // name words nothing can ask for. So Vue takes the boolean as a prop of
  // the same name, boolean only, beside the slot.
  "KozmosDescriptionListItem.value:extra-prop":
    "React's boolean `value` (a yes or a no) is Vue's `:value`, beside the `#value` slot that takes its nodes: a slot cannot carry a boolean",
  // React's Input action's toggle takes its icon as a ReactNode; Vue's has
  // no ReactNode, so the toggle's icon is a Vue component (an
  // @kozmos-ds/icons/vue glyph) or a VNode, which draws the same <svg> at
  // the field's end (input.parity.spec.ts, Actions). The rest of the
  // action, copy, toggle and edit, is React's to the letter
  // (Input/types.ts).
  "KozmosInput.action:type":
    "Vue's Input action is React's InputAction but for its toggle's icon, a Vue component or a VNode where React's is a ReactNode; the same <svg> is drawn (input.parity.spec.ts, Actions)",
  "KozmosDescriptionListItem.value:type":
    "Vue's `value` prop is the boolean half of React's `ReactNode | boolean`; the node half is the `#value` slot",
  // A function React's parameter list defaults to, which the contract reads
  // as source text, not a value: the same function is Vue's default.
  // IconButton's counterLabel defaults to `String`, the number alone.
  "KozmosIconButton.counterLabel:default":
    "React's default is the function `String`, which the contract cannot read as a literal; Vue's default is the same `String`, and icon-button.parity.spec.ts reads the count it writes",
  // Rating's itemLabel and valueLabel default to the recipe's English words
  // (recipes/rating.ts), the functions React's parameter list names.
  "KozmosRating.itemLabel:default":
    "React's default is the recipe's defaultRatingItemLabel, a function the contract cannot read as a literal; Vue's default is the same function, and rating.parity.spec.ts reads each option's name",
  // React's SegmentedControlItem's label is a ReactNode; Vue's has no
  // ReactNode, so a segment's label is text or a VNode (an icon beside
  // words, drawn with `h`), what Vue draws inside the segment. The rest of
  // the item, its value and disabled, is React's to the letter
  // (SegmentedControl/types.ts).
  "KozmosSegmentedControl.items:type":
    "Vue's segment is React's SegmentedControlItem but for its label, text or a VNode where React's is a ReactNode; the same segment is drawn (segmented-control.parity.spec.ts)",
  // React's formatValue(value) is a render prop; Vue's is the scoped slot
  // formatValue, given one props object, `{ value }`, as a Vue slot is.
  // What it draws as text alone is what the thumb says (aria-valuetext), as
  // React's says a string or a number.
  "KozmosSlider.formatValue:render-prop":
    "React's formatValue(value) is Vue's formatValue scoped slot, given { value }: a Vue slot takes one props object, not arguments; text it draws is the thumb's aria-valuetext (slider.parity.spec.ts)",
  "KozmosRating.valueLabel:default":
    "React's default is the recipe's defaultRatingValueLabel, a function the contract cannot read as a literal; Vue's default is the same function, and rating.parity.spec.ts reads the read-only label",
  // React's ComboboxOption takes `trailing` as a ReactNode; Vue has no
  // ReactNode, so KozmosComboboxOption takes text, a number or a VNode,
  // what Vue draws at a row's end. Every other field is React's
  // (Listbox/types.ts), and listbox.parity.spec.ts draws trailing words in
  // both. The option is in what a choice emits too.
  "KozmosListbox.options:type":
    "Vue's KozmosComboboxOption is React's ComboboxOption but for `trailing`, text, a number or a VNode where React's is a ReactNode; listbox.parity.spec.ts draws trailing words in both",
  "KozmosListbox.update:modelValue:payload":
    "The option a choice emits is KozmosComboboxOption, React's ComboboxOption but for `trailing`'s node (KozmosListbox.options:type)",
  // Combobox's options are Listbox's (KozmosListbox.options:type), and
  // its filter is given them; its commands' icons are Vue components or
  // VNodes where React's are nodes. Its defaults are React's own: the
  // shared recipe's defaultFilterOption, and no commands.
  "KozmosCombobox.options:type":
    "Vue's KozmosComboboxOption is React's ComboboxOption but for `trailing`'s node (KozmosListbox.options:type); combobox.parity.spec.ts draws the options in both",
  "KozmosCombobox.update:modelValue:payload":
    "The option a choice emits is KozmosComboboxOption, React's ComboboxOption but for `trailing`'s node (KozmosListbox.options:type)",
  "KozmosCombobox.filterOption:type":
    "The filter is given KozmosComboboxOption, React's ComboboxOption but for `trailing`'s node (KozmosListbox.options:type)",
  "KozmosCombobox.popupActions:type":
    "Vue's KozmosComboboxPopupAction is React's ComboboxPopupAction but for its icon, a Vue component or a VNode where React's is a ReactNode; combobox.parity.spec.ts draws and runs the commands in both",
  "KozmosCombobox.filterOption:default":
    "React's default is the recipe's defaultFilterOption, a function the contract cannot read as a literal; Vue's default is the same function (recipes/combobox.ts), and combobox.parity.spec.ts filters by typing in both",
  "KozmosCombobox.popupActions:default":
    "React's default is NO_ACTIONS, an empty list the contract cannot read as a literal; Vue's default is an empty list too, and combobox.parity.spec.ts draws a combobox without commands in both",
  // MultiSelect's options are Listbox's (KozmosListbox.options:type), and
  // its filter is given them and its change emits them. Its defaults are
  // React's own: the shared recipe's filter and limit words.
  "KozmosMultiSelect.options:type":
    "Vue's KozmosComboboxOption is React's ComboboxOption but for `trailing`'s node (KozmosListbox.options:type); multi-select.parity.spec.ts draws the options in both",
  "KozmosMultiSelect.update:modelValue:payload":
    "The options a change emits are KozmosComboboxOption, React's ComboboxOption but for `trailing`'s node (KozmosListbox.options:type)",
  "KozmosMultiSelect.filterOption:type":
    "The filter is given KozmosComboboxOption, React's ComboboxOption but for `trailing`'s node (KozmosListbox.options:type)",
  "KozmosMultiSelect.filterOption:default":
    "React's default is the recipe's defaultFilterOption, a function the contract cannot read as a literal; Vue's default is the same function (recipes/combobox.ts), and multi-select.parity.spec.ts filters by typing in both",
  "KozmosMultiSelect.maxSelectedLabel:default":
    "React's default is the recipe's defaultMaxSelectedLabel, a function the contract cannot read as a literal; Vue's default is the same function (recipes/multi-select.ts), and multi-select.parity.spec.ts hears the limit said in both",
  // ChipInput's defaults are React's own, from the shared recipe.
  "KozmosChipInput.defaultValue:default":
    "React's default is NO_ENTRIES, an empty list the contract cannot read as a literal; Vue's default is an empty list too, and chip-input.parity.spec.ts draws a field without entries in both",
  "KozmosChipInput.removeLabel:default":
    "React's default is the recipe's chipInputDefaults.removeLabel, a function the contract cannot read as a literal; Vue's default is the same function (recipes/multi-select.ts), and chip-input.parity.spec.ts draws the removes' names in both",
  "KozmosChipInput.addedLabel:default":
    "React's default is the recipe's chipInputDefaults.addedLabel, a function the contract cannot read as a literal; Vue's default is the same function (recipes/multi-select.ts), and chip-input.parity.spec.ts hears what each says",
  "KozmosChipInput.removedLabel:default":
    "React's default is the recipe's chipInputDefaults.removedLabel, a function the contract cannot read as a literal; Vue's default is the same function (recipes/multi-select.ts), and chip-input.parity.spec.ts hears what each says",
  "KozmosChipInput.duplicateLabel:default":
    "React's default is the recipe's chipInputDefaults.duplicateLabel, a function the contract cannot read as a literal; Vue's default is the same function (recipes/multi-select.ts), and chip-input.parity.spec.ts hears what each says",
};
