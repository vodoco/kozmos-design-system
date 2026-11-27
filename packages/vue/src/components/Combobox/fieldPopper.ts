import {
  defineComponent,
  h,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  Teleport,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import {
  cn,
  FIELD_POPUP_CONTENT_CLASS,
  FIELD_POPUP_PLACEMENT,
} from "#kozmos-recipes";
import { ThemeKey, useKozmosDensity } from "../../theme/injection";

/**
 * A text field's popup (Combobox's), drawn as React's FieldPopupContent
 * draws it: in the theme's portal, the box Radix's Popper places
 * (`data-radix-popper-content-wrapper`, fixed, its custom properties named
 * as Radix's, which React's classes and FIELD_POPUP_MAX_HEIGHT read) around
 * the content (`data-side`, `data-align`, as wide as the field). Positioned
 * only: no dialog, no focus scope and no dismiss layer, so the field keeps
 * its keyboard and its Escape. Internal.
 *
 * Reka UI keeps its Popper to itself, so this places the popup as Radix's
 * options for it do: under the field from its start (its end, right to
 * left), 4 below, flipped above when the room under it is smaller than the
 * popup and than the room above, shifted along to stay 8 from the window's
 * edges, with the room left on its side as `--radix-popper-available-height`.
 */
export const KozmosFieldPopper = defineComponent({
  name: "KozmosFieldPopper",
  inheritAttrs: false,
  props: {
    anchor: {
      type: Function as PropType<() => HTMLElement | null | undefined>,
      required: true,
    },
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, slots }) {
    const theme = inject(ThemeKey, undefined);
    const density = useKozmosDensity();
    const mounted = ref(false);
    const wrapper = shallowRef<HTMLElement | null>(null);
    const content = shallowRef<HTMLElement | null>(null);
    const placed = ref<{
      x: number;
      y: number;
      side: "bottom" | "top";
      availableWidth: number;
      availableHeight: number;
      anchorWidth: number;
      anchorHeight: number;
      origin: string;
    } | null>(null);

    const {
      side: preferred,
      sideOffset,
      collisionPadding,
    } = FIELD_POPUP_PLACEMENT;
    const place = () => {
      const anchor = props.anchor();
      const floating = content.value;
      if (!anchor || !floating) return;
      const view = anchor.ownerDocument.defaultView;
      const width = view?.innerWidth ?? 0;
      const height = view?.innerHeight ?? 0;
      const box = anchor.getBoundingClientRect();
      const own = floating.getBoundingClientRect();
      const below = height - box.bottom - sideOffset - collisionPadding;
      const above = box.top - sideOffset - collisionPadding;
      const side =
        preferred === "bottom" && own.height > below && above > below
          ? "top"
          : "bottom";
      const rtl = view?.getComputedStyle(floating).direction === "rtl";
      const start = rtl ? box.right - own.width : box.left;
      const x = Math.max(
        collisionPadding,
        Math.min(start, width - collisionPadding - own.width),
      );
      const y =
        side === "bottom"
          ? box.bottom + sideOffset
          : box.top - sideOffset - own.height;
      placed.value = {
        x: Math.round(x),
        y: Math.round(y),
        side,
        availableWidth: width - collisionPadding * 2,
        availableHeight: side === "bottom" ? below : above,
        anchorWidth: box.width,
        anchorHeight: box.height,
        origin: `${rtl ? "100%" : "0%"} ${side === "bottom" ? "0px" : `${own.height}px`}`,
      };
    };

    let observer: ResizeObserver | undefined;
    let reobserveFrame = 0;
    const onMove = () => place();
    // As Radix's Popper (floating-ui's autoUpdate) does: placed in the
    // observer's callback, and when the field resizes, the popup is no
    // longer observed until the next frame. Placing writes the field's width
    // as the popup's, so the popup resizes in the same frame; observed, it
    // would be a loop, which WebKit raises as "ResizeObserver loop completed
    // with undelivered notifications" (floating-ui#1740; a Combobox in a
    // Dialog, where the field and the popup settle as the Dialog opens). A
    // resize of the popup alone moves it and changes no size it observes.
    const onResize = (entries: ResizeObserverEntry[]) => {
      const anchor = props.anchor();
      const floating = content.value;
      if (
        observer &&
        floating &&
        entries.some((entry) => entry.target === anchor)
      ) {
        observer.unobserve(floating);
        cancelAnimationFrame(reobserveFrame);
        reobserveFrame = requestAnimationFrame(() => {
          if (observer && content.value) observer.observe(content.value);
        });
      }
      place();
    };
    onMounted(() => {
      mounted.value = true;
      nextTick(() => {
        place();
        const anchor = props.anchor();
        if (typeof ResizeObserver !== "undefined") {
          observer = new ResizeObserver(onResize);
          if (anchor) observer.observe(anchor);
          if (content.value) observer.observe(content.value);
        }
        window.addEventListener("scroll", onMove, {
          capture: true,
          passive: true,
        });
        window.addEventListener("resize", onMove);
      });
    });
    onBeforeUnmount(() => {
      observer?.disconnect();
      observer = undefined;
      if (typeof cancelAnimationFrame !== "undefined")
        cancelAnimationFrame(reobserveFrame);
      window.removeEventListener("scroll", onMove, { capture: true });
      window.removeEventListener("resize", onMove);
    });

    return () => {
      if (!mounted.value) return null;
      const container = theme ? theme.portalContainer.value : document.body;
      // Do not draw in the body briefly and again once the provider's own
      // portal exists.
      if (!container) return null;
      const at = placed.value;
      const {
        class: className,
        style,
        ...rest
      } = attrs as Record<string, unknown>;
      const zIndex = content.value
        ? content.value.ownerDocument.defaultView?.getComputedStyle(
            content.value,
          ).zIndex
        : undefined;
      // Radix's Portal draws a <div> of its own around what it portals.
      return h(Teleport, { to: container }, [
        h("div", null, [
          h(
            "div",
            {
              ref: wrapper,
              "data-radix-popper-content-wrapper": "",
              style: {
                position: "fixed",
                left: "0px",
                top: "0px",
                transform: at
                  ? `translate(${at.x}px, ${at.y}px)`
                  : "translate(0, -200%)",
                minWidth: "max-content",
                zIndex: zIndex || undefined,
                "--radix-popper-available-width": at
                  ? `${at.availableWidth}px`
                  : undefined,
                "--radix-popper-available-height": at
                  ? `${at.availableHeight}px`
                  : undefined,
                "--radix-popper-anchor-width": at
                  ? `${at.anchorWidth}px`
                  : undefined,
                "--radix-popper-anchor-height": at
                  ? `${at.anchorHeight}px`
                  : undefined,
                "--radix-popper-transform-origin": at?.origin,
              },
            },
            [
              h(
                "div",
                {
                  ref: content,
                  "data-side": at?.side ?? preferred,
                  "data-align": FIELD_POPUP_PLACEMENT.align,
                  // As React's ThemePortal marks what it draws.
                  "data-kozmos-density": density?.value,
                  class: cn(FIELD_POPUP_CONTENT_CLASS, className as string),
                  ...rest,
                  style: [
                    { width: "var(--radix-popper-anchor-width)" },
                    style,
                    at ? {} : { animation: "none" },
                  ],
                },
                slots.default?.(),
              ),
            ],
          ),
        ]),
      ]);
    };
  },
});
