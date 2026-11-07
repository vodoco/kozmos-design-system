// Node's CommonJS, as a Node 16+ app requires the package: consumer-types.spec.ts.
// In a .cts file an import is a require(), resolved by `exports`' require.
import * as Kozmos from "@kozmos-ds/vue";
import * as Bridge from "@kozmos-ds/vue/react-bridge";

export const parts = [Kozmos.KozmosButton, Bridge.KozmosAnchoredPopover];
