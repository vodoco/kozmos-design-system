import * as React from "react";
import type { AdaptiveMapLayoutSnapshot } from "@kozmos-ds/product-contracts";

type Presentation = AdaptiveMapLayoutSnapshot["presentation"];

/**
 * How the map shell presents its panel: `bottom`, a sheet on a phone-sized
 * frame, or beside or apart from the map. Null outside a shell. Parts that
 * scroll read it to draw their scrollbar the way the presentation does
 * (decision 75, GAP-138/139). Internal: published by the shell, never a
 * product prop.
 */
export const MapShellPresentationContext =
  React.createContext<Presentation | null>(null);

// Moved to recipes/scrollbar.ts, shared with @kozmos-ds/vue's KozmosCombobox:
// framework-free, so Vue builds it in.
export { scrollbarFor } from "../../recipes/scrollbar";
