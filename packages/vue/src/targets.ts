import { isRef, toRaw } from "vue";

/**
 * Backdrop's `target` as Vue holds one, handed to React as what it names
 * (GAP-189). A template ref on an element arrives as the element; one on a
 * component arrives as its instance, whose `$el` is its element (the
 * harness's wrappers draw `display: contents`, and Backdrop lights such an
 * element by its children's box). A `ref()` that the template did not
 * unwrap, inside a list, is read through `.value`. A list is read item by
 * item; anything else (a React ref, a rect, a virtual element) is passed on.
 */
export function toReactTarget(target: unknown): unknown {
  if (Array.isArray(target)) return toRaw(target).map(toReactTarget);
  // A ref() holds its value reactive; React is handed the object itself.
  if (isRef(target)) return toReactTarget(toRaw(target.value));
  if (
    typeof target === "object" &&
    target !== null &&
    "$el" in target &&
    !("nodeType" in target)
  )
    return (target as { $el: unknown }).$el ?? null;
  return target;
}
