/**
 * Badge's public prop types, written out so the package's declarations name
 * nothing outside it. `types.check.ts` holds each to the shared recipe's own
 * type, so a variant or size added there fails the typecheck here.
 */
export type KozmosBadgeVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

export type KozmosBadgeSize = "default" | "sm" | "lg" | "icon";
