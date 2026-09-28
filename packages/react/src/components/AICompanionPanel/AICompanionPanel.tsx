import React from "react";
import { Stars01, XClose } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import { Text } from "../Text";

export interface AICompanionPanelProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  /**
   * Whether the panel is on screen; `true` when left out. Keep the panel
   * mounted and turn `open` on when the visitor opens it — from
   * AISearchButton, usually: that is when it takes focus. A panel that is
   * open as it mounts, on screen from the start, was opened by nobody and
   * leaves focus where it is. Closed, it draws nothing.
   */
  open?: boolean;
  title?: React.ReactNode;
  /**
   * The heading level the title takes. It follows whatever heading sits above
   * the panel: 2 where it covers the frame, as in the SDK's sheet; deeper
   * where a product puts it inside a section. It looks the same at every
   * level — the level is the document's, not the type's.
   */
  titleLevel?: 2 | 3 | 4 | 5 | 6;
  onClose?: () => void;
  closeLabel?: string;
  /** The thread and its input, in that order. */
  children?: React.ReactNode;
  /** Above the thread: the Story 14 notice, an offline EmptyState. */
  banner?: React.ReactNode;
  /**
   * The panel takes focus when the visitor opens it: when `open` turns true
   * after it has mounted. Called first: `event.preventDefault()` keeps focus
   * where you put it instead — in the field, through AIInputBar's `inputRef`.
   * Not called for a panel that mounts open, which takes no focus, nor when a
   * part inside has already taken focus, which is left alone.
   */
  onOpenAutoFocus?: (event: Event) => void;
  /**
   * The panel closes when `open` turns false or it unmounts, and hands focus
   * back to whatever had it when it opened: AISearchButton, usually. Called
   * first: `event.preventDefault()`, then focus what should have it. Not
   * called at all when the product has already put focus somewhere outside
   * the panel — that choice stands.
   */
  onCloseAutoFocus?: (event: Event) => void;
}

/** Whatever has focus in the page, where there is a page to ask. */
const focusedElement = () =>
  typeof document === "undefined" ? null : document.activeElement;

/**
 * The assistant surface.
 *
 * It covers the frame and leaves the search sheet untouched beneath, as the
 * prototype sheet spec describes, so closing it returns the visitor to exactly
 * the search they left.
 *
 * `onClose` is optional on purpose. Story 18 lets a host app turn the
 * assistant off, and Story 5 AC1 says the panel must tolerate AISearchButton
 * being absent — a panel that cannot be opened from a button it does not have
 * must still be closable by whatever did open it, or by nothing at all.
 *
 * It is a region named by its title, and it moves focus in and out itself
 * (row 60). Opening left focus on the button beneath, which is focus on
 * something the visitor can no longer see; closing removed whatever held it,
 * and focus fell to the page. It moves focus in only when the visitor opens
 * it (decision 16): a panel on screen from the start takes nothing from the
 * page, which may have put focus somewhere on purpose.
 */
const AICompanionPanel = React.forwardRef<
  HTMLDivElement,
  AICompanionPanelProps
