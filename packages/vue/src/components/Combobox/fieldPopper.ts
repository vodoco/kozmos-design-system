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
  autoUpdate,
  computePosition,
  flip,
  limitShift,
  offset,
  shift,
  size,
  type Middleware,
} from "@floating-ui/dom";
import {
  cn,
  FIELD_POPUP_CONTENT_CLASS,
  FIELD_POPUP_PLACEMENT,
} from "#kozmos-recipes";
import { ThemeKey, useKozmosDensity } from "../../theme/injection";

/**
 * A text field's popup (Combobox's, MultiSelect's), drawn as React's
 * FieldPopupContent draws it: in the theme's portal, the box Radix's Popper
 * places (`data-radix-popper-content-wrapper`, fixed, its custom properties
 * named as Radix's, which React's classes and FIELD_POPUP_MAX_HEIGHT read)
 * around the content (`data-side`, `data-align`, as wide as the field).
 * Positioned only: no dialog, no focus scope and no dismiss layer, so the
 * field keeps its keyboard and its Escape. Internal.
 *
 * Reka UI keeps its Popper to itself, so this is Radix's PopperContent
 * (@radix-ui/react-popper 1.2) for the props FieldPopupContent passes, on
 * the floating-ui Reka already ships: fixed, `bottom-start`, and its
 * middleware in its order with its options — offset 4, shift on the main
 * axis only with limitShift (sticky "partial"), flip, size writing the room
 * and the field's size as Radix's custom properties on the wrapper, and the
 * transform origin Radix's own middleware works out with no arrow — against
 * the window alone (Radix passes an empty boundary, so a scroll box never
 * clips it), 8 in from its edges. autoUpdate replaces it on scroll, resize
 * and layout shifts, as Radix's does ("optimized": no frame loop); a
 * resize of the field or the popup is observed here, so the room it
 * writes never loops WebKit's ResizeObserver (below).
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
    // Where floating-ui placed it, its side and alignment, the popup's
    // height there (for the transform origin) and the device pixel ratio.
    const placed = ref<{
      x: number;
      y: number;
      side: string;
      align: string;
      height: number;
      dpr: number;
    } | null>(null);

    const { side, align, sideOffset, collisionPadding } = FIELD_POPUP_PLACEMENT;
    // Radix's options, written as floating-ui's defaults leave them: its
    // offset with no alignment offset, its shift on the main axis alone, and
    // its detectOverflowOptions, no boundary of its own (so the window) and
    // no altBoundary.
    const overflow = { padding: collisionPadding, boundary: [] };
    const middleware: Middleware[] = [
      offset(sideOffset),
      shift({ limiter: limitShift(), ...overflow }),
      flip(overflow),
      size({
        ...overflow,
        apply({ elements, rects, availableWidth, availableHeight }) {
          for (const [name, value] of [
            ["available-width", availableWidth],
            ["available-height", availableHeight],
            ["anchor-width", rects.reference.width],
            ["anchor-height", rects.reference.height],
          ] as const)
            elements.floating.style.setProperty(
              `--radix-popper-${name}`,
              `${value}px`,
            );
        },
      }),
      // Radix's transformOrigin reads the popup's height where it settles.
      { name: "origin", fn: ({ rects }) => ({ data: rects.floating }) },
    ];

    let stop: (() => void) | undefined;
    let live = true;
    const update = () => {
      const anchor = props.anchor();
      const floating = wrapper.value;
      if (!anchor || !floating) return;
      computePosition(anchor, floating, {
        strategy: "fixed",
        placement: `${side}-${align}`,
        middleware,
      }).then(({ x, y, placement, middlewareData }) => {
        const [placedSide, placedAlign = "center"] = placement.split("-");
        if (live)
          placed.value = {
            x,
            y,
            side: placedSide,
            align: placedAlign,
            height: middlewareData.origin.height,
            dpr: floating.ownerDocument.defaultView?.devicePixelRatio || 1,
          };
      });
    };
    onMounted(() => {
      mounted.value = true;
      nextTick(() => {
        const anchor = props.anchor();
        const floating = wrapper.value;
        if (!live || !anchor || !floating) return;
        // autoUpdate, as Radix's, on scroll, resize and layout shifts; its
        // ResizeObserver is this one. autoUpdate's places the popup inside
        // the observer's delivery on any resize, and stops observing the
        // popup for a frame only when the field resizes (floating-ui#1740).
        // The popup's own resize is the other loop: placing writes the room
        // left on its side, which its list's max-height reads, so it resizes
        // again in the same delivery (a Combobox in a Dialog, a Drawer or a
        // Popover, where the popup settles as the overlay opens), and WebKit
        // raises "ResizeObserver loop completed with undelivered
        // notifications". It is placed on the next frame instead.
        const cleanup = autoUpdate(anchor, floating, update, {
          elementResize: false,
        });
        let frame = 0;
        let reobserve = 0;
        const observer =
          typeof ResizeObserver === "undefined"
            ? undefined
            : new ResizeObserver((entries) => {
                cancelAnimationFrame(frame);
                if (entries.some((entry) => entry.target === anchor)) {
                  observer!.unobserve(floating);
                  cancelAnimationFrame(reobserve);
                  reobserve = requestAnimationFrame(() =>
                    observer!.observe(floating),
                  );
                  update();
                } else frame = requestAnimationFrame(update);
              });
        observer?.observe(anchor);
        observer?.observe(floating);
        stop = () => {
          cleanup();
          observer?.disconnect();
          cancelAnimationFrame(frame);
          cancelAnimationFrame(reobserve);
        };
      });
    });
    onBeforeUnmount(() => {
      live = false;
      stop?.();
      stop = undefined;
    });

    return () => {
      if (!mounted.value) return null;
      const container = theme ? theme.portalContainer.value : document.body;
      // Do not draw in the body briefly and again once the provider's own
      // portal exists.
      if (!container) return null;
      const at = placed.value;
      // As @floating-ui/react-dom's floatingStyles: rounded to the device
      // pixel, and promoted at 1.5 and over.
      const round = (value: number) =>
        at ? Math.round(value * at.dpr) / at.dpr : 0;
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
      // Radix's Portal draws a <div> of its own around what it portals. The
      // wrapper's --radix-popper-available-* and -anchor-* are written by the
      // size middleware, as Radix's are, and never drawn here.
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
                  ? `translate(${round(at.x)}px, ${round(at.y)}px)`
                  : "translate(0, -200%)",
                willChange: at && at.dpr >= 1.5 ? "transform" : undefined,
                minWidth: "max-content",
                zIndex: zIndex || undefined,
                // Radix's with no arrow: the aligned edge, on the field's side
                // (only bottom or top: flip falls back to the other).
                "--radix-popper-transform-origin": at
                  ? `${{ start: "0%", center: "50%", end: "100%" }[at.align]} ${at.side === "top" ? at.height : 0}px`
                  : " ",
              },
            },
            [
              h(
                "div",
                {
                  ref: content,
                  "data-side": at?.side ?? side,
                  "data-align": at?.align ?? align,
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
