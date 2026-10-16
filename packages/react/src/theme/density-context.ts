import { createContext } from "react";
import type { ThemeDensity } from "../components/ThemeProvider/ThemeProvider";

/**
 * The density where an element renders (decision 82). Every ThemeProvider and
 * DensityScope sets it; a provider nested inside inherits it, and a portal
 * marks what it renders with it.
 */
export const DensityContext = createContext<ThemeDensity | undefined>(
  undefined,
);
