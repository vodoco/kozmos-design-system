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
  "KozmosRating.valueLabel:default":
    "React's default is the recipe's defaultRatingValueLabel, a function the contract cannot read as a literal; Vue's default is the same function, and rating.parity.spec.ts reads the read-only label",
};
