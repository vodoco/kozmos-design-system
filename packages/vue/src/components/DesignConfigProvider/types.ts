import type { ComputedRef } from "vue";

/**
 * The design configuration's public types, as React's `GlassConfig`,
 * `DesignConfig` and `DesignConfigInput`. Written out here, never named from
 * `#kozmos-recipes` (PORTING.md §3), and held to the shared recipe's in
 * `types.check.ts`.
 */
export interface KozmosGlassConfig {
  enabled: boolean;
  refraction: number;
  dispersion: number;
  depth: number;
  frost: number;
  /** @deprecated Reserved experimental control; no rendered effect. */
  splay: number;
  specular: number;
  surfaceScale: number;
}

export interface KozmosDesignConfig {
  /** @deprecated Legacy radius aliases only. Customize semantic radius tokens instead. */
  roundness: number;
  glass: KozmosGlassConfig;
  noise: boolean;
  spotlight: boolean;
  /** @deprecated Legacy shadow aliases only. Customize semantic elevation tokens instead. */
  shadow: "soft" | "hard" | "none";
  motion: "fluid" | "snappy" | "reduced";
  /** @deprecated Metadata only; does not apply a preset. */
  preset?: "apple" | "geometric" | "corporate";
  accessibility: { reduceMotion: boolean; reduceTransparency: boolean };
}

export type KozmosDesignConfigInput = Omit<
  Partial<KozmosDesignConfig>,
  "glass" | "accessibility"
> & {
  glass?: Partial<KozmosGlassConfig>;
  accessibility?: Partial<KozmosDesignConfig["accessibility"]>;
};

/** What `useDesignConfig()` gives the parts inside a KozmosDesignConfigProvider. */
export interface KozmosDesignConfigState {
  config: ComputedRef<KozmosDesignConfig>;
  updateConfig: (
    patch:
      | KozmosDesignConfigInput
      | ((previous: KozmosDesignConfig) => KozmosDesignConfigInput),
  ) => void;
  updateGlassConfig: (patch: Partial<KozmosGlassConfig>) => void;
  resetConfig: () => void;
  /** @deprecated Prefer declarative tokens. Merges overrides; an empty value removes a key. */
  injectRuntimeTokens: (tokens: Record<string, string>) => void;
}
