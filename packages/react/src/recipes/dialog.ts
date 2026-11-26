/**
 * Dialog's recipe: the classes its scrim, panel, close, header, media,
 * footer, title and description are drawn with, for every framework that
 * draws one. React's `Dialog` parts build their elements from it, and so do
 * Vue's `KozmosDialog` parts. Framework-free (`recipes.framework-free.test.ts`).
 */

/** The scrim under a modal dialog. */
export const DIALOG_OVERLAY_CLASS =
  "kozmos-modal-overlay fixed inset-0 z-50 bg-overlay-scrim data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0";

/** The panel, centred in the window, at either size. */
export const DIALOG_CONTENT_CLASS =
  "kozmos-dialog-content fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto -translate-x-1/2 -translate-y-1/2 gap-6 border bg-background p-6 shadow-overlay transition-none duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-container";

/**
 * `default`: at most 512 wide. `full`: the window less 16 on each side
 * (decision 202, GAP-259), the header keeping its height and the second
 * child taking the rest.
 */
export const DIALOG_CONTENT_SIZE_CLASSES = {
  default: "max-w-lg",
  full: "max-w-none h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)]",
} as const;

/** The panel's size classes: `full` for `full`, the default's otherwise. */
export const dialogContentSizeClass = (size: string | undefined) =>
  size === "full"
    ? DIALOG_CONTENT_SIZE_CLASSES.full
    : DIALOG_CONTENT_SIZE_CLASSES.default;

/**
 * The persistent close, an outline icon button. It centres on the title's
 * first line, 44 tall, at any density (decision 82): 24 from the top at 44,
 * 30 at 32.
 */
export const DIALOG_CLOSE_CLASS =
  "kozmos-dialog-close absolute end-6 top-[calc(1.5rem_+_(2.75rem_-_var(--density-icon-control-size-md,2.75rem))_/_2)]";

export const DIALOG_HEADER_CLASS = "flex min-w-0 flex-col gap-2 text-start";

/** The header's illustration or photo above the title (decision 195). */
export const DIALOG_MEDIA_CLASS = "kozmos-dialog-media";

export const DIALOG_FOOTER_CLASS =
  "kozmos-dialog-footer flex min-w-0 gap-2 [overflow-wrap:anywhere]";

/** Stacked keeps DOM, reading and visual order aligned; responsive reverses on a phone. */
export const DIALOG_FOOTER_LAYOUT_CLASSES = {
  stacked: "flex-col",
  responsive: "flex-col-reverse sm:flex-row sm:flex-wrap sm:justify-end",
} as const;

/** The footer's layout classes: stacked for `stacked`, responsive otherwise. */
export const dialogFooterLayoutClass = (layout: string | undefined) =>
  layout === "stacked"
    ? DIALOG_FOOTER_LAYOUT_CLASSES.stacked
    : DIALOG_FOOTER_LAYOUT_CLASSES.responsive;

/**
 * Room for the close, the icon button's size, and 12 (decision 82). GAP-275:
 * 8 over the words, so the first line centres on the close, and none under
 * them, so a description sits 8 under a one-line title; 36 tall at least, so
 * the description starts where the close's 44 target ends (24 + 44 = 68 =
 * 24 + 36 + the header's 8).
 */
export const DIALOG_TITLE_CLASS =
  "min-h-9 min-w-0 pt-2 pe-[calc(var(--density-icon-control-size-md,2.75rem)_+_0.75rem)] text-xl font-semibold leading-snug tracking-tight [overflow-wrap:anywhere]";

export const DIALOG_DESCRIPTION_CLASS =
  "min-w-0 text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]";
