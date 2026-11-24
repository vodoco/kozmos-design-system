/**
 * What the handler reads of a key press: React's `KeyboardEvent` and the
 * DOM's both have it, so React's parts and Vue's share one handler.
 */
export interface HorizontalScrollKeyEvent {
  currentTarget: EventTarget | null;
  target: EventTarget | null;
  key: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  defaultPrevented: boolean;
  preventDefault(): void;
}

/** Native keyboard scrolling is inconsistent for focusable lists in WebKit.
 * Handle horizontal scroll keys only when the viewport itself owns focus;
 * descendants retain their own keys and vertical page navigation is untouched.
 * Framework-free: React's MetaStrip, Table and panels and Vue's
 * KozmosMetaStrip call it.
 */
export function scrollHorizontalWithKeyboard(event: HorizontalScrollKeyEvent) {
  const viewport = event.currentTarget as HTMLElement;
  if (
    event.defaultPrevented ||
    event.target !== viewport ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    viewport.scrollWidth <= viewport.clientWidth
  )
    return;
  const distance = Math.max(40, viewport.clientWidth / 10);
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    viewport.scrollBy({
      left: event.key === "ArrowLeft" ? -distance : distance,
      behavior: "auto",
    });
  } else if (event.key === "Home" || event.key === "End") {
    event.preventDefault();
    const direction =
      viewport.ownerDocument.defaultView?.getComputedStyle(viewport).direction;
    viewport.scrollTo({
      left:
        event.key === "Home"
          ? 0
          : (direction === "rtl" ? -1 : 1) *
            (viewport.scrollWidth - viewport.clientWidth),
      behavior: "auto",
    });
  }
}
