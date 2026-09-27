import { IconButton, Icon, Text } from "@kozmos-ds/react";

/**
 * The padding of the block a `PanelHeader` sits in — **the thing that decides where the ✕ lands**,
 * since the header aligns it to `flex-start` and the panel's own right edge.
 *
 * It is a constant because it drifted (Olcay, 2026-08-11: *"position of the close button should be
 * consistent"*): Manual Review used `18px` where every other panel used `16px`, and — far worse —
 * three of the four screens had the header **inside** their scrolling area, so a 15px scrollbar
 * pushed the ✕ left on exactly the long screens that grow one, and scrolling took it off the top of
 * the panel altogether. Put the header in its own non-scrolling block with this padding, and the
 * scroller beneath it.
 */
export const PANEL_PAD = "16px 20px 8px";

/**
 * The panel header every drawer-shaped screen wears: title block on the left, the v9 drawerHeader
 * **✕ on the right** (Olcay's standing rule — panels close from the header, footers keep only the
 * concluding action). Figma `12929:243939`'s `drawerHeader` / `x-close` anatomy.
 *
 * One component because it was four copies (Version History, Editing Level, Manual Review, the
 * Building wizard) plus a drifted fifth in the lightbox — and two of them rendered the same icon
 * in *different greys* (`MUTED` #5d626f vs `--review-muted` #737373) because each screen reached
 * for whichever muted constant was nearest. Tokens, not constants, settle it.
 */
export function PanelHeader({
  eyebrow,
  leading,
  title,
  subtitle,
  onClose,
  closeLabel = "Close",
}: {
  /** The small muted line above the title — a breadcrumb or the parent's name. */
  eyebrow?: string;
  /**
   * An icon before the text — its own column, deliberately (Olcay, 2026-08-16: *"alignent issue at
   * the feature header"*).
   *
   * ⚠️ It used to be composed *into* the title node by the caller, which meant only the **title**
   * carried the icon's width and gap while the eyebrow and subtitle stayed flush with the panel's
   * padding. Measured: title at 45px, subtitle at 21px, body at 21px — the title alone hanging 24px
   * to the right of its own subtitle. Worse when the sprite failed to load, because the box
   * collapsed to nothing and left an 8px indent with visibly nothing to explain it.
   *
   * As its own column the icon leads the whole block, so title and subtitle share one left edge and
   * the icon lines up with the body beneath.
   */
  leading?: React.ReactNode;
  /** A plain string gets the standard title type; pass a node to compose your own (S3 does). */
  title: string | React.ReactElement;
  /** The muted line below the title, where a screen explains itself. */
  subtitle?: string;
  onClose?: () => void;
  /** Accessible name for the ✕ — say what closes, not just "close". */
  closeLabel?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
      {leading != null && (
        <span style={{ flex: "0 0 auto", marginTop: 3 }}>{leading}</span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {eyebrow != null && (
          <Text
            style={{
              fontSize: 12,
              color: "var(--primitives-colors-background-600)",
              display: "block",
            }}
          >
            {eyebrow}
          </Text>
        )}
        {typeof title === "string" ? (
          <Text
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "var(--primitives-colors-theme-900)",
              display: "block",
              marginTop: 2,
            }}
          >
            {title}
          </Text>
        ) : (
          title
        )}
        {subtitle != null && (
          <Text
            style={{
              fontSize: 12.5,
              color: "var(--primitives-colors-background-600)",
              display: "block",
              marginTop: 2,
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </Text>
        )}
      </div>
      {onClose && (
        <IconButton
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label={closeLabel}
          title="Close"
          style={{ flex: "0 0 auto" }}
        >
          <Icon name="x-close" />
        </IconButton>
      )}
    </div>
  );
}
