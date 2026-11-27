import {
  cloneVNode,
  computed,
  defineComponent,
  Comment,
  Text,
  h,
  inject,
  onBeforeUnmount,
  provide,
  watch,
  type Ref,
  type ComputedRef,
  type SlotsType,
  type VNode,
} from "vue";
import {
  GenericClickKey,
  ThemeKey,
  useKozmosDensity,
} from "../../theme/injection";

/**
 * The overlays' layering, one system for every part that draws over the
 * page (Dialog, Drawer, BottomSheet, Popover, Tooltip, Select's list and
 * Combobox's popup), as Radix's DismissableLayer, FocusScope and Portal are
 * one system for React's:
 *
 * - **Layers.** Every overlay is a layer of Reka UI's DismissableLayer
 *   (its Dialog, Popover, Tooltip and Select content are), whose stack is
 *   shared across them: Escape and a press outside reach only the highest
 *   layer, a modal layer turns the body's pointer events off and keeps its
 *   own and every layer above it on, and a press in a layer opened above
 *   another (portalled after it) is inside the lower one. A popup that is
 *   no Reka layer, Combobox's, joins that stack's DOM contract
 *   (`joinLayers`): React's is a Radix DismissableLayer with no dismiss.
 * - **Focus.** Reka's FocusScope stack: a scope opened inside another
 *   (Select's list in a Dialog) pauses the outer one until it closes.
 * - **Portals.** Each is drawn in the nearest KozmosThemeProvider's portal,
 *   or the part's `portal-container`, carrying the density where it opened
 *   (`useOverlayPortal`), as React's ThemePortal; never in the body briefly
 *   while the provider's portal is still mounting.
 */

/** Where an overlay is drawn, and the density it carries there. */
export function useOverlayPortal(
  portalContainer: () => Element | DocumentFragment | null | undefined,
): {
  /** The portal's element; null while the provider's is still mounting. */
  to: ComputedRef<Element | DocumentFragment | string | null>;
  density: ComputedRef<string | undefined>;
} {
  const theme = inject(ThemeKey, undefined);
  const density = useKozmosDensity();
  return {
    to: computed(() => {
      const own = portalContainer();
      if (own !== undefined) return own;
      return theme ? theme.portalContainer.value : "body";
    }),
    density: computed(() => density?.value),
  };
}

/**
 * What a popup that is no Reka layer draws to join the layers' stack as
 * React's Radix DismissableLayer does with no dismiss of its own: marked as
 * a layer, so a layer under it hears a press in it as inside; and taking
 * the pointer while a modal layer under it has turned the body's off, as
 * Radix gives each layer above the modal one (`pointer-events: auto`).
 */
export function joinLayers(element: Element | null | undefined) {
  const body = (element?.ownerDocument ?? globalThis.document)?.body;
  return {
    "data-dismissable-layer": "",
    style:
      body?.style.pointerEvents === "none"
        ? { pointerEvents: "auto" as const }
        : undefined,
  };
}

/** Whether a layer opened after `element` (portalled after it) is still open. */
export function layerAbove(element: Element) {
  const layers = [
    ...element.ownerDocument.querySelectorAll("[data-dismissable-layer]"),
  ];
  const own = layers.findIndex(
    (layer) => layer === element || layer.contains(element),
  );
  return layers.some(
    (layer, index) =>
      !element.contains(layer) &&
      (own === -1
        ? !!(
            element.compareDocumentPosition(layer) &
            Node.DOCUMENT_POSITION_FOLLOWING
          )
        : index > own),
  );
}

/**
 * Its slot, with a KozmosButton in it reporting no `button_clicked`, as
 * React's WithoutGenericClick. Internal.
 */
export const KozmosWithoutGenericClick = defineComponent({
  name: "KozmosWithoutGenericClick",
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(_, { slots }) {
    provide(GenericClickKey, false);
    return () => slots.default?.();
  },
});

/**
 * Radix's arrow, drawn in the tip Reka places (`<XArrow as-child>`): a
 * triangle on a 30 by 10 box scaled to its size. Reka's own draws a 12 by 6
 * path, the same triangle in other markup. It takes Reka's `rounded`, which
 * would otherwise be written on the `<svg>`.
 */
