import {
  Comment,
  createTextVNode,
  defineComponent,
  h,
  isVNode,
  normalizeClass,
  Text,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import {
  BADGE_ICON_CLASS,
  badgeCounterClass,
  badgeCounterTone,
  badgeShowsCounter,
  badgeVariants,
  cn,
  counterVariants,
  formatCounterText,
} from "#kozmos-recipes";
import type { KozmosBadgeSize, KozmosBadgeVariant } from "./types";

/** A slot's nodes, or undefined when it draws nothing but comments. */
function drawn(nodes: VNode[] | undefined): VNode[] | undefined {
  return nodes?.some((node) => !isVNode(node) || node.type !== Comment)
    ? nodes
    : undefined;
}

/** A count's text as React's Counter writes it: `(3)` is `3`. */
const formatted = (nodes: VNode[]) =>
  nodes.map((node) =>
    isVNode(node) && node.type === Text && typeof node.children === "string"
      ? createTextVNode(formatCounterText(node.children))
      : node,
  );

/**
 * Vue's counterpart of React's Badge: a status, not a control, drawn as the
 * `<div>` React's draws from the same recipe (`badgeVariants`). Its label is
 * the default slot; `icon` draws before it, hidden from assistive
 * technology; and a `counter`, when `show-counter` asks for it, draws after
 * it in Counter's pill, inverted on the filled variants. An icon Badge
 * (`size="icon"`) is an image: name it with `aria-label`.
 *
 * `as-child` is taken and ignored, as React's Badge ignores it. Badge sends
 * no analytics event, in React or here.
 */
export const KozmosBadge = defineComponent({
  name: "KozmosBadge",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: undefined },
    showCounter: { type: Boolean, default: false },
    size: { type: String as PropType<KozmosBadgeSize>, default: undefined },
    variant: {
      type: String as PropType<KozmosBadgeVariant>,
      default: undefined,
    },
  },
  slots: Object as SlotsType<{
    /** The count, as React's `counter`: drawn only with `show-counter`. */
    counter?: () => VNode[];
    /** The icon, as React's `icon`. */
    icon?: () => VNode[];
    /** The label, as React's `children`. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      const isIconOnly = props.size === "icon";
      const icon = drawn(slots.icon?.());
      const children = slots.default?.();
      const counter = drawn(slots.counter?.());
      return h(
        "div",
        {
          role: isIconOnly ? "img" : undefined,
          class: cn(
            badgeVariants({ variant: props.variant, size: props.size }),
            normalizeClass(className),
          ),
          ...rest,
        },
        [
          icon
            ? h(
                "span",
                {
                  "aria-hidden": "true",
                  class: BADGE_ICON_CLASS,
                  "data-slot": "badge-icon",
                },
                icon,
              )
            : isIconOnly
              ? children
              : null,
          isIconOnly ? null : children,
          counter && badgeShowsCounter(props.size, props.showCounter, counter)
            ? h(
                "span",
                {
                  class: cn(
                    counterVariants({ tone: badgeCounterTone(props.variant) }),
                    badgeCounterClass(props.variant),
                  ),
                  "data-slot": "badge-counter",
                },
                formatted(counter),
              )
            : null,
        ],
      );
    };
  },
});
