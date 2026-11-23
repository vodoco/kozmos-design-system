/**
 * Avatar's recipe: the classes an avatar, its image and its fallback draw
 * with, for every framework that draws one. React's `Avatar` (on Radix) and
 * Vue's `KozmosAvatar` both build their elements from it. Framework-free
 * (`recipes.framework-free.test.ts`).
 */

/**
 * `default`, 40, or `sm`, 24 (decision 221), its initials at 12/16: for a
 * row that keeps its own height, such as an option's media (decision 215).
 */
export type AvatarSize = "default" | "sm";

/** The avatar's own box, round, at its size. */
export function avatarClasses(size: AvatarSize | undefined): string {
  return `relative flex shrink-0 overflow-hidden rounded-pill ${size === "sm" ? "h-6 w-6 text-xs" : "h-10 w-10"}`;
}

/** What marks a small avatar (`data-size`); a default one carries none. */
export const avatarDataSize = (size: AvatarSize | undefined) =>
  size === "sm" ? "sm" : undefined;

/** The image, filling the box. */
export const AVATAR_IMAGE_CLASS = "aspect-square h-full w-full";

/** The fallback, the initials centred on the muted fill. */
export const AVATAR_FALLBACK_CLASS =
  "flex h-full w-full items-center justify-center rounded-pill bg-muted";
