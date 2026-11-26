// Link's recipe: the classes a Kozmos link draws with, and when it opens a
// new tab, for every framework that draws one. React's `Link` and Vue's
// `KozmosLink` build their anchor from it. Framework-free
// (`recipes.framework-free.test.ts`).

export type LinkVariant = "default" | "subtle";

/** The anchor's classes, before a caller's, by variant. */
export function linkClasses(variant: LinkVariant | undefined) {
  return [
    "font-medium hover:underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background rounded-marker",
    variant === "default" && "text-primary",
    variant === "subtle" && "text-muted-foreground hover:text-foreground",
  ];
}

/**
 * Whether an `external` link opens a new tab. The caller's `target` wins, so
 * one that keeps the link in this tab leaves nothing to say about a new one.
 * An empty target is this tab too.
 */
export function linkOpensNewTab(
  external: boolean,
  target: string | null | undefined,
): boolean {
  return (
    external && (target == null || !/^(?:_self|_parent|_top)?$/i.test(target))
  );
}

/** The new tab's target, where the caller gives none. */
export const LINK_NEW_TAB_TARGET = "_blank";
/** The new tab's rel, where the caller gives none. */
export const LINK_NEW_TAB_REL = "noopener noreferrer";

/**
 * The new-tab mark at the link's end: a no-break space joins the icon to the
 * link's last word, so the icon never wraps onto a line alone, and is the gap
 * before it. It also parts the name from the announcement where WebKit runs a
 * visually hidden span into the text before it.
 */
export const LINK_EXTERNAL_CLASS = "kozmos-link-external";
export const LINK_EXTERNAL_JOINER = "\u00a0";
export const LINK_EXTERNAL_ICON_CLASS =
  "kozmos-link-external-icon kozmos-rtl-mirror";
/** The words after the link's name, for a screen reader. */
export const LINK_EXTERNAL_LABEL_CLASS = "kozmos-link-external-label";
