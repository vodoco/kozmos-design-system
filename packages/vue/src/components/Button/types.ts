/**
 * Button's public prop types, written out so the package's declarations name
 * nothing outside it. `types.check.ts` holds each to the shared recipe's own
 * type, so a variant, size or emotion added there fails the typecheck here.
 */
export type KozmosButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link"
  | "glass"
  | "subtle";

export type KozmosButtonSize = "default" | "sm" | "lg" | "icon";

export type KozmosButtonEmotion =
  | "themed"
  | "neutral"
  | "success"
  | "danger"
  | "informative"
  | "alert";
