/**
 * Alert's public prop types, written out so the package's declarations name
 * nothing outside it. `types.check.ts` holds each to the shared recipe's own
 * type, so a variant added there fails the typecheck here.
 */
export type KozmosAlertVariant =
  | "default"
  | "destructive"
  | "success"
  | "warning"
  | "info";

/** `off`, no live region; `polite`, `role="status"`; `assertive`, `role="alert"`. */
export type KozmosAlertLiveness = "off" | "polite" | "assertive";

/** The title's heading level, or `none` for a `<p>`. */
export type KozmosAlertTitleLevel = 2 | 3 | 4 | 5 | 6 | "none";
