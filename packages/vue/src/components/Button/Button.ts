import {
  defineComponent,
  h,
  normalizeClass,
  type PropType,
  type SlotsType,
  type StyleValue,
  type VNode,
} from "vue";
import {
  buttonEmotionTokens,
  buttonVariants,
  cn,
  emotionCustomProperties,
  TREATMENT_CLASSES,
} from "#kozmos-recipes";
import { spinnerArc } from "../Spinner/SpinnerArc";
import type {
  KozmosButtonEmotion,
  KozmosButtonSize,
  KozmosButtonVariant,
} from "./types";

/**
 * Vue's counterpart of React's Button: a native `<button>` built from the same
 * recipe (`buttonVariants`, the emotion's tier and custom properties), so the
 * two draw the same element. `variant` says how much it weighs, `emotion`
 * what it means; `is-loading` draws the loading arc before the content and
 * disables the button. Every other attribute and listener reaches the
 * `<button>`; a `class` merges with the recipe's as React's `className` does.
 *
 * Like React's, it does not reparent its content: for navigation, use Link,
 * or `buttonVariants` on an anchor. React's reports each press to its
 * AnalyticsProvider; Vue has no analytics provider yet, so this one reports
 * nothing.
 */
export const KozmosButton = defineComponent({
  name: "KozmosButton",
  inheritAttrs: false,
  props: {
    variant: {
      type: String as PropType<KozmosButtonVariant>,
      default: undefined,
    },
    size: { type: String as PropType<KozmosButtonSize>, default: undefined },
    /**
     * What the button means. Leave it unset and the variant keeps its own
     * colours; set it and the emotion decides the colour, whatever the
     * variant. `glass` takes no emotion.
     */
    emotion: {
      type: String as PropType<KozmosButtonEmotion>,
      default: undefined,
    },
    isLoading: { type: Boolean, default: undefined },
    disabled: { type: Boolean, default: undefined },
  },
  /** The label, as React's `children`. */
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, style, ...rest } = attrs;
      const emotional = buttonEmotionTokens(props.variant, props.emotion);
      // A style only when there is one: an empty one is written as style="".
      const drawnStyle = emotional
        ? [emotionCustomProperties(emotional.tier, emotional.emotion), style]
        : style;
      return h(
        "button",
        {
          class: cn(
            buttonVariants({ variant: props.variant, size: props.size }),
            emotional && TREATMENT_CLASSES[emotional.treatment],
            normalizeClass(className),
          ),
          ...(drawnStyle === undefined
            ? {}
            : { style: drawnStyle as StyleValue }),
          disabled: props.isLoading || props.disabled ? true : undefined,
          ...rest,
        },
        [
          props.isLoading
            ? spinnerArc({
                className: "kozmos-reset kozmos-button-loader",
                size: 16,
              })
            : null,
          slots.default?.(),
        ],
      );
    };
  },
});
