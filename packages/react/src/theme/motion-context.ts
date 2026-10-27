import { createContext } from "react";

/**
 * The design config's reduced motion where an element renders: "reduced"
 * under a DesignConfigProvider whose config reduces motion (`motion:
 * "reduced"` or `accessibility.reduceMotion`), and undefined otherwise. The
 * provider marks its own scope `data-kozmos-motion="reduced"`, and every
 * ThemeProvider inside it marks its portal the same way, so what draws in
 * the portal (a Popover, a Dialog, a Select's list) stops its loops on the
 * mark as what draws in place does (GAP-50). It carries downward: a provider
 * nested inside a reduced one is reduced whatever its own config says, as
 * the rules that read the mark by ancestor (CSS, Backdrop's cut-out,
 * POIResultList's scrolling) already see what it draws in place.
 */
export const MotionContext = createContext<"reduced" | undefined>(undefined);
