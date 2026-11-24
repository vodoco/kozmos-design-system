/**
 * Tag's public prop types, written out so the package's declarations name
 * nothing outside it. `types.check.ts` holds each to the shared recipe's own
 * type, so a variant or an emotion added there fails the typecheck here.
 */
export type KozmosTagVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline";

/**
 * What a thing means, as opposed to how much it weighs: Tag's `emotion` and
 * Progress's `tone`, as React's `Emotion`.
 */
export type KozmosEmotion =
  | "neutral"
  | "themed"
  | "success"
  | "danger"
  | "informative"
  | "alert";
