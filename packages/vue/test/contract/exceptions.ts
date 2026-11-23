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
};
