import * as React from "react";

/**
 * True when the map shell's credits slot has less room than the attribution's
 * full height: MapAttribution then leaves out its brand, so the credits keep
 * their full height and are never clipped into a scroll region (GAP-135).
 * Internal: published by the shell, never a product prop.
 */
export const MapShellAttributionCompactContext = React.createContext(false);
