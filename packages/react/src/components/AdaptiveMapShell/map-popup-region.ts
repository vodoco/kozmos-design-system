import * as React from "react";

/** Internal geometry ownership for controls hosted in registered shell corners. */
export const MapPopupRegionContext = React.createContext<{
  boundary: HTMLElement | null;
  available: boolean;
  focusFallback: () => void;
} | null>(null);
