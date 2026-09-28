import { useCallback, useEffect, useRef } from "react";

/**
 * Focus for a view that replaces another in place: a step, a detail panel, a
 * confirmation. The control that was pressed leaves with the old view, and
 * focus would fall back to the page's body, so a keyboard or screen reader
 * user would start again from the top. Instead it moves to the new view's
 * heading or panel, as the site does for a new page.
 *
 * Give the returned ref to that element — any element: a heading, a button,
 * a panel — with `tabIndex={-1}` when it is not a control. Nothing moves on
 * the first render, or when the view is the same; `when` limits it to the
 * changes that lead to this element's view.
 *
 * In a map shell's panel the new view starts at the panel's top. The panel's
 * content scrolls in a box AdaptiveMapShell marks `data-kozmos-scroller`
 * (POIResultList.mdx), with the panel's top inset inside it; focus alone
 * would scroll the view's top edge to that box's and take the inset with it.
 * So there the box goes back to its top and the view takes focus where it
 * is, and the padding above it stays what the shell and the view give it.
 */
export function useFocusOnChange(view: unknown, when = true) {
  const target = useRef<HTMLElement | null>(null);
  const previous = useRef(view);
  useEffect(() => {
    if (Object.is(previous.current, view)) return;
    previous.current = view;
    const node = target.current;
    if (!when || !node) return;
    const scroller = node.closest<HTMLElement>("[data-kozmos-scroller]");
    if (!scroller) {
      node.focus();
      return;
    }
    scroller.scrollTop = 0;
    node.focus({ preventScroll: true });
  }, [view, when]);
  return useCallback((node: HTMLElement | null) => {
    target.current = node;
  }, []);
}
