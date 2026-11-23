/**
 * CodeBlock's recipe: a read-only block of code (GAP-216, decision 225),
 * for every framework that draws one. React's `CodeBlock` and Vue's
 * `KozmosCodeBlock` both draw the region, its `<pre>` and its copy from it.
 * Framework-free (`recipes.framework-free.test.ts`).
 */

/** The region, the `<pre>` in it, the copy button and the copy's glyph. */
export const CODE_BLOCK_CLASS = "kozmos-code-block";
export const CODE_BLOCK_PRE_CLASS = "kozmos-code-block-pre";
export const CODE_BLOCK_COPY_CLASS = "kozmos-code-block-copy";
export const CODE_BLOCK_COPY_ICON_CLASS =
  "kozmos-reset kozmos-code-block-copy-icon";

/** How long "Copied" is said, and the check drawn, after a copy: 2 s. */
export const CODE_BLOCK_SAID_MS = 2000;

/** Whether the block's height is capped by a `maxHeight`. */
export function codeBlockCapped(maxHeight: number | string | null | undefined) {
  return maxHeight !== undefined && maxHeight !== null;
}

/**
 * The `<pre>`'s tabindex: scrolling sideways, or down past maxHeight, the
 * box is a stop on the keyboard's way.
 */
export function codeBlockTabIndex(wrap: boolean, capped: boolean) {
  return wrap && !capped ? undefined : 0;
}

/**
 * What is announced after a copy. The same words twice are not read twice:
 * a second copy changes them by a no-break space, as Input's copy does.
 */
export function codeBlockSaid(previous: string, copiedLabel: string) {
  return previous === copiedLabel ? `${copiedLabel}\u00a0` : copiedLabel;
}
