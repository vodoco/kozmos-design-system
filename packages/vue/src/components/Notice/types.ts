/**
 * Notice's public prop types, written out so the package's declarations
 * name nothing outside it. `types.check.ts` holds each to the shared
 * recipe's own type, so a tone added there fails the typecheck here.
 */
export type KozmosNoticeTone = "warning" | "info" | "critical" | "success";

/** `progress` turns the loading arc where the mark is; `done` ends in a check. */
export type KozmosNoticeStatus = "progress" | "done";

/** `off`, no live region; `polite`, `role="status"`; `assertive`, `role="alert"`. */
export type KozmosNoticeLiveness = "off" | "polite" | "assertive";

/** Where the icon sits beside the summary. */
export type KozmosNoticeIconAlign = "start" | "center";
