import * as React from "react";

/**
 * True for content in the map shell's panel: a part that has a hosted
 * presentation takes it there unless its product chose one (decision 43).
 * Internal: published by the shell, never a product prop.
 */
export const MapShellPanelContext = React.createContext(false);

/**
 * Set for the panel's content: a part that fills its panel (AICompanionPanel,
 * whose header and input stay put while its thread scrolls) calls it while it
 * is mounted. Beside the map, where the panel otherwise hugs its content, the
 * shell then gives the panel its full height, so the part's own height
 * resolves (GAP-124). Returns the release. Internal, never a product prop.
 */
export const MapShellPanelFillContext = React.createContext<
  (() => () => void) | null
>(null);