const RadixArrow = defineComponent({
  name: "KozmosRadixArrow",
  inheritAttrs: false,
  props: { rounded: { type: Boolean, default: undefined } },
  setup(_, { attrs }) {
    return () =>
      h(
        "svg",
        {
          ...Object.fromEntries(
            Object.entries(attrs).filter(
              ([name, value]) =>
                value !== undefined &&
                !/^(view-?box|preserve-?aspect-?ratio)$/i.test(name),
            ),
          ),
          viewBox: "0 0 30 10",
          preserveAspectRatio: "none",
        },
        h("polygon", { points: "0,0 30,0 15,10" }),
      );
  },
});
export const radixArrow = () => h(RadixArrow);

/** A press or focus outside a layer, as Radix's (and Reka's) events. */
export type OutsideEvent = CustomEvent<{
  originalEvent: PointerEvent | FocusEvent;
}>;

/** Whether `target` is in `element`, or in a layer opened above it. */
function insideOrAbove(element: Element, target: EventTarget | null) {
  if (!(target instanceof Node)) return false;
  if (element.contains(target)) return true;
  const layer =
    target instanceof Element
      ? target.closest("[data-dismissable-layer]")
      : target.parentElement?.closest("[data-dismissable-layer]");
  return (
    !!layer &&
    !layer.contains(element) &&
    !!(
      element.compareDocumentPosition(layer) & Node.DOCUMENT_POSITION_FOLLOWING
    )
  );
}

/**
 * Hears a press or focus outside `element` while `enabled`, as a Radix
 * DismissableLayer with no dismiss does, which tells its callbacks and
 * closes nothing: a press or focus in a layer opened above it (a Popover
 * or Select opened from inside) is inside. Each handler is given the
 * custom event Radix gives, which it may prevent. Listens a task after it
 * is enabled, so the press that opened it is not heard as outside.
 */
export function useOutsideInteractions(
  element: Ref<HTMLElement | null>,
  enabled: () => boolean,
  handlers: {
    pointerDownOutside: (event: OutsideEvent) => void;
    focusOutside: (event: OutsideEvent) => void;
  },
) {
  let stop: (() => void) | undefined;
  const dispatch = (
    name: string,
    originalEvent: PointerEvent | FocusEvent,
    handler: (event: OutsideEvent) => void,
  ) => {
    const target = originalEvent.target as Element;
    const event = new CustomEvent(name, {
      bubbles: false,
      cancelable: true,
      detail: { originalEvent },
    }) as OutsideEvent;
    target.addEventListener(name, handler as EventListener, { once: true });
    target.dispatchEvent(event);
  };
  watch(
    [element, enabled],
    ([node, on]) => {
      stop?.();
      stop = undefined;
      if (!node || !on) return;
      const doc = node.ownerDocument;
      const onPointerDown = (event: PointerEvent) => {
        if (!insideOrAbove(node, event.target))
          dispatch(
            "dismissableLayer.pointerDownOutside",
            event,
            handlers.pointerDownOutside,
          );
      };
      const onFocusIn = (event: FocusEvent) => {
        if (!insideOrAbove(node, event.target))
          dispatch(
            "dismissableLayer.focusOutside",
            event,
            handlers.focusOutside,
          );
      };
      const timer = setTimeout(() => {
        doc.addEventListener("pointerdown", onPointerDown);
        doc.addEventListener("focusin", onFocusIn);
      }, 0);
      stop = () => {
        clearTimeout(timer);
        doc.removeEventListener("pointerdown", onPointerDown);
        doc.removeEventListener("focusin", onFocusIn);
      };
    },
    { immediate: true, flush: "post" },
  );
  onBeforeUnmount(() => stop?.());
}

/**
 * A Reka trigger's element, with the app's attributes on it, for
 * `<RekaXTrigger as-child>`: Reka draws a popper trigger through a Slot
 * whose element's own props win over what Reka writes, as an app's props
 * win over Radix's in React (`aria-describedby`, `id`). With `as-child`, the
 * first element of the slot, the attributes merged onto it; otherwise a
 * `tag` holding the slot.
 */
export function triggerChild(
  asChild: boolean | undefined,
  tag: string,
  attrs: Record<string, unknown>,
  slot: (() => VNode[] | undefined) | undefined,
): VNode | VNode[] | undefined {
  if (!asChild) return h(tag, attrs, slot?.());
  const children = slot?.() ?? [];
  const index = children.findIndex(
    (node) => node.type !== Comment && node.type !== Text,
  );
  if (index === -1) return children;
  const copy = [...children];
  copy[index] = cloneVNode(children[index], attrs, true);
  return copy;
}
