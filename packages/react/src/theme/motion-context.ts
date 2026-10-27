import { createContext } from "react";

/**
 * The design config's reduced motion where an element renders: "reduced"
 * under a DesignConfigProvider whose config reduces motion (`motion:
 * "reduced"` or `accessibility.reduceMotion`), and undefined otherwise. The
 * provider marks its own scope `data-kozmos-motion="reduced"`, and every
 * ThemeProvider inside it marks its portal the same way, so what draws in
 * the portal (a Popover, a Dialog, a Select's list) stops its loops on the
 * mark as what draws in place does (GAP-50). A provider nested inside says
 * its own config's.
 */
export const MotionContext = createContext<"reduced" | undefined>(undefined);
