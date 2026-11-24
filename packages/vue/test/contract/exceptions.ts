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
};
