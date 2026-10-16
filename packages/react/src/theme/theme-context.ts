import { createContext } from "react";
import type {
  Theme,
  ResolvedTheme,
  ThemeTokens,
} from "../components/ThemeProvider/ThemeProvider";

/** Every theme's inherited overrides, so a nested provider can apply its own. */
export interface InheritedThemeTokens {
  light: ThemeTokens;
  dark: ThemeTokens;
}
export interface ThemeState {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  dir: "ltr" | "rtl";
  /** The overrides this provider applies: its resolved theme's set. */
  tokens: ThemeTokens;
  tokenSets: InheritedThemeTokens;
  portalContainer: HTMLDivElement | null;
}

export const ThemeProviderContext = createContext<ThemeState | undefined>(
  undefined,
);
