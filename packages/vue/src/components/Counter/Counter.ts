import {
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
  cn,
  counterVariants,
  EMOTION_FILLED_CLASSES,
  emotionSurfaceVariables,
  formatCounterText,
} from "#kozmos-recipes";
import type { KozmosEmotion } from "../Tag/types";
import { styleAttribute } from "../style";
import type { KozmosCounterSize, KozmosCounterTone } from "./types";

/**
 * The count as React's Counter writes it: a count that is text alone (React's
 * string or number `children`) is trimmed and loses the parentheses a caller
 * may wrap it in, `(3)` is `3`; anything else is drawn as it is.
 */
function formatted(nodes: VNode[] | undefined): VNode[] | undefined {
  const node = nodes?.length === 1 ? nodes[0] : undefined;
  return isVNode(node) &&
    node.type === Text &&
    typeof node.children === "string"
    ? [createTextVNode(formatCounterText(node.children))]
    : nodes;
}

/**
 * Vue's counterpart of React's Counter: a count in a pill, drawn as the
 * `<span data-slot="counter">` React's draws from the same recipe
 * (`counterVariants`). The count is the default slot. `tone` and `size` are
 * React's; `emotion` says what the count means, and when it is set the
 * emotion decides the colour, a filled pill, with the app's own `style`
 * winning over the emotion's properties, as React's does. Counter sends no
 * analytics event, in React or here.
 */
export const KozmosCounter = defineComponent({
  name: "KozmosCounter",
  inheritAttrs: false,
  props: {
    /**
     * What the count means. Leave it unset and `tone` draws it; set it and
     * the emotion decides the colour.
     */
    emotion: {
      type: String as PropType<KozmosEmotion>,
      default: undefined,
    },
    size: { type: String as PropType<KozmosCounterSize>, default: undefined },
    tone: { type: String as PropType<KozmosCounterTone>, default: undefined },
  },
  slots: Object as SlotsType<{
    /** The count, as React's `children`. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, style, ...rest } = attrs;
      return h(
        "span",
        {
          class: cn(
            counterVariants({ tone: props.tone, size: props.size }),
            props.emotion && EMOTION_FILLED_CLASSES,
            normalizeClass(className),
          ),
          "data-slot": "counter",
          // The caller's own style wins over the emotion's defaults.
          ...styleAttribute(
            props.emotion && emotionSurfaceVariables(props.emotion),
            style,
          ),
          ...rest,
        },
        formatted(slots.default?.()),
      );
    };
  },
});
