/**
 * The design configuration every Kozmos framework applies: what a config
 * holds, how caller input and stored JSON are read into one, and the custom
 * properties it sets on its provider's scope. React's DesignConfigProvider
 * and Vue's KozmosDesignConfigProvider draw from this one module, so a
 * config sets the same properties in both (GAP-291).
 */

/** Custom properties, as ThemeProvider's `ThemeTokens`. */
type ThemeTokens = Record<`--${string}`, string | number>;

export interface GlassConfig {
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

export interface DesignConfig {
  /** @deprecated Legacy radius aliases only. Customize semantic radius tokens instead. */
  roundness: number;
  glass: GlassConfig;
  noise: boolean;
  spotlight: boolean;
  /** @deprecated Legacy shadow aliases only. Customize semantic elevation tokens instead. */
  shadow: "soft" | "hard" | "none";
  motion: "fluid" | "snappy" | "reduced";
  /** @deprecated Metadata only; does not apply a preset. */
  preset?: "apple" | "geometric" | "corporate";
  accessibility: { reduceMotion: boolean; reduceTransparency: boolean };
}

export type DesignConfigInput = Omit<
  Partial<DesignConfig>,
  "glass" | "accessibility"
> & {
  glass?: Partial<GlassConfig>;
  accessibility?: Partial<DesignConfig["accessibility"]>;
};

export const DEFAULT_CONFIG: DesignConfig = {
  roundness: 1,
  glass: {
    enabled: true,
    refraction: 40,
    dispersion: 20,
    depth: 10,
    frost: 10,
    splay: 15,
    specular: 30,
    surfaceScale: 5,
  },
  noise: true,
  spotlight: true,
  shadow: "soft",
  motion: "fluid",
  preset: "apple",
  accessibility: { reduceMotion: false, reduceTransparency: false },
};

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
const bool = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;
const number = (value: unknown, fallback: number, maximum: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(maximum, value))
    : fallback;
function choice<T extends string>(
  value: unknown,
  choices: readonly T[],
  fallback: T,
): T {
  return choices.includes(value as T) ? (value as T) : fallback;
}

/** Whitelist and deep-merge both caller inputs and untrusted stored JSON. */
export function normalizeDesignConfig(
  value: unknown,
  base = DEFAULT_CONFIG,
): DesignConfig {
  const input = record(value);
  const glass = record(input.glass);
  const accessibility = record(input.accessibility);
  return {
    roundness: number(input.roundness, base.roundness, 2),
    glass: {
      enabled: bool(glass.enabled, base.glass.enabled),
      refraction: number(glass.refraction, base.glass.refraction, 100),
      dispersion: number(glass.dispersion, base.glass.dispersion, 100),
      depth: number(glass.depth, base.glass.depth, 100),
      frost: number(glass.frost, base.glass.frost, 100),
      splay: number(glass.splay, base.glass.splay, 100),
      specular: number(glass.specular, base.glass.specular, 100),
      surfaceScale: number(glass.surfaceScale, base.glass.surfaceScale, 100),
    },
    noise: bool(input.noise, base.noise),
    spotlight: bool(input.spotlight, base.spotlight),
    shadow: choice(input.shadow, ["soft", "hard", "none"], base.shadow),
    motion: choice(input.motion, ["fluid", "snappy", "reduced"], base.motion),
    preset: choice(
      input.preset,
      ["apple", "geometric", "corporate"] as const,
      base.preset ?? "apple",
    ),
    accessibility: {
      reduceMotion: bool(
        accessibility.reduceMotion,
        base.accessibility.reduceMotion,
      ),
      reduceTransparency: bool(
        accessibility.reduceTransparency,
        base.accessibility.reduceTransparency,
      ),
    },
  };
}

/** Backwards-compatible primitive shorthand; declarative tokens are preferred. */
export function normalizeRuntimeTokens(
  tokens: Record<string, string> = {},
): ThemeTokens {
  return Object.fromEntries(
    Object.entries(tokens)
      .filter(([, value]) => typeof value === "string" && value !== "")
      .map(([key, value]) => [
        key.startsWith("--") ? key : `--primitives-${key}`,
        value,
      ]),
  );
}

/**
 * Merges runtime token overrides, as `injectRuntimeTokens` does: a key without
 * `--` is a primitive, and an empty value removes the key.
 */
export function mergeRuntimeTokens(
  previous: Record<string, string>,
  patch: Record<string, string>,
): Record<string, string> {
  const next = { ...previous };
  for (const [key, value] of Object.entries(patch)) {
    const normalizedKey = key.startsWith("--") ? key : `--primitives-${key}`;
    if (value === "") delete next[normalizedKey];
    else if (typeof value === "string") next[normalizedKey] = value;
  }
  return next;
}

/**
 * Reduced motion where a provider draws: its own config's, or an enclosing
 * provider's (`inherited`). It carries downward, so a provider inside a
 * reduced one cannot turn motion back on.
 */
export function designConfigMotion(
  config: DesignConfig,
  inherited: "reduced" | undefined,
): "reduced" | undefined {
  return config.accessibility.reduceMotion || config.motion === "reduced"
    ? "reduced"
    : inherited;
}

/**
 * The config a provider draws its tokens from: its own, reduced when an
 * enclosing provider reduces motion and it does not.
 */
export function designConfigTokenConfig(
  config: DesignConfig,
  motion: "reduced" | undefined,
): DesignConfig {
  return motion === "reduced" && config.motion !== "reduced"
    ? normalizeDesignConfig({ motion: "reduced" }, config)
    : config;
}

/** Whether a config follows the pointer with its spotlight. */
export function designConfigFollowsPointer(
  config: DesignConfig,
  motion: "reduced" | undefined,
): boolean {
  return (
    config.spotlight &&
    config.glass.enabled &&
    !config.accessibility.reduceTransparency &&
    motion !== "reduced"
  );
}

/** Whether a config draws its glass SVG filters. */
export function designConfigDrawsFilters(config: DesignConfig): boolean {
  return config.glass.enabled && !config.accessibility.reduceTransparency;
}

/** The surfaces a spotlight follows the pointer over. */
export const SPOTLIGHT_SURFACES = ".glass-spotlight, .glass-edge-spotlight";

/**
 * Where the pointer is on a spotlight surface, as `--spotlight-x` and
 * `--spotlight-y`, or null when the surface draws nothing. Visual
 * coordinates are converted back to the CSS box when glass magnifies it.
 */
export function spotlightPosition(
  surface: HTMLElement,
  clientX: number,
  clientY: number,
): { x: string; y: string } | null {
  const bounds = surface.getBoundingClientRect();
  if (bounds.width <= 0 || bounds.height <= 0) return null;
  return {
    x: `${(clientX - bounds.left) * (surface.offsetWidth / bounds.width || 1)}px`,
    y: `${(clientY - bounds.top) * (surface.offsetHeight / bounds.height || 1)}px`,
  };
}

// Local, deterministic texture. Its alpha is encoded into the image so noise
// does not depend on the unrelated surface-filter opacity. No canvas/DOM work.
const noiseImage = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" seed="1"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.015"/></feComponentTransfer></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>')}")`;

export function designConfigTokens(
  config: DesignConfig,
  id: string,
): ThemeTokens {
  const enabled =
    config.glass.enabled && !config.accessibility.reduceTransparency;
  const motionReduced =
    config.accessibility.reduceMotion || config.motion === "reduced";
  const saturation = enabled ? 1.8 : 1;
  const motionScale = motionReduced
    ? 0.001
    : config.motion === "snappy"
      ? 0.5
      : 1;
  const innerShadow = enabled
    ? `inset 0 1px 1px 0 rgba(255, 255, 255, ${(config.glass.depth / 100) * 0.8}), inset 0 -10px 20px -10px rgba(0, 0, 0, ${(config.glass.depth / 100) * 0.6})`
    : "none";
  const bevelShadow =
    "inset 1px 1px 0 0 rgba(255,255,255,0.3), inset -1px -1px 0 0 rgba(0,0,0,0.1), inset 2px 0 4px rgba(255,0,0,var(--glass-dispersion-opacity, 0)), inset -2px 0 4px rgba(0,255,255,var(--glass-dispersion-opacity, 0))";
  const shadow =
    config.shadow === "none"
      ? ["none", "none", "none"]
      : config.shadow === "hard"
        ? [
            "2px 2px 0px rgba(0,0,0,0.15)",
            "4px 4px 0px rgba(0,0,0,0.15)",
            "8px 8px 0px rgba(0,0,0,0.15)",
          ]
        : [
            "0 1px 2px 0 rgba(0,0,0,0.05)",
            "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
            "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
          ];
  return {
    "--kozmos-design-id": id,
    "--roundness": config.roundness,
    "--radius-sm": "calc(var(--primitives-radius-sm) * var(--roundness))",
    "--radius-md": "calc(var(--primitives-radius-default) * var(--roundness))",
    "--radius-lg": "calc(var(--primitives-radius-md) * var(--roundness))",
    "--radius-xl": "calc(var(--primitives-radius-xl) * var(--roundness))",
    "--radius-2xl": "calc(var(--primitives-radius-2xl) * var(--roundness))",
    "--radius-full": "calc(var(--primitives-radius-full) * var(--roundness))",
    "--glass-opacity": enabled && !motionReduced ? 0.7 : 1,
    // The glass surface role reads Semantics.Effect.glass itself; these two
    // exist only to switch it off, so a value is set solely when it is.
    "--kozmos-surface-glass-opacity": enabled ? "initial" : 1,
    "--kozmos-surface-glass-blur": enabled ? "initial" : "0px",
    "--glass-blur": `${enabled ? config.glass.refraction / 2 + config.glass.frost / 5 : 0}px`,
    "--glass-scale":
      enabled && !motionReduced
        ? 1 + (config.glass.refraction / 100) * 0.05
        : 1,
    "--glass-saturation": saturation,
    "--glass-filter": `blur(var(--glass-blur)) saturate(${saturation})`,
    "--glass-bevel-opacity": enabled ? config.glass.specular / 100 : 0,
    "--glass-inner-shadow": innerShadow,
    "--glass-bevel-shadow": enabled ? bevelShadow : "none",
    "--glass-composite-shadow": enabled
      ? "var(--glass-inner-shadow), var(--glass-bevel-shadow)"
      : "none",
    "--glass-dispersion-opacity": enabled ? config.glass.dispersion / 100 : 0,
    "--glass-surface-opacity": enabled
      ? Math.min(1, (config.glass.surfaceScale / 10) * 0.3)
      : 0,
    "--glass-surface-filter":
      enabled && config.glass.surfaceScale > 0
        ? `url("#${id}-surface")`
        : "none",
    "--glass-noise-opacity": enabled && config.noise ? 0.015 : 0,
    "--glass-noise-image": enabled && config.noise ? noiseImage : "none",
    "--glass-spotlight-opacity":
      enabled && config.spotlight && !motionReduced ? 1 : 0,
    "--spotlight-x": "50%",
    "--spotlight-y": "50%",
    "--shadow-sm": shadow[0],
    "--shadow-md": shadow[1],
    "--shadow-lg": shadow[2],
    "--motion-scale": motionScale,
    "--motion-duration-scale": motionScale,
    "--semantics-motion-duration-scale": motionScale,
  };
}
