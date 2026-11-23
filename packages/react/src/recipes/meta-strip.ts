/**
 * MetaStrip's recipe: the classes a Kozmos strip of facts and each of its
 * tiles draw with, for every framework that draws them. React's `MetaStrip`
 * and `MetaStripItem` and Vue's `KozmosMetaStrip` and `KozmosMetaStripItem`
 * build their elements from it; the strip's arrow keys are
 * `scrollHorizontalWithKeyboard` (`keyboard-scroll.ts`). Framework-free
 * (`recipes.framework-free.test.ts`).
 */
// The source strip is wider than the card that holds it, so it scrolls
// rather than wraps: a fact tile that has wrapped to a second row reads
// as a different kind of thing.
export const META_STRIP_CLASS = "kozmos-reset kozmos-meta-strip";

// `dt` must come before its `dd` for the pair to be read as a pair, and
// the label is drawn under the value — so the DOM order is the accessible
// one and `flex-col-reverse` does the drawing.
export const META_STRIP_ITEM_CLASS = "kozmos-reset kozmos-meta-item";

export const META_STRIP_LABEL_CLASS = "kozmos-meta-label";

/** The label kept for assistive technology, not drawn. */
export const META_STRIP_LABEL_HIDDEN_CLASS = "kozmos-meta-label-hidden";

export const META_STRIP_VALUE_CLASS = "kozmos-meta-value";

export const META_STRIP_ICON_CLASS = "kozmos-meta-icon";