>(
  (
    {
      className,
      open = true,
      title = "Assistant",
      titleLevel = 2,
      onClose,
      closeLabel = "Close assistant",
      banner,
      children,
      onOpenAutoFocus,
      onCloseAutoFocus,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      ...props
    },
    ref,
  ) => {
    const titleId = React.useId();
    const root = React.useRef<HTMLDivElement>(null);
    // Closed, there is no panel: the handle follows `open`.
    React.useImperativeHandle(ref, () => root.current!, [open]);

    // What had focus as the panel opened, read while it renders open: once it
    // commits, a part inside may already have taken focus as it mounted. Each
    // open has its own opener, so it is read again whenever `open` turns true.
    const [shown, setShown] = React.useState(() => ({
      open,
      opener: open ? focusedElement() : null,
    }));
    if (shown.open !== open)
      setShown({ open, opener: open ? focusedElement() : null });
    const { opener } = shown;
    // Whether the panel was open when it last committed. It starts as `open`:
    // a panel that mounts open is one nobody opened.
    const wasOpen = React.useRef(open);
    // The close comes renders after the open, so it calls the handler the
    // panel has by then, not the one it opened with.
    const closeAutoFocus = React.useRef(onCloseAutoFocus);
    React.useEffect(() => {
      closeAutoFocus.current = onCloseAutoFocus;
    }, [onCloseAutoFocus]);

    // `open` changing is the panel's open and close; so is unmounting open.
    React.useEffect(() => {
      // Only `open` turning true is the visitor opening it. Mounting open is
      // not, nor is StrictMode running this again as the panel mounts.
      const opened = open && !wasOpen.current;
      wasOpen.current = open;
      const node = root.current;
      if (!open || !node) return;
      const doc = node.ownerDocument;
      if (opened && !node.contains(doc.activeElement)) {
        const opening = new Event("kozmos.aiCompanionPanel.openAutoFocus", {
          cancelable: true,
        });
        onOpenAutoFocus?.(opening);
        if (!opening.defaultPrevented) node.focus({ preventScroll: true });
      }
      return () => {
        // StrictMode's rehearsal runs this with the panel still in the
        // document. A real close has already taken it out.
        if (node.isConnected) return;
        // Only focus that went down with the panel is handed back. A product
        // that has already put it somewhere — the details of a place picked
        // from the thread — keeps it there. Radix's Dialog hands focus back
        // after its exit animation whatever happened meanwhile, and undoes
        // exactly that.
        const active = doc.activeElement;
        const lost =
          !active ||
          active === doc.body ||
          !active.isConnected ||
          node.contains(active);
        if (!lost) return;
        const closing = new Event("kozmos.aiCompanionPanel.closeAutoFocus", {
          cancelable: true,
        });
        closeAutoFocus.current?.(closing);
        if (closing.defaultPrevented) return;
        const target = opener as HTMLElement | null;
        if (target && target !== doc.body && target.isConnected)
          target.focus?.({ preventScroll: true });
      };
      // `open` alone. `onOpenAutoFocus` and the opener are read at the open;
      // the close reads its handler through the ref above.
    }, [open]);

    // A surface that covers the frame has to be dismissible from the
    // keyboard, or it is a trap for anyone not using a pointer. Bound on the
    // panel rather than the document so a host that renders two of these does
    // not close both, and skipped entirely when there is nothing to close.
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!onClose || event.key !== "Escape") return;
      event.stopPropagation();
      onClose();
    };

    if (!open) return null;
    return (
      <div
        aria-label={ariaLabel}
        // Named by its title, so a product that translates the title has
        // translated the region. A name the product gives it outright wins.
        aria-labelledby={ariaLabelledBy ?? (ariaLabel ? undefined : titleId)}
        className={cn(
          // Focused as it opens so a screen reader announces it, but it is a
          // region, not a control: no ring round the whole frame.
          "flex h-full min-h-0 w-full flex-col bg-background text-foreground outline-none",
          className,
        )}
        onKeyDown={handleKeyDown}
        ref={root}
        role="region"
        tabIndex={-1}
        {...props}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
          <span
            aria-hidden="true"
            className="inline-flex h-8 w-8 items-center justify-center rounded-pill border border-border text-primary"
          >
            <Stars01 className="h-4 w-4" />
          </span>
          {/* A heading, so a screen reader moving by headings finds the
              assistant; it was a <p>. Text, not Heading: the size is the
              header's, whatever the level. */}
          <Text
            as={`h${titleLevel}`}
            className="min-w-0 flex-1"
            id={titleId}
            size="base"
            truncate
            weight="semibold"
          >
            {title}
          </Text>
          {onClose && (
            <button
              aria-label={closeLabel}
              // The mark stays 36; `kozmos-ai-companion-close` carries the
              // 44px target in the owned stylesheet.
              className="kozmos-ai-companion-close inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border border-border text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={onClose}
              type="button"
            >
              <XClose aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </div>
        {banner && <div className="shrink-0 px-4 pt-4">{banner}</div>}
        {children}
      </div>
    );
  },
);
AICompanionPanel.displayName = "AICompanionPanel";

export { AICompanionPanel };
