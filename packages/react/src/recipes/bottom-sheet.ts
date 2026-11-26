/**
 * BottomSheet's recipe: the classes its sheet, grip and close are drawn
 * with, over Drawer's (drawer.ts), for every framework that draws one.
 * React's `BottomSheetContent` builds its element from it, and so does Vue's
 * `KozmosBottomSheetContent`. Framework-free (`recipes.framework-free.test.ts`).
 */

export const BOTTOM_SHEET_CONTENT_CLASS =
  "kozmos-bottom-sheet inset-x-0 bottom-0 mt-24 flex h-auto max-h-[min(100%,calc(100dvh-env(safe-area-inset-top)-1rem))] flex-col overscroll-contain rounded-t-container border-t bg-background !px-4 !pb-[max(1.5rem,env(safe-area-inset-bottom))] !pt-0";
/** The grip at the sheet's top: drawn, and hidden from readers. */
export const BOTTOM_SHEET_GRIP_CLASS =
  "kozmos-bottom-sheet-grip mx-auto my-2 h-[5px] w-12 shrink-0 rounded-pill bg-muted-foreground/40";
export const BOTTOM_SHEET_CLOSE_CLASS =
  "kozmos-bottom-sheet-close absolute right-0 top-2 inline-flex h-11 w-11 items-start justify-end rounded-control p-2 text-muted-foreground transition-colors hover:bg-hover-fill hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none";
/** The close's name, read and never drawn. */
export const BOTTOM_SHEET_CLOSE_LABEL = "Close bottom sheet";
