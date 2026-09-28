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
 */
export function useFocusOnChange(view: unknown, when = true) {
  const target = useRef<HTMLElement | null>(null);
  const previous = useRef(view);
  useEffect(() => {
    if (Object.is(previous.current, view)) return;
    previous.current = view;
    if (when) target.current?.focus();
  }, [view, when]);
  return useCallback((node: HTMLElement | null) => {
    target.current = node;
  }, []);
}
