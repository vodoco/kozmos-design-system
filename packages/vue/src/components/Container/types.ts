/**
 * Container's public prop types, written out so the package's declarations
 * name nothing outside it. `types.check.ts` holds each to the shared
 * recipe's own type.
 */

/**
 * A step of Container's block (top and bottom) inset: `none` 0, `sm` 16,
 * `md` 24 and `lg` 32, the layout spacing steps 200, 300 and 400.
 */
export type KozmosContainerBlockInset = "none" | "sm" | "md" | "lg";

/** Both edges one step, or the top (`start`) and bottom (`end`) apart. */
export type KozmosContainerBlock =
  | KozmosContainerBlockInset
  | { start?: KozmosContainerBlockInset; end?: KozmosContainerBlockInset };

/** What the side padding responds to: the window, or a panel. */
export type KozmosContainerInset = "window" | "panel";
