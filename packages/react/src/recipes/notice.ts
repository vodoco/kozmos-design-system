/**
 * Notice's recipe: the classes a Kozmos notice draws with, by tone, and the
 * boxes of its mark, summary, disclosure, detail and action, for every
 * framework that draws one. React's `Notice` and Vue's `KozmosNotice` build
 * their elements from it; its `live` is `LIVE_ROLES` (`live-region.ts`), its
 * progress mark `SPINNER_ARC`. Framework-free
 * (`recipes.framework-free.test.ts`).
 */

/** The notice's box; its tone's classes follow (`NOTICE_TONES`). */
export const NOTICE_CLASS = "w-full rounded-container border px-3 py-2";

export type NoticeTone = "warning" | "info" | "critical" | "success";

/**
 * Where the work the notice reports on has got (GAP-160). `progress` turns
 * the system's loading arc where the tone's mark is; `done` draws a check
 * at the summary's inline end, in the tone's colour, in place of the mark
 * at its start.
 */
export type NoticeStatus = "progress" | "done";

/**
 * How loudly the notice announces itself. The same three values Alert takes,
 * so a product does not learn two vocabularies for one idea.
 *
 * `polite` is `role="status"`, the default and right for almost everything: a
 * dietary notice must be read when the results arrive, but must not cut across
 * whatever the visitor is already being told.
 *
 * `assertive` is `role="alert"`, which interrupts. It is for the emergency
 * notice and nothing else — the case the notice previously could not express,
 * because the role was fixed.
 */
export type NoticeLiveness = "off" | "polite" | "assertive";

/** Where the icon sits beside the summary. */
export type NoticeIconAlign = "start" | "center";

export const NOTICE_TONES: Record<NoticeTone, string> = {
  warning: "border-warning/50 bg-warning/5 text-warning-text",
  info: "border-info/50 bg-info/5 text-info-text",
  critical: "border-destructive/60 bg-destructive/5 text-destructive-text",
  success: "border-success/50 bg-success/5 text-success-text",
};

/** The tone's mark and the progress arc, at 16. */
export const NOTICE_MARK_CLASS = "h-4 w-4";
export const NOTICE_MARK_SIZE = 16;

// Boxes, not paragraphs: a summary or detail may hold a control or a
// framework's wrapper, which a <p> may not hold.
export const NOTICE_SUMMARY_CLASS =
  "min-w-0 flex-1 text-sm font-semibold leading-snug";

export const NOTICE_MORE_CLASS =
  "kozmos-notice-more -mr-1 inline-flex shrink-0 items-center gap-1 rounded-control px-1 py-0.5 text-xs font-semibold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export const NOTICE_DETAIL_TEXT_CLASS = "text-sm leading-snug";

/**
 * Everything else a notice draws that its state decides, in one call: the
 * tone it draws (`warning`, its default, for a tone it does not know); the
 * summary's line; the mark's box at the start; the done check at the end;
 * More's chevron; the detail's box, in line with the summary; and the
 * action's box, under the text.
 */
export function noticeParts(
  tone: NoticeTone | undefined,
  iconAlign: NoticeIconAlign,
  open: boolean,
  drawsIcon: boolean,
  detailVisible: boolean,
): [
  tone: NoticeTone,
  row: string,
  mark: string,
  done: string,
  chevron: string,
  detail: string,
  action: string,
] {
  const start = iconAlign === "start" ? " mt-0.5" : "";
  const inset = drawsIcon ? " pl-6" : "";
  return [
    tone !== undefined && NOTICE_TONES[tone] ? tone : "warning",
    `flex gap-2 ${iconAlign === "center" ? "items-center" : "items-start"}`,
    `shrink-0${start}`,
    `h-4 w-4 shrink-0${start}`,
    `h-3.5 w-3.5 transition-transform${open ? " rotate-180" : ""}`,
    `${drawsIcon ? "pl-6 " : ""}pr-1${detailVisible ? " mt-1.5" : ""}`,
    `mt-3${inset}`,
  ];
}
