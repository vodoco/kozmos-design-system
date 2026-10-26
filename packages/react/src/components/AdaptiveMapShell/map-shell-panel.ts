import * as React from "react";

/**
 * True for what the map shell's panel holds, its header and its content: a
 * part that has a hosted presentation takes it there unless its product
 * chose one (decision 43). Internal: published by the shell, never a
 * product prop.
 */
export const MapShellPanelContext = React.createContext(false);

/**
 * Set for the panel's content: a part that fills its panel (AICompanionPanel,
 * whose header and input stay put while its thread scrolls) calls it with its
 * root while it is mounted. Beside the map, where the panel otherwise hugs its
 * content, the shell then gives the panel its full height, so the part's own
 * height resolves (GAP-124). A sheet fitted to its content measures that root
 * as it lays out unstretched. Returns the release. Internal, never a product
 * prop.
 */
export const MapShellPanelFillContext = React.createContext<
  ((root: HTMLElement) => () => void) | null
>(null);
