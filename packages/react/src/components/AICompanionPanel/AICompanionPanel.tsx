import React from "react";
import { Stars01, XClose } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import { inertOutside } from "../../utils/modal-inert";
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
 * What the open panel covers (GAP-93): the box it is laid over and fills,
 * taken out of flow to cover it — `absolute inset-0` in its positioned
 * container, as its docs place it — or the page, for a panel that fills the
 * viewport (fixed) or the whole page. A panel in flow, or one over only part
 * of its box, covers nothing: what is beside it stays in reach. Read from
 * the layout, not the screen, so a transform the product animates it in with
 * does not change the answer.
 */
function coveredBy(panel: HTMLElement): Element | null {
  const doc = panel.ownerDocument;
  const position = doc.defaultView?.getComputedStyle(panel).position;
  if (position !== "absolute" && position !== "fixed") return null;
  const { offsetWidth: width, offsetHeight: height, offsetParent: box } = panel;
  // Nothing laid out, hidden or without a layout at all, covers nothing.
  if (!width || !height) return null;
  if (box && box !== doc.body)
    return panel.offsetLeft <= 1 &&
      panel.offsetTop <= 1 &&
      width >= box.clientWidth - 1 &&
      height >= box.clientHeight - 1
      ? box
      : null;
  const page = doc.documentElement;
  return width >= page.clientWidth - 1 &&
    height >= (position === "fixed" ? page.clientHeight : page.scrollHeight) - 1
    ? doc.body
    : null;
}

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
 *
 * While it is open, what it covers is out of reach (GAP-93): laid over the
 * box it fills, `absolute inset-0` in its positioned container, it makes the
 * rest of that box inert, and gives it back as it closes, before it hands
 * focus back. The keyboard cannot step back out of it onto controls nobody
 * can see. Placed in flow, or over part of its box, it covers nothing.
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
      onKeyDown,
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
      // What the panel covers is out of reach while it is open (GAP-93):
      // stepping back out of it with Shift+Tab landed on the search's tiles
      // beneath, where nobody could see them (WCAG 2.2, 2.4.11). Only what it
      // covers, never the page beyond its frame; live regions beneath still
      // speak, and the page's portals, where a part inside opens its popups,
      // stay in reach. After focus has moved in, so the button that opened
      // it does not lose focus to the page on the way.
      const covered = coveredBy(node);
      const release = covered
        ? inertOutside(node, { within: covered, keep: "[data-kozmos-portal]" })
        : undefined;
      return () => {
        // Given back first: the control focus returns to was under the panel.
        release?.();
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
    //
    // The product's own handler runs first, and an Escape already handled —
    // by it, or by a part inside that dismissed something of its own and said
    // so with preventDefault() — is left alone (R2). The product's handler
    // used to replace this one, and a handled Escape closed the panel anyway.
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (!onClose || event.key !== "Escape" || event.defaultPrevented) return;
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
