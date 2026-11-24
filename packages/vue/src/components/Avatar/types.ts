/**
 * Avatar's public types, written out so the package's declarations name
 * nothing outside it. `types.check.ts` holds the size to the shared recipe's.
 */
export type KozmosAvatarSize = "default" | "sm";

/** Where an avatar's image is: Radix's and Reka's `ImageLoadingStatus`. */
export type KozmosAvatarImageLoadingStatus =
  | "idle"
  | "loading"
  | "loaded"
  | "error";
