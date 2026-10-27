import * as React from "react";

/**
 * The content element of the modal overlay (Dialog, Drawer, BottomSheet)
 * something renders inside, for a part that draws in a portal of its own and
 * must stay inside the modal: Backdrop. A modal makes everything outside its
 * content inert (Radix hides it from assistive technology, takes its pointer
 * events and traps focus inside the content), so a Backdrop drawn in the
 * theme's portal beside it could not block presses, take focus or be read.
 * Inside a modal, it is drawn in the modal's content instead.
 *
 * Undefined outside a modal; null while the modal's content is mounting.
 */
export const OverlayContainerContext = React.createContext<
  HTMLElement | null | undefined
>(undefined);

/**
 * A modal content's ref, composed with the one forwarded to it, and the
 * element it holds, to provide through OverlayContainerContext.
 */
export function useOverlayContainer<T extends HTMLElement>(
  forwarded: React.ForwardedRef<T>,
) {
  const [element, setElement] = React.useState<T | null>(null);
  const ref = React.useCallback(
    (node: T | null) => {
      setElement(node);
      if (typeof forwarded === "function") forwarded(node);
      else if (forwarded) forwarded.current = node;
    },
    [forwarded],
  );
  return [ref, element] as const;
}
