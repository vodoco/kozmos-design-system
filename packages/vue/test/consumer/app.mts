// Node's ESM, as a Node 16+ app resolves the package: consumer-types.spec.ts.
import * as Kozmos from "@kozmos-ds/vue";
import * as Bridge from "@kozmos-ds/vue/react-bridge";

export const parts = [Kozmos.KozmosButton, Bridge.KozmosAnchoredPopover];
