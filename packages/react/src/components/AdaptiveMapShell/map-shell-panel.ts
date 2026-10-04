import * as React from "react";

/**
 * True for content in the map shell's panel: a part that has a hosted
 * presentation takes it there unless its product chose one (decision 43).
 * Internal: published by the shell, never a product prop.
 */
export const MapShellPanelContext = React.createContext(false);
