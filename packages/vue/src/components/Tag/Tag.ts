import {
  defineComponent,
  getCurrentInstance,
  h,
  isVNode,
  normalizeClass,
  Text,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import { X } from "@kozmos-ds/icons/vue";
import {
  cn,
  emotionSurfaceVariables,
  TAG_REMOVE_CLASS,
  TAG_REMOVE_ICON_CLASS,
  TAG_REMOVE_ON_THEME_FILL_CLASS,
  tagEmotionClasses,
  tagOnThemeFill,
  tagVariants,
} from "#kozmos-recipes";
import { useKozmosAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { styleAttribute } from "../style";
import type { KozmosEmotion, KozmosTagVariant } from "./types";

/** A label that is text alone, as React's `children` is a string. */
function labelText(nodes: VNode[] | undefined): string | undefined {
  const node = nodes?.length === 1 ? nodes[0] : undefined;
  return isVNode(node) &&
    node.type === Text &&
    typeof node.children === "string"
    ? node.children
    : undefined;
}

/**
 * Vue's counterpart of React's Tag: a label in a pill, drawn as the `<div>`
 * React's draws from the same recipe (`tagVariants`). Its label is the
 * default slot. `emotion` says what it means: `outline` becomes the emotion
 * as text with a matching edge, and every other variant the emotion's filled
 * pair; the app's own `style` wins over the emotion's properties.
 *
 * Listen for `remove` (`@remove`) and it draws React's remove button after
 * the label, named by `remove-label`: a press reports `tag_removed` through
 * `useKozmosAnalytics`, with the label when it is text, as React's does, and
 * then emits `remove`.
 */
export const KozmosTag = defineComponent({
  name: "KozmosTag",
  inheritAttrs: false,
  props: {
    emotion: {
      type: String as PropType<KozmosEmotion>,
      default: undefined,
    },
    removeLabel: { type: String, default: "Remove" },
    variant: {
      type: String as PropType<KozmosTagVariant>,
      default: undefined,
    },
  },
  emits: {
    /** React's `onRemove`: the remove button was pressed. */
    remove: () => true,
  },
  slots: Object as SlotsType<{
    /** The label, as React's `children`. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, emit, slots }) {
    const { trackEvent } = useKozmosAnalytics();
    // React draws the button only for an `onRemove`; a declared event is
    // not an attribute, so it is read from what the app bound.
    const instance = getCurrentInstance();
    const removable = () => !!instance?.vnode.props?.onRemove;
    return () => {
      const { class: className, style, ...rest } = attrs;
      const children = slots.default?.();
      return h(
        "div",
        {
          class: cn(
            tagVariants({ variant: props.variant }),
            tagEmotionClasses(props.variant, props.emotion),
            normalizeClass(className),
          ),
          // The app's own style wins: these are a default the emotion
          // sets, not something the part insists on.
          ...styleAttribute(
            props.emotion && emotionSurfaceVariables(props.emotion),
            style,
          ),
          ...rest,
        },
        [
          children,
          removable()
            ? h(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    const label = labelText(children);
                    if (label !== undefined)
                      trackEvent("Tag", "tag_removed", { label });
                    else trackEvent("Tag", "tag_removed");
                    emit("remove");
                  },
                  class: cn(
                    TAG_REMOVE_CLASS,
                    tagOnThemeFill(props.variant, props.emotion) &&
                      TAG_REMOVE_ON_THEME_FILL_CLASS,
                  ),
                },
                [
                  h(X, { class: TAG_REMOVE_ICON_CLASS }),
                  h("span", { class: "sr-only" }, props.removeLabel),
                ],
              )
            : null,
        ],
      );
    };
  },
});
