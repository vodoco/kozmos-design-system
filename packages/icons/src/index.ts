/**
 * The registry is the package's surface: `getIconComponent`, the names, the
 * definitions, and the icons this package owns.
 *
 * It once re-exported lucide wholesale, and the moment the first owned outline
 * landed that made two different icons reachable under one name — `import
 * { Heart }` drew lucide's, while `getIconComponent("heart")` drew Pointr's,
 * and nothing told the caller which one they had. The re-export went first; on
 * 2026-09-23 lucide itself went, when every one of the 43 names still resolving
 * to it gained its own Pointr outline. This package now has no dependency on
 * lucide at all, not even for types. A consumer that wants an icon outside the
 * set installs whatever it likes and uses it directly.
 */
export type { KozmosIconProps } from "./iconProps.js";
export * from "./registry.js";
export * from "./owned/icons.js";
export * from "./pointr/icons.generated.js";
