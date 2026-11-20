/**
 * Separator's recipe: the classes a Kozmos separator draws with, by
 * orientation, for every framework that draws one. React's `Separator` (on
 * Radix) and Vue's `KozmosSeparator` (on Reka UI) both build their element
 * from it. Framework-free (`recipes.framework-free.test.ts`).
 */
export type SeparatorOrientation = "horizontal" | "vertical";

export function separatorClasses(
  orientation: SeparatorOrientation | undefined,
): string {
  return `shrink-0 bg-border ${orientation === "horizontal" ? "h-px w-full" : "h-full w-px"}`;
}
