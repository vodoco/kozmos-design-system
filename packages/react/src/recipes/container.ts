// Container's recipe: the classes a Kozmos container draws with, for every
// framework that draws one. React's `Container` and Vue's `KozmosContainer`
// both build their element from it, so the two cannot drift. Framework-free
// (`recipes.framework-free.test.ts`).

/**
 * A step of Container's block (top and bottom) inset: `none` 0, `sm` 16,
 * `md` 24 and `lg` 32, the layout spacing steps 200, 300 and 400.
 */
export type ContainerBlockInset = "none" | "sm" | "md" | "lg";

/** Both edges one step, or the top (`start`) and bottom (`end`) apart. */
export type ContainerBlock =
  | ContainerBlockInset
  | { start?: ContainerBlockInset; end?: ContainerBlockInset };

/** What a Container's side padding responds to: the window, or a panel. */
export type ContainerInset = "window" | "panel";

const BLOCK_START: Record<ContainerBlockInset, string | false> = {
  none: false,
  sm: "pt-4",
  md: "pt-6",
  lg: "pt-8",
};
const BLOCK_END: Record<ContainerBlockInset, string | false> = {
  none: false,
  sm: "pb-4",
  md: "pb-6",
  lg: "pb-8",
};

function blockEdges(block: ContainerBlock | undefined) {
  if (block === undefined) return { start: "none", end: "none" } as const;
  if (typeof block === "string") return { start: block, end: block };
  return { start: block.start ?? "none", end: block.end ?? "none" };
}

/**
 * A Container's classes, before the caller's: full width, its side padding
 * by `inset`, its block inset, and centred at the widest page's width.
 */
export function containerClasses({
  centered,
  inset,
  block,
}: {
  centered: boolean;
  inset: ContainerInset;
  block: ContainerBlock | undefined;
}): (string | false)[] {
  const edges = blockEdges(block);
  return [
    "w-full",
    inset === "panel" ? "px-4" : "px-4 sm:px-6 lg:px-8",
    BLOCK_START[edges.start],
    BLOCK_END[edges.end],
    centered && "mx-auto max-w-7xl", // Centered with max width
  ];
}
