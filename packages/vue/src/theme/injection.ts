import { inject, type ComputedRef, type InjectionKey, type Ref } from "vue";

/** The colour theme a provider is asked for; `system` follows the OS. */
export type KozmosTheme = "dark" | "light" | "system";
export type KozmosResolvedTheme = Exclude<KozmosTheme, "system">;
/** CSS custom properties a provider sets on its scope and its portal. */
export type KozmosThemeTokens = Record<`--${string}`, string | number>;
/**
 * How large the controls are (decision 82). `touch`, the default, keeps the
 * 44 controls products and the SDK use; `compact` is for pointer-first desktop
 * tools such as Pointr Cloud: 32, 40 and 48 buttons, 28, 32 and 40 icon
 * buttons, and 40 fields. As React's `ThemeDensity`.
 */
export type KozmosDensity = "touch" | "compact";
/** Overrides per theme: each provider applies the set for its own resolved theme. */
export interface KozmosThemeTokenSets {
  light?: KozmosThemeTokens;
  dark?: KozmosThemeTokens;
}

/** What a ThemeProvider gives the parts inside it, as React's ThemeProviderContext. */
export interface KozmosThemeState {
  theme: ComputedRef<KozmosTheme>;
  resolvedTheme: ComputedRef<KozmosResolvedTheme>;
  dir: ComputedRef<"ltr" | "rtl">;
  /** The overrides this provider applies: its resolved theme's set. */
  tokens: ComputedRef<KozmosThemeTokens>;
  tokenSets: ComputedRef<{ light: KozmosThemeTokens; dark: KozmosThemeTokens }>;
  /** The element the provider's portal draws into, once it is mounted. */
  portalContainer: Ref<HTMLElement | null>;
  setTheme: (theme: KozmosTheme) => void;
}

export const ThemeKey: InjectionKey<KozmosThemeState> = Symbol("KozmosTheme");
/** The density where a part renders: every ThemeProvider and DensityScope sets it. */
export const DensityKey: InjectionKey<ComputedRef<KozmosDensity>> =
  Symbol("KozmosDensity");

/**
 * The design config's reduced motion where a part renders, as React's
 * MotionContext: "reduced" under a design config that reduces motion, and
 * undefined otherwise. Every ThemeProvider marks its portal with it, so what
 * draws there stops its loops as what draws in place does (GAP-50). Vue has
 * no design-config provider yet; this is the key it will provide.
 */
export const MotionKey: InjectionKey<ComputedRef<"reduced" | undefined>> =
  Symbol("KozmosMotion");

/** The density where the caller renders, or undefined outside every provider and scope. */
export function useKozmosDensity(): ComputedRef<KozmosDensity> | undefined {
  return inject(DensityKey, undefined);
}

/** The nearest ThemeProvider's theme, as React's `useTheme`. */
export function useTheme() {
  const state = inject(ThemeKey, undefined);
  if (!state)
    throw new Error("useTheme must be used within a KozmosThemeProvider");
  return {
    theme: state.theme,
    resolvedTheme: state.resolvedTheme,
    setTheme: state.setTheme,
  };
}
